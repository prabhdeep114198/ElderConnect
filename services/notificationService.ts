import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface MedicationAlert {
  id: string;
  time: { hour: number; minute: number };
  name: string;
  dosage?: string;
  instructions?: string;
}

export interface NotificationPreferences {
  userName?: string;
  wakeUpHour?: number;      // default 8
  sleepHour?: number;        // default 22
  hydrationCount?: number;   // how many hydration reminders (0 to disable)
  enableMorningBriefing?: boolean;
  enableNightRoutine?: boolean;
  enableHealthReminder?: boolean;
  medications?: MedicationAlert[];
}

const DEFAULT_PREFS: NotificationPreferences = {
  userName: '',
  wakeUpHour: 8,
  sleepHour: 22,
  hydrationCount: 3,
  enableMorningBriefing: true,
  enableNightRoutine: true,
  enableHealthReminder: true,
  medications: [],
};

// Friendly, warm greeting pools for variety
const MORNING_GREETINGS = [
  (name: string) => `Good morning${name ? `, ${name}` : ''}! 🌅 Ready to start a healthy day?`,
  (name: string) => `Rise and shine${name ? `, ${name}` : ''}! ☀️ Let's check your health today.`,
  (name: string) => `Hello${name ? `, ${name}` : ''}! 🌤️ A new day, a fresh start for your wellness.`,
];

const NIGHT_MESSAGES = [
  (name: string) => `Good night${name ? `, ${name}` : ''}! 🌙 Don't forget your evening routine.`,
  (name: string) => `Time to wind down${name ? `, ${name}` : ''}. 😴 Check your vitals before bed.`,
  (name: string) => `Sleep well${name ? `, ${name}` : ''}! 💤 Your health matters even at bedtime.`,
];

const HYDRATION_MESSAGES = [
  (name: string) => `Stay hydrated${name ? `, ${name}` : ''}! 💧 A glass of water keeps you energized.`,
  (name: string) => `Water break${name ? `, ${name}` : ''}! 🚰 Your body needs regular hydration.`,
  (name: string) => `Drink up${name ? `, ${name}` : ''}! 💦 Staying hydrated supports your heart and joints.`,
];

