-- Общие настройки сайта (hero, stats, contacts)
CREATE TABLE t_p51549197_aqua_terra_project.site_settings (
  key VARCHAR(64) PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- FAQ
CREATE TABLE t_p51549197_aqua_terra_project.faq (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE
);

-- Квиз: вопросы
CREATE TABLE t_p51549197_aqua_terra_project.quiz_questions (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE
);

-- Квиз: варианты ответов
CREATE TABLE t_p51549197_aqua_terra_project.quiz_answers (
  id SERIAL PRIMARY KEY,
  question_id INT NOT NULL REFERENCES t_p51549197_aqua_terra_project.quiz_questions(id),
  text TEXT NOT NULL,
  type VARCHAR(16) NOT NULL,
  sort_order INT DEFAULT 0
);

-- Квиз: результаты
CREATE TABLE t_p51549197_aqua_terra_project.quiz_results (
  type VARCHAR(16) PRIMARY KEY,
  title VARCHAR(128) NOT NULL,
  description TEXT NOT NULL,
  tip TEXT NOT NULL
);

-- Дефолтные настройки сайта
INSERT INTO t_p51549197_aqua_terra_project.site_settings (key, value) VALUES
  ('hero_badge', 'Аквариумы · Террариумы · Экзотика'),
  ('hero_title', 'Живая природа в вашем доме'),
  ('hero_subtitle', 'Оформление, обслуживание и перевозка аквариумов и террариумов любой сложности. Магазин экзотических животных, кормов и материалов.'),
  ('stat_years', '15'),
  ('stat_projects', '200'),
  ('stat_clients', '500'),
  ('stat_rating', '4.9'),
  ('contacts_phone', '+7 905 533 7226'),
  ('contacts_address', 'Москва, работаем по всему городу'),
  ('contacts_telegram', 'aquascale'),
  ('contacts_email', ''),
  ('contacts_whatsapp', '');

-- Дефолтные FAQ
INSERT INTO t_p51549197_aqua_terra_project.faq (question, answer, sort_order) VALUES
  ('Как часто нужно обслуживать аквариум?', 'Зависит от объёма и населения — обычно раз в 1–2 недели. Мы составим индивидуальный график.', 1),
  ('Вы перевозите аквариумы с рыбами?', 'Да, мы бережно транспортируем обитателей в специальных ёмкостях с аэрацией.', 2),
  ('Какой минимальный объём аквариума вы оформляете?', 'Работаем с любыми объёмами — от 20 литров до нескольких тонн.', 3),
  ('Даёте ли гарантию на работу?', 'Да, мы даём гарантию 12 месяцев на все выполненные работы.', 4);

-- Дефолтные вопросы квиза
INSERT INTO t_p51549197_aqua_terra_project.quiz_questions (question, sort_order) VALUES
  ('Что тебя привлекает больше всего?', 1),
  ('Как ты представляешь свой идеальный уголок природы?', 2),
  ('Сколько времени готов уделять уходу?', 3);

-- Ответы
INSERT INTO t_p51549197_aqua_terra_project.quiz_answers (question_id, text, type, sort_order) VALUES
  (1, 'Подводный мир и рыбы', 'aqua', 1),
  (1, 'Рептилии и экзотические животные', 'terra', 2),
  (1, 'Растения и живая природа', 'flora', 3),
  (2, 'Журчащая вода и плавающие рыбки', 'aqua', 1),
  (2, 'Камни, песок и греющийся геккон', 'terra', 2),
  (2, 'Зелёные листья и влажный воздух', 'flora', 3),
  (3, '30 минут в неделю — я занятой человек', 'aqua', 1),
  (3, 'Готов кормить каждый день, мне нравится', 'terra', 2),
  (3, 'Поливать раз в неделю — мой максимум', 'flora', 3);

-- Результаты квиза
INSERT INTO t_p51549197_aqua_terra_project.quiz_results (type, title, description, tip) VALUES
  ('aqua', 'Хранитель Рифа', 'Ты создан для подводного мира. Твоя стихия — аквариумы с живыми растениями, яркими рыбами и успокаивающим течением воды.', 'В нашем Telegram — советы по запуску аквариума и акции на оборудование.'),
  ('terra', 'Повелитель Пустыни', 'Тебя манят рептилии и экзотика. Геккон на ладони или паук-птицеед в стильном террариуме — твой стиль.', 'Подпишись на Telegram: каждую неделю новые животные и скидки на корма.'),
  ('flora', 'Лесной Дух', 'Тебе по душе зелень и жизнь. Флорариум или палюдариум с папоротниками и мхами создадут атмосферу живого леса у тебя дома.', 'В Telegram делимся советами по уходу за растениями и редкими новинками.');
