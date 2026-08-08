-- Bot de Apostas Sociais no Discord — Schema PostgreSQL

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id VARCHAR(32) UNIQUE NOT NULL,
  chip_balance INTEGER NOT NULL DEFAULT 1000,
  prestige_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(64) NOT NULL,
  starts_at DATE NOT NULL,
  ends_at DATE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES seasons(id),
  title VARCHAR(200) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'open', -- open | closed
  closes_at TIMESTAMPTZ NOT NULL,
  created_by VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL,
  is_winner BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  event_id UUID NOT NULL REFERENCES events(id),
  outcome_id UUID NOT NULL REFERENCES outcomes(id),
  amount INTEGER NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  delta INTEGER NOT NULL,
  reason VARCHAR(32) NOT NULL, -- bet_placed | bet_won | prestige_earned | redemption
  ref_id UUID, -- id da aposta ou resgate relacionado
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  cost_prestige INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  season_id UUID REFERENCES seasons(id),
  status VARCHAR(16) NOT NULL DEFAULT 'pending', -- pending | delivered
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bets_event ON bets(event_id);
CREATE INDEX idx_bets_user ON bets(user_id);
CREATE INDEX idx_ledger_user ON ledger(user_id);
CREATE INDEX idx_events_status ON events(status);
