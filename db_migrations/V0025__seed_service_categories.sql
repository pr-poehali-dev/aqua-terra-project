INSERT INTO t_p51549197_aqua_terra_project.service_categories (name, slug, icon, sort_order)
SELECT 'Морской аквариум', 'marine', 'Waves', 1
WHERE NOT EXISTS (SELECT 1 FROM t_p51549197_aqua_terra_project.service_categories WHERE slug = 'marine');

INSERT INTO t_p51549197_aqua_terra_project.service_categories (name, slug, icon, sort_order)
SELECT 'Пресный аквариум', 'freshwater', 'Droplets', 2
WHERE NOT EXISTS (SELECT 1 FROM t_p51549197_aqua_terra_project.service_categories WHERE slug = 'freshwater');

INSERT INTO t_p51549197_aqua_terra_project.service_categories (name, slug, icon, sort_order)
SELECT 'Флорариум', 'florarium', 'Leaf', 3
WHERE NOT EXISTS (SELECT 1 FROM t_p51549197_aqua_terra_project.service_categories WHERE slug = 'florarium');

INSERT INTO t_p51549197_aqua_terra_project.service_categories (name, slug, icon, sort_order)
SELECT 'Террариум', 'terrarium', 'Bug', 4
WHERE NOT EXISTS (SELECT 1 FROM t_p51549197_aqua_terra_project.service_categories WHERE slug = 'terrarium');

INSERT INTO t_p51549197_aqua_terra_project.service_categories (name, slug, icon, sort_order)
SELECT 'Палюдариум', 'paludarium', 'TreePine', 5
WHERE NOT EXISTS (SELECT 1 FROM t_p51549197_aqua_terra_project.service_categories WHERE slug = 'paludarium');
