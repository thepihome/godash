-- App-wide settings (AI matching configuration, etc.)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);
