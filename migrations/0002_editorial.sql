CREATE TABLE member_languages (
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('de', 'fr', 'ru', 'es')),
  PRIMARY KEY (member_id, locale)
);

CREATE TABLE content_drafts (
  id TEXT PRIMARY KEY NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('news', 'guide', 'event')),
  slug TEXT NOT NULL,
  category_id TEXT,
  position INTEGER,
  english_title TEXT NOT NULL DEFAULT '',
  english_summary TEXT NOT NULL DEFAULT '',
  english_body_json TEXT NOT NULL DEFAULT '{}',
  updated_by TEXT REFERENCES members(id),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (kind, slug)
);

CREATE INDEX content_drafts_kind_idx ON content_drafts (kind);

CREATE TABLE content_draft_translations (
  draft_id TEXT NOT NULL REFERENCES content_drafts(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('de', 'fr', 'ru', 'es')),
  title TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  body_json TEXT NOT NULL DEFAULT '{}',
  updated_by TEXT REFERENCES members(id),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (draft_id, locale)
);

CREATE TABLE published_pieces (
  kind TEXT NOT NULL CHECK (kind IN ('news', 'guide', 'event')),
  slug TEXT NOT NULL,
  category_id TEXT,
  position INTEGER,
  payload_json TEXT NOT NULL,
  published_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  published_by TEXT REFERENCES members(id),
  PRIMARY KEY (kind, slug)
);

CREATE INDEX published_pieces_kind_category_idx ON published_pieces (kind, category_id, position);
CREATE INDEX published_pieces_kind_published_at_idx ON published_pieces (kind, published_at DESC);

CREATE TABLE interface_strings (
  key TEXT NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('de', 'fr', 'ru', 'es')),
  value TEXT NOT NULL,
  updated_by TEXT REFERENCES members(id),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (key, locale)
);

CREATE TABLE asset_catalog (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'image',
  size INTEGER NOT NULL DEFAULT 0,
  storage_key TEXT NOT NULL UNIQUE,
  uploaded_by TEXT REFERENCES members(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
