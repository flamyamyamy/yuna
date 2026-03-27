const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  ApplicationIntegrationType,
  ContainerBuilder,
  TextDisplayBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SeparatorBuilder,
  MessageFlags
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
      opt
        .setName('user')
        .setDescription('Target user')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const user = interaction.options.getUser('user') || interaction.user;

      const avatar = user.displayAvatarURL({
        size: 1024,
        extension: 'png'
      });

      const container = new ContainerBuilder()
        .setAccentColor(0x2b2d31)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            [
              `# ${user.username}'s avatar`,
              '',
              `**User:** ${user.tag}`,
              `**ID:** \`${user.id}\``
            ].join('\n')
          )
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addMediaGalleryComponents(
          new MediaGalleryBuilder().addItems(
            new MediaGalleryItemBuilder()
              .setURL(avatar)
              .setDescription(`${user.username}'s avatar`)
          )
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `*Requested by ${interaction.user.username}*`
          )
        )
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel('Open Avatar')
              .setStyle(ButtonStyle.Link)
              .setURL(avatar),
            new ButtonBuilder()
              .setLabel('Profile')
              .setStyle(ButtonStyle.Link)
              .setURL(`https://discord.com/users/${user.id}`)
          )
        );

      await interaction.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    } catch (error) {
      console.error('avatar error:', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'There was an error while fetching the avatar.',
          flags: 64
        }).catch(() => null);
      } else {
        await interaction.reply({
          content: 'There was an error while fetching the avatar.',
          flags: 64
        }).catch(() => null);
      }
    }
  }
};