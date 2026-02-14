export type ConflictResolutionStrategy = 'last-write-wins' | 'server-authoritative' | 'timestamp' | 'manual';

class ConflictResolver {
    async resolve(strategy: ConflictResolutionStrategy, localData: any, serverData: any): Promise<any> {
        switch (strategy) {
            case 'last-write-wins':
                return localData; // We already have localData, just push it again (might need force flag on API)

            case 'server-authoritative':
                return null; // Don't replay, let the local DB be overwritten by server the next time we fetch

            case 'timestamp':
                const localTs = localData.updatedAt || localData.timestamp || 0;
                const serverTs = serverData.updatedAt || serverData.timestamp || 0;
                return localTs > serverTs ? localData : serverData;

            case 'manual':
                // This would typically trigger a UI event or store the conflict for the user to see
                console.warn('Manual conflict resolution required for data:', { localData, serverData });
                return null;

            default:
                return serverData;
        }
    }
}

export const conflictResolver = new ConflictResolver();
