import NetInfo from '@react-native-community/netinfo';
import { appDatabase } from '../../database/Database';
import { api } from '../../services/api/client';
import { offlineQueue } from '../../services/offline/OfflineQueue';
import { syncManager } from '../../services/offline/SyncManager';

export interface VitalRecord {
    id: string;
    type: string;
    value: number;
    unit: string;
    timestamp: number;
}

export class VitalsRepository {
    /**
     * Returns data immediately from local DB, then refreshes from API if online.
     */
    async getVitals(): Promise<VitalRecord[]> {
        // 1. Get from local DB immediately
        const localVitals = await appDatabase.getAll('vitals') as VitalRecord[];

        // 2. Refresh from API in background if online
        const netState = await NetInfo.fetch();
        if (netState.isConnected) {
            this.refreshVitalsFromServer().catch(console.error);
        }

        return localVitals;
    }

    private async refreshVitalsFromServer() {
        const remoteVitals = await api.get<VitalRecord[]>('/vitals');
        for (const vital of remoteVitals) {
            await appDatabase.saveItem('vitals', { ...vital, synced: 1 });
        }
    }

    /**
     * Optimistic update: Save locally first, then queue for sync.
     */
    async addVital(vital: Omit<VitalRecord, 'id'>) {
        const tempId = `temp_${Date.now()}`;
        const newRecord = { ...vital, id: tempId, synced: 0 };

        // 1. Save to local DB (Optimistic UI)
        await appDatabase.saveItem('vitals', newRecord);

        // 2. Queue for API
        await offlineQueue.enqueue({
            method: 'POST',
            endpoint: '/vitals',
            headers: JSON.stringify({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(vital),
        });

        // 3. Trigger sync attempt
        syncManager.processQueue();

        return newRecord;
    }
}

export const vitalsRepository = new VitalsRepository();
