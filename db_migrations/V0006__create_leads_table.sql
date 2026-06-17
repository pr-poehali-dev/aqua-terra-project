CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  contact TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'form',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX leads_read_idx ON leads (read, created_at DESC);
