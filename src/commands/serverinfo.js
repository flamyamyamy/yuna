const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  ApplicationIntegrationType,
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SeparatorBuilder,
  MessageFlags
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

  async execute(interaction) {
    const rawInvite = interaction.options.getString('invite');
    const inviteCode = cleanInvite(rawInvite);

    try {
      const invite = await interaction.client.fetchInvite(inviteCode, {
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

      const mainText = [
        `# ${guild.name}`,
        '',
        guild.description || 'No server description.',
        '',
        `**Server ID:** \`${guild.id}\``,
        `**Invite Code:** \`${invite.code}\``,
        `**Channel:** ${invite.channel ? `<#${invite.channel.id}>` : 'Unknown'}`,
        `**Members:** ${invite.memberCount ?? 'Unknown'}`,
        `**Online:** ${invite.presenceCount ?? 'Unknown'}`,
        `**Boosts:** ${guild.premiumSubscriptionCount || 0}`,
        '',
        `**Created:** ${
          guild.createdTimestamp
            ? `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>\n<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`
            : 'Unknown'
        }`,
        '',
        `**Inviter:** ${
          invite.inviter
            ? `${invite.inviter.tag}\n\`${invite.inviter.id}\``
            : 'Unknown'
        }`,
        `**Verification:** ${verificationLevels[guild.verificationLevel] ?? 'Unknown'}`,
        `**NSFW Level:** ${nsfwLevels[guild.nsfwLevel] ?? 'Unknown'}`,
        `**Vanity URL:** ${guild.vanityURLCode ? `discord.gg/${guild.vanityURLCode}` : 'None'}`
      ].join('\n');

      const container = new ContainerBuilder().setAccentColor(0x2b2d31);

      if (icon) {
        container.addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(mainText)
            )
            .setThumbnailAccessory(
              new ThumbnailBuilder()
                .setURL(icon)
                .setDescription(`${guild.name} icon`)
            )
        );
      } else {
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(mainText)
        );
      }

      if (banner) {
        container
          .addSeparatorComponents(new SeparatorBuilder())
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('## Server Banner')
          )
          .addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(
              new MediaGalleryItemBuilder()
                .setURL(banner)
                .setDescription(`${guild.name} banner`)
            )
          );
      }

      container
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `*Requested by ${interaction.user.username}*`
          )
        )
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel('Open Invite')
              .setStyle(ButtonStyle.Link)
              .setURL(`https://discord.gg/${invite.code}`),
            new ButtonBuilder()
              .setCustomId(`server_features_${interaction.id}`)
              .setLabel('Show Features')
              .setStyle(ButtonStyle.Secondary)
          )
        );

      if (icon || banner) {
        const mediaButtons = new ActionRowBuilder();

        if (icon) {
          mediaButtons.addComponents(
            new ButtonBuilder()
              .setLabel('Icon URL')
              .setStyle(ButtonStyle.Link)
              .setURL(icon)
          );
        }

        if (banner) {
          mediaButtons.addComponents(
            new ButtonBuilder()
              .setLabel('Banner URL')
              .setStyle(ButtonStyle.Link)
              .setURL(banner)
          );
        }

        container.addActionRowComponents(mediaButtons);
      }

      await interaction.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });

      const reply = await interaction.fetchReply();

      const buttonInteraction = await reply.awaitMessageComponent({
        filter: i =>
          i.customId === `server_features_${interaction.id}` &&
          i.user.id === interaction.user.id,
        time: 60000
      }).catch(() => null);

      if (!buttonInteraction) return;

      const featureContainer = new ContainerBuilder()
        .setAccentColor(0x2b2d31)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            [
              `# ${guild.name} Features`,
              '',
              '```yaml',
              formattedFeatures,
              '```'
            ].join('\n')
          )
        );

      if (banner) {
        featureContainer
          .addSeparatorComponents(new SeparatorBuilder())
          .addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(
              new MediaGalleryItemBuilder()
                .setURL(banner)
                .setDescription(`${guild.name} banner`)
            )
          );
      }

      await buttonInteraction.reply({
        flags: MessageFlags.IsComponentsV2 | 64,
        components: [featureContainer]
      });
    } catch (error) {
      console.error('serverinfo error:', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Invalid invite or I could not fetch that server.',
          flags: 64
        }).catch(() => null);
      } else {
        await interaction.reply({
          content: 'Invalid invite or I could not fetch that server.',
          flags: 64
        }).catch(() => null);
      }
    }
  }
};