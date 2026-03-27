const {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('Shows bot information')
    .setIntegrationTypes(
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall
    )
    .setContexts(
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel
    ),

  async execute(interaction) {
    const uptimeSeconds = process.uptime();
    const startedAt = Math.floor(Date.now() / 1000 - uptimeSeconds);
    const serverCount = interaction.client.guilds.cache.size || 0;
    const avatar = interaction.client.user.displayAvatarURL({ size: 512 });

    const profileSection = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          [
            '# Yuna Profile',
            '',
            `**Uptime:** <t:${startedAt}:R>`,
            `**Servers:** ${serverCount}`,
            '**Host:** Hetzner Cloud',
            '',
            '*Developed by flamyamy*'
          ].join('\n')
        )
      )
      .setThumbnailAccessory(
        new ThumbnailBuilder()
          .setURL(avatar)
          .setDescription('Bot avatar')
      );

    const divider = new SeparatorBuilder();

    const supportRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Support')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.gg/F9VdyDymtC')
    );

    const container = new ContainerBuilder()
      .setAccentColor(0x5865f2)
      .addSectionComponents(profileSection)
      .addSeparatorComponents(divider)
      .addActionRowComponents(supportRow);

    await interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [container]
    });
  }
};