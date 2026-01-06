
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

// =====================
// Types (Copied from tracker.tsx)
// =====================
export interface HealthMetric {
    id: string;
    name: string;
    value: number;
    unit: string;
    target?: number;
    icon: string;
    color: string;
    trend: 'up' | 'down' | 'stable';
    lastUpdated: string;
    history: { date: string; value: number }[];
}

export interface VitalSign {
    id: string;
    name: string;
    systolic?: number;
    diastolic?: number;
    value?: number;
    unit: string;
    status: 'normal' | 'high' | 'low' | 'critical';
    timestamp: string;
    notes?: string;
}

export interface WeeklyGoal {
    name: string;
    current: number;
    target: number;
    unit: string;
}

// =====================
// Default Static Data
// =====================
const DEFAULT_HEALTH_METRICS: HealthMetric[] = [
    {
        id: '1',
        name: 'Steps',
        value: 6847,
        unit: 'steps',
        target: 8000,
        icon: 'walk',
        color: '#4CAF50', // colors.primary hardcoded for now, will fix imports if needed or rely on hex
        trend: 'up',
        lastUpdated: '2 hours ago',
        history: [
            { date: '2024-12-09', value: 5200 },
            { date: '2024-12-10', value: 6100 },
            { date: '2024-12-11', value: 7300 },
            { date: '2024-12-12', value: 6847 }
        ]
    },
    {
        id: '2',
        name: 'Heart Rate',
        value: 72,
        unit: 'bpm',
        target: 75,
        icon: 'heart',
        color: '#FF5252', // colors.error
        trend: 'stable',
        lastUpdated: '30 minutes ago',
        history: [
            { date: '2024-12-09', value: 74 },
            { date: '2024-12-10', value: 71 },
            { date: '2024-12-11', value: 73 },
            { date: '2024-12-12', value: 72 }
        ]
    },
    {
        id: '3',
        name: 'Sleep',
        value: 7.5,
        unit: 'hours',
        target: 8,
        icon: 'moon',
        color: '#2196F3', // colors.info
        trend: 'up',
        lastUpdated: 'This morning',
        history: [
            { date: '2024-12-09', value: 6.8 },
            { date: '2024-12-10', value: 7.2 },
            { date: '2024-12-11', value: 7.8 },
            { date: '2024-12-12', value: 7.5 }
        ]
    },
    {
        id: '4',
        name: 'Water Intake',
        value: 6,
        unit: 'glasses',
        target: 8,
        icon: 'water',
        color: '#2196F3', // colors.info
        trend: 'down',
        lastUpdated: '1 hour ago',
        history: [
            { date: '2024-12-09', value: 7 },
            { date: '2024-12-10', value: 8 },
            { date: '2024-12-11', value: 6 },
            { date: '2024-12-12', value: 6 }
        ]
    },
    {
        id: '5',
        name: 'Weight',
        value: 68.5,
        unit: 'kg',
        icon: 'fitness',
        color: '#4CAF50', // colors.success
        trend: 'stable',
        lastUpdated: 'Yesterday',
        history: [
            { date: '2024-12-09', value: 68.8 },
            { date: '2024-12-10', value: 68.6 },
            { date: '2024-12-11', value: 68.4 },
            { date: '2024-12-12', value: 68.5 }
        ]
    },
    {
        id: '6',
        name: 'Exercise',
        value: 45,
        unit: 'minutes',
        target: 60,
        icon: 'barbell',
        color: '#FFC107', // colors.warning
        trend: 'up',
        lastUpdated: '3 hours ago',
        history: [
            { date: '2024-12-09', value: 30 },
            { date: '2024-12-10', value: 35 },
            { date: '2024-12-11', value: 40 },
            { date: '2024-12-12', value: 45 }
        ]
    }
];

const DEFAULT_VITAL_SIGNS: VitalSign[] = [
    {
        id: '1',
        name: 'Blood Pressure',
        systolic: 120,
        diastolic: 80,
        unit: 'mmHg',
        status: 'normal',
        timestamp: '2024-12-12 08:30',
        notes: 'Measured after morning walk'
    },
    {
        id: '2',
        name: 'Blood Sugar',
        value: 95,
        unit: 'mg/dL',
        status: 'normal',
        timestamp: '2024-12-12 07:45',
        notes: 'Fasting glucose level'
    },
    {
        id: '3',
        name: 'Temperature',
        value: 98.6,
        unit: '°F',
        status: 'normal',
        timestamp: '2024-12-12 09:00'
    },
    {
        id: '4',
        name: 'Oxygen Saturation',
        value: 98,
        unit: '%',
        status: 'normal',
        timestamp: '2024-12-12 08:45'
    }
];

