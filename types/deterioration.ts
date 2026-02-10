export enum HealthTrendStatus {
    STABLE = 'stable',
    DECLINING = 'declining',
    IMPROVING = 'improving',
}

export interface HealthDeteriorationInsight {
    status: HealthTrendStatus;
    explanation: string;
    caregiverVisible: boolean;
    deteriorationScore: number; // 0-100
    lastAssessment: string; // ISO Date string
}
