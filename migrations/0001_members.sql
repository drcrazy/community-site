CREATE TABLE members (
  id TEXT PRIMARY KEY NOT NULL,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT,
  discord_id TEXT UNIQUE,
  display_name TEXT,
  site_rank TEXT NOT NULL DEFAULT 'normal' CHECK (site_rank IN ('normal', 'editor', 'admin')),
  publish_permission INTEGER NOT NULL DEFAULT 0 CHECK (publish_permission IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX members_discord_id_idx ON members (discord_id);
