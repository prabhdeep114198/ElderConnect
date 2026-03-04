/**
 * Web version of OfflineQueue.ts
 * Since expo-sqlite is not available on web, this fallback ensures the build passes.
 * In a real-world scenario, you might use localStorage or IndexedDB here.
 */

export interface QueuedRequest {
    id: number;
    method: string;
    endpoint: string;
    headers: string; // JSON stringified
    body: string;    // JSON stringified
    timestamp: number;
    retryCount: number;
    status: 'PENDING' | 'FAILED' | 'RETRYING';
}

class OfflineQueueWeb {
    async init() {
        console.log('[Web OfflineQueue] Virtual init complete');
        return;
    }

    async enqueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount' | 'status'>) {
        console.warn('[Web OfflineQueue] SQLite not available on web. Enqueue ignored.');
    }

    async getPendingRequests(): Promise<QueuedRequest[]> {
        return [];
    }

    async updateRetry(id: number, retryCount: number, status: QueuedRequest['status']) {
        return;
    }

    async removeRequest(id: number) {
        return;
    }

    async clearQueue() {
        return;
    }
}

export const offlineQueue = new OfflineQueueWeb();
