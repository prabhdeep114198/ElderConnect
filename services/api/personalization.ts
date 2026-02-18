import { api } from './client';

export enum InteractionType {
    MUSIC_PLAY = 'music_play',
    EVENT_VIEW = 'event_view',
    EVENT_JOIN = 'event_join',
    FEATURE_USE = 'feature_use',
    MOOD_LOG = 'mood_log',
    CONTENT_VIEW = 'content_view',
    CONTENT_DISMISS = 'content_dismiss',
    ACTIVITY_START = 'activity_start',
    ACTIVITY_COMPLETE = 'activity_complete',
    APP_SESSION = 'app_session',
}

export interface Recommendation {
    type: 'event' | 'activity' | 'music' | 'medication' | 'social';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    score: number;
    reason?: string;
    actionUrl?: string;
    safetyWarnings?: string[];
    metadata?: any;
}

export interface PersonalizationData {
    wellness: any;
    recommendations: Recommendation[];
    dailyBriefing: string;
}

export interface ChatbotContext {
    userId: string;
    profileSummary: {
        conditions: string[];
        allergies: string[];
        hobbies: string[];
    };
    healthStatus: {
        physicalScore: number;
        mentalScore: number;
        riskLevel: string;
        recentAlerts: number;
    };
    engagementLevel: 'low' | 'medium' | 'high';
    primaryConcerns: string[];
}

export const personalizationService = {
    getJourney: () =>
        api.get<{ message: string; data: PersonalizationData }>('/v1/personalization/journey'),

    trackInteraction: (type: InteractionType | string, metadata: any = {}) =>
        api.post('/v1/personalization/interaction', {
            type,
            metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata)
        }),

    getChatbotContext: () =>
        api.get<{ message: string; data: ChatbotContext }>('/v1/personalization/chatbot-context'),
};
