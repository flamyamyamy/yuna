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
      opt
        .setName('user')
        .setDescription('Target user')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const user = interaction.options.getUser('user') || interaction.user;

      const fetched = await interaction.client.users.fetch(user.id, { force: true });
      const banner = fetched.bannerURL({
        size: 1024,
        extension: 'png'
      });

      if (!banner) {
        return interaction.reply({
          content: 'This user has no banner.',
          flags: 64
        });
      }

      const container = new ContainerBuilder()
        .setAccentColor(fetched.accentColor || 0x2b2d31)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${user.username}'s banner`)
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addMediaGalleryComponents(
          new MediaGalleryBuilder().addItems(
            new MediaGalleryItemBuilder().setURL(banner)
          )
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel('Open Banner')
              .setStyle(ButtonStyle.Link)
              .setURL(banner)
          )
        );

      await interaction.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    } catch (error) {
      console.error('banner error:', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'There was an error while fetching the banner.',
          flags: 64
        }).catch(() => null);
      } else {
        await interaction.reply({
          content: 'There was an error while fetching the banner.',
          flags: 64
        }).catch(() => null);
      }
    }
  }
};