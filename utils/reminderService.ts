import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const REMINDERS_STORAGE_KEY = 'elderconnect_reminders';

export interface Reminder {
    id: string;
    title: string;
    body: string;
    date: string; // ISO string
    type: 'general' | 'medication' | 'appointment';
    status: 'active' | 'completed' | 'cancelled';
}

export const ReminderService = {
    /**
     * Schedules a new notification and saves it to local storage.
     */
    async scheduleReminder(reminder: Omit<Reminder, 'id' | 'status'>): Promise<Reminder> {
        const triggerDate = new Date(reminder.date);

        if (triggerDate <= new Date()) {
            throw new Error("Cannot set a reminder in the past.");
        }

        // Schedule notification
        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: `⏰ ${reminder.title}`,
                body: reminder.body,
                sound: Platform.OS === 'android' ? 'default' : 'alarm.wav',
                data: { type: reminder.type },
            },
            trigger: {
                date: triggerDate,
            } as Notifications.DateTriggerInput,
        });

        const newReminder: Reminder = {
            ...reminder,
            id: notificationId,
            status: 'active',
        };

        // Save to storage
        const existingReminders = await this.getAllReminders();
        const updatedReminders = [...existingReminders, newReminder];
        await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(updatedReminders));

        return newReminder;
    },

    /**
     * Retrieves all reminders from local storage.
     */
    async getAllReminders(): Promise<Reminder[]> {
        try {
            const data = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);
            if (!data) return [];
            const reminders: Reminder[] = JSON.parse(data);

            // Filter out reminders that are in the past and marked as active (cleanup)
            const now = new Date().getTime();
            return reminders.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        } catch (error) {
            console.error("Failed to fetch reminders:", error);
            return [];
        }
    },

    /**
     * Cancels a scheduled reminder and removes/updates it in storage.
     */
    async cancelReminder(id: string): Promise<void> {
        // Cancel notification
        await Notifications.cancelScheduledNotificationAsync(id);

        // Update storage
        const reminders = await this.getAllReminders();
        const updatedReminders = reminders.filter(r => r.id !== id);
        await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(updatedReminders));
    },

    /**
     * Cleans up old reminders (completed or past date).
     */
    async cleanupReminders(): Promise<void> {
        const reminders = await this.getAllReminders();
        const now = new Date().getTime();
        const activeReminders = reminders.filter(r => new Date(r.date).getTime() > now);
        await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(activeReminders));
    }
};
