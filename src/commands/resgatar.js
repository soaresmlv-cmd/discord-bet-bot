import { SlashCommandBuilder } from 'discord.js';
import { query, ensureUser, getActiveSeason } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('resgatar')
  .setDescription('Resgata um produto da loja usando pontos de prestígio')
  .addStringOption((opt) =>
    opt.setName('produto_id').setDescription('ID do produto (veja em /loja)').setRequired(true)
  );

export async function execute(interaction) {
  const productId = interaction.options.getString('produto_id');
  const user = await ensureUser(interaction.user.id);

  const productRes = await query('SELECT * FROM products WHERE id = $1', [productId]);
  const product = productRes.rows[0];
  if (!product) {
    return interaction.reply({ content: '⚠️ Produto não encontrado.', ephemeral: true });
  }
  if (product.stock <= 0) {
    return interaction.reply({ content: '⚠️ Produto esgotado.', ephemeral: true });
  }
  if (user.prestige_points < product.cost_prestige) {
    return interaction.reply({
      content: `⚠️ Prestígio insuficiente. Você tem ${user.prestige_points}, precisa de ${product.cost_prestige}.`,
      ephemeral: true,
    });
  }

  const season = await getActiveSeason();

  await query('UPDATE users SET prestige_points = prestige_points - $1 WHERE id = $2', [
    product.cost_prestige,
    user.id,
  ]);
  await query('UPDATE products SET stock = stock - 1 WHERE id = $1', [product.id]);
  const redemption = await query(
    `INSERT INTO redemptions (user_id, product_id, season_id, status)
     VALUES ($1, $2, $3, 'pending') RETURNING id`,
    [user.id, product.id, season?.id || null]
  );
  await query(
    "INSERT INTO ledger (user_id, delta, reason, ref_id) VALUES ($1, $2, 'redemption', $3)",
    [user.id, -product.cost_prestige, redemption.rows[0].id]
  );

  await interaction.reply({
    content:
      `🎁 Resgate registrado: **${product.name}**!\n` +
      `Pedido \`${redemption.rows[0].id}\` está pendente — a organização vai combinar a entrega com você.`,
  });
}
