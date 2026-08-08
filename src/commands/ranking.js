import { SlashCommandBuilder } from 'discord.js';
import { query } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('ranking')
  .setDescription('Mostra o top 10 de fichas ou prestígio')
  .addStringOption((opt) =>
    opt
      .setName('tipo')
      .setDescription('fichas ou prestigio')
      .addChoices(
        { name: 'Fichas', value: 'fichas' },
        { name: 'Prestígio', value: 'prestigio' }
      )
  );

export async function execute(interaction) {
  const tipo = interaction.options.getString('tipo') || 'fichas';
  const coluna = tipo === 'prestigio' ? 'prestige_points' : 'chip_balance';
  const emoji = tipo === 'prestigio' ? '⭐' : '💰';

  const res = await query(
    `SELECT discord_id, ${coluna} AS valor FROM users ORDER BY ${coluna} DESC LIMIT 10`
  );

  if (res.rows.length === 0) {
    return interaction.reply('Ninguém no ranking ainda.');
  }

  const linhas = res.rows.map(
    (r, i) => `${i + 1}. <@${r.discord_id}> — ${emoji} ${r.valor}`
  );

  await interaction.reply({ content: `**Ranking (${tipo})**\n` + linhas.join('\n') });
}