const DEFAULT_WEEKLY_GOALS: WeeklyGoal[] = [
    { name: 'Steps', current: 45230, target: 56000, unit: 'steps' },
    { name: 'Exercise', current: 280, target: 420, unit: 'minutes' },
    { name: 'Sleep', current: 52.5, target: 56, unit: 'hours' },
    { name: 'Water', current: 42, target: 56, unit: 'glasses' }
];

// =====================
// Context
// =====================
interface HealthContextType {
    healthMetrics: HealthMetric[];
    vitalSigns: VitalSign[];
    weeklyGoals: WeeklyGoal[];
    loading: boolean;
    updateMetric: (metricId: string, value: number) => Promise<void>;
    addVitalSign: (vital: VitalSign) => Promise<void>;
    updateWeeklyGoal: (name: string, value: number) => Promise<void>;
}

const HealthContext = createContext<HealthContextType | undefined>(undefined);

export const useHealth = () => {
    const context = useContext(HealthContext);
    if (!context) {
        throw new Error("useHealth must be used within a HealthProvider");
    }
    return context;
};

export const HealthProvider = ({ children }: { children: ReactNode }) => {
    const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>(DEFAULT_HEALTH_METRICS);
    const [vitalSigns, setVitalSigns] = useState<VitalSign[]>(DEFAULT_VITAL_SIGNS);
    const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>(DEFAULT_WEEKLY_GOALS);
    const [loading, setLoading] = useState(true);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const storedMetrics = await AsyncStorage.getItem("healthMetrics");
            const storedVitals = await AsyncStorage.getItem("vitalSigns");
            const storedGoals = await AsyncStorage.getItem("weeklyGoals");

            if (storedMetrics) setHealthMetrics(JSON.parse(storedMetrics));
            if (storedVitals) setVitalSigns(JSON.parse(storedVitals));
            if (storedGoals) setWeeklyGoals(JSON.parse(storedGoals));
        } catch (error) {
            console.error("Failed to load health data", error);
        } finally {
            setLoading(false);
        }
    };

    const updateMetric = async (metricId: string, newValue: number) => {
        const updatedMetrics = healthMetrics.map(metric => {
            if (metric.id === metricId) {
                const today = new Date().toISOString().split('T')[0];
                const updatedHistory = [...metric.history];
                const todayIndex = updatedHistory.findIndex(h => h.date === today);

                if (todayIndex >= 0) {
                    updatedHistory[todayIndex].value = newValue;
                } else {
                    updatedHistory.push({ date: today, value: newValue });
                }

                return {
                    ...metric,
                    value: newValue,
                    history: updatedHistory,
                    lastUpdated: 'Just now'
                };
            }
            return metric;
        });

        setHealthMetrics(updatedMetrics);
        await AsyncStorage.setItem("healthMetrics", JSON.stringify(updatedMetrics));

        // Also update related weekly goal if exists
        const metricName = healthMetrics.find(m => m.id === metricId)?.name;
        if (metricName) {
            // Simple mapping logic: e.g., if metric is "Water Intake" (daily), add to weekly goal?
            // For simplicity and matching current logic, we might just want to update the goal 'current' value
            // But the original code didn't automatically link them. I'll leave this as a future enhancement 
            // unless explicitly requested, or implement simple updates if names match.
            // For now, I will just persist the metrics.
        }
    };

    const addVitalSign = async (vital: VitalSign) => {
        const updatedVitals = [vital, ...vitalSigns];
        setVitalSigns(updatedVitals);
        await AsyncStorage.setItem("vitalSigns", JSON.stringify(updatedVitals));
    };

    const updateWeeklyGoal = async (name: string, value: number) => {
        const updatedGoals = weeklyGoals.map(goal =>
            goal.name === name ? { ...goal, current: value } : goal
        );
        setWeeklyGoals(updatedGoals);
        await AsyncStorage.setItem("weeklyGoals", JSON.stringify(updatedGoals));
    };

    return (
        <HealthContext.Provider
            value={{
                healthMetrics,
                vitalSigns,
                weeklyGoals,
                loading,
                updateMetric,
                addVitalSign,
                updateWeeklyGoal
            }}
        >
            {children}
        </HealthContext.Provider>
    );
};
