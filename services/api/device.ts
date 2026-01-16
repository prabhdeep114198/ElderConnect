import { api } from './client';

export const deviceService = {
    // Telemetry
    getTelemetry: (userId: string, params?: any) => api.get(`/v1/users/${userId}/telemetry`, { params }),
    getLatestTelemetry: (userId: string, metricType: string) => api.get(`/v1/users/${userId}/telemetry/latest/${metricType}`),

    // Vitals
    recordVitals: (userId: string, data: any) => api.post(`/v1/users/${userId}/vitals`, data),
    getVitals: (userId: string, params?: any) => api.get(`/v1/users/${userId}/vitals`, { params }),
    getLatestVitals: (userId: string, vitalType: string) => api.get(`/v1/users/${userId}/vitals/latest/${vitalType}`),
    getVitalsTrends: (userId: string, vitalType: string, days = 30) => api.get(`/v1/users/${userId}/vitals/${vitalType}/trends`, { params: { days: String(days) } }),

    // SOS
    createSOS: (userId: string, data: any) => api.post(`/v1/users/${userId}/sos`, data),
    getSOSAlerts: (userId: string, params?: any) => api.get(`/v1/users/${userId}/sos`, { params }),
    getSOSAlert: (userId: string, alertId: string) => api.get(`/v1/users/${userId}/sos/${alertId}`),
    updateSOSAlert: (userId: string, alertId: string, data: any) => api.put(`/v1/users/${userId}/sos/${alertId}`, data),
};
