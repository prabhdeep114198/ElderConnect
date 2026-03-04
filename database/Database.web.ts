/**
 * Web version of Database.ts
 * SQLite is not natively supported in standard web builds without complex WASM setup.
 * This mock allows the web build to pass on Vercel.
 */

class AppDatabaseWeb {
    async getDb() {
        // Return null or a mock object that mimics SQLite database interface if needed
        return null;
    }

    async saveItem(table: string, item: any) {
        // On web, we can fallback to localStorage or just log for now
        console.warn(`[Web Database] SQLite not available on web. Item not saved to table: ${table}`);
        try {
            // Simple fallback to localStorage for web persistence if desired
            const key = `db_${table}_${item.id || Date.now()}`;
            localStorage.setItem(key, JSON.stringify(item));
        } catch (e) {
            // Ignore storage errors on web
        }
    }

    async getAll(table: string) {
        console.warn(`[Web Database] SQLite not available on web. Returning empty array for table: ${table}`);
        return [];
    }
}

export const appDatabase = new AppDatabaseWeb();
