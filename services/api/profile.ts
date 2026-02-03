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
    getHealthSummary: (userId: string) => api.get(`/v1/users/${userId}/reports/health-summary`),
    getComplianceReport: (userId: string, days = 30) => api.get(`/v1/users/${userId}/reports/medication-compliance`, { params: { days: String(days) } }),
    getMedicationReminders: (userId: string) => api.get(`/v1/users/${userId}/medication-reminders`),

    // Health Metrics
    updateHealthMetric: (userId: string, data: { type: string; value: number; timestamp?: string }) => api.post(`/v1/users/${userId}/health/metrics`, data),
    getDailyMetrics: (userId: string, date?: string) => {
        const params: any = {};
        if (date) params.date = date;
        return api.get(`/v1/users/${userId}/health/metrics`, { params });
    },

    // Appointments
    getAppointments: (userId: string) => api.get(`/v1/users/${userId}/appointments`),
    createAppointment: (userId: string, data: any) => api.post(`/v1/users/${userId}/appointments`, data),
    updateAppointment: (userId: string, appId: string, data: any) => api.put(`/v1/users/${userId}/appointments/${appId}`, data),
    deleteAppointment: (userId: string, appId: string) => api.delete(`/v1/users/${userId}/appointments/${appId}`),

    // Social Events
    getSocialEvents: (userId: string) => api.get(`/v1/users/${userId}/events`),
    createSocialEvent: (userId: string, data: any) => api.post(`/v1/users/${userId}/events`, data),
    joinSocialEvent: (userId: string, eventId: string) => api.post(`/v1/users/${userId}/events/${eventId}/join`, {}),

    // Gamification
    getStreaks: (userId: string) => api.get(`/v1/users/${userId}/gamification/streaks`),
    getAchievements: (userId: string) => api.get(`/v1/users/${userId}/gamification/achievements`),
};
