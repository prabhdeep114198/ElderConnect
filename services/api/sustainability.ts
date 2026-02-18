import { api } from './client';

export interface SustainabilityImpact {
  reportsGenerated: number;
  telemedicineSessions: number;
  paperSavedSheets: number;
  carbonSavedKg: number;
  tripsAvoided: number;
  year: number;
}

export interface PublicImpact {
  year: number;
  totalReportsGenerated: number;
  totalTelemedicineSessions: number;
  totalPaperSavedSheets: number;
  totalCarbonSavedKg: number;
  totalTripsAvoided: number;
  activeUsers: number;
}

export const sustainabilityService = {
  trackReport: (userId: string, count = 1) =>
    api.post(`/v1/users/${userId}/sustainability/track-report`, { count }),

  trackTelemedicine: (userId: string, count = 1) =>
    api.post(`/v1/users/${userId}/sustainability/track-telemedicine`, { count }),

  getUserImpact: (userId: string, year?: number) => {
    const params = year ? { year: String(year) } : undefined;
    return api.get<{ data: SustainabilityImpact }>(
      `/v1/users/${userId}/sustainability/impact`,
      { params }
    );
  },

  getPublicImpact: (year?: number) => {
    const params = year ? { year: String(year) } : undefined;
    return api.get<{ data: PublicImpact }>('/v1/sustainability/public', {
      params,
      requiresAuth: false,
    });
  },
};
