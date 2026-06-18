CREATE TABLE IF NOT EXISTS t_p51549197_aqua_terra_project.client_locations (
  id         SERIAL PRIMARY KEY,
  address    TEXT NOT NULL,
  lat        FLOAT NOT NULL,
  lon        FLOAT NOT NULL,
  radius_km  FLOAT NOT NULL DEFAULT 5,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
