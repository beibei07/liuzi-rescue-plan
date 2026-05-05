export const CREATE_CHAR_CARDS = `
  CREATE TABLE IF NOT EXISTS char_cards (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    character       TEXT NOT NULL UNIQUE,
    pinyin          TEXT,
    definition      TEXT,
    level           INTEGER DEFAULT 1,
    due             INTEGER,
    stability       REAL DEFAULT 0,
    difficulty      REAL DEFAULT 0,
    elapsed_days    INTEGER DEFAULT 0,
    scheduled_days  INTEGER DEFAULT 0,
    reps            INTEGER DEFAULT 0,
    lapses          INTEGER DEFAULT 0,
    state           INTEGER DEFAULT 0,
    last_review     INTEGER
  );
`;

export const CREATE_QUOTES = `
  CREATE TABLE IF NOT EXISTS quotes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    text        TEXT NOT NULL,
    author      TEXT,
    work        TEXT,
    category    TEXT DEFAULT 'novel',
    source      TEXT DEFAULT 'default',
    difficulty  INTEGER DEFAULT 2,
    created_at  INTEGER
  );
`;

export const CREATE_PRACTICE_LOG = `
  CREATE TABLE IF NOT EXISTS practice_log (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    type         TEXT NOT NULL,
    ref_id       INTEGER NOT NULL,
    rating       INTEGER NOT NULL,
    practiced_at INTEGER NOT NULL
  );
`;

export const CREATE_STREAK = `
  CREATE TABLE IF NOT EXISTS streak (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    date             TEXT NOT NULL UNIQUE,
    chars_practiced  INTEGER DEFAULT 0,
    quotes_practiced INTEGER DEFAULT 0
  );
`;
