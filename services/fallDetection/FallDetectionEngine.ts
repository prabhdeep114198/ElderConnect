import { SensorBuffer, SensorSample } from './SensorBuffer';
import { sensorService } from './SensorService';

export type FallDetectionCallback = () => void;

class FallDetectionEngine {
    private buffer: SensorBuffer;
    private onFallDetected: FallDetectionCallback | null = null;
    private isMonitoring: boolean = false;
    private lastImpactTime: number = 0;
    private impactDetected: boolean = false;

    constructor() {
        this.buffer = new SensorBuffer(100); // 100 samples = 10s window at 100ms
    }

    public async start(callback: FallDetectionCallback) {
        this.onFallDetected = callback;
        if (this.isMonitoring) return;

        this.isMonitoring = true;
        await sensorService.start(this.handleSensorData.bind(this));
        console.log('Fall Detection Engine Started');
    }

    public stop() {
        this.isMonitoring = false;
        sensorService.stop();
        console.log('Fall Detection Engine Stopped');
    }

    private handleSensorData(sample: SensorSample) {
        this.buffer.push(sample);
        this.processLogic();
    }

    private processLogic() {
        const window = this.buffer.getWindow();
        if (window.length < 50) return; // Need at least 5s of data

        const latest = window[window.length - 1];
        const magnitude = Math.sqrt(latest.accelX ** 2 + latest.accelY ** 2 + latest.accelZ ** 2);

        // Rule 1: Impact Detection
        if (magnitude > 2.8) {
            if (!this.impactDetected) {
                console.log('Potential Impact Detected:', magnitude.toFixed(2));
                this.impactDetected = true;
                this.lastImpactTime = Date.now();
            }
        }

        // If we detected an impact, we wait for Rule 2 and 3 to be met
        if (this.impactDetected) {
            const timeSinceImpact = Date.now() - this.lastImpactTime;

            // If more than 10 seconds passed since impact and no fall confirmed, reset
            if (timeSinceImpact > 10000) {
                this.impactDetected = false;
                return;
            }

            // Check for Rule 2 (Orientation) and Rule 3 (Stillness) in the last 3-5 seconds
            // We look at the most recent samples
            const recentSamples = window.slice(-30); // Last 3 seconds

            let isHorizontal = false;
            let isStill = true;

            for (const s of recentSamples) {
                // Orientation Check (approx 80-100 degrees)
                if (
                    (Math.abs(s.pitch) > 75 && Math.abs(s.pitch) < 105) ||
                    (Math.abs(s.roll) > 75 && Math.abs(s.roll) < 105)
                ) {
                    isHorizontal = true;
                }

                // Stillness Check (IF dynamic acceleration < 0.3g for 3-5 seconds)
                // Dynamic acceleration is total magnitude minus gravity (1.0g)
                const m = Math.sqrt(s.accelX ** 2 + s.accelY ** 2 + s.accelZ ** 2);
                const dynamicAccel = Math.abs(m - 1.0);
                if (dynamicAccel > 0.3) { // If dynamic acceleration > 0.3g, person is moving
                    isStill = false;
                }
            }

            // Final Rule: IF impact AND horizontal AND stillness
            if (this.impactDetected && isHorizontal && isStill && timeSinceImpact > 2000) {
                console.log('FALL CONFIRMED!');
                this.onFallDetected?.();
                this.reset();
            }
        }
    }

    private reset() {
        this.impactDetected = false;
        this.lastImpactTime = 0;
        this.buffer.clear();
    }
}

export const fallDetectionEngine = new FallDetectionEngine();
