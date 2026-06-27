CREATE TABLE IF NOT EXISTS guests (
  visitor_id TEXT PRIMARY KEY,
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  visits INTEGER NOT NULL DEFAULT 1 CHECK (visits >= 1)
);

CREATE INDEX IF NOT EXISTS idx_guests_last_seen ON guests(last_seen);
