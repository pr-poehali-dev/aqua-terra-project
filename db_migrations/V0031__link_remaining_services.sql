-- Разовый визит → "Разовый выезд" (id=10)
UPDATE t_p51549197_aqua_terra_project.services SET category_id=10 WHERE id=4;
-- Перевозка → "Перевозка" (id=8)
UPDATE t_p51549197_aqua_terra_project.services SET category_id=8 WHERE id=5;
-- Консультация → "Консультация" (id=9)
UPDATE t_p51549197_aqua_terra_project.services SET category_id=9 WHERE id=6;
-- Изготовление аквариума/террариума/декораций → "Индивидуальный проект" (id=11)
UPDATE t_p51549197_aqua_terra_project.services SET category_id=11 WHERE id IN (8,9,10);