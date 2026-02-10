import { api } from './client';
import { HealthScoreInsight } from '../../types/health-score';

export const healthScoreService = {
    getLatestScore: async (userId: string): Promise<HealthScoreInsight> => {
        const response = await api.get<any>(`/health-score/${userId}`);

        return {
            score: response.score,
            statusLabel: response.statusLabel,
            explanations: response.explanations || [],
            trend: 'stable', // Logic to compute trend from history if needed
            lastUpdated: response.date,
        };
    },

    getMockScore: (): HealthScoreInsight => ({
        score: 88,
        statusLabel: "Excellent",
        explanations: [
            "Your medication adherence is perfect this week.",
            "Mobility is tracking 10% higher than last week."
        ],
        trend: 'improving',
        lastUpdated: new Date().toISOString(),
    }),
};
