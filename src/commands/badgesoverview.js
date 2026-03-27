const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MessageFlags
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('badgesoverview')
    .setDescription('Shows a badge overview of the server'),

  async execute(interaction) {
    const guild = interaction.guild;

    if (!guild) {
      return interaction.reply({
        components: [
          new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent('This command can only be used in a server.')
          )
        ],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
      });
    }

    await interaction.deferReply({
      flags: MessageFlags.IsComponentsV2
    });

    await guild.members.fetch();

    const e = {
      staff: '<:Staff:1486088043373789324>',
      partner: '<:discordpartner:1485856247591997470>',
      bughunter: '<:discordbughunter:1486089501146353768>',
      bughuntergold: '<:bughuntergold:1485854044353204224>',
      hypesquad: '<:hypesquadevents:1485854115102986260>',
      bravery: '<:hypesquadbravery:1485853974262321242>',
      brilliance: '<:Brilliance:1486088638776479884>',
      balance: '<:hypesquadbalance:1485853862899224667>',
      earlysupporter: '<:earlysupporter:1485853825247088680>',
      earlydev: '<:earlyverifiedbotdeveloper:1486091043811365026>',
      alumni: '<:moderatorprogramsalumni:1486090665631682622>',
      booster: '<:booster:1485917206041722912>',
      newmember: '<:newmember:1485916842701619301>'
    };

    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    const members = [...guild.members.cache.values()].filter(member => !member.user.bot);

    let newMembers = 0;
    for (const member of members) {
      if (member.joinedTimestamp && now - member.joinedTimestamp <= sevenDays) {
        newMembers++;
      }
    }

    const boosterRole = guild.roles.premiumSubscriberRole;
    const boosters = boosterRole ? boosterRole.members.size : 0;

    const totals = {
      staff: 0,
      partner: 0,
      bughunter: 0,
      bughuntergold: 0,
      hypesquad: 0,
      bravery: 0,
      brilliance: 0,
      balance: 0,
      earlysupporter: 0,
      earlydev: 0,
      alumni: 0
    };

    function countFlags(user) {
      const flags = user.flags;

      return {
        staff: flags?.has('Staff') ? 1 : 0,
        partner: flags?.has('Partner') ? 1 : 0,
        bughunter: flags?.has('BugHunterLevel1') ? 1 : 0,
        bughuntergold: flags?.has('BugHunterLevel2') ? 1 : 0,
        hypesquad: flags?.has('Hypesquad') ? 1 : 0,
        bravery: flags?.has('HypeSquadOnlineHouse1') ? 1 : 0,
        brilliance: flags?.has('HypeSquadOnlineHouse2') ? 1 : 0,
        balance: flags?.has('HypeSquadOnlineHouse3') ? 1 : 0,
        earlysupporter: flags?.has('PremiumEarlySupporter') ? 1 : 0,
        earlydev: flags?.has('VerifiedDeveloper') ? 1 : 0,
        alumni: flags?.has('CertifiedModerator') ? 1 : 0
      };
    }

    async function processInBatches(items, batchSize, fn) {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const results = await Promise.allSettled(batch.map(fn));

        for (const result of results) {
          if (result.status !== 'fulfilled' || !result.value) continue;

          const row = result.value;

          totals.staff += row.staff;
          totals.partner += row.partner;
          totals.bughunter += row.bughunter;
          totals.bughuntergold += row.bughuntergold;
          totals.hypesquad += row.hypesquad;
          totals.bravery += row.bravery;
          totals.brilliance += row.brilliance;
          totals.balance += row.balance;
          totals.earlysupporter += row.earlysupporter;
          totals.earlydev += row.earlydev;
          totals.alumni += row.alumni;
        }
      }
    }

    await processInBatches(members, 10, async (member) => {
      const freshUser = await member.user.fetch().catch(() => null);
      if (!freshUser) return null;
      return countFlags(freshUser);
    });

    const overviewText = [
      `# ${guild.name} Badge Overview`,
      '',
      `${e.staff} Discord Staff: **${totals.staff}**`,
      `${e.partner} Discord Partners: **${totals.partner}**`,
      `${e.hypesquad} HypeSquad Events: **${totals.hypesquad}**`,
      `${e.brilliance} Brilliance: **${totals.brilliance}**`,
      `${e.bravery} Bravery: **${totals.bravery}**`,
      `${e.balance} Balance: **${totals.balance}**`,
      `${e.bughuntergold} Golden Bug Hunter: **${totals.bughuntergold}**`,
      `${e.bughunter} Bug Hunter: **${totals.bughunter}**`,
      `${e.earlydev} Early Verified Developer: **${totals.earlydev}**`,
      `${e.alumni} Moderator Programs Alumni: **${totals.alumni}**`,
      `${e.earlysupporter} Early Supporters: **${totals.earlysupporter}**`,
      `${e.newmember} New Members: **${newMembers}**`,
      `${e.booster} Server Boosters: **${boosters}**`,
      '',
      `**Total Members:** ${guild.memberCount}`
    ].join('\n');

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(overviewText)
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `- Scanned **${members.length}** non-bot members\n- Live fetched without database cache`
        )
      );

    await interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};