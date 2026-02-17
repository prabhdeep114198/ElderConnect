import { api } from './client';

export interface Recommendation {
    type: 'event' | 'activity' | 'music' | 'medication' | 'social';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    score: number;
    reason?: string;
    actionUrl?: string;
    metadata?: any;
}

export interface PersonalizationData {
    wellness: any;
    recommendations: Recommendation[];
    dailyBriefing: string;
}

export const personalizationService = {
    getJourney: () =>
        api.get<{ message: string; data: PersonalizationData }>('/v1/personalization/journey'),

    trackInteraction: (type: string, metadata: any = {}) =>
        api.post('/v1/personalization/interaction', { type, metadata }),
};
