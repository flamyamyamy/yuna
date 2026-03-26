const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require('discord.js');

const SUPPORT_GUILD_ID = '1062657996104151121';

const COLORS = [
  0xff5e5e,
  0xff9f43,
  0xfeca57,
  0x1dd1a1,
  0x48dbfb,
  0x5f27cd,
  0xff6bcb,
  0x54a0ff,
  0x00d2d3,
  0xc8d6e5
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rules')
    .setDescription('Post the server rules')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.guild)
      return interaction.reply({ content: 'Server only', ephemeral: true });

    if (interaction.guild.id !== SUPPORT_GUILD_ID)
      return interaction.reply({ content: 'Only support server', ephemeral: true });

    const introText =
      '**Yuna Bot Support Server**\n\nWelcome to the official support server for the Yuna Bot. This server is intended for users who need help, want to report issues, suggest features, or interact with the community. We are not an official Discord service, but a community-driven support hub focused on helping users get the best experience possible with Yuna.\n\nTo ensure everything runs smoothly, please read and follow the rules below.';

    const embeds = [
      new EmbedBuilder()
        .setColor(COLORS[0])
        .setTitle('Respectful Communication')
        .setDescription(
          'Be polite, respectful, and mindful when interacting with others. Harassment, insults, discrimination, or any form of toxic behavior will not be tolerated. We want this server to be a safe space for everyone, regardless of background or experience.\n\nCriticism is allowed, but it must remain constructive and respectful.'
        ),

      new EmbedBuilder()
        .setColor(COLORS[1])
        .setTitle('Support & Purpose')
        .setDescription(
          'This server exists primarily to support users of the Yuna Bot. Please keep discussions related to the bot, its features, or general community interaction.\n\nIf you need help, provide clear information so others can assist you effectively.'
        ),

      new EmbedBuilder()
        .setColor(COLORS[2])
        .setTitle('No Spam or Advertising')
        .setDescription(
          'Spamming messages, mentions, emojis, or links is not allowed. Advertising other servers, services, or products without permission from staff is strictly prohibited.\n\nRepeated violations may lead to restrictions or removal.'
        ),

      new EmbedBuilder()
        .setColor(COLORS[3])
        .setTitle('Accurate Information')
        .setDescription(
          'Please avoid spreading false or misleading information. If you are unsure about something, ask instead of assuming.\n\nProviding helpful and accurate answers improves the experience for everyone.'
        ),

      new EmbedBuilder()
        .setColor(COLORS[4])
        .setTitle('Privacy & Safety')
        .setDescription(
          'Do not share personal information (yours or others), including addresses, private conversations, or sensitive data.\n\nRespect the privacy of all members at all times.'
        ),

      new EmbedBuilder()
        .setColor(COLORS[5])
        .setTitle('Content Guidelines')
        .setDescription(
          'NSFW, illegal, violent, or otherwise inappropriate content is strictly forbidden. This includes images, links, and text.\n\nKeep the environment clean and safe for everyone.'
        ),

      new EmbedBuilder()
        .setColor(COLORS[6])
        .setTitle('Use Channels Properly')
        .setDescription(
          'Each channel has a specific purpose. Please use the correct channels and read their descriptions before posting.\n\nOff-topic messages may be removed to keep things organized.'
        ),

      new EmbedBuilder()
        .setColor(COLORS[7])
        .setTitle('Respect Staff')
        .setDescription(
          'Staff members are here to help maintain the server. Please respect their decisions and follow their instructions.\n\nIf you disagree with a decision, discuss it calmly in private.'
        ),

      new EmbedBuilder()
        .setColor(COLORS[8])
        .setTitle('Constructive Community')
        .setDescription(
          'We encourage helpful discussions, feedback, and suggestions. Your input helps improve the Yuna Bot and the community.\n\nBe part of building a positive and supportive environment.'
        ),

      new EmbedBuilder()
        .setColor(COLORS[9])
        .setTitle('Final Notes')
        .setDescription(
          'These rules are here to ensure a good experience for everyone. Staff may take action even if something is not explicitly listed here.\n\nBy participating in this server, you agree to follow these guidelines.\n\nEnjoy your stay and have fun using Yuna ??'
        )
    ];

    await interaction.reply({
      content: 'Rules posted',
      ephemeral: true
    });

    await interaction.channel.send({
      content: introText,
      embeds
    });
  }
};