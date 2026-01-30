export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS identities (
  id VARCHAR PRIMARY KEY,
  public_key VARCHAR NOT NULL UNIQUE,
  display_name VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id VARCHAR PRIMARY KEY,
  author_id VARCHAR NOT NULL,
  content TEXT NOT NULL,
  signature VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES identities(id)
);

CREATE TABLE IF NOT EXISTS replies (
  id VARCHAR PRIMARY KEY,
  post_id VARCHAR NOT NULL,
  parent_id VARCHAR,
  author_id VARCHAR NOT NULL,
  content TEXT NOT NULL,
  signature VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  depth INTEGER DEFAULT 0,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (parent_id) REFERENCES replies(id),
  FOREIGN KEY (author_id) REFERENCES identities(id)
);

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_replies_post_id ON replies(post_id);
CREATE INDEX IF NOT EXISTS idx_replies_parent_id ON replies(parent_id);
`
