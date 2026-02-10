import { api } from './client';
import { HealthDeteriorationInsight, HealthTrendStatus } from '../../types/deterioration';

export const deteriorationService = {
    getLatestInsight: async (userId: string): Promise<HealthDeteriorationInsight> => {
        // This will call the backend deterrence/trends endpoint
        const response = await api.get<any>(`/deterioration/trends/${userId}`);

        // Transform the backend entity to the minimal frontend contract
        if (Array.isArray(response) && response.length > 0) {
            const latest = response[0];
            return {
                status: latest.aggregates?.adherence?.adherenceTrend || HealthTrendStatus.STABLE,
                explanation: latest.trendSummary,
                caregiverVisible: latest.deteriorationScore > 40, // Logic: Only visible if decline is notable
                deteriorationScore: latest.deteriorationScore,
                lastAssessment: latest.assessmentDate,
            };
        }

        return deteriorationService.getMockInsight();
    },

    getMockInsight: (): HealthDeteriorationInsight => ({
        status: HealthTrendStatus.STABLE,
        explanation: "Your health trends remain consistent. Your daily activity and sleep patterns match your monthly baseline.",
        caregiverVisible: false,
        deteriorationScore: 12,
        lastAssessment: new Date().toISOString(),
    }),
};
