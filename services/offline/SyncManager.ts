import NetInfo from '@react-native-community/netinfo';
import { apiClient } from '../../services/api/client';
import { ConflictResolutionStrategy, conflictResolver } from './ConflictResolver';
import { offlineQueue, QueuedRequest } from './OfflineQueue';

const MAX_RETRIES = 5;
const BACKOFF_FACTOR = 1000; // 1 second base

export class SyncManager {
    private isSyncing = false;
    private resolutionStrategy: ConflictResolutionStrategy = 'timestamp';

    constructor() {
        this.setupNetworkListener();
    }

    setResolutionStrategy(strategy: ConflictResolutionStrategy) {
        this.resolutionStrategy = strategy;
    }

    private setupNetworkListener() {
        NetInfo.addEventListener(state => {
            if (state.isConnected && state.isInternetReachable) {
                console.log('[SyncManager] Internet restored, starting sync...');
                this.processQueue();
            }
        });
    }

    async processQueue() {
        if (this.isSyncing) return;
        this.isSyncing = true;

        try {
            const pending = await offlineQueue.getPendingRequests();
            for (const request of pending) {
                const success = await this.executeRequest(request);
                if (success) {
                    await offlineQueue.removeRequest(request.id);
                } else {
                    // If a request fails significantly (e.g. fatal error), we might stop the queue
                    // to preserve FIFO order if dependencies exist.
                    if (request.retryCount >= MAX_RETRIES) {
                        console.error(`[SyncManager] Request ${request.id} exceeded max retries.`);
                        // Handle dead-letter queue or manual intervention
                    }
                }
            }
        } finally {
            this.isSyncing = false;
        }
    }

    private async executeRequest(request: QueuedRequest): Promise<boolean> {
        try {
            const headers = JSON.parse(request.headers);
            const body = JSON.parse(request.body);

            await apiClient(request.endpoint, request.method, {
                headers,
                body,
                requiresAuth: true, // Assuming auth token is still valid or will be refreshed by interceptor
            });

            return true;
        } catch (error: any) {
            if (error.status === 409) {
                return await this.handleConflict(request, error.data);
            }

            // Exponential backoff retry
            const nextRetryCount = request.retryCount + 1;
            if (nextRetryCount < MAX_RETRIES) {
                const delay = Math.pow(2, nextRetryCount) * BACKOFF_FACTOR;
                console.log(`[SyncManager] Retrying request ${request.id} in ${delay}ms...`);

                await offlineQueue.updateRetry(request.id, nextRetryCount, 'RETRYING');
                // We don't block the loop here, we'll pick it up in the next iteration or process
                return false;
            }

            await offlineQueue.updateRetry(request.id, nextRetryCount, 'FAILED');
            return false;
        }
    }

    private async handleConflict(request: QueuedRequest, serverData: any): Promise<boolean> {
        const resolvedData = await conflictResolver.resolve(
            this.resolutionStrategy,
            JSON.parse(request.body),
            serverData
        );

        if (resolvedData) {
            // Re-attempt with resolved data
            try {
                await apiClient(request.endpoint, request.method, {
                    body: resolvedData,
                });
                return true;
            } catch (e) {
                return false;
            }
        }
        return false;
    }
}

export const syncManager = new SyncManager();
