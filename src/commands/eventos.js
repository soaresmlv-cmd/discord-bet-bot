import { SlashCommandBuilder } from 'discord.js';
import { query } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('eventos')
  .setDescription('Lista eventos abertos e o pool acumulado por opção');

export async function execute(interaction) {
  const eventsRes = await query(
    "SELECT * FROM events WHERE status = 'open' ORDER BY closes_at ASC"
  );

  if (eventsRes.rows.length === 0) {
    return interaction.reply({ content: 'Nenhum evento aberto no momento.', ephemeral: true });
  }

  const blocks = [];
  for (const event of eventsRes.rows) {
    const poolRes = await query(
      `SELECT o.label, o.id, COALESCE(SUM(b.amount), 0) AS pool
       FROM outcomes o
       LEFT JOIN bets b ON b.outcome_id = o.id
       WHERE o.event_id = $1
       GROUP BY o.id, o.label`,
      [event.id]
    );
    const linhas = poolRes.rows
      .map((r) => `   • ${r.label}: ${r.pool} fichas no pool`)
      .join('\n');
    blocks.push(
      `🎲 **${event.title}** (ID: \`${event.id}\`)\n` +
      `   Fecha em: ${new Date(event.closes_at).toLocaleString('pt-BR')}\n${linhas}`
    );
  }

  await interaction.reply({ content: blocks.join('\n\n') });
}
