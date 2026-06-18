-- Таблица настройки ценовых зон по радиусу
CREATE TABLE IF NOT EXISTS t_p51549197_aqua_terra_project.price_zones (
  id          SERIAL PRIMARY KEY,
  center_lat  FLOAT NOT NULL DEFAULT 55.7328,
  center_lon  FLOAT NOT NULL DEFAULT 36.8517,
  -- 4 кольца: радиус в км и коэффициент цены
  zone1_radius FLOAT NOT NULL DEFAULT 20,
  zone1_factor FLOAT NOT NULL DEFAULT 1.0,
  zone1_label  VARCHAR(64) DEFAULT 'Основная зона',
  zone2_radius FLOAT NOT NULL DEFAULT 35,
  zone2_factor FLOAT NOT NULL DEFAULT 1.2,
  zone2_label  VARCHAR(64) DEFAULT 'Ближняя зона',
  zone3_radius FLOAT NOT NULL DEFAULT 55,
  zone3_factor FLOAT NOT NULL DEFAULT 1.5,
  zone3_label  VARCHAR(64) DEFAULT 'Средняя зона',
  zone4_radius FLOAT NOT NULL DEFAULT 80,
  zone4_factor FLOAT NOT NULL DEFAULT 2.0,
  zone4_label  VARCHAR(64) DEFAULT 'Дальняя зона',
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at   TIMESTAMP DEFAULT NOW()
);

-- Вставляем дефолтные настройки
INSERT INTO t_p51549197_aqua_terra_project.price_zones
  (center_lat, center_lon, zone1_radius, zone1_factor, zone1_label, zone2_radius, zone2_factor, zone2_label, zone3_radius, zone3_factor, zone3_label, zone4_radius, zone4_factor, zone4_label)
VALUES
  (55.7328, 36.8517, 20, 1.0, 'Основная зона', 35, 1.3, 'Ближняя зона', 55, 1.6, 'Средняя зона', 80, 2.0, 'Дальняя зона');
