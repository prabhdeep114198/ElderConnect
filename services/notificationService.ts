import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export class NotificationService {
  constructor() {
    this.initCategories();
  }

  async initCategories() {
    if (Platform.OS !== 'web') {
      await Notifications.setNotificationCategoryAsync('medication', [
        {
          identifier: 'snooze',
          buttonTitle: 'Snooze 10 mins',
          options: { isDestructive: false },
        },
        {
          identifier: 'confirm',
          buttonTitle: 'Confirm Taken',
          options: { isDestructive: false },
        },
      ]);
      await Notifications.setNotificationCategoryAsync('social', [
        {
          identifier: 'call',
          buttonTitle: 'Call Caregiver',
          options: { isDestructive: false },
        },
        {
          identifier: 'message',
          buttonTitle: 'Send Message',
          options: { isDestructive: false },
        },
      ]);
      await Notifications.setNotificationCategoryAsync('health', []);
    }
  }

  /**
   * Immediately triggers a push notification logically bypassing scheduled queues, mainly for Safety or Inactivity checks.
   */
  async triggerNotification(title: string, body: string, categoryIdentifier?: string, data?: any) {
    if (Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        categoryIdentifier,
        data,
        sound: true,
      },
      trigger: null, // immediate trigger
    });
  }

  async scheduleDailyHealthReminder() {
    if (Platform.OS === 'web') return;
    
    // Scheduled at 8:00 PM nightly
    await Notifications.scheduleNotificationAsync({
      identifier: 'daily_health_check',
      content: {
        title: 'Health Check Reminder',
        body: 'You haven’t logged your blood pressure today. Keeping track of your vitals helps your caregivers monitor your health.',
        categoryIdentifier: 'health',
        sound: true,
      },
      trigger: {
        hour: 20,
        minute: 0,
        repeats: true,
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
      } as Notifications.DailyTriggerInput
    });
  }

  /**
   * Overrides daily health reminder if user has already achieved compliance to avoid alert fatigue.
   */
  async cancelDailyHealthReminder() {
    if (Platform.OS === 'web') return;
    await Notifications.cancelScheduledNotificationAsync('daily_health_check');
  }

  /**
   * Schedule medication alerts dynamically based on user routines 
   */
  async scheduleMedicationAlerts(medications: { id: string; time: { hour: number; minute: number }; name: string }[]) {
    if (Platform.OS === 'web') return;
    for (const med of medications) {
      await Notifications.scheduleNotificationAsync({
        identifier: `med_${med.id}`,
        content: {
          title: 'Medication Reminder',
          body: `It's time to take your ${med.name}.`,
          categoryIdentifier: 'medication',
          sound: true,
          data: { medName: med.name },
        },
        trigger: {
          hour: med.time.hour,
          minute: med.time.minute,
          repeats: true,
          type: Notifications.SchedulableTriggerInputTypes.DAILY
        } as Notifications.DailyTriggerInput
      });
    }
  }

  /**
   * Schedule staggered daytime hydration reminders
   */
  async scheduleHydrationReminders() {
    if (Platform.OS === 'web') return;
    const hours = [10, 14, 18]; // 10 AM, 2 PM, 6 PM
    
    for (const hour of hours) {
      await Notifications.scheduleNotificationAsync({
        identifier: `hydration_${hour}`,
        content: {
          title: 'Hydration Reminder',
          body: 'Drinking water regularly is important for your health.',
          sound: true
        },
        trigger: {
          hour,
          minute: 0,
          repeats: true,
          type: Notifications.SchedulableTriggerInputTypes.DAILY
        } as Notifications.DailyTriggerInput
      });
    }
  }

  async setNightRoutineReminder() {
    if (Platform.OS === 'web') return;
    await Notifications.scheduleNotificationAsync({
      identifier: 'night_routine',
      content: {
        title: 'Night Routine',
        body: 'Remember to take evening medication and check your vitals before sleeping.',
        sound: true
      },
      trigger: {
        hour: 22,
        minute: 0,
        repeats: true,
        type: Notifications.SchedulableTriggerInputTypes.DAILY
      } as Notifications.DailyTriggerInput
    });
  }

  async setMorningWellnessNotification() {
    if (Platform.OS === 'web') return;
    await Notifications.scheduleNotificationAsync({
      identifier: 'morning_wellness',
      content: {
        title: 'Good Morning!',
        body: 'Start your day by checking your health metrics.',
        sound: true
      },
      trigger: {
        hour: 9,
        minute: 0,
        repeats: true,
        type: Notifications.SchedulableTriggerInputTypes.DAILY
      } as Notifications.DailyTriggerInput
    });
  }

  async clearAll() {
    if (Platform.OS !== 'web') {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  }
}

export const notificationService = new NotificationService();
