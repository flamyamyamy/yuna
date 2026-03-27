require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  ActivityType
} = require('discord.js');

const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();
const commandsArray = [];


const commandFiles = fs
  .readdirSync('./src/commands')
  .filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`); 

  try {
    command.data.toJSON();

    client.commands.set(command.data.name, command);
    commandsArray.push(command.data.toJSON());

    console.log(`Loaded command: ${command.data.name}`);
  } catch (err) {
    console.error(`ERROR IN COMMAND: ${file}`);
    console.error(err);
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  client.user.setPresence({
    status: 'dnd',
    activities: [
      {
        name: 'your profile',
        type: ActivityType.Watching
      }
    ]
  });

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commandsArray }
    );

    console.log('Commands registered globally');
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(err);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'Something went wrong',
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: 'Something went wrong',
        ephemeral: true
      });
    }
  }
});

client.login(process.env.TOKEN);