import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { scenarios } from '../scenarios/seeds';
import { scenariosTable } from './schema';

const cache = new Map<string, { sqlite: Database.Database; orm: ReturnType<typeof drizzle> }>();
export function database() {
  const location =
    process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'decision-lab.sqlite');
  const cached = cache.get(location);
  if (cached) return cached;
  if (location !== ':memory:') mkdirSync(path.dirname(location), { recursive: true });
  const sqlite = new Database(location);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('recursive_triggers = ON');
  sqlite.pragma('busy_timeout = 5000');
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS scenarios (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS case_sessions (id TEXT PRIMARY KEY, scenario_id TEXT NOT NULL REFERENCES scenarios(id), payload TEXT NOT NULL, version INTEGER NOT NULL, requirement_counter INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS accepted_adrs (case_id TEXT NOT NULL REFERENCES case_sessions(id), id TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY (case_id, id));
    CREATE TABLE IF NOT EXISTS reasoning_snapshots (id TEXT PRIMARY KEY, case_id TEXT NOT NULL REFERENCES case_sessions(id), kind TEXT NOT NULL CHECK(kind IN ('first','final')), payload TEXT NOT NULL);
    CREATE UNIQUE INDEX IF NOT EXISTS one_first_snapshot ON reasoning_snapshots(case_id) WHERE kind = 'first';
    CREATE TRIGGER IF NOT EXISTS immutable_adr_update BEFORE UPDATE ON accepted_adrs BEGIN SELECT RAISE(ABORT, 'Accepted ADRs are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS immutable_adr_delete BEFORE DELETE ON accepted_adrs BEGIN SELECT RAISE(ABORT, 'Accepted ADRs are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS immutable_snapshot_update BEFORE UPDATE ON reasoning_snapshots BEGIN SELECT RAISE(ABORT, 'Reasoning snapshots are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS immutable_snapshot_delete BEFORE DELETE ON reasoning_snapshots BEGIN SELECT RAISE(ABORT, 'Reasoning snapshots are immutable'); END;
  `);
  const orm = drizzle(sqlite);
  sqlite.transaction(() => {
    for (const scenario of scenarios)
      orm
        .insert(scenariosTable)
        .values({ id: scenario.id, payload: JSON.stringify(scenario) })
        .onConflictDoNothing()
        .run();
  })();
  const value = { sqlite, orm };
  cache.set(location, value);
  return value;
}

export function closeDatabase(): void {
  for (const value of cache.values()) value.sqlite.close();
  cache.clear();
}
