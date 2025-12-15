-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assets
-- Note: real_estate_details is stored as JSONB to avoid extra join tables.
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('LIQUIDITY', 'INVESTMENT', 'REAL_ESTATE', 'CRYPTO')),
  value NUMERIC(14,2) NOT NULL DEFAULT 0,
  yield_rate NUMERIC(10,4) NOT NULL DEFAULT 0,
  real_estate_details JSONB, -- structure flexible: { monthlyRent, hasLoan, loanAmount, loanRate, loanDurationYears, loanStartDate }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assets_user ON assets(user_id);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
  label TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);

-- Add label column to existing installations if missing, and add optional constraint
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS label TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_label_check'
  ) THEN
    ALTER TABLE transactions
      ADD CONSTRAINT transactions_label_check CHECK (label IS NULL OR label IN (
        'Perso', 'Salaire', 'Crédits', 'Mobile & Internet', 'Divertissement', 'Banque', 'Assurances', 'Eau', 'Électricité', 'Voiture', 'Impôts', 'Alimentation', 'Loyer', 'Shopping', 'Vacances'
      ));
  END IF;
END$$;

  -- Backfill existing NULL labels to 'Perso' for consistency
  UPDATE transactions SET label = 'Perso' WHERE label IS NULL;

-- Optional: simple function to help insert consistent JSON structure for real estate (example)
-- INSERT INTO assets (...) VALUES (..., jsonb_build_object('monthlyRent', 1200, 'hasLoan', true, 'loanAmount', 200000, 'loanRate', 1.5, 'loanDurationYears', 20, 'loanStartDate', '2023-01-01'));