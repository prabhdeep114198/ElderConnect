export interface HealthScoreInsight {
    score: number; // 0-100
    statusLabel: string; // e.g., "Excellent", "Stable", "Needs Attention"
    explanations: string[]; // 1-2 short points
    trend: 'improving' | 'declining' | 'stable';
    lastUpdated: string; // ISO date
}
