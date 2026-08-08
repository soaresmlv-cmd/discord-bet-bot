import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export async function query(text, params) {
  return pool.query(text, params);
}

// Garante que o usuário existe na tabela users; retorna a linha do usuário.
export async function ensureUser(discordId) {
  const existing = await query('SELECT * FROM users WHERE discord_id = $1', [discordId]);
  if (existing.rows.length > 0) return existing.rows[0];
  const created = await query(
    'INSERT INTO users (discord_id) VALUES ($1) RETURNING *',
    [discordId]
  );
  return created.rows[0];
}

// Aplica um delta de fichas ao usuário e grava no ledger.
export async function applyChipDelta(userId, delta, reason, refId = null) {
  await query('UPDATE users SET chip_balance = chip_balance + $1 WHERE id = $2', [delta, userId]);
  await query(
    'INSERT INTO ledger (user_id, delta, reason, ref_id) VALUES ($1, $2, $3, $4)',
    [userId, delta, reason, refId]
  );
}

// Adiciona pontos de prestígio (não gastáveis).
export async function addPrestige(userId, amount, refId = null) {
  await query('UPDATE users SET prestige_points = prestige_points + $1 WHERE id = $2', [amount, userId]);
  await query(
    'INSERT INTO ledger (user_id, delta, reason, ref_id) VALUES ($1, $2, $3, $4)',
    [userId, amount, 'prestige_earned', refId]
  );
}

export async function getActiveSeason() {
  const res = await query('SELECT * FROM seasons WHERE is_active = true ORDER BY starts_at DESC LIMIT 1');
  return res.rows[0] || null;
}

export default pool;
