-- Старые категории (1-5) становятся подкатегориями "Оформление" (id=6)
-- и переходят на sort_order для подкатегорий
UPDATE t_p51549197_aqua_terra_project.service_categories SET parent_id = 6, sort_order = 1 WHERE id = 1;
UPDATE t_p51549197_aqua_terra_project.service_categories SET parent_id = 6, sort_order = 2 WHERE id = 2;
UPDATE t_p51549197_aqua_terra_project.service_categories SET parent_id = 6, sort_order = 3 WHERE id = 3;
UPDATE t_p51549197_aqua_terra_project.service_categories SET parent_id = 6, sort_order = 4 WHERE id = 4;
UPDATE t_p51549197_aqua_terra_project.service_categories SET parent_id = 6, sort_order = 5 WHERE id = 5;

-- Добавляем ещё подкатегорию Палюдариум под Оформление (уже есть id=5)
-- Также добавим подкатегории для "Обслуживание" (id=7)
INSERT INTO t_p51549197_aqua_terra_project.service_categories (name, slug, icon, sort_order, active, parent_id)
SELECT 'Морской аквариум', 'maint-marine', 'Waves', 1, true, 7
WHERE NOT EXISTS (SELECT 1 FROM t_p51549197_aqua_terra_project.service_categories WHERE slug = 'maint-marine');

INSERT INTO t_p51549197_aqua_terra_project.service_categories (name, slug, icon, sort_order, active, parent_id)
SELECT 'Пресный аквариум', 'maint-freshwater', 'Droplets', 2, true, 7
WHERE NOT EXISTS (SELECT 1 FROM t_p51549197_aqua_terra_project.service_categories WHERE slug = 'maint-freshwater');

INSERT INTO t_p51549197_aqua_terra_project.service_categories (name, slug, icon, sort_order, active, parent_id)
SELECT 'Террариум', 'maint-terrarium', 'Bug', 3, true, 7
WHERE NOT EXISTS (SELECT 1 FROM t_p51549197_aqua_terra_project.service_categories WHERE slug = 'maint-terrarium');

INSERT INTO t_p51549197_aqua_terra_project.service_categories (name, slug, icon, sort_order, active, parent_id)
SELECT 'Флорариум', 'maint-florarium', 'Leaf', 4, true, 7
WHERE NOT EXISTS (SELECT 1 FROM t_p51549197_aqua_terra_project.service_categories WHERE slug = 'maint-florarium');
