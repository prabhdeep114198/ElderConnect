import { appDatabase } from '../../database/Database';
import { FallRiskAnalysis, FallRiskScore, GaitClusters } from '../../types/fallRisk';
import { sensorService } from './SensorService';

// ─────────────────────────────────────────────────────────────────────────────
// Activity Cluster Thresholds (on-device, based on raw accelerometer magnitude)
//
// These thresholds classify each raw IMU sample into one of 3 activity clusters
// matching the K-Means clusters computed on the backend (sedentary/moderate/vigorous).
//
// Calibration:
//   At rest:      magnitude ≈ 1.0g (Earth gravity, phone flat)
//   Walking:      magnitude ≈ 1.1–1.4g peak
//   Brisk walk:   magnitude ≈ 1.4–2.0g peak
//   Running/fall: magnitude > 2.0g
//
// We compute the *deviation from 1g* (gravity subtracted) to isolate motion:
//   deviation = |magnitude - 1.0|
// ─────────────────────────────────────────────────────────────────────────────
const SEDENTARY_THRESHOLD = 0.08;  // deviation < 0.08g → sedentary / at rest
const VIGOROUS_THRESHOLD = 0.5;   // deviation > 0.5g  → vigorous / high-intensity

type ActivityCluster = 'sedentary' | 'moderate' | 'vigorous';

interface ClusterCounts {
    sedentary: number;
    moderate: number;
    vigorous: number;
}

class LocalFallRiskEngine {
    private samples: number[] = [];
    private maxSamples = 50; // ~5 seconds at 10Hz

    private currentScore = 45;
    private gaitVar = 10;
    private activityLevel = 50;

    // Rolling cluster distribution (updated with each new sample window)
    private clusterCounts: ClusterCounts = { sedentary: 0, moderate: 0, vigorous: 0 };
    private totalSamplesForClusters = 0;

    constructor() {
        this.startMonitoring();
    }

    // ── Sensor Monitoring ──────────────────────────────────────────────────

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

            // Classify this sample into an activity cluster
            const cluster = this.classifySample(magnitude);
            this.clusterCounts[cluster]++;
            this.totalSamplesForClusters++;

