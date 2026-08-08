import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { query, applyChipDelta, addPrestige } from '../db.js';

const PRESTIGE_RATE = 0.10; // 10% do valor ganho vira prestígio

export const data = new SlashCommandBuilder()
  .setName('resultado')
  .setDescription('Marca o vencedor de um evento e liquida as apostas (admin)')
  .addStringOption((opt) =>
    opt.setName('evento_id').setDescription('ID do evento').setRequired(true)
  )
  .addStringOption((opt) =>
    opt.setName('vencedor').setDescription('Texto exato da opção vencedora').setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  const eventId = interaction.options.getString('evento_id');
  const vencedorTexto = interaction.options.getString('vencedor');

  const eventRes = await query('SELECT * FROM events WHERE id = $1', [eventId]);
  const event = eventRes.rows[0];
  if (!event || event.status !== 'open') {
    return interaction.reply({ content: '⚠️ Evento inválido ou já liquidado.', ephemeral: true });
  }

  const outcomeRes = await query(
    'SELECT * FROM outcomes WHERE event_id = $1 AND label = $2',
    [eventId, vencedorTexto]
  );
  const winningOutcome = outcomeRes.rows[0];
  if (!winningOutcome) {
    return interaction.reply({ content: '⚠️ Opção vencedora não encontrada.', ephemeral: true });
  }

  await query('UPDATE outcomes SET is_winner = true WHERE id = $1', [winningOutcome.id]);

  const totalRes = await query('SELECT COALESCE(SUM(amount),0) AS total FROM bets WHERE event_id = $1', [eventId]);
  const winPoolRes = await query('SELECT COALESCE(SUM(amount),0) AS total FROM bets WHERE outcome_id = $1', [winningOutcome.id]);
  const totalPool = Number(totalRes.rows[0].total);
  const winPool = Number(winPoolRes.rows[0].total);

  let resumo = `🏁 **${event.title}** liquidado! Vencedor: **${vencedorTexto}**\n`;

  if (winPool === 0 || totalPool === 0) {
    resumo += 'Ninguém apostou no lado vencedor — pool não distribuído.';
  } else {
    const winningBets = await query('SELECT * FROM bets WHERE outcome_id = $1', [winningOutcome.id]);
    const linhas = [];
    for (const bet of winningBets.rows) {
      const payout = Math.floor((totalPool / winPool) * bet.amount);
      const prestigeGain = Math.floor(payout * PRESTIGE_RATE);
      await applyChipDelta(bet.user_id, payout, 'bet_won', bet.id);
      if (prestigeGain > 0) await addPrestige(bet.user_id, prestigeGain, bet.id);
      linhas.push(`<@${(await query('SELECT discord_id FROM users WHERE id = $1', [bet.user_id])).rows[0].discord_id}>: +${payout} fichas (+${prestigeGain} prestígio)`);
    }
    resumo += `Pool total: ${totalPool} fichas\n` + linhas.join('\n');
  }

  await query("UPDATE events SET status = 'closed' WHERE id = $1", [eventId]);
  await interaction.reply({ content: resumo });
}
