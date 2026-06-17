CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  icon TEXT NOT NULL DEFAULT 'Wrench',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_from INTEGER NOT NULL DEFAULT 0,
  price_unit TEXT NOT NULL DEFAULT 'за работу',
  tags TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO services (icon, title, description, price_from, price_unit, tags, sort_order) VALUES
('Fish',    'Оформление аквариума',      'Дизайн, декор, растения, грунт — под ключ. Пресные и морские системы.',          5000,  'за работу', ARRAY['Пресный','Морской'],    1),
('Turtle',  'Оформление террариума',     'Создание живого биотопа под конкретный вид рептилий, амфибий или пауков.',         4000,  'за работу', ARRAY['Тропик','Пустыня'],     2),
('Sprout',  'Флорариум / Палюдариум',    'Стеклянные сады с живыми растениями, мхами и водопадами.',                        6000,  'за работу', ARRAY['Флорариум','Палюдариум'],3),
('Wrench',  'Обслуживание',              'Регулярный уход: чистка, подмена воды, контроль параметров, корм.',               1500,  'за визит',  ARRAY['Разовый','Договор'],    4),
('Truck',   'Перевозка',                 'Бережная транспортировка аквариумов и террариумов с обитателями.',                2000,  'за выезд',  ARRAY['По городу','МО'],       5),
('Star',    'Консультация',              'Подбор оборудования, животных, параметров воды — онлайн или на выезде.',          500,   'онлайн',    ARRAY['Онлайн','Выезд'],       6);
