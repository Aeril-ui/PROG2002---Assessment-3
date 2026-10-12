CREATE DATABASE IF NOT EXISTS charityevents_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE charityevents_db;

DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS organisations;

CREATE TABLE organisations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  mission VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  address VARCHAR(255) NOT NULL
);

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organisation_id INT NOT NULL,
  category_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  short_description VARCHAR(255) NOT NULL,
  full_description TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  location VARCHAR(120) NOT NULL,
  venue VARCHAR(200) NOT NULL,
  ticket_price DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  goal_amount DECIMAL(10,2) NOT NULL,
  progress_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  image_url VARCHAR(255) NOT NULL,
  latitude DECIMAL(9,6) DEFAULT NULL,
  longitude DECIMAL(9,6) DEFAULT NULL,
  is_suspended TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_events_organisation
    FOREIGN KEY (organisation_id) REFERENCES organisations (id),
  CONSTRAINT fk_events_category
    FOREIGN KEY (category_id) REFERENCES categories (id)
);

INSERT INTO organisations (name, mission, description, email, phone, address)
VALUES (
  'Harbour Light Community Fund',
  'Helping Brisbane neighbours find housing, meals, and a fair start at school.',
  'Harbour Light Community Fund is a local charity that raises money for emergency housing, community meals, and school supplies. This website lists the fund\'s public events so people in Brisbane can read the details and register their interest.',
  'hello@harbourlight.example',
  '07 3000 2140',
  '12 River Terrace, South Brisbane QLD 4101'
);

INSERT INTO categories (name) VALUES
  ('Fun run'),
  ('Gala'),
  ('Auction'),
  ('Concert');

CREATE TABLE registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  user_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  ticket_count INT NOT NULL DEFAULT 1,
  registration_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_registrations_event
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE RESTRICT,
  CONSTRAINT uq_event_registration_user
    UNIQUE (event_id, email)
);
