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
    ),

  async execute(interaction, client) {
    const user = interaction.options.getUser('user') || interaction.user;

    const fetchedUser = await client.users.fetch(user.id, { force: true });
    const member = interaction.guild
      ? await interaction.guild.members.fetch(user.id).catch(() => null)
      : null;

    const avatar = user.displayAvatarURL({ size: 1024, extension: 'png' });
    const banner = fetchedUser.bannerURL({ size: 1024, extension: 'png' });

    const embed = new EmbedBuilder()
      .setColor(fetchedUser.accentColor || 0x2b2d31)
      .setTitle(`${user.username}'s profile`)
      .setURL(`https://discord.com/users/${user.id}`)
      .setThumbnail(avatar)
      .addFields(
        {
          name: 'User',
          value: `${user.tag}\n\`${user.id}\``,
          inline: true
        },
        {
          name: 'Bot',
          value: user.bot ? 'Yes' : 'No',
          inline: true
        },
        {
          name: 'Accent Color',
          value: formatHex(fetchedUser.accentColor),
          inline: true
        },
        {
          name: 'Account Created',
          value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>\n(<t:${Math.floor(user.createdTimestamp / 1000)}:R>)`,
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
          value: member.roles.highest?.id === interaction.guild.id
            ? 'None'
            : `<@&${member.roles.highest.id}>`,
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
        .setURL(`https://discord.com/users/${user.id}`)
    );

    const row = new ActionRowBuilder().addComponents(...buttons);

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};