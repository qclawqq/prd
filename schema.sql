-- ============================================================
-- 爱心公益平台 数据库初始化脚本
-- ============================================================

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  background TEXT,
  project_type VARCHAR(20) NOT NULL CHECK (project_type IN ('goods_only', 'money_only', 'mixed')),
  goods_name VARCHAR(100),
  goods_unit VARCHAR(20),
  goods_price DECIMAL(12,2),
  goods_target_qty DECIMAL(12,2),
  money_target DECIMAL(12,2),
  volunteer_target INT DEFAULT 0,
  deadline DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewing', 'ongoing', 'ended')),
  media_urls JSONB DEFAULT '[]',
  remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_progress (
  project_id INT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  current_goods_qty DECIMAL(12,2) DEFAULT 0,
  current_money DECIMAL(12,2) DEFAULT 0,
  current_volunteer INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS donations (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) ON DELETE SET NULL,
  donor_name VARCHAR(100),
  donor_contact VARCHAR(100),
  type VARCHAR(10) NOT NULL CHECK (type IN ('money', 'goods', 'volunteer')),
  amount DECIMAL(12,2),
  goods_name VARCHAR(100),
  goods_qty DECIMAL(12,2),
  volunteer_skill TEXT,
  message TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'fulfilled', 'contacted')),
  certificate_code VARCHAR(50) UNIQUE,
  certificate_generated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_out_orders (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) ON DELETE SET NULL,
  out_type VARCHAR(10) NOT NULL CHECK (out_type IN ('goods', 'money')),
  goods_name VARCHAR(100),
  quantity DECIMAL(12,2) NOT NULL,
  recipient VARCHAR(200),
  purpose TEXT,
  order_date DATE,
  created_by INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  paragraph1 TEXT,
  media_urls JSONB DEFAULT '[]',
  conclusion TEXT,
  write_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS love_wall (
  id SERIAL PRIMARY KEY,
  type VARCHAR(10) NOT NULL CHECK (type IN ('image', 'video')),
  media_url VARCHAR(500) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  donation_id INT REFERENCES donations(id) ON DELETE SET NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS love_stories (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('image', 'video')),
  media_url VARCHAR(500) NOT NULL,
  donor_name VARCHAR(100),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_assets (
  id SERIAL PRIMARY KEY,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(10) CHECK (file_type IN ('image', 'video', 'audio')),
  original_name VARCHAR(255),
  upload_time TIMESTAMP DEFAULT NOW(),
  used_count INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donations_project ON donations(project_id);
CREATE INDEX IF NOT EXISTS idx_donations_type ON donations(type);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type);
CREATE INDEX IF NOT EXISTS idx_achievements_project ON achievements(project_id);
CREATE INDEX IF NOT EXISTS idx_love_wall_active ON love_wall(is_active);
CREATE INDEX IF NOT EXISTS idx_love_stories_active ON love_stories(is_active);

INSERT INTO admins (username, password_hash) VALUES ('admin', '$2b$10$K8J5G7pVHJ6GZqWzZ3K5JOXxXqK5pJ9H5sQ4a7r3Y8vH6mN0wD3u') ON CONFLICT (username) DO NOTHING;
