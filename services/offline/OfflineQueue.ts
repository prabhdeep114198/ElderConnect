import { Platform } from 'react-native';
const SQLite = Platform.OS !== 'web' ? require('expo-sqlite') : null;

import { RequestMethod } from '../api/client';

export interface QueuedRequest {
    id: number;
    method: RequestMethod;
    endpoint: string;
    headers: string; // JSON stringified
    body: string;    // JSON stringified
    timestamp: number;
    retryCount: number;
    status: 'PENDING' | 'FAILED' | 'RETRYING';
}

class OfflineQueue {
    private db: any = null;

    async init() {
        this.db = await SQLite.openDatabaseAsync('offline_requests.db');
        await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS queued_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        method TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        headers TEXT,
        body TEXT,
        timestamp INTEGER NOT NULL,
        retryCount INTEGER DEFAULT 0,
        status TEXT DEFAULT 'PENDING'
      );
    `);
    }

    async enqueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount' | 'status'>) {
        if (!this.db) await this.init();

        const timestamp = Date.now();
        await this.db!.runAsync(
            `INSERT INTO queued_requests (method, endpoint, headers, body, timestamp) VALUES (?, ?, ?, ?, ?)`,
            [request.method, request.endpoint, request.headers, request.body, timestamp]
        );
    }

    async getPendingRequests(): Promise<QueuedRequest[]> {
        if (!this.db) await this.init();
        return await this.db!.getAllAsync(
            `SELECT * FROM queued_requests WHERE status IN ('PENDING', 'RETRYING') ORDER BY timestamp ASC`
        ) as QueuedRequest[];
    }

    async updateRetry(id: number, retryCount: number, status: QueuedRequest['status']) {
        if (!this.db) await this.init();
        await this.db!.runAsync(
            `UPDATE queued_requests SET retryCount = ?, status = ? WHERE id = ?`,
            [retryCount, status, id]
        );
    }

    async removeRequest(id: number) {
        if (!this.db) await this.init();
        await this.db!.runAsync(`DELETE FROM queued_requests WHERE id = ?`, [id]);
    }

    async clearQueue() {
        if (!this.db) await this.init();
        await this.db!.runAsync(`DELETE FROM queued_requests`);
    }
}

export const offlineQueue = new OfflineQueue();
