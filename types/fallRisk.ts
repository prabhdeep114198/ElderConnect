// ─────────────────────────────────────────────────────────────────────────────
// Core primitives
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// AI Gait Analysis — NEW
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Result of K-Means (k=3) clustering over 30 days of health metrics.
 * Describes the user's "activity movement fingerprint".
 */
export interface GaitClusters {
    sedentaryPct: number;    // % of days classified as sedentary (Cluster 0)
    moderatePct: number;     // % of days classified as moderate activity (Cluster 1)
    activePct: number;       // % of days classified as active (Cluster 2)
    stepVariance: number;    // Variance in daily step count (proxy for gait irregularity)
    hrVariance: number;      // Variance in daily heart rate
    dominantPattern: 'sedentary' | 'moderate' | 'active';
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobility Coaching Plan — NEW
// ─────────────────────────────────────────────────────────────────────────────

export type RiskCategory = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface CoachingExercise {
    id: string;
    name: string;
    goal: string;             // Physiological benefit
    duration: string;         // Human-readable, e.g. "30 seconds each leg"
    sets: number;
    difficulty: ExerciseDifficulty;
    tailoredReason: string;   // Explains WHY this was chosen for this specific user
    completed?: boolean;      // Local UI state for "Mark Done" checkbox
}

export interface MobilityCoachingPlan {
    summary: string;           // 2-3 sentence analysis of the user's movement pattern
    riskCategory: RiskCategory;
    weeklyGoal: string;        // One specific measurable goal for this week
    exercises: CoachingExercise[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Analysis — EXTENDED
// ─────────────────────────────────────────────────────────────────────────────

export interface FallRiskAnalysis {
    currentScore: number;
    lastUpdate: string;
    /** K-Means cluster breakdown — present in upgraded API responses */
    gaitClusters?: GaitClusters;
    indicators: {
        gaitSpeedVar: number;        // Now real: derived from stepVariance
        activityLevel: number;       // normalized 0-100
        medicationAdherence: number; // 0-100
        recentFalls: number;
        environmentalRisk: number;   // 0-100
    };
    forecasts: FallRiskForecast[];
    historicalData: FallRiskScore[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Alerts & Recommendations (unchanged shape for backwards compatibility)
// ─────────────────────────────────────────────────────────────────────────────

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