const HEALTH_CHECK_MESSAGES = [
  (name: string) => `${name ? `${name}, you` : 'You'} haven't logged your vitals today. A quick check helps your caregivers stay informed! 📊`,
  (name: string) => `Health check time${name ? `, ${name}` : ''}! 🩺 Tracking your BP and heart rate takes just a minute.`,
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

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
   * Immediately triggers a push notification.
   */
  async triggerNotification(title: string, body: string, categoryIdentifier?: string, data?: any) {
    if (Platform.OS === 'web') return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        ...(categoryIdentifier ? { categoryIdentifier } : {}),
        data,
        sound: true,
      },
      trigger: null, // immediate trigger
    });
  }

  /**
   * Schedules the daily health reminder with a personalized message.
   * Cancelled automatically if the user logs vitals before the scheduled time.
   */
  async scheduleDailyHealthReminder(prefs: NotificationPreferences = DEFAULT_PREFS) {
    if (Platform.OS === 'web') return;
    if (!prefs.enableHealthReminder) return;

    const name = prefs.userName || '';
    const body = pickRandom(HEALTH_CHECK_MESSAGES)(name);

    // Schedule 2 hours before bed (e.g. bed at 22 → reminder at 20)
    const reminderHour = Math.max((prefs.sleepHour || 22) - 2, 12);

    await Notifications.scheduleNotificationAsync({
      identifier: 'daily_health_check',
      content: {
        title: '🩺 Health Check Reminder',
        body,
        categoryIdentifier: 'health',
        sound: true,
      },
      trigger: {
        hour: reminderHour,
        minute: 0,
        repeats: true,
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
      } as Notifications.DailyTriggerInput,
    });
  }

  /**
   * Overrides daily health reminder if user has already achieved compliance.
   */
  async cancelDailyHealthReminder() {
    if (Platform.OS === 'web') return;
    await Notifications.cancelScheduledNotificationAsync('daily_health_check');
  }

  /**
   * Schedule medication alerts dynamically from the user's ACTUAL medication list.
   * Each medication gets its own named notification with specific dosage info.
   */
  async scheduleMedicationAlerts(medications: MedicationAlert[]) {
    if (Platform.OS === 'web') return;

    for (const med of medications) {
      const dosageInfo = med.dosage ? ` (${med.dosage})` : '';
      const instructionInfo = med.instructions ? `\n${med.instructions}` : '';

      await Notifications.scheduleNotificationAsync({
        identifier: `med_${med.id}`,
        content: {
          title: `💊 Time for ${med.name}`,
          body: `It's time to take your ${med.name}${dosageInfo}.${instructionInfo}`,
          categoryIdentifier: 'medication',
          sound: true,
          data: { medId: med.id, medName: med.name, medDosage: med.dosage },
        },
        trigger: {
          hour: med.time.hour,
          minute: med.time.minute,
          repeats: true,
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
        } as Notifications.DailyTriggerInput,
      });
    }
  }

  /**
   * Trigger a missed medication notification for a SPECIFIC medication.
   */
  async triggerMissedMedNotification(med: MedicationAlert) {
    if (Platform.OS === 'web') return;

    const dosageInfo = med.dosage ? ` (${med.dosage})` : '';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `⚠️ Missed: ${med.name}`,
        body: `You may have missed your ${med.name}${dosageInfo}. Please take it if you haven't already.`,
        categoryIdentifier: 'medication',
        sound: true,
        data: { medId: med.id, medName: med.name, type: 'missed' },
      },
      trigger: null, // immediate
    });
  }

  /**
   * Schedule personalized hydration reminders spread across the user's waking hours.
   */
  async scheduleHydrationReminders(prefs: NotificationPreferences = DEFAULT_PREFS) {
    if (Platform.OS === 'web') return;

    const count = prefs.hydrationCount ?? 3;
    if (count <= 0) return;

    const wakeUp = prefs.wakeUpHour ?? 8;
    const sleep = prefs.sleepHour ?? 22;
    const awakeHours = sleep - wakeUp;

    // Spread reminders evenly across waking hours (skip first hour)
    const interval = Math.floor(awakeHours / (count + 1));
    const name = prefs.userName || '';

    for (let i = 1; i <= count; i++) {
      const hour = wakeUp + (interval * i);
      if (hour >= sleep) break;

      await Notifications.scheduleNotificationAsync({
        identifier: `hydration_${hour}`,
        content: {
          title: '💧 Hydration Reminder',
          body: pickRandom(HYDRATION_MESSAGES)(name),
          sound: true,
        },
        trigger: {
          hour,
          minute: 0,
          repeats: true,
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
        } as Notifications.DailyTriggerInput,
      });
    }
  }

  /**
   * Personalized night routine reminder at the user's configured sleep time.
   */
  async setNightRoutineReminder(prefs: NotificationPreferences = DEFAULT_PREFS) {
    if (Platform.OS === 'web') return;
    if (!prefs.enableNightRoutine) return;

    const name = prefs.userName || '';
    const sleepHour = prefs.sleepHour ?? 22;

    await Notifications.scheduleNotificationAsync({
      identifier: 'night_routine',
      content: {
        title: '🌙 Night Routine',
        body: pickRandom(NIGHT_MESSAGES)(name),
        sound: true,
      },
      trigger: {
        hour: sleepHour,
        minute: 0,
        repeats: true,
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
      } as Notifications.DailyTriggerInput,
    });
  }

  /**
   * Personalized morning wellness check at the user's configured wake-up time.
   */
  async setMorningWellnessNotification(prefs: NotificationPreferences = DEFAULT_PREFS) {
    if (Platform.OS === 'web') return;
    if (!prefs.enableMorningBriefing) return;

    const name = prefs.userName || '';
    const wakeHour = (prefs.wakeUpHour ?? 8) + 1; // 1 hour after wake-up

    await Notifications.scheduleNotificationAsync({
      identifier: 'morning_wellness',
      content: {
        title: '☀️ Good Morning!',
        body: pickRandom(MORNING_GREETINGS)(name),
        sound: true,
      },
      trigger: {
        hour: wakeHour,
        minute: 0,
        repeats: true,
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
      } as Notifications.DailyTriggerInput,
    });
  }

  /**
   * Sends a highly personalized, context-aware notification.
   */
  async sendPersonalizedNotification(userId: string, type: 'MED_REMINDER' | 'MED_MISSED' | 'HEALTH_TIP' | 'DAILY_SUMMARY', params: any = {}) {
    if (Platform.OS === 'web') return;

    const prefs = DEFAULT_PREFS; // In a real app, fetch from storage/backend
    const name = prefs.userName || '';
    const hour = new Date().getHours();
    
    let greeting = '';
    if (hour < 12) greeting = pickRandom(MORNING_GREETINGS)(name);
    else if (hour > 18) greeting = pickRandom(NIGHT_MESSAGES)(name);
    else greeting = `Hello${name ? `, ${name}` : ''}!`;

    let title = "ElderConnect";
    let body = "";
    const { medName, dosage } = params;

    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

    switch (type) {
      case 'MED_REMINDER':
        const medMsgs = [
          `It's time for your ${medName} (${dosage}).`,
          `Time to take your ${medName}. A healthy habit is a happy life!`,
          `Remembering your ${medName} (${dosage}) helps you stay strong.`
        ];
        title = "Time for Medication";
        body = `${greeting} ${pick(medMsgs)}`;
        break;
      case 'MED_MISSED':
        const missedMsgs = [
          `I noticed you missed your ${medName}. Let's take it now to stay on track.`,
          `Your ${medName} is waiting for you! It's important for your health.`,
          `A quick reminder for your ${medName}—don't forget to log it when you're done.`
        ];
        title = "Medication Reminder";
        body = `${greeting} ${pick(missedMsgs)}`;
        break;
      case 'HEALTH_TIP':
        const tips = [
          "Remember to stay hydrated today! A glass of water can work wonders.",
          "A short 10-minute walk can boost your energy levels.",
          "Deep breathing for a few minutes helps keep the mind calm."
        ];
        title = "Daily Health Tip";
        body = `${greeting} ${pick(tips)}`;
        break;
      case 'DAILY_SUMMARY':
        const summaryMsgs = [
          `You've had a productive day! Take a moment to reflect on your health wins.`,
          `Great job staying on top of your health today. Have a restful evening!`,
          `Your daily summary is ready. You're doing great with your routine!`
        ];
        title = "Daily Health Summary";
        body = `${greeting} ${pick(summaryMsgs)}`;
        break;
      default:
        body = `${greeting} Hope you're having a wonderful day.`;
    }

    await this.triggerNotification(title, body, type === 'MED_REMINDER' || type === 'MED_MISSED' ? 'medication' : 'health');
  }

  async clearAll() {
    if (Platform.OS !== 'web') {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  }
}

export const notificationService = new NotificationService();
