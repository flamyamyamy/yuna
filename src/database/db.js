const Database = require('better-sqlite3');

const db = new Database('./database.sqlite');

db.pragma('journal_mode = WAL');

db.prepare(`
  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    channel_id TEXT,
    message TEXT NOT NULL,
    remind_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    sent INTEGER NOT NULL DEFAULT 0
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS user_badges (
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    staff INTEGER NOT NULL DEFAULT 0,
    partner INTEGER NOT NULL DEFAULT 0,
    bughunter INTEGER NOT NULL DEFAULT 0,
    bughuntergold INTEGER NOT NULL DEFAULT 0,
    bravery INTEGER NOT NULL DEFAULT 0,
    brilliance INTEGER NOT NULL DEFAULT 0,
    balance INTEGER NOT NULL DEFAULT 0,
    earlysupporter INTEGER NOT NULL DEFAULT 0,
    earlydev INTEGER NOT NULL DEFAULT 0,
    alumni INTEGER NOT NULL DEFAULT 0,
    last_checked INTEGER NOT NULL,
    PRIMARY KEY (user_id, guild_id)
  )
`).run();

db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_user_badges_guild_id
  ON user_badges(guild_id)
`).run();

module.exports = db;