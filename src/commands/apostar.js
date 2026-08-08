import { SlashCommandBuilder } from 'discord.js';
import { query, ensureUser, applyChipDelta } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('apostar')
  .setDescription('Aposta fichas em um evento aberto')
  .addStringOption((opt) =>
    opt.setName('evento_id').setDescription('ID do evento (veja em /eventos)').setRequired(true)
  )
  .addStringOption((opt) =>
    opt.setName('opcao').setDescription('Texto exato da opção escolhida').setRequired(true)
  )
  .addIntegerOption((opt) =>
    opt.setName('valor').setDescription('Quantidade de fichas').setRequired(true).setMinValue(1)
  );

export async function execute(interaction) {
  const eventId = interaction.options.getString('evento_id');
  const opcaoTexto = interaction.options.getString('opcao');
  const valor = interaction.options.getInteger('valor');

  const user = await ensureUser(interaction.user.id);

  const eventRes = await query('SELECT * FROM events WHERE id = $1', [eventId]);
  const event = eventRes.rows[0];
  if (!event) {
    return interaction.reply({ content: '⚠️ Evento não encontrado.', ephemeral: true });
  }
  if (event.status !== 'open' || new Date() > new Date(event.closes_at)) {
    return interaction.reply({ content: '⚠️ Esse evento já está fechado.', ephemeral: true });
  }
  if (user.chip_balance < valor) {
    return interaction.reply({ content: '⚠️ Fichas insuficientes.', ephemeral: true });
  }

  const outcomeRes = await query(
    'SELECT * FROM outcomes WHERE event_id = $1 AND label = $2',
    [eventId, opcaoTexto]
  );
  const outcome = outcomeRes.rows[0];
  if (!outcome) {
    return interaction.reply({ content: '⚠️ Opção inválida para esse evento.', ephemeral: true });
  }

  const betRes = await query(
    'INSERT INTO bets (user_id, event_id, outcome_id, amount) VALUES ($1, $2, $3, $4) RETURNING id',
    [user.id, eventId, outcome.id, valor]
  );

  await applyChipDelta(user.id, -valor, 'bet_placed', betRes.rows[0].id);

  await interaction.reply({
    content: `✅ Aposta registrada: **${valor} fichas** em **${opcaoTexto}** no evento "${event.title}".`,
    ephemeral: true,
  });
}
