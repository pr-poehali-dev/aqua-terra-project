-- Оформление пресного аквариума → тип "Пресный аквариум" (id=2)
UPDATE t_p51549197_aqua_terra_project.services SET category_id=2 WHERE id=1 AND category_id IS NULL;
-- Оформление террариума → тип "Террариум" (id=4)
UPDATE t_p51549197_aqua_terra_project.services SET category_id=4 WHERE id=2 AND category_id IS NULL;
-- Флорариум/Палюдариум → "Флорариум" (id=3)
UPDATE t_p51549197_aqua_terra_project.services SET category_id=3 WHERE id=3 AND category_id IS NULL;
-- Оформление морского аквариума → "Морской аквариум" (id=1)
UPDATE t_p51549197_aqua_terra_project.services SET category_id=1 WHERE id=7 AND category_id IS NULL;