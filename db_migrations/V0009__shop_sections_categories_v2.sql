CREATE TABLE t_p51549197_aqua_terra_project.shop_sections (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(64) NOT NULL UNIQUE,
  title VARCHAR(128) NOT NULL,
  description TEXT DEFAULT '',
  icon VARCHAR(64) DEFAULT 'Package',
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  has_order_form BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p51549197_aqua_terra_project.shop_categories (
  id SERIAL PRIMARY KEY,
  section_id INT NOT NULL REFERENCES t_p51549197_aqua_terra_project.shop_sections(id),
  slug VARCHAR(64) NOT NULL,
  title VARCHAR(128) NOT NULL,
  icon VARCHAR(64) DEFAULT 'Tag',
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  UNIQUE(section_id, slug)
);

ALTER TABLE t_p51549197_aqua_terra_project.products
  ADD COLUMN IF NOT EXISTS section_id INT,
  ADD COLUMN IF NOT EXISTS category_id INT,
  ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

INSERT INTO t_p51549197_aqua_terra_project.shop_sections (slug, title, description, icon, sort_order, active, has_order_form) VALUES
  ('freshwater', 'Пресный аквариум', 'Всё для пресноводных аквариумов', 'Waves', 1, TRUE, FALSE),
  ('marine', 'Морской аквариум', 'Всё для морских рифовых аквариумов', 'Fish', 2, TRUE, FALSE),
  ('terrarium', 'Террариум', 'Всё для террариумов', 'Turtle', 3, TRUE, FALSE),
  ('custom', 'На заказ', 'Аквариумы и террариумы на заказ', 'Sparkles', 4, TRUE, TRUE);

INSERT INTO t_p51549197_aqua_terra_project.shop_categories (section_id, slug, title, icon, sort_order) VALUES
  (1, 'fish',      'Рыбы и беспозвоночные', 'Fish',         1),
  (1, 'plants',    'Растения',              'Sprout',        2),
  (1, 'chemistry', 'Химия',                 'FlaskConical',  3),
  (1, 'food',      'Корма',                 'Wheat',         4),
  (1, 'equipment', 'Оборудование',          'Settings',      5),
  (1, 'supplies',  'Расходные материалы',   'Package',       6),
  (2, 'fish',      'Рыбы и беспозвоночные', 'Fish',         1),
  (2, 'plants',    'Кораллы и водоросли',   'Sprout',        2),
  (2, 'chemistry', 'Химия и добавки',       'FlaskConical',  3),
  (2, 'food',      'Корма',                 'Wheat',         4),
  (2, 'equipment', 'Оборудование',          'Settings',      5),
  (2, 'supplies',  'Расходные материалы',   'Package',       6),
  (3, 'animals',   'Животные',              'Turtle',        1),
  (3, 'supplies',  'Расходные материалы',   'Package',       2),
  (3, 'equipment', 'Оборудование',          'Settings',      3),
  (3, 'food',      'Корма',                 'Wheat',         4),
  (3, 'additives', 'Добавки',               'FlaskConical',  5);

UPDATE t_p51549197_aqua_terra_project.products SET section_id = 3, category_id = 13 WHERE id = 1;
UPDATE t_p51549197_aqua_terra_project.products SET section_id = 1, category_id = 1  WHERE id = 2;
UPDATE t_p51549197_aqua_terra_project.products SET section_id = 3, category_id = 13 WHERE id = 3;
UPDATE t_p51549197_aqua_terra_project.products SET section_id = 3, category_id = 16 WHERE id = 4;
UPDATE t_p51549197_aqua_terra_project.products SET section_id = 3, category_id = 16 WHERE id = 5;
UPDATE t_p51549197_aqua_terra_project.products SET section_id = 3, category_id = 16 WHERE id = 6;
UPDATE t_p51549197_aqua_terra_project.products SET section_id = 1, category_id = 6  WHERE id = 7;
UPDATE t_p51549197_aqua_terra_project.products SET section_id = 3, category_id = 15 WHERE id = 8;
UPDATE t_p51549197_aqua_terra_project.products SET section_id = 1, category_id = 5  WHERE id = 9;
