const {
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder
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
    const botAvatar = interaction.client.user.displayAvatarURL({ size: 1024 });

    const text = new TextDisplayBuilder().setContent(
`# Yuna Profile

![bot avatar](${botAvatar})

**Uptime:** <t:${startedAt}:R>  
**Servers:** ${serverCount}  
**Host:** Hetzner Cloud  

*Developed by flamyamy*`
    );

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Support')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.gg/s3xX82Xfav')
    );

    const container = new ContainerBuilder()
      .addTextDisplayComponents(text)
      .addSeparatorComponents(new SeparatorBuilder())
      .addActionRowComponents(buttons);

    await interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [container]
    });
  }
};