            this.updateMetrics();
        });
    }

    /**
     * Classifies a single accelerometer magnitude reading into an activity cluster.
     * Uses deviation from gravity (1.0g) as the motion intensity signal.
     */
    private classifySample(magnitude: number): ActivityCluster {
        const deviation = Math.abs(magnitude - 1.0);
        if (deviation < SEDENTARY_THRESHOLD) return 'sedentary';
        if (deviation > VIGOROUS_THRESHOLD) return 'vigorous';
        return 'moderate';
    }

    /**
     * Returns the current rolling cluster distribution as percentages.
     * Resets every 5,000 samples (~8 minutes at 10Hz) to stay current.
     */
    private getClusterPercentages(): { sedentaryPct: number; moderatePct: number; activePct: number } {
        if (this.totalSamplesForClusters === 0) {
            return { sedentaryPct: 60, moderatePct: 30, activePct: 10 };
        }

        // Auto-reset cluster counts periodically to prevent staleness
        if (this.totalSamplesForClusters > 5000) {
            this.clusterCounts = { sedentary: 0, moderate: 0, vigorous: 0 };
            this.totalSamplesForClusters = 0;
            return { sedentaryPct: 60, moderatePct: 30, activePct: 10 };
        }

        const total = this.totalSamplesForClusters;
        return {
            sedentaryPct: Math.round((this.clusterCounts.sedentary / total) * 100),
            moderatePct: Math.round((this.clusterCounts.moderate / total) * 100),
            activePct: Math.round((this.clusterCounts.vigorous / total) * 100),
        };
    }

    // ── Metrics Computation ────────────────────────────────────────────────

    private updateMetrics() {
        if (this.samples.length < 10) return;

        // Activity level: standard deviation of magnitudes (movement intensity)
        const mean = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
        const variance = this.samples.reduce((a, b) => a + (b - mean) ** 2, 0) / this.samples.length;
        const stdDev = Math.sqrt(variance);

        // Normalize activity level (0.0 to 1.0g deviation → 0–100 scale)
        this.activityLevel = Math.min(100, Math.max(0, stdDev * 200));

        // Gait variability: high variance in accelerometer readings = irregular gait
        // Map variance to 0–100 percentage
        this.gaitVar = Math.min(100, variance * 1000);

        // Fall risk score from cluster percentages + gait variability
        const { sedentaryPct, moderatePct, activePct } = this.getClusterPercentages();

        // Risk formula mirroring backend logic:
        //   F1: Sedentary dominance (max +25)
        //   F2: Gait variability (max +20)
        //   F8: Active time bonus (max -15)
        const excessSedentary = Math.max(0, sedentaryPct - 30);
        const sedentaryRisk = (excessSedentary / 10) * 5;
        const gaitRisk = (this.gaitVar / 100) * 20;
        const activeBonus = activePct >= 40 ? 15 : activePct >= 25 ? 8 : 0;

        this.currentScore = Math.min(100, Math.max(0,
            20 + sedentaryRisk + gaitRisk - activeBonus
        ));

        // Persist score to local DB periodically
        if (Date.now() % 60000 < 500) {
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
                cluster_sedentary: this.clusterCounts.sedentary,
                cluster_moderate: this.clusterCounts.moderate,
                cluster_vigorous: this.clusterCounts.vigorous,
                timestamp: Date.now(),
            });
        } catch (e) {
            console.error('Failed to persist fall risk score', e);
        }
    }

    // ── Public API ─────────────────────────────────────────────────────────

    public async getAnalysis(): Promise<FallRiskAnalysis> {
        const rawHistory = await appDatabase.getAll('fall_risk_scores') as any[];
        const historicalData: FallRiskScore[] = rawHistory.map(h => ({
            score: h.score,
            timestamp: new Date(h.timestamp).toISOString(),
        })).slice(-30);

        if (historicalData.length === 0) {
            historicalData.push({
                score: this.currentScore,
                timestamp: new Date().toISOString(),
            });
        }

        const { sedentaryPct, moderatePct, activePct } = this.getClusterPercentages();
        const dominantPattern: GaitClusters['dominantPattern'] =
            sedentaryPct >= moderatePct && sedentaryPct >= activePct ? 'sedentary' :
            activePct >= moderatePct ? 'active' : 'moderate';

        const gaitClusters: GaitClusters = {
            sedentaryPct,
            moderatePct,
            activePct,
            stepVariance: Math.round(this.gaitVar * 50_000), // Approximate step variance from gait var
            hrVariance: 0, // Not available from accelerometer only
            dominantPattern,
        };

        return {
            currentScore: this.currentScore,
            lastUpdate: new Date().toISOString(),
            gaitClusters,
            indicators: {
                gaitSpeedVar: Math.round(this.gaitVar),
                activityLevel: Math.round(this.activityLevel),
                medicationAdherence: 85, // Static until reminders are linked
                recentFalls: 0,
                environmentalRisk: Math.min(50, sedentaryPct * 0.5),
            },
            historicalData,
            forecasts: [
                {
                    days: 7,
                    predictedScore: Math.max(0, this.currentScore - 2),
                    trend: 'stable',
                    confidenceInterval: [this.currentScore - 5, this.currentScore + 5],
                },
                {
                    days: 30,
                    predictedScore: Math.max(0, this.currentScore - 5),
                    trend: 'down',
                    confidenceInterval: [this.currentScore - 10, this.currentScore + 10],
                },
                {
                    days: 90,
                    predictedScore: Math.max(0, this.currentScore - 10),
                    trend: 'down',
                    confidenceInterval: [this.currentScore - 20, this.currentScore + 20],
                },
            ],
        };
    }
}

export const localFallRiskEngine = new LocalFallRiskEngine();
