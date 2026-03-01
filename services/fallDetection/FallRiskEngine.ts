import { appDatabase } from '../../database/Database';
import { FallRiskAnalysis, FallRiskScore } from '../../types/fallRisk';
import { sensorService } from './SensorService';

class LocalFallRiskEngine {
    private samples: number[] = [];
    private maxSamples = 50; // 5 seconds at 10Hz
    private currentScore = 45;
    private gaitVar = 10;
    private activityLevel = 50;

    constructor() {
        this.startMonitoring();
    }

    private startMonitoring() {
        sensorService.start((sample) => {
            const magnitude = Math.sqrt(
                sample.accelX ** 2 +
                sample.accelY ** 2 +
                sample.accelZ ** 2
            );

            this.samples.push(magnitude);
            if (this.samples.length > this.maxSamples) {
                this.samples.shift();
            }

            this.updateMetrics();
        });
    }

    private updateMetrics() {
        if (this.samples.length < 10) return;

        // Calculate Activity Level (Movement intensity)
        const mean = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
        const variance = this.samples.reduce((a, b) => a + (b - mean) ** 2, 0) / this.samples.length;
        const stdDev = Math.sqrt(variance);

        // Normalize activity level (0.0 to 1.0g range mapped to 0-100)
        this.activityLevel = Math.min(100, Math.max(0, stdDev * 200));

        // Calculate Gait Variability (simplified: variance of magnitude changes)
        // High variability in movement usually indicates higher fall risk
        this.gaitVar = Math.min(100, (variance * 1000));

        // Fall Risk Calculation Logic (simplified)
        // More movement (activity) generally reduces risk, 
        // but high variability (unstable gait) increases it
        const baseRisk = 50;
        const activityComponent = (50 - this.activityLevel) * 0.3; // Less activity = higher risk
        const gaitComponent = this.gaitVar * 0.5; // More gait variance = higher risk

        this.currentScore = Math.min(100, Math.max(0, baseRisk + activityComponent + gaitComponent));

        // Save to DB every 1 minute (optional, but good for history)
        if (Date.now() % 60000 < 500) { // fuzzy check for "once a minute"
            this.persistScore();
        }
    }

    private async persistScore() {
        try {
            await appDatabase.saveItem('fall_risk_scores', {
                id: Date.now().toString(),
                score: this.currentScore,
                gait_var: this.gaitVar,
                activity_level: this.activityLevel,
                timestamp: Date.now()
            });
        } catch (e) {
            console.error('Failed to persist fall risk score', e);
        }
    }

    public async getAnalysis(): Promise<FallRiskAnalysis> {
        // Fetch historical data from local DB
        const rawHistory = await appDatabase.getAll('fall_risk_scores') as any[];
        const historicalData: FallRiskScore[] = rawHistory.map(h => ({
            score: h.score,
            timestamp: new Date(h.timestamp).toISOString()
        })).slice(-30);

        // If no history, provide at least today's point
        if (historicalData.length === 0) {
            historicalData.push({
                score: this.currentScore,
                timestamp: new Date().toISOString()
            });
        }

        return {
            currentScore: this.currentScore,
            lastUpdate: new Date().toISOString(),
            indicators: {
                gaitSpeedVar: Math.round(this.gaitVar),
                activityLevel: Math.round(this.activityLevel),
                medicationAdherence: 85, // Static for now until reminders are linked
                recentFalls: 0,
                environmentalRisk: 10
            },
            historicalData,
            forecasts: [
                { days: 7, predictedScore: Math.max(0, this.currentScore - 2), trend: 'stable', confidenceInterval: [this.currentScore - 5, this.currentScore + 5] },
                { days: 30, predictedScore: Math.max(0, this.currentScore - 5), trend: 'down', confidenceInterval: [this.currentScore - 10, this.currentScore + 10] },
                { days: 90, predictedScore: Math.max(0, this.currentScore - 10), trend: 'down', confidenceInterval: [this.currentScore - 20, this.currentScore + 20] }
            ]
        };
    }
}

export const localFallRiskEngine = new LocalFallRiskEngine();
