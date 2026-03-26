const {
  SlashCommandBuilder,
  EmbedBuilder,
  InteractionContextType,
  ApplicationIntegrationType
} = require('discord.js');

const db = require('../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Set a reminder')
    .setIntegrationTypes(
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall
    )
    .setContexts(
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel
    )
    .addIntegerOption(option =>
      option
        .setName('minutes')
        .setDescription('Reminder time in minutes')
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption(option =>
      option
        .setName('text')
        .setDescription('What should I remind you about?')
        .setRequired(true)
    ),

  async execute(interaction) {
    const minutes = interaction.options.getInteger('minutes');
    const text = interaction.options.getString('text');

    const remindAt = Date.now() + minutes * 60 * 1000;

    // ?? DM SAFE CHANNEL
    const channelId = interaction.channelId || null;

    const insert = db.prepare(`
      INSERT INTO reminders (user_id, channel_id, message, remind_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    insert.run(
      interaction.user.id,
      channelId,
      text,
      remindAt,
      Date.now()
    );

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle('? Reminder set')
      .setDescription(`I will remind you <t:${Math.floor(remindAt / 1000)}:R>`)
      .addFields({
        name: 'Message',
        value: text
      })
      .setFooter({ text: `User: ${interaction.user.username}` });

    await interaction.reply({ embeds: [embed] });
  }
};