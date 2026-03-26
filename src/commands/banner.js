const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  ApplicationIntegrationType
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('banner')
    .setDescription('Get user banner')
    .setIntegrationTypes(
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall
    )
    .setContexts(
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel
    )
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('Target user')
    ),

  async execute(interaction, client) {
    const user = interaction.options.getUser('user') || interaction.user;

    const fetched = await client.users.fetch(user.id, { force: true });
    const banner = fetched.bannerURL({ size: 1024, extension: 'png' });

    // ? sch�ner Fehlertext
    if (!banner) {
      return interaction.reply({
        content: '? This user has no banner',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(fetched.accentColor || 0x2b2d31)
      .setTitle(`${user.username}'s banner`)
      .setURL(`https://discord.com/users/${user.id}`)
      .setImage(banner)
      .setFooter({ text: `User ID: ${user.id}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Open Banner')
        .setStyle(ButtonStyle.Link)
        .setURL(banner)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};