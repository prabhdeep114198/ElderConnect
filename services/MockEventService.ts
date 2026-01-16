// services/MockEventService.ts

export interface Event {
    id: string;
    name: string;
    start: string;
    end: string;
    category: string;
    description?: string;
}

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

export interface DiaryEntry {
    id: string;
    date: string;
    mood: 'happy' | 'sad' | 'neutral' | 'anxious' | 'angry';
    notes: string;
    tags: string[];
    weather?: string;
    activity: string[];
}

const EVENT_CATEGORIES = [
    "Health",
    "Social",
    "Education",
    "Fitness",
    "Entertainment",
    "Community"
];

const EVENT_TITLES = [
    "Morning Yoga in the Park",
    "Community Bingo Night",
    "Healthy Cooking Workshop",
    "Local History Walk",
    "Senior Tech Support Session",
    "Gardening Club Meetup",
    "Live Jazz Evening",
    "Book Club Discussion",
    "Art Therapy Class",
    "Meditation & Mindfulness"
];

const DESCRIPTIONS = [
    "Join us for a relaxing session to start your day with energy.",
    "Meet new friends and win exciting prizes!",
    "Learn to cook nutritious meals that taste great.",
    "Explore the hidden gems of our neighborhood.",
    "Get help with your smartphone or tablet.",
    "Share tips and seeds with fellow gardening enthusiasts.",
    "Enjoy classic jazz hits in a comfortable setting.",
    "Discussing this month's bestseller. Refreshments provided.",
    "Express yourself through painting and drawing.",
    "Find your inner peace with guided meditation."
];

// Helper to generate a random date within the next n days
const getFutureDate = (daysOffset: number, hour: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    date.setHours(hour, 0, 0, 0);
    return date.toISOString();
};

// Helper to get past dates
const getPastDate = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
};

export const fetchMockEvents = async (lat: number, lon: number): Promise<Event[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const events: Event[] = [];

    // Generate 10 mock events
    for (let i = 0; i < 10; i++) {
        const titleIndex = Math.floor(Math.random() * EVENT_TITLES.length);
        const daysOffset = Math.floor(Math.random() * 14); // Next 2 weeks
        const startHour = 10 + Math.floor(Math.random() * 8); // 10 AM to 6 PM

        const startDate = getFutureDate(daysOffset, startHour);
        // End time is 2 hours later
        const endDateObj = new Date(startDate);
        endDateObj.setHours(new Date(startDate).getHours() + 2);

        events.push({
            id: `mock-evt-${i}-${Date.now()}`,
            name: EVENT_TITLES[titleIndex],
            start: startDate,
            end: endDateObj.toISOString(),
            category: EVENT_CATEGORIES[Math.floor(Math.random() * EVENT_CATEGORIES.length)],
            description: DESCRIPTIONS[titleIndex] || "Join us for this wonderful event!",
        });
    }

    // Sort by date
    return events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
};

// Mock Health Metrics
export const fetchMockHealthMetrics = async (): Promise<HealthMetric[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    return [
        {
            id: '1',
            name: 'Steps',
            value: 6847,
            unit: 'steps',
            target: 8000,
            icon: 'walk',
            color: '#5a67d8',
            trend: 'up',
            lastUpdated: '2 hours ago',
            history: [
                { date: getPastDate(3), value: 5200 },
                { date: getPastDate(2), value: 6100 },
                { date: getPastDate(1), value: 7300 },
                { date: getPastDate(0), value: 6847 }
            ]
        },
        {
            id: '6',
            name: 'Exercise',
            value: 45,
            unit: 'minutes',
            target: 60,
            icon: 'barbell',
            color: '#FF9800',
            trend: 'up',
            lastUpdated: '3 hours ago',
            history: [
                { date: getPastDate(3), value: 30 },
                { date: getPastDate(2), value: 35 },
                { date: getPastDate(1), value: 40 },
                { date: getPastDate(0), value: 45 }
            ]
        },
        {
            id: '3',
            name: 'Sleep',
            value: 7.5,
            unit: 'hours',
            target: 8,
            icon: 'moon',
            color: '#3B82F6',
            trend: 'up',
            lastUpdated: 'This morning',
            history: [
                { date: getPastDate(3), value: 6.8 },
                { date: getPastDate(2), value: 7.2 },
                { date: getPastDate(1), value: 7.8 },
                { date: getPastDate(0), value: 7.5 }
            ]
        },
        {
            id: '4',
            name: 'Water Intake',
            value: 6,
            unit: 'glasses',
            target: 8,
            icon: 'water',
            color: '#06B6D4',
            trend: 'down',
            lastUpdated: '1 hour ago',
            history: [
                { date: getPastDate(3), value: 7 },
                { date: getPastDate(2), value: 8 },
                { date: getPastDate(1), value: 6 },
                { date: getPastDate(0), value: 6 }
            ]
        }
    ];
};

// Mock Vital Signs
export const fetchMockVitalSigns = async (): Promise<VitalSign[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    return [
        {
            id: '1',
            name: 'Blood Pressure',
            systolic: 120,
            diastolic: 80,
            unit: 'mmHg',
            status: 'normal',
            timestamp: new Date().toISOString(),
            notes: 'Measured after morning walk'
        },
        {
            id: '2',
            name: 'Blood Sugar',
            value: 95,
            unit: 'mg/dL',
            status: 'normal',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            notes: 'Fasting glucose level'
        },
        {
            id: '3',
            name: 'Heart Rate',
            value: 72,
            unit: 'bpm',
            status: 'normal',
            timestamp: new Date(Date.now() - 3600000).toISOString()
        }
    ];
};

// Mock Diary Entries
export const fetchMockDiaryEntries = async (): Promise<DiaryEntry[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    return [
        {
            id: '1',
            date: new Date().toISOString(),
            mood: 'happy',
            notes: 'Had a great walk in the park today. The weather was perfect!',
            tags: ['exercise', 'outdoors'],
            weather: 'sunny',
            activity: ['Walking', 'Gardening']
        },
        {
            id: '2',
            date: new Date(Date.now() - 86400000).toISOString(),
            mood: 'neutral',
            notes: 'Regular day, spent time reading and relaxing.',
            tags: ['reading', 'relaxation'],
            weather: 'cloudy',
            activity: ['Reading']
        },
        {
            id: '3',
            date: new Date(Date.now() - 172800000).toISOString(),
            mood: 'happy',
            notes: 'Attended a community event and met some wonderful people.',
            tags: ['social', 'community'],
            weather: 'sunny',
            activity: ['Socializing', 'Community Event']
        }
    ];
};
