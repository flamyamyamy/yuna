const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  ApplicationIntegrationType,
  InteractionContextType
} = require('discord.js');

function trimText(text, max = 220) {
  if (!text) return '*No text content*';
  const clean = text.replace(/`/g, '\'').trim();
  return clean.length > max ? `${clean.slice(0, max)}...` : clean;
}

function formatAuthor(msg) {
  return (
    msg.author?.global_name ||
    msg.author?.username ||
    msg.author?.tag ||
    'Unknown User'
  );
}

function buildSearchSummary({ query, user, channel, limit, total }) {
  const parts = [
    query ? `**Query**: \`${query.replace(/`/g, '\'')}\`` : '**Query**: `—`',
    user ? `**User**: <@${user.id}>` : '**User**: `Any`',
    channel ? `**Channel**: <#${channel.id}>` : '**Channel**: `Any`',
    `**Shown**: \`${limit}\``,
    typeof total === 'number' ? `**Total Matches**: \`${total}\`` : null
  ];

  return parts.filter(Boolean).join('\n');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search messages in this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ReadMessageHistory)
    .setIntegrationTypes(
      ApplicationIntegrationType.GuildInstall
    )
    .setContexts(
      InteractionContextType.Guild
    )
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('Text to search for')
        .setRequired(false)
        .setMaxLength(1024)
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Only search messages from this user')
        .setRequired(false)
    )
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Only search in this channel')
        .setRequired(false)
        .addChannelTypes(
          ChannelType.GuildText,
          ChannelType.GuildAnnouncement,
          ChannelType.PublicThread,
          ChannelType.PrivateThread,
          ChannelType.AnnouncementThread
        )
    )
    .addIntegerOption(option =>
      option
        .setName('limit')
        .setDescription('How many results to show (1-10)')
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.inGuild() || !interaction.guild) {
      return interaction.reply({
        content: 'This command can only be used in a server.',
        flags: 64
      });
    }

    const query = interaction.options.getString('query')?.trim() || null;
    const user = interaction.options.getUser('user');
    const channel = interaction.options.getChannel('channel');
    const limit = interaction.options.getInteger('limit') ?? 5;

    if (!query && !user && !channel) {
      return interaction.reply({
        content: 'You need to provide at least one filter: `query`, `user`, or `channel`.',
        flags: 64
      });
    }

    await interaction.deferReply({ flags: 64 });

    try {
      const params = new URLSearchParams();
      params.set('limit', String(Math.min(limit, 25)));

      if (query) {
        params.set('content', query);
      }

      if (user) {
        params.append('author_id', user.id);
      }

      if (channel) {
        params.append('channel_id', channel.id);
      }

      const response = await fetch(
        `https://discord.com/api/v10/guilds/${interaction.guild.id}/messages/search?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bot ${process.env.TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (response.status === 202 && data?.code === 110000) {
        const embed = new EmbedBuilder()
          .setColor('#f59e0b')
          .setTitle('Search Not Ready Yet')
          .setDescription(
            `This server has not been indexed for search yet.\nPlease try again in **${data.retry_after ?? 2} seconds**.`
          )
          .setTimestamp();

        return interaction.editReply({
          embeds: [embed]
        });
      }

      if (!response.ok) {
        console.error('Search API error:', data);

        const errorEmbed = new EmbedBuilder()
          .setColor('#ef4444')
          .setTitle('Search Failed')
          .setDescription(
            response.status === 403
              ? 'I do not have permission to search messages here.\nMake sure the bot has **Read Message History** in the target channel.'
              : 'Something went wrong while trying to search messages.'
          )
          .addFields({
            name: 'Status',
            value: `\`${response.status}\``,
            inline: true
          })
          .setTimestamp();

        return interaction.editReply({
          embeds: [errorEmbed]
        });
      }

      const rawMessages = Array.isArray(data.messages)
        ? data.messages.flat()
        : [];

      const uniqueMessages = [];
      const seen = new Set();

      for (const msg of rawMessages) {
        if (!msg?.id || seen.has(msg.id)) continue;
        seen.add(msg.id);
        uniqueMessages.push(msg);
      }

      const shown = uniqueMessages.slice(0, limit);

      if (!shown.length) {
        const noResultsEmbed = new EmbedBuilder()
          .setColor('#5865f2')
          .setTitle('No Results Found')
          .setDescription(
            'No matching messages were found for your current filters.'
          )
          .addFields({
            name: 'Search Filters',
            value: buildSearchSummary({
              query,
              user,
              channel,
              limit,
              total: data?.total_results
            })
          })
          .setThumbnail(interaction.guild.iconURL({ size: 256 }) || null)
          .setTimestamp();

        return interaction.editReply({
          embeds: [noResultsEmbed]
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#5865f2')
        .setTitle('Message Search')
        .setDescription('Here are the best matching messages I found.')
        .addFields({
          name: 'Search Filters',
          value: buildSearchSummary({
            query,
            user,
            channel,
            limit: shown.length,
            total: data?.total_results
          })
        })
        .setThumbnail(interaction.guild.iconURL({ size: 256 }) || null)
        .setFooter({
          text: `${interaction.guild.name} • Search Results`
        })
        .setTimestamp();

      for (const msg of shown) {
        const content = trimText(msg.content, 260);
        const jumpUrl = `https://discord.com/channels/${interaction.guild.id}/${msg.channel_id}/${msg.id}`;
        const authorName = formatAuthor(msg);
        const timestamp = msg.timestamp
          ? `<t:${Math.floor(new Date(msg.timestamp).getTime() / 1000)}:R>`
          : '`Unknown time`';

        let extra = [];
        extra.push(`**Author:** ${authorName}`);
        extra.push(`**Channel:** <#${msg.channel_id}>`);
        extra.push(`**Sent:** ${timestamp}`);

        if (Array.isArray(msg.attachments) && msg.attachments.length > 0) {
          extra.push(`**Attachments:** \`${msg.attachments.length}\``);
        }

        embed.addFields({
          name: `Result • ${authorName}`.slice(0, 256),
          value: `${content}\n\n${extra.join('\n')}\n[Jump to message](${jumpUrl})`
        });
      }

      await interaction.editReply({
        embeds: [embed]
      });
    } catch (error) {
      console.error('Search command error:', error);

      const errorEmbed = new EmbedBuilder()
        .setColor('#ef4444')
        .setTitle('Unexpected Error')
        .setDescription('An unexpected error occurred while searching messages.')
        .setTimestamp();

      await interaction.editReply({
        embeds: [errorEmbed]
      });
    }
  }
};