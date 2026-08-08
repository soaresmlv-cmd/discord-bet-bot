import { SlashCommandBuilder } from 'discord.js';
import { ensureUser } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('saldo')
  .setDescription('Mostra suas fichas e pontos de prestígio');

export async function execute(interaction) {
  const user = await ensureUser(interaction.user.id);
  await interaction.reply({
    content:
      `💰 **Fichas:** ${user.chip_balance}\n` +
      `⭐ **Prestígio:** ${user.prestige_points}`,
    ephemeral: true,
  });
}
