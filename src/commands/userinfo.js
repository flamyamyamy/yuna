const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  ApplicationIntegrationType,
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags
} = require('discord.js');

function formatHex(color) {
  if (!color) return 'None';
  return `#${color.toString(16).padStart(6, '0').toUpperCase()}`;
}

function formatBadges(flags = []) {
  const badgeMap = {
    Staff: '<:Staff:1486088043373789324>',
    Partner: '<:discordpartner:1485856247591997470>',
    Hypesquad: '<:hypesquadevents:1485854115102986260>',
    BugHunterLevel1: '<:discordbughunter:1486089501146353768>',
    BugHunterLevel2: '<:bughuntergold:1485854044353204224>',
    HypeSquadOnlineHouse1: '<:hypesquadbravery:1485853974262321242>',
    HypeSquadOnlineHouse2: '<:Brilliance:1486088638776479884>',
    HypeSquadOnlineHouse3: '<:hypesquadbalance:1485853862899224667>',
    PremiumEarlySupporter: '<:earlysupporter:1485853825247088680>',
    VerifiedDeveloper: '<:earlyverifiedbotdeveloper:1486091043811365026>',
    CertifiedModerator: '<:moderatorprogramsalumni:1486090665631682622>'
  };

  if (!flags.length) return 'None';

  const badgeList = flags
    .map(flag => badgeMap[flag])
    .filter(Boolean)
    .join(' ');

  return badgeList || 'None';
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Show detailed information about a user')
    .setIntegrationTypes(
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall
    )
    .setContexts(
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to inspect')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const user = interaction.options.getUser('user') || interaction.user;
      const fetchedUser = await interaction.client.users.fetch(user.id, { force: true });

      const member = interaction.guild
        ? await interaction.guild.members.fetch(user.id).catch(() => null)
        : null;

      const avatar = fetchedUser.displayAvatarURL({
        size: 1024,
        extension: 'png'
      });

      const banner = fetchedUser.bannerURL({
        size: 1024,
        extension: 'png'
      });

      const flags = fetchedUser.flags ? fetchedUser.flags.toArray() : [];
      const badges = formatBadges(flags);

      const createdAt = `<t:${Math.floor(fetchedUser.createdTimestamp / 1000)}:F>\n(<t:${Math.floor(fetchedUser.createdTimestamp / 1000)}:R>)`;

      const joinedAt = member?.joinedTimestamp
        ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>\n(<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`
        : 'Unknown';

      const highestRole =
        member?.roles?.highest && interaction.guild && member.roles.highest.id !== interaction.guild.id
          ? `<@&${member.roles.highest.id}>`
          : 'None';

      const boosterSince = member?.premiumSinceTimestamp
        ? `<t:${Math.floor(member.premiumSinceTimestamp / 1000)}:R>`
        : 'No';

      const mainText = [
        `# ${fetchedUser.username}'s profile`,
        '',
        `**User**`,
        `${fetchedUser.tag}`,
        `\`${fetchedUser.id}\``,
        '',
        `**Bot:** ${fetchedUser.bot ? 'Yes' : 'No'}`,
        `**Accent Color:** ${formatHex(fetchedUser.accentColor)}`,
        `**Badges:** ${badges}`,
        '',
        `**Account Created:**`,
        `${createdAt}`
      ].join('\n');

      const container = new ContainerBuilder()
        .setAccentColor(fetchedUser.accentColor || 0x2b2d31)
        .addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(mainText)
            )
            .setThumbnailAccessory(
              new ThumbnailBuilder()
                .setURL(avatar)
                .setDescription(`${fetchedUser.username}'s avatar`)
            )
        );

      if (member) {
        container
          .addSeparatorComponents(new SeparatorBuilder())
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              [
                '## Server Information',
                '',
                `**Joined Server:**`,
                `${joinedAt}`,
                '',
                `**Nickname:** ${member.nickname || 'None'}`,
                `**Highest Role:** ${highestRole}`,
                `**Server Booster:** ${boosterSince}`
              ].join('\n')
            )
          );
      }

      if (banner) {
        container
          .addSeparatorComponents(new SeparatorBuilder())
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('## Banner')
          )
          .addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(
              new MediaGalleryItemBuilder()
                .setURL(banner)
                .setDescription(`${fetchedUser.username}'s banner`)
            )
          );
      }

      container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('Avatar URL')
            .setStyle(ButtonStyle.Link)
            .setURL(avatar),
          ...(banner
            ? [
                new ButtonBuilder()
                  .setLabel('Banner URL')
                  .setStyle(ButtonStyle.Link)
                  .setURL(banner)
              ]
            : []),
          new ButtonBuilder()
            .setLabel('Profile')
            .setStyle(ButtonStyle.Link)
            .setURL(`https://discord.com/users/${fetchedUser.id}`)
        )
      );

      await interaction.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    } catch (error) {
      console.error('userinfo error:', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'There was an error while fetching the user info.',
          flags: 64
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: 'There was an error while fetching the user info.',
          flags: 64
        }).catch(() => {});
      }
    }
  }
};