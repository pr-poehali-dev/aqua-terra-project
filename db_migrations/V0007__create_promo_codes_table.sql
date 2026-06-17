CREATE TABLE promo_codes (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount INTEGER NOT NULL CHECK (discount > 0 AND discount <= 100),
  description TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  uses_count INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO promo_codes (code, discount, description, active) VALUES
('AQUA10',      10, 'Приветственная скидка 10%',  true),
('TERRA15',     15, 'Скидка для любителей рептилий', true),
('AQUASCALE20', 20, 'VIP промокод 20%',            true);
