-- Добавляем parent_id для иерархии категорий
ALTER TABLE t_p51549197_aqua_terra_project.service_categories
  ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES t_p51549197_aqua_terra_project.service_categories(id);

-- Добавляем верхнеуровневые категории (тип услуги)
INSERT INTO t_p51549197_aqua_terra_project.service_categories (name, slug, icon, sort_order, active)
SELECT 'Оформление', 'design', 'Palette', 1, true
WHERE NOT EXISTS (SELECT 1 FROM t_p51549197_aqua_terra_project.service_categories WHERE slug = 'design');

INSERT INTO t_p51549197_aqua_terra_project.service_categories (name, slug, icon, sort_order, active)
SELECT 'Обслуживание', 'maintenance', 'Wrench', 2, true
WHERE NOT EXISTS (SELECT 1 FROM t_p51549197_aqua_terra_project.service_categories WHERE slug = 'maintenance');

INSERT INTO t_p51549197_aqua_terra_project.service_categories (name, slug, icon, sort_order, active)
SELECT 'Перевозка', 'transport', 'Truck', 3, true
WHERE NOT EXISTS (SELECT 1 FROM t_p51549197_aqua_terra_project.service_categories WHERE slug = 'transport');

INSERT INTO t_p51549197_aqua_terra_project.service_categories (name, slug, icon, sort_order, active)
SELECT 'Консультация', 'consultation', 'MessageCircle', 4, true
WHERE NOT EXISTS (SELECT 1 FROM t_p51549197_aqua_terra_project.service_categories WHERE slug = 'consultation');

INSERT INTO t_p51549197_aqua_terra_project.service_categories (name, slug, icon, sort_order, active)
SELECT 'Разовый выезд', 'visit', 'MapPin', 5, true
WHERE NOT EXISTS (SELECT 1 FROM t_p51549197_aqua_terra_project.service_categories WHERE slug = 'visit');

INSERT INTO t_p51549197_aqua_terra_project.service_categories (name, slug, icon, sort_order, active)
SELECT 'Индивидуальный проект', 'custom', 'Star', 6, true
WHERE NOT EXISTS (SELECT 1 FROM t_p51549197_aqua_terra_project.service_categories WHERE slug = 'custom');
