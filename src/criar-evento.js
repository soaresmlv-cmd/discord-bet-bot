import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { query, getActiveSeason } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('criar-evento')
  .setDescription('Cria um novo evento de apostas (admin)')
  .addStringOption((opt) =>
    opt.setName('titulo').setDescription('Título do evento').setRequired(true)
  )
  .addStringOption((opt) =>
    opt
      .setName('opcoes')
      .setDescription('Opções separadas por vírgula, ex: Time A,Time B')
      .setRequired(true)
  )
  .addStringOption((opt) =>
    opt
      .setName('fecha-em')
      .setDescription('Data/hora de fechamento (formato: YYYY-MM-DD HH:mm)')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  const titulo = interaction.options.getString('titulo');
  const opcoesRaw = interaction.options.getString('opcoes');
  const fechaEm = interaction.options.getString('fecha-em');

  const opcoes = opcoesRaw.split(',').map((o) => o.trim()).filter(Boolean);
  if (opcoes.length < 2) {
    return interaction.reply({
      content: '⚠️ Informe pelo menos 2 opções separadas por vírgula.',
      ephemeral: true,
    });
  }

  const closesAt = new Date(fechaEm.replace(' ', 'T'));
  if (isNaN(closesAt.getTime())) {
    return interaction.reply({
      content: '⚠️ Data inválida. Use o formato YYYY-MM-DD HH:mm.',
      ephemeral: true,
    });
  }

  const season = await getActiveSeason();

  const eventRes = await query(
    `INSERT INTO events (season_id, title, closes_at, created_by)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [season?.id || null, titulo, closesAt, interaction.user.id]
  );
  const eventId = eventRes.rows[0].id;

  for (const label of opcoes) {
    await query('INSERT INTO outcomes (event_id, label) VALUES ($1, $2)', [eventId, label]);
  }

  await interaction.reply({
    content:
      `🎲 **Evento criado:** ${titulo}\n` +
      `Opções: ${opcoes.join(' | ')}\n` +
      `Fecha em: ${closesAt.toLocaleString('pt-BR')}\n` +
      `Use \`/apostar\` para participar!`,
  });
}
