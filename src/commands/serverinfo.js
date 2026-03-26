const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  ApplicationIntegrationType
} = require('discord.js');

const verificationLevels = {
  0: 'None',
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Very High'
};

const nsfwLevels = {
  0: 'Default',
  1: 'Explicit',
  2: 'Safe',
  3: 'Age Restricted'
};

function cleanInvite(input) {
  return input
    .replace('https://discord.gg/', '')
    .replace('http://discord.gg/', '')
    .replace('https://www.discord.gg/', '')
    .replace('https://discord.com/invite/', '')
    .replace('http://discord.com/invite/', '')
    .trim();
}

function formatFeatureName(feature) {
  return feature
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Show detailed information about a server via invite')
    .setIntegrationTypes(
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall
    )
    .setContexts(
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel
    )
    .addStringOption(option =>
      option
        .setName('invite')
        .setDescription('Invite code or invite link')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const rawInvite = interaction.options.getString('invite');
    const inviteCode = cleanInvite(rawInvite);

    try {
      const invite = await client.fetchInvite(inviteCode, {
        withCounts: true,
        withExpiration: true
      });

      const guild = invite.guild;
      
      const icon = guild.iconURL?.({ size: 1024, extension: 'png' }) || null;
      const banner = guild.bannerURL?.({ size: 1024, extension: 'png' }) || null;

      const formattedFeatures = guild.features?.length
        ? guild.features
            .map(formatFeatureName)
            .map(feature => `- ${feature}`)
            .join('\n')
        : 'No features';

      const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle(guild.name)
        .setURL(`https://discord.gg/${invite.code}`)
        .setThumbnail(icon)
        .setDescription(guild.description || 'No server description.')
        .addFields(
          {
            name: 'Server ID',
            value: `\`${guild.id}\``,
            inline: true
          },
          {
            name: 'Invite Code',
            value: `\`${invite.code}\``,
            inline: true
          },
          {
            name: 'Channel',
            value: invite.channel ? `<#${invite.channel.id}>` : 'Unknown',
            inline: true
          },
          {
            name: 'Members',
            value: invite.memberCount ? `${invite.memberCount}` : 'Unknown',
            inline: true
          },
          {
            name: 'Online',
            value: invite.presenceCount ? `${invite.presenceCount}` : 'Unknown',
            inline: true
          },
          {
            name: 'Boosts',
            value: `${guild.premiumSubscriptionCount || 0}`,
            inline: true
          },
          {
            name: 'Created',
            value: guild.createdTimestamp
              ? `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>\n<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`
              : 'Unknown',
            inline: false
          },
          {
            name: 'Inviter',
            value: invite.inviter
              ? `${invite.inviter.tag}\n\`${invite.inviter.id}\``
              : 'Unknown',
            inline: true
          },
          {
            name: 'Verification',
            value: verificationLevels[guild.verificationLevel] ?? 'Unknown',
            inline: true
          },
          {
            name: 'NSFW Level',
            value: nsfwLevels[guild.nsfwLevel] ?? 'Unknown',
            inline: true
          },
          {
            name: 'Vanity URL',
            value: guild.vanityURLCode
              ? `discord.gg/${guild.vanityURLCode}`
              : 'None',
            inline: false
          }
        )
        .setFooter({ text: `Requested by ${interaction.user.username}` })
        .setTimestamp();

      if (banner) {
        embed.setImage(banner);
      }

      const buttons = [
        new ButtonBuilder()
          .setLabel('Open Invite')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.gg/${invite.code}`),

        new ButtonBuilder()
          .setCustomId(`server_features_${interaction.id}`)
          .setLabel('Show Features')
          .setStyle(ButtonStyle.Secondary)
      ];

      if (icon) {
        buttons.push(
          new ButtonBuilder()
            .setLabel('Icon URL')
            .setStyle(ButtonStyle.Link)
            .setURL(icon)
        );
      }

      if (banner) {
        buttons.push(
          new ButtonBuilder()
            .setLabel('Banner URL')
            .setStyle(ButtonStyle.Link)
            .setURL(banner)
        );
      }

      const row = new ActionRowBuilder().addComponents(...buttons);

      await interaction.reply({
        embeds: [embed],
        components: [row]
      });

      const reply = await interaction.fetchReply();

      const buttonInteraction = await reply.awaitMessageComponent({
        filter: i => i.customId === `server_features_${interaction.id}`,
        time: 60000
      }).catch(() => null);

      if (!buttonInteraction) return;

      const featuresEmbed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle(`${guild.name} Features`)
        .setDescription(`\`\`\`yaml\n${formattedFeatures}\n\`\`\``)
        .setFooter({ text: `${guild.features?.length || 0} feature(s)` })
        .setTimestamp();

      if (banner) {
        featuresEmbed.setImage(banner);
      }

      if (icon) {
        featuresEmbed.setThumbnail(icon);
      }

      await buttonInteraction.reply({
        embeds: [featuresEmbed],
        flags: 64
      });
    } catch (error) {
      console.error(error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Invalid invite or I could not fetch that server.',
          flags: 64
        }).catch(() => null);
      } else {
        await interaction.reply({
          content: 'Invalid invite or I could not fetch that server.',
          flags: 64
        });
      }
    }
  }
};