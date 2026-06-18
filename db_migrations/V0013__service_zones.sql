-- Зоны обслуживания для карты
CREATE TABLE t_p51549197_aqua_terra_project.service_zones (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  color VARCHAR(16) NOT NULL DEFAULT '#22c55e',
  opacity FLOAT NOT NULL DEFAULT 0.3,
  zone_type VARCHAR(16) NOT NULL DEFAULT 'polygon',
  -- Для полигона: массив координат [[lat,lon], ...]
  -- Для круга: центр + радиус
  coordinates JSONB NOT NULL DEFAULT '[]',
  center_lat FLOAT,
  center_lon FLOAT,
  radius_km FLOAT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Преднастроенные зоны: Звенигород + 25км, Одинцовский р-н, запад Москвы
INSERT INTO t_p51549197_aqua_terra_project.service_zones (name, color, opacity, zone_type, coordinates, center_lat, center_lon, radius_km, sort_order) VALUES
  ('Звенигород и окрестности (25 км)', '#22c55e', 0.25, 'circle', '[]', 55.7328, 36.8517, 25, 1),
  ('Одинцовский район', '#22c55e', 0.25, 'polygon', '[[55.62,36.78],[55.62,37.22],[55.85,37.22],[55.85,36.78]]', NULL, NULL, NULL, 2),
  ('Красногорск', '#22c55e', 0.25, 'circle', '[]', 55.8218, 37.3417, 8, 3),
  ('Запад и Северо-Запад Москвы', '#22c55e', 0.25, 'polygon', '[[55.72,37.20],[55.72,37.55],[55.87,37.55],[55.87,37.20]]', NULL, NULL, NULL, 4),
  ('Новорижское шоссе', '#22c55e', 0.25, 'polygon', '[[55.62,36.80],[55.62,37.20],[55.78,37.20],[55.78,36.80]]', NULL, NULL, NULL, 5);
