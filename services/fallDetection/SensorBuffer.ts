export type SensorSample = {
    accelX: number;
    accelY: number;
    accelZ: number;
    pitch: number;
    roll: number;
    yaw: number;
    timestamp: number;
};

export class SensorBuffer {
    private buffer: SensorSample[] = [];
    private readonly maxSize: number;

    constructor(maxSize: number = 50) {
        this.maxSize = maxSize;
    }

    public push(sample: SensorSample) {
        this.buffer.push(sample);
        if (this.buffer.length > this.maxSize) {
            this.buffer.shift();
        }
    }

    public getWindow(): SensorSample[] {
        return [...this.buffer];
    }

    public clear() {
        this.buffer = [];
    }

    public get currentSize(): number {
        return this.buffer.length;
    }
}
