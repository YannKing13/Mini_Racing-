CREATE TABLE IF NOT EXISTS results (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 fingerprint TEXT NOT NULL UNIQUE,
 player_id TEXT NOT NULL,
 name TEXT NOT NULL,
 tag TEXT NOT NULL,
 team TEXT NOT NULL,
 track TEXT NOT NULL,
 laps INTEGER NOT NULL,
 finish REAL NOT NULL,
 best_lap REAL,
 position INTEGER NOT NULL,
 points INTEGER NOT NULL,
 difficulty INTEGER NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_results_player ON results(player_id);
CREATE INDEX IF NOT EXISTS idx_results_track ON results(track,laps);
