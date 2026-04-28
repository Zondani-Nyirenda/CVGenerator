// db/database.ts
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initialize the database connection and create tables if they don't exist
 */
export async function initDB(): Promise<void> {
  if (db) {
    console.log('Database already initialized');
    return;
  }

  if (initPromise) {
    console.log('Database initialization in progress, waiting...');
    return initPromise;
  }

  initPromise = (async () => {
    try {
      console.log('Opening database...');
      db = await SQLite.openDatabaseAsync('cvbuilder.db');

      console.log('Creating tables if not exists...');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS cv_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE NOT NULL,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_key ON cv_data(key);
      `);

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      db = null;
      throw error;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * Ensure database is initialized
 */
async function ensureDB(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    await initDB();
  }
  if (!db) {
    throw new Error('Failed to initialize database');
  }
  return db;
}

/**
 * Save or update CV data
 */
export async function saveCV(key: string, value: string): Promise<void> {
  try {
    const database = await ensureDB();
    await database.runAsync(
      `INSERT INTO cv_data (key, value, updated_at) 
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET 
         value = excluded.value,
         updated_at = CURRENT_TIMESTAMP;`,
      [key, value]
    );
    console.log(`✅ Saved ${key}`);
  } catch (error) {
    console.error(`❌ Error saving ${key}:`, error);
    throw error;
  }
}

/**
 * Load CV data for a specific key
 */
export async function loadCV(key: string): Promise<string | null> {
  try {
    const database = await ensureDB();
    const row = await database.getFirstAsync<{ value: string; updated_at: string }>(
      'SELECT value, updated_at FROM cv_data WHERE key = ?;',
      [key]
    );

    if (row) {
      console.log(`✅ Loaded ${key} (last updated: ${row.updated_at})`);
      return row.value;
    }
    console.log(`⚠️ No data found for key: ${key}`);
    return null;
  } catch (error) {
    console.error(`❌ Error loading ${key}:`, error);
    return null;
  }
}

/**
 * Load all CV data
 */
export async function loadAllCVData(): Promise<Record<string, string>> {
  try {
    const database = await ensureDB();
    const rows = await database.getAllAsync<{ key: string; value: string }>(
      'SELECT key, value FROM cv_data;'
    );

    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }

    console.log(`📊 Loaded ${Object.keys(result).length} records from database`);
    return result;
  } catch (error) {
    console.error('❌ Error loading all CV data:', error);
    return {};
  }
}

/**
 * Clear all CV data
 */
export async function clearCV(): Promise<void> {
  try {
    const database = await ensureDB();
    await database.runAsync('DELETE FROM cv_data;');
    await database.runAsync('DELETE FROM sqlite_sequence WHERE name = "cv_data";');
    console.log('✅ All CV data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{ totalRecords: number; keys: string[] }> {
  try {
    const database = await ensureDB();
    
    const countResult = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM cv_data;'
    );
    
    const keysResult = await database.getAllAsync<{ key: string }>(
      'SELECT key FROM cv_data ORDER BY updated_at DESC;'
    );
    
    return {
      totalRecords: countResult?.count || 0,
      keys: keysResult.map(row => row.key),
    };
  } catch (error) {
    console.error('❌ Error getting database stats:', error);
    return { totalRecords: 0, keys: [] };
  }
}

/**
 * Delete specific key
 */
export async function deleteCV(key: string): Promise<void> {
  try {
    const database = await ensureDB();
    await database.runAsync('DELETE FROM cv_data WHERE key = ?;', [key]);
    console.log(`✅ Deleted ${key}`);
  } catch (error) {
    console.error(`❌ Error deleting ${key}:`, error);
    throw error;
  }
}

/**
 * Close database
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
    initPromise = null;
    console.log('Database closed successfully');
  }
}