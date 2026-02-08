import { Accelerometer, Gyroscope } from 'expo-sensors';
import { SensorSample } from './SensorBuffer';

export type SensorCallback = (sample: SensorSample) => void;

class SensorService {
    private accelSubscription: any = null;
    private gyroSubscription: any = null;
    private currentAccel = { x: 0, y: 0, z: 0 };
    private currentGyro = { x: 0, y: 0, z: 0 };
    private callbacks: SensorCallback[] = [];
    private updateInterval = 100; // 100ms as requested (50-100ms)

    constructor() {
        Accelerometer.setUpdateInterval(this.updateInterval);
        Gyroscope.setUpdateInterval(this.updateInterval);
    }

    public async start(callback: SensorCallback) {
        const isAccelAvailable = await Accelerometer.isAvailableAsync();
        const isGyroAvailable = await Gyroscope.isAvailableAsync();

        if (!isAccelAvailable || !isGyroAvailable) {
            console.warn('Accelerometer or Gyroscope not available on this device');
            return;
        }

        const { status: accelStatus } = await Accelerometer.requestPermissionsAsync();
        const { status: gyroStatus } = await Gyroscope.requestPermissionsAsync();

        if (accelStatus !== 'granted' || gyroStatus !== 'granted') {
            console.warn('Sensor permissions not granted');
            return;
        }

        this.callbacks.push(callback);

        if (this.accelSubscription && this.gyroSubscription) return;

        this.accelSubscription = Accelerometer.addListener(data => {
            this.currentAccel = data;
            this.emitLatest();
        });

        this.gyroSubscription = Gyroscope.addListener(data => {
            this.currentGyro = data;
        });
    }

    public stop() {
        this.accelSubscription?.remove();
        this.gyroSubscription?.remove();
        this.accelSubscription = null;
        this.gyroSubscription = null;
        this.callbacks = [];
    }

    private emitLatest() {
        const timestamp = Date.now();

        // Euler angles (simplified estimation from accelerometer for pitch/roll)
        // Pitch: rotation around X-axis
        // Roll: rotation around Y-axis
        // Yaw: rotation around Z-axis (hard to get from just accel/gyro without magnetometer/fusion)

        const { x, y, z } = this.currentAccel;

        // Convert to degrees
        const pitch = Math.atan2(y, Math.sqrt(x * x + z * z)) * (180 / Math.PI);
        const roll = Math.atan2(-x, z) * (180 / Math.PI);
        const yaw = this.currentGyro.z; // Just using gyro z for yaw as a placeholder

        const sample: SensorSample = {
            accelX: x,
            accelY: y,
            accelZ: z,
            pitch,
            roll,
            yaw,
            timestamp
        };

        this.callbacks.forEach(cb => cb(sample));
    }

    public setUpdateInterval(interval: number) {
        this.updateInterval = interval;
        Accelerometer.setUpdateInterval(interval);
        Gyroscope.setUpdateInterval(interval);
    }
}

export const sensorService = new SensorService();
