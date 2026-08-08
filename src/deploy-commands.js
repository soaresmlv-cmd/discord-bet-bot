import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

const commands = [];
for (const file of commandFiles) {
  const filePath = pathToFileURL(path.join(commandsPath, file));
  const command = await import(filePath);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

try {
  console.log(`Registrando ${commands.length} comandos...`);
  await rest.put(
    Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
    { body: commands }
  );
  console.log('✅ Comandos registrados com sucesso.');
} catch (err) {
  console.error(err);
}
