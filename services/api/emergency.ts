import { api } from './client';
import { EmergencyPrediction } from '../../types/emergency';

export const emergencyService = {
    getLatestPrediction: async (userId: string): Promise<EmergencyPrediction> => {
        // This will call the backend endpoint once implemented
        return await api.get<EmergencyPrediction>(`/emergency/prediction/${userId}`);
    },

    // Mock function for development if needed
    getMockPrediction: (): EmergencyPrediction => ({
        riskLevel: 'LOW' as any,
        reassuranceMessage: "Your vital signs are stable. Keep up the good work!",
        caregiverAlertState: 'NORMAL' as any,
        adherenceScore: 92,
        lastAssessment: new Date().toISOString(),
    }),
};
