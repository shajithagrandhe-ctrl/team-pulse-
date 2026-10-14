-- EstateHub database schema (MySQL)
-- Generated as a human-readable reference for database/schema.prisma

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'EMPLOYEE', 'CUSTOMER', 'AGENT') NOT NULL,
  department VARCHAR(255),
  position VARCHAR(255),
  admin_code VARCHAR(255) UNIQUE,
  employee_id VARCHAR(255) UNIQUE,
  phone_number VARCHAR(255),
  address VARCHAR(255),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  last_login DATETIME(3)
);

CREATE TABLE locations (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
);

CREATE TABLE ventures (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  location_id CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT ventures_location_fk FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
);

CREATE INDEX ventures_location_id_idx ON ventures(location_id);

CREATE TABLE plots (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  plot_number VARCHAR(255) NOT NULL,
  status ENUM('AVAILABLE', 'ADVANCE', 'SOLD') NOT NULL,
  area INT NOT NULL,
  price_per_sq_yard INT NOT NULL,
  venture_id CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT plots_venture_fk FOREIGN KEY (venture_id) REFERENCES ventures(id) ON DELETE CASCADE
);

CREATE INDEX plots_venture_id_idx ON plots(venture_id);
CREATE INDEX plots_status_idx ON plots(status);

CREATE TABLE leads (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  plot_id CHAR(36) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  contact_number VARCHAR(64) NOT NULL,
  location VARCHAR(255) NOT NULL,
  unique_id VARCHAR(255) NOT NULL UNIQUE,
  price_per_sq_yard INT NOT NULL,
  notes TEXT,
  photo_url VARCHAR(2048),
  status ENUM('NEW', 'FOLLOW_UP', 'QUALIFIED', 'WON', 'LOST') NOT NULL DEFAULT 'NEW',
  agent_id CHAR(36),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT leads_plot_fk FOREIGN KEY (plot_id) REFERENCES plots(id) ON DELETE CASCADE,
  CONSTRAINT leads_agent_fk FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX leads_plot_id_idx ON leads(plot_id);
CREATE INDEX leads_agent_id_idx ON leads(agent_id);

CREATE TABLE customer_records (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  contact_name VARCHAR(255) NOT NULL,
  contact_number VARCHAR(64) NOT NULL,
  location VARCHAR(255) NOT NULL,
  budget VARCHAR(255) NOT NULL,
  interested BOOLEAN NOT NULL DEFAULT false,
  record_owner VARCHAR(255) NOT NULL,
  notes TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

CREATE TABLE favorites (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  plot_id CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY favorites_user_plot_unique (user_id, plot_id),
  CONSTRAINT favorites_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT favorites_plot_fk FOREIGN KEY (plot_id) REFERENCES plots(id) ON DELETE CASCADE
);

CREATE TABLE agent_profiles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL UNIQUE,
  bio TEXT,
  phone VARCHAR(64),
  license_number VARCHAR(255),
  photo_url VARCHAR(2048),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT agent_profiles_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE inquiries (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  plot_id CHAR(36),
  agent_id CHAR(36),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(64),
  message TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT inquiries_plot_fk FOREIGN KEY (plot_id) REFERENCES plots(id) ON DELETE SET NULL,
  CONSTRAINT inquiries_agent_fk FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE tracking_updates (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  customer_id CHAR(36) NOT NULL UNIQUE,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE', 'MOVING'),
  address VARCHAR(255),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  updated_by CHAR(36),
  CONSTRAINT tracking_customer_fk FOREIGN KEY (customer_id) REFERENCES customer_records(id) ON DELETE CASCADE,
  CONSTRAINT tracking_updated_by_fk FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX tracking_updated_by_idx ON tracking_updates(updated_by);
