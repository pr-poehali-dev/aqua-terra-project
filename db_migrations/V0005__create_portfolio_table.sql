CREATE TABLE portfolio (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  tag TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'Fish',
  photo_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO portfolio (title, tag, icon, sort_order) VALUES
('Морской риф 400л',       'Аквариум',   'Fish',   1),
('Тропический палюдариум', 'Палюдариум', 'Waves',  2),
('Пустынный террариум',    'Террариум',  'Turtle', 3),
('Акваскейп «Лес»',        'Аквариум',   'Sprout', 4);
