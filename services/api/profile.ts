import { api } from './client';

export const profileService = {
    // Profile
    createProfile: (userId: string, data: any) => api.post(`/v1/users/${userId}/profile`, data),
    getProfile: (userId: string) => api.get(`/v1/users/${userId}/profile`),
    updateProfile: (userId: string, data: any) => api.put(`/v1/users/${userId}/profile`, data),

    // Medications
    addMedication: (userId: string, data: any) => api.post(`/v1/users/${userId}/medications`, data),
    getMedications: (userId: string, includeInactive = false) => api.get(`/v1/users/${userId}/medications`, { params: { includeInactive: String(includeInactive) } }),
    getMedication: (userId: string, medId: string) => api.get(`/v1/users/${userId}/medications/${medId}`),
    updateMedication: (userId: string, medId: string, data: any) => api.put(`/v1/users/${userId}/medications/${medId}`, data),
    deleteMedication: (userId: string, medId: string) => api.delete(`/v1/users/${userId}/medications/${medId}`),

    // Logs
    logMedication: (userId: string, medId: string, data: any) => api.post(`/v1/users/${userId}/medications/${medId}/logs`, data),
    getMedicationLogs: (userId: string, medId: string, start?: string, end?: string) => {
        const params: any = {};
        if (start) params.startDate = start;
        if (end) params.endDate = end;
        return api.get(`/v1/users/${userId}/medications/${medId}/logs`, { params });
    },

    // Reports
    getHealthSummary: (userId: string) => api.get(`/v1/users/${userId}/health-summary`),
    getComplianceReport: (userId: string, days = 30) => api.get(`/v1/users/${userId}/medication-compliance`, { params: { days: String(days) } }),
    getReminders: (userId: string) => api.get(`/v1/users/${userId}/medication-reminders`),
};
