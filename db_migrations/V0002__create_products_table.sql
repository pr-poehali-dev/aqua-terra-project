CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'animals',
  tag TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'Package',
  photo_url TEXT,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX products_category_idx ON products (category, in_stock);

INSERT INTO products (name, price, category, tag, icon) VALUES
('Геккон эублефар', 4500, 'animals', 'Рептилия', 'Turtle'),
('Креветка Вишня', 120, 'animals', 'Аквариум', 'Fish'),
('Паук-птицеед', 2800, 'animals', 'Экзотика', 'Bug'),
('Сверчок банановый', 350, 'food', 'Живой корм', 'Bug'),
('Мыши кормовые', 90, 'food', 'Заморозка', 'Wheat'),
('Зофобас', 420, 'food', 'Живой корм', 'Wheat'),
('Грунт питательный', 1200, 'supplies', 'Аквариум', 'Package'),
('Лампа УФ для рептилий', 2100, 'supplies', 'Террариум', 'Lightbulb'),
('Фильтр внешний', 5600, 'supplies', 'Оборудование', 'Settings');
