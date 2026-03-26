const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  ApplicationIntegrationType
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

  async execute(interaction, client) {
    try {
      const user = interaction.options.getUser('user') || interaction.user;

      const fetchedUser = await client.users.fetch(user.id, { force: true });
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

      const embed = new EmbedBuilder()
        .setColor(fetchedUser.accentColor || 0x2b2d31)
        .setTitle(`${fetchedUser.username}'s profile`)
        .setURL(`https://discord.com/users/${fetchedUser.id}`)
        .setThumbnail(avatar)
        .addFields(
          {
            name: 'User',
            value: `${fetchedUser.tag}\n\`${fetchedUser.id}\``,
            inline: true
          },
          {
            name: 'Bot',
            value: fetchedUser.bot ? 'Yes' : 'No',
            inline: true
          },
          {
            name: 'Accent Color',
            value: formatHex(fetchedUser.accentColor),
            inline: true
          },
          {
            name: 'Badges',
            value: badges,
            inline: false
          },
          {
            name: 'Account Created',
            value: `<t:${Math.floor(fetchedUser.createdTimestamp / 1000)}:F>\n(<t:${Math.floor(fetchedUser.createdTimestamp / 1000)}:R>)`,
            inline: false
          }
        )
        .setFooter({ text: `Requested by ${interaction.user.username}` })
        .setTimestamp();

      if (member) {
        embed.addFields(
          {
            name: 'Joined Server',
            value: member.joinedTimestamp
              ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>\n(<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`
              : 'Unknown',
            inline: false
          },
          {
            name: 'Nickname',
            value: member.nickname || 'None',
            inline: true
          },
          {
            name: 'Highest Role',
            value:
              member.roles.highest && member.roles.highest.id !== interaction.guild.id
                ? `<@&${member.roles.highest.id}>`
                : 'None',
            inline: true
          },
          {
            name: 'Server Booster',
            value: member.premiumSinceTimestamp
              ? `<t:${Math.floor(member.premiumSinceTimestamp / 1000)}:R>`
              : 'No',
            inline: true
          }
        );
      }

      if (banner) {
        embed.setImage(banner);
      }

      const buttons = [
        new ButtonBuilder()
          .setLabel('Avatar URL')
          .setStyle(ButtonStyle.Link)
          .setURL(avatar)
      ];

      if (banner) {
        buttons.push(
          new ButtonBuilder()
            .setLabel('Banner URL')
            .setStyle(ButtonStyle.Link)
            .setURL(banner)
        );
      }

      buttons.push(
        new ButtonBuilder()
          .setLabel('Profile')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/users/${fetchedUser.id}`)
      );

      const row = new ActionRowBuilder().addComponents(...buttons);

      await interaction.reply({
        embeds: [embed],
        components: [row]
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