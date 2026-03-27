const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  ApplicationIntegrationType,
  InteractionContextType
} = require('discord.js');

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
        .setRequired(true)
        .setMaxLength(1024)
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Only search messages from this user')
    )
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Only search in this channel')
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
    ),

  async execute(interaction) {
    if (!interaction.inGuild() || !interaction.guild) {
      return interaction.reply({
        content: 'This command can only be used in a server.',
        flags: 64
      });
    }

    const query = interaction.options.getString('query', true).trim();
    const user = interaction.options.getUser('user');
    const channel = interaction.options.getChannel('channel');
    const limit = interaction.options.getInteger('limit') ?? 5;

    await interaction.deferReply({ flags: 64 });

    try {
      const params = new URLSearchParams();
      params.set('content', query);
      params.set('limit', String(Math.min(limit, 25)));

      if (user) {
        // endpoint supports array style params
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

      // Guild not indexed yet
      if (response.status === 202 && data?.code === 110000) {
        return interaction.editReply({
          content: `This server is not indexed yet for search.\nTry again in about **${data.retry_after ?? 2} seconds**.`
        });
      }

      if (!response.ok) {
        console.error('Search API error:', data);

        if (response.status === 403) {
          return interaction.editReply({
            content: 'I do not have permission to search messages here. Make sure the bot has **Read Message History** in the selected channel.'
          });
        }

        return interaction.editReply({
          content: `Search failed.\n\`\`\`json\n${JSON.stringify(data, null, 2).slice(0, 1800)}\n\`\`\``
        });
      }

      const rawMessages = Array.isArray(data.messages) ? data.messages.flat() : [];

      if (!rawMessages.length) {
        return interaction.editReply({
          content: 'No matching messages found.'
        });
      }

      const uniqueMessages = [];
      const seen = new Set();

      for (const msg of rawMessages) {
        if (!msg?.id || seen.has(msg.id)) continue;
        seen.add(msg.id);
        uniqueMessages.push(msg);
      }

      const shown = uniqueMessages.slice(0, limit);

      const embed = new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle('Search Results')
        .setDescription(
          [
            `**Query:** \`${query.replace(/`/g, '\'')}\``,
            user ? `**User:** <@${user.id}>` : null,
            channel ? `**Channel:** <#${channel.id}>` : null,
            `**Results shown:** ${shown.length}`,
            typeof data.total_results === 'number' ? `**Total matches:** ${data.total_results}` : null
          ].filter(Boolean).join('\n')
        )
        .setFooter({
          text: 'Discord Search Guild Messages'
        })
        .setTimestamp();

      for (const msg of shown) {
        const cleanContent = (msg.content?.trim() || '*No text content*')
          .replace(/`/g, '\'')
          .slice(0, 300);

        const msgLink = `https://discord.com/channels/${interaction.guild.id}/${msg.channel_id}/${msg.id}`;
        const authorTag =
          msg.author?.global_name ||
          msg.author?.username ||
          'Unknown User';

        embed.addFields({
          name: `${authorTag} • <#${msg.channel_id}>`,
          value: `${cleanContent}\n[Jump to message](${msgLink})`
        });
      }

      await interaction.editReply({
        embeds: [embed]
      });
    } catch (error) {
      console.error('Search command error:', error);

      await interaction.editReply({
        content: 'An error occurred while searching messages.'
      });
    }
  }
};