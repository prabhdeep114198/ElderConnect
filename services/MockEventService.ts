// services/MockEventService.ts

export interface Event {
    id: string;
    name: string;
    start: string;
    end: string;
    category: string;
    description?: string;
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

    // Sort by date date
    return events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
};
