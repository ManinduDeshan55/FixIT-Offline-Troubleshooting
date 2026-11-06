export async function initializeDatabase(db) {
  try {
    // Foreign keys must be enabled on each SQLite connection.
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS favourites (
        guide_id TEXT PRIMARY KEY NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY NOT NULL,
        guide_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('in_progress', 'solved', 'not_solved')),
        current_step_number INTEGER NOT NULL DEFAULT 1 CHECK (current_step_number >= 1),
        started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS completed_steps (
        session_id TEXT NOT NULL,
        step_id TEXT NOT NULL,
        step_number INTEGER NOT NULL CHECK (step_number >= 1),
        completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (session_id, step_id),
        FOREIGN KEY (session_id) REFERENCES sessions (session_id) ON DELETE CASCADE
      );
    `);

    const foreignKeys = await db.getFirstAsync('PRAGMA foreign_keys');
    if (foreignKeys?.foreign_keys !== 1) {
      throw new Error('SQLite foreign-key enforcement could not be enabled.');
    }
  } catch (error) {
    console.error('Could not initialize the FixIT database:', error);
    throw error;
  }
}
