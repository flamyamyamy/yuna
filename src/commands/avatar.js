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
    .setName('avatar')
    .setDescription('Get user avatar')
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

  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;

    const avatar = user.displayAvatarURL({
      size: 1024,
      extension: 'png'
    });

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle(`${user.username}'s avatar`)
      .setURL(`https://discord.com/users/${user.id}`)
      .setImage(avatar)
      .setFooter({ text: `User ID: ${user.id}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Open Avatar')
        .setStyle(ButtonStyle.Link)
        .setURL(avatar)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};