import { Platform } from 'react-native';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import { SensorSample } from './SensorBuffer';

export type SensorCallback = (sample: SensorSample) => void;

class SensorService {
    private accelSubscription: any = null;
    private gyroSubscription: any = null;
    private currentAccel = { x: 0, y: 0, z: 0 };
    private currentGyro = { x: 0, y: 0, z: 0 };
    private callbacks: SensorCallback[] = [];
    private updateInterval = 100; // 100ms (50-100ms range)

    constructor() {
        // Sensors are not available on web — skip initialization
        if (Platform.OS === 'web') return;

        Accelerometer.setUpdateInterval(this.updateInterval);
        Gyroscope.setUpdateInterval(this.updateInterval);
    }

    public async start(callback: SensorCallback) {
        // Sensors are native-only — silently skip on web
        if (Platform.OS === 'web') {
            console.log('[SensorService] Fall detection not supported on web');
            return;
        }

        const isAccelAvailable = await Accelerometer.isAvailableAsync();
        const isGyroAvailable  = await Gyroscope.isAvailableAsync();

        if (!isAccelAvailable || !isGyroAvailable) {
            console.warn('[SensorService] Accelerometer or Gyroscope not available on this device');
            return;
        }

        const { status: accelStatus } = await Accelerometer.requestPermissionsAsync();
        const { status: gyroStatus }  = await Gyroscope.requestPermissionsAsync();

        if (accelStatus !== 'granted' || gyroStatus !== 'granted') {
            console.warn('[SensorService] Sensor permissions not granted');
            return;
        }

        this.callbacks.push(callback);

        // Already running — don't add duplicate subscriptions
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
        if (Platform.OS === 'web') return;

        this.accelSubscription?.remove();
        this.gyroSubscription?.remove();
        this.accelSubscription = null;
        this.gyroSubscription = null;
        this.callbacks = [];
    }

    private emitLatest() {
        const timestamp = Date.now();

        const { x, y, z } = this.currentAccel;

        // Convert accelerometer data to Euler angles (degrees)
        // Pitch: rotation around X-axis
        // Roll:  rotation around Y-axis
        // Yaw:   approximated from gyro Z (no magnetometer available)
        const pitch = Math.atan2(y, Math.sqrt(x * x + z * z)) * (180 / Math.PI);
        const roll  = Math.atan2(-x, z) * (180 / Math.PI);
        const yaw   = this.currentGyro.z;

        const sample: SensorSample = {
            accelX: x,
            accelY: y,
            accelZ: z,
            pitch,
            roll,
            yaw,
            timestamp,
        };

        this.callbacks.forEach(cb => cb(sample));
    }

    public setUpdateInterval(interval: number) {
        if (Platform.OS === 'web') return;

        this.updateInterval = interval;
        Accelerometer.setUpdateInterval(interval);
        Gyroscope.setUpdateInterval(interval);
    }
}

export const sensorService = new SensorService();