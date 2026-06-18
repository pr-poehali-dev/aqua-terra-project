-- 3 зоны вместо 4: обновляем подписи, ring4 игнорируем в коде
-- work_points теперь хранит индивидуальные радиусы: [{lat, lon, address, r1_km, r2_km, r3_km}]
UPDATE t_p51549197_aqua_terra_project.price_zones SET
  ring1_km = 10, ring1_factor = 1.0, ring1_label = 'Рядом',
  ring2_km = 30, ring2_factor = 1.5, ring2_label = 'Недалеко',
  ring3_km = 60, ring3_factor = 2.0, ring3_label = 'Далеко';
