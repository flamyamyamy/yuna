const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ApplicationIntegrationType,
  InteractionContextType
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

    const embed = new EmbedBuilder()
      .setColor('#2b2d31')
      .setTitle('Yuna Profile')
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setDescription(`
**Uptime:** <t:${startedAt}:R>  
**Servers:** ${serverCount}  
**Host:** Hetzner Cloud  

*Developed by flamyamy*
      `);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Support')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.gg/5uaK2vCXzC')
    );

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};