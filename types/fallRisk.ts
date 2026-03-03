export interface FallRiskScore {
    score: number; // 0-100
    timestamp: string;
}

export interface FallRiskForecast {
    days: number;
    predictedScore: number;
    confidenceInterval: [number, number];
    trend: 'up' | 'down' | 'stable';
}

export interface FallRiskAnalysis {
    currentScore: number;
    lastUpdate: string;
    indicators: {
        gaitSpeedVar: number; // variability percentage
        activityLevel: number; // normalized 0-100
        medicationAdherence: number; // 0-100
        recentFalls: number;
        environmentalRisk: number; // 0-100
    };
    forecasts: FallRiskForecast[];
    historicalData: FallRiskScore[];
}

export interface FallRiskAlert {
    id: string;
    type: 'warning' | 'danger' | 'info';
    message: string;
    timestamp: string;
    indicator?: string;
}

export interface FallRiskRecommendation {
    id: string;
    category: 'exercise' | 'environment' | 'medication';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
}
