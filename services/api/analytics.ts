import { api } from './client';

export enum TimeGranularity {
    DAY = 'day',
    WEEK = 'week',
    MONTH = 'month',
    YEAR = 'year',
}

export interface AnalyticsQuery {
    granularity?: TimeGranularity;
    startDate?: string;
    endDate?: string;
    days?: number;
}

export interface HealthAnalyticsResponse {
    message: string;
    data: {
        timeSeries: any[];
        statistics: any;
        trends: any;
        insights: string[];
    };
}

export const analyticsService = {
    getHealthAnalytics: (userId: string, query: AnalyticsQuery = {}) =>
        api.get<HealthAnalyticsResponse>(`/v1/users/${userId}/analytics/health`, { params: query as any }),

    getComparativeAnalysis: (userId: string, query: any) =>
        api.get<any>(`/v1/users/${userId}/analytics/comparison`, { params: query }),

    getCorrelationAnalysis: (userId: string, days: number = 90) =>
        api.get<any>(`/v1/users/${userId}/analytics/correlation`, { params: { days: days.toString() } }),
};
