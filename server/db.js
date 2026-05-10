import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const db = new Database(join(__dirname, 'calora.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at INTEGER NOT NULL,
    image_filename TEXT,
    food_items TEXT NOT NULL DEFAULT '[]',
    nutrition TEXT NOT NULL DEFAULT '{}',
    meal_type TEXT DEFAULT 'meal',
    analysis_notes TEXT DEFAULT ''
  );
  CREATE INDEX IF NOT EXISTS idx_meals_ts ON meals(created_at DESC);
`);

mkdirSync(join(__dirname, 'uploads'), { recursive: true });

export default db;
