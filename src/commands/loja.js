import { SlashCommandBuilder } from 'discord.js';
import { query } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('loja')
  .setDescription('Lista os produtos disponíveis para resgate com prestígio');

export async function execute(interaction) {
  const res = await query('SELECT * FROM products WHERE stock > 0 ORDER BY cost_prestige ASC');

  if (res.rows.length === 0) {
    return interaction.reply('Nenhum produto disponível no momento.');
  }

  const linhas = res.rows.map(
    (p) => `• **${p.name}** — ⭐ ${p.cost_prestige} pontos (estoque: ${p.stock})\n  ID: \`${p.id}\``
  );

  await interaction.reply({ content: '🛒 **Loja de resgate**\n\n' + linhas.join('\n\n') });
}
