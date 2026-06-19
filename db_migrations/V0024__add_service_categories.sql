CREATE TABLE IF NOT EXISTS t_p51549197_aqua_terra_project.service_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT 'Layers',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE t_p51549197_aqua_terra_project.services
  ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES t_p51549197_aqua_terra_project.service_categories(id);
