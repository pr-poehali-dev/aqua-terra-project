-- Добавляем поле points в price_zones
-- Структура: [{ lat, lon, radius_km, address }] для каждой зоны
ALTER TABLE t_p51549197_aqua_terra_project.price_zones
  ADD COLUMN IF NOT EXISTS zone1_points JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS zone2_points JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS zone3_points JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS zone4_points JSONB DEFAULT '[]'::jsonb;
