import * as SQLite from 'expo-sqlite';

/**
 * Main application database for caching server data.
 * This patterns allows us to have a local mirror of the remote REST API.
 */
class AppDatabase {
    private db: SQLite.SQLiteDatabase | null = null;

    async getDb() {
        if (!this.db) {
            this.db = await SQLite.openDatabaseAsync('elderconnect_main.db');
            await this.initSchema();
        }
        return this.db;
    }

    private async initSchema() {
        if (!this.db) return;

        // Example schema for Vitals and Reminders
        await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS vitals (
        id TEXT PRIMARY KEY,
        type TEXT,
        value REAL,
        unit TEXT,
        timestamp INTEGER,
        synced INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        title TEXT,
        time TEXT,
        completed INTEGER,
        synced INTEGER DEFAULT 1
      );
    `);
    }

    // Generic CRUD helpers could go here
    async saveItem(table: string, item: any) {
        const db = await this.getDb();
        const keys = Object.keys(item);
        const placeholders = keys.map(() => "?").join(",");
        const values = Object.values(item);

        await db.runAsync(
            `INSERT OR REPLACE INTO ${table} (${keys.join(",")}) VALUES (${placeholders})`,
            values as any[]
        );
    }

    async getAll(table: string) {
        const db = await this.getDb();
        return await db.getAllAsync(`SELECT * FROM ${table}`);
    }
}

export const appDatabase = new AppDatabase();
