CREATE TABLE benben_snapshot (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
