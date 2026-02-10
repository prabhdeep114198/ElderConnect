export enum RiskLevel {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
}

export enum AlertState {
    NORMAL = 'NORMAL',
    ADVISORY = 'ADVISORY',
    URGENT = 'URGENT',
    EMERGENCY = 'EMERGENCY',
}

export interface EmergencyPrediction {
    riskLevel: RiskLevel;
    reassuranceMessage: string;
    caregiverAlertState: AlertState;
    adherenceScore: number; // 0-100
    lastAssessment: string; // ISO date string
}
