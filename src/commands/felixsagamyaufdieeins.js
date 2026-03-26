const {
  SlashCommandBuilder,
  EmbedBuilder,
  ApplicationIntegrationType,
  InteractionContextType
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('felixsagamyaufdieeins')
    .setDescription('Sends the Felix embed')

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
    const embed = new EmbedBuilder()
      .setTitle('Felix sag Amy auf die Eins')
      .setColor('#ff4d6d')
      .setImage('https://imgur.com/SDXhtjW.png') 
      .setTimestamp();

    await interaction.reply({
      embeds: [embed]
    });
  }
};