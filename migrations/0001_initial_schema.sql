-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  industry TEXT,
  memo TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CSV Upload History
CREATE TABLE IF NOT EXISTS uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  original_data TEXT NOT NULL, -- JSON string of original CSV
  column_mapping TEXT NOT NULL, -- JSON string of mapping config
  row_count INTEGER DEFAULT 0,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Normalized SNS Data (after CSV import and cleaning)
CREATE TABLE IF NOT EXISTS sns_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  upload_id INTEGER NOT NULL,
  date DATE NOT NULL,
  title TEXT,
  link TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  watch_time_sec INTEGER DEFAULT 0,
  avg_view_duration_sec REAL DEFAULT 0,
  vcr REAL DEFAULT 0, -- View Completion Rate
  profile_views INTEGER DEFAULT 0,
  follows INTEGER DEFAULT 0,
  outbound_clicks INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0, -- Calculated: likes + comments + shares + saves
  engagement_rate REAL DEFAULT 0, -- Calculated: engagement / reach
  week_iso TEXT, -- ISO week format: 2025-W46
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE CASCADE
);

-- KPI Settings (monthly, weekly, custom)
CREATE TABLE IF NOT EXISTS kpi_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  kpi_type TEXT NOT NULL, -- 'monthly', 'weekly', 'custom'
  period TEXT NOT NULL, -- '2025-11' for monthly, '2025-W46' for weekly
  metric_name TEXT NOT NULL,
  metric_label TEXT,
  target_value REAL,
  formula TEXT, -- For custom KPIs
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Generated Reports
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  report_type TEXT NOT NULL, -- 'monthly_client', 'weekly_internal'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  title TEXT NOT NULL,
  content_markdown TEXT, -- Generated markdown content
  content_html TEXT, -- Generated HTML content
  metadata TEXT, -- JSON: highlights, issues, proposals, top posts
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Data Quality Logs (cleaning/validation issues)
CREATE TABLE IF NOT EXISTS data_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  upload_id INTEGER NOT NULL,
  log_type TEXT NOT NULL, -- 'error', 'warning', 'info'
  message TEXT NOT NULL,
  row_data TEXT, -- JSON of problematic row
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE CASCADE
);

-- Column Mapping Templates (saved mappings per client)
CREATE TABLE IF NOT EXISTS column_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  mapping_name TEXT NOT NULL,
  mapping_config TEXT NOT NULL, -- JSON of column mapping
  is_default INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_uploads_client_id ON uploads(client_id);
CREATE INDEX IF NOT EXISTS idx_sns_data_client_id ON sns_data(client_id);
CREATE INDEX IF NOT EXISTS idx_sns_data_date ON sns_data(date);
CREATE INDEX IF NOT EXISTS idx_sns_data_week_iso ON sns_data(week_iso);
CREATE INDEX IF NOT EXISTS idx_kpi_settings_client_id ON kpi_settings(client_id);
CREATE INDEX IF NOT EXISTS idx_kpi_settings_period ON kpi_settings(period);
CREATE INDEX IF NOT EXISTS idx_reports_client_id ON reports(client_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_data_logs_upload_id ON data_logs(upload_id);
