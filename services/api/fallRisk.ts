import {
    FallRiskAlert,
    FallRiskAnalysis,
    FallRiskRecommendation,
    FallRiskScore
} from '../../types/fallRisk';

export const fallRiskService = {
    getAnalysis: async (userId: string): Promise<FallRiskAnalysis> => {
        try {
            // In a real app, this would be an API call
            // return await api.get<FallRiskAnalysis>(`/fall-risk/analysis/${userId}`);
            return fallRiskService.getMockAnalysis();
        } catch (error) {
            console.error("Failed to fetch fall risk analysis", error);
            throw error;
        }
    },

    getAlerts: async (userId: string): Promise<FallRiskAlert[]> => {
        // Mocking alerts
        return [
            {
                id: '1',
                type: 'warning',
                message: 'Reduced gait stability detected during morning walk.',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                indicator: 'Gait'
            },
            {
                id: '2',
                type: 'info',
                message: 'Night-time activity is higher than usual. Ensure walkways are illuminated.',
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                indicator: 'Activity'
            }
        ];
    },

    getRecommendations: async (userId: string): Promise<FallRiskRecommendation[]> => {
        return [
            {
                id: '1',
                category: 'exercise',
                title: 'Balance & Strength',
                description: 'Follow the 10-minute balance circuit in the Exercises tab to strengthen core stability.',
                priority: 'high'
            },
            {
                id: '2',
                category: 'environment',
                title: 'Lighting Check',
                description: 'Your motion sensors detected 3 instances of hesitation in the hallway. Check if bulbs need replacement.',
                priority: 'medium'
            }
        ];
    },

    getMockAnalysis: (): FallRiskAnalysis => {
        const now = new Date();
        const historical: FallRiskScore[] = Array.from({ length: 30 }, (_, i) => ({
            timestamp: new Date(now.getTime() - (30 - i) * 86400000).toISOString(),
            score: 30 + Math.random() * 20
        }));

        return {
            currentScore: 48,
            lastUpdate: now.toISOString(),
            indicators: {
                gaitSpeedVar: 12,
                activityLevel: 75,
                medicationAdherence: 95,
                recentFalls: 0,
                environmentalRisk: 15
            },
            historicalData: historical,
            forecasts: [
                { days: 7, predictedScore: 52, trend: 'up', confidenceInterval: [48, 56] },
                { days: 30, predictedScore: 58, trend: 'up', confidenceInterval: [50, 66] },
                { days: 90, predictedScore: 45, trend: 'down', confidenceInterval: [35, 55] }
            ]
        };
    },

    updateThreshold: async (userId: string, threshold: number): Promise<void> => {
        // API call to update caregiver notification threshold
        console.log(`Updated threshold for ${userId} to ${threshold}`);
    }
};
