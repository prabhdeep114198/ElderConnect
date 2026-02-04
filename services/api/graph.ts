import { api } from './client';

export interface GraphNode {
    id: string;
    label: string;
    sublabel?: string;
    type: string;
    color: string;
    status?: string;
}

export interface GraphEdge {
    from: string;
    to: string;
    type: string;
}

export interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

export const graphService = {
    async getUserGraph(userId: string): Promise<GraphData | null> {
        try {
            return await api.get<GraphData>(`/graph/user/${userId}`);
        } catch (error) {
            console.error('Error fetching graph data:', error);
            return null;
        }
    },

    async syncGraph(userId: string): Promise<boolean> {
        try {
            await api.post(`/graph/sync/${userId}`, {});
            return true;
        } catch (error) {
            console.error('Error syncing graph:', error);
            return false;
        }
    }
};
