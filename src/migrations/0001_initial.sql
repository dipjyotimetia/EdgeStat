-- EdgeStat: Initial schema
-- Sites table
CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Events table (main analytics data)
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('pageview','session_start','session_end','custom','web_vital')),
  url TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  device_type TEXT CHECK(device_type IN ('desktop','mobile','tablet')),
  browser TEXT,
  country TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  event_name TEXT,
  event_props TEXT,
  vital_name TEXT,
  vital_value REAL,
  session_id TEXT,
  timestamp INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (site_id) REFERENCES sites(id)
);

-- Only 2 indexes to minimize write amplification (~3 rows written per INSERT)
CREATE INDEX IF NOT EXISTS idx_events_site_ts ON events(site_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_events_site_session ON events(site_id, session_id);

-- Pre-computed daily aggregates (populated by cron)
CREATE TABLE IF NOT EXISTS daily_stats (
  site_id TEXT NOT NULL,
  date TEXT NOT NULL,
  visitors INTEGER DEFAULT 0,
  pageviews INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  bounce_rate REAL DEFAULT 0,
  avg_session_duration REAL DEFAULT 0,
  top_page TEXT,
  top_referrer TEXT,
  PRIMARY KEY (site_id, date)
);
