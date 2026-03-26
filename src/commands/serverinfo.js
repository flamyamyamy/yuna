const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  ApplicationIntegrationType
} = require('discord.js');

const verificationLevels = {
  0: 'None',
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Very High'
};

const nsfwLevels = {
  0: 'Default',
  1: 'Explicit',
  2: 'Safe',
  3: 'Age Restricted'
};

function cleanInvite(input) {
  return input
    .replace('https://discord.gg/', '')
    .replace('https://discord.com/invite/', '')
    .trim();
}

function formatFeatureName(feature) {
  return feature
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Show detailed information about a server via invite')
    .setIntegrationTypes(
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall
    )
    .setContexts(
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel
    )
    .addStringOption(option =>
      option.setName('invite').setDescription('Invite').setRequired(true)
    ),

  async execute(interaction, client) {
    const inviteCode = cleanInvite(
      interaction.options.getString('invite')
    );

    try {
      const invite = await client.fetchInvite(inviteCode, {
        withCounts: true
      });

      const guild = invite.guild;

      const icon = guild.iconURL?.({ size: 1024 }) || null;

      const formattedFeatures = guild.features?.length
        ? guild.features
            .map(formatFeatureName)
            .map(f => `- ${f}`)
            .join('\n')
        : 'None';

      // ?? BASE EMBED (OHNE FEATURES)
      const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle(guild.name)
        .setDescription('Click the button to reveal features.')
        .addFields(
          { name: 'Server ID', value: `\`${guild.id}\``, inline: true },
          { name: 'Members', value: `${invite.memberCount}`, inline: true },
          { name: 'Verification', value: verificationLevels[guild.verificationLevel] }
        )
        .setThumbnail(icon)
        .setTimestamp();

      const button = new ButtonBuilder()
        .setCustomId(`show_features_${interaction.id}`)
        .setLabel('Show Features')
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(button);

      await interaction.reply({
        embeds: [embed],
        components: [row]
      });

      const msg = await interaction.fetchReply();

      const collector = msg.createMessageComponentCollector({
        time: 60000
      });

      collector.on('collect', async i => {
        if (i.customId !== `show_features_${interaction.id}`) return;

        // ?? UPDATED EMBED MIT CODEBLOCK
        const updated = EmbedBuilder.from(embed).addFields({
          name: `Features (${guild.features.length})`,
          value: `\`\`\`yaml\n${formattedFeatures}\n\`\`\``
        });

        // ?? Button deaktivieren
        const disabledRow = new ActionRowBuilder().addComponents(
          ButtonBuilder.from(button).setDisabled(true)
        );

        await i.update({
          embeds: [updated],
          components: [disabledRow]
        });
      });

    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: '? Invalid invite.',
        flags: 64
      });
    }
  }
};