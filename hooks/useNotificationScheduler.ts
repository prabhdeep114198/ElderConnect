import { useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService, MedicationAlert, NotificationPreferences } from '../services/notificationService';
import { healthComplianceChecker } from '../services/healthComplianceChecker';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/api/profile';

const NOTIFICATION_PREFS_KEY = 'elderconnect_notification_prefs';
const LAST_MED_SYNC_KEY = 'elderconnect_last_med_sync';

/**
 * Parse a time string like "08:30 AM" or "20:30" into { hour, minute }.
 */
function parseTimeString(time: string): { hour: number; minute: number } {
  const trimmed = time.trim();

  // Try 12-hour format: "08:30 AM"
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return { hour: h, minute: m };
  }

  // Try 24-hour format: "20:30"
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return { hour: parseInt(match24[1], 10), minute: parseInt(match24[2], 10) };
  }

  // Fallback
  return { hour: 8, minute: 0 };
}

/**
 * Convert backend medication data into MedicationAlert[] for scheduling.
 */
function mapMedicationsToAlerts(medications: any[]): MedicationAlert[] {
  const alerts: MedicationAlert[] = [];

  for (const med of medications) {
    const times: string[] = Array.isArray(med.schedule)
      ? med.schedule
      : med.schedule
        ? Object.values(med.schedule)
        : ['08:00 AM'];

    for (let i = 0; i < times.length; i++) {
      alerts.push({
        id: `${med.id}_${i}`,
        time: parseTimeString(times[i]),
        name: med.name,
        dosage: med.dosage || undefined,
        instructions: med.instructions || undefined,
      });
    }
  }

  return alerts;
}

export function useNotificationScheduler(preferences: { enabled: boolean; maxDaily: number }) {
  const appState = useRef(AppState.currentState);
  const { user } = useAuth();
  const setupDoneRef = useRef(false);

  /**
   * Load saved notification preferences or build defaults from user data.
   */
  const getNotificationPrefs = useCallback(async (): Promise<NotificationPreferences> => {
    try {
      const saved = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Always update the user's name from the latest session
        if (user?.name) parsed.userName = user.name.split(' ')[0]; // First name only
        return parsed;
      }
    } catch (e) {
      console.log('[NotifScheduler] Failed to load prefs, using defaults');
    }

    // Build defaults from user profile
    return {
      userName: user?.name?.split(' ')[0] || '',
      wakeUpHour: 8,
      sleepHour: 22,
      hydrationCount: 3,
      enableMorningBriefing: true,
      enableNightRoutine: true,
      enableHealthReminder: true,
      medications: [],
    };
  }, [user]);

  /**
   * Fetch the user's ACTUAL medications from the backend and schedule personalized alerts.
   */
  const syncMedicationsFromBackend = useCallback(async (): Promise<MedicationAlert[]> => {
    if (!user?.id) return [];

    try {
      const response: any = await profileService.getMedications(user.id);
      if (response?.data?.medications && Array.isArray(response.data.medications)) {
        const alerts = mapMedicationsToAlerts(response.data.medications);
        await AsyncStorage.setItem(LAST_MED_SYNC_KEY, new Date().toISOString());
        return alerts;
      }
    } catch (error) {
      console.log('[NotifScheduler] Failed to fetch medications from backend:', error);
    }

    return [];
  }, [user?.id]);

  const medicationAlertsRef = useRef<MedicationAlert[]>([]);

  /**
   * Main setup: clears old notifications, fetches real data, schedules personalized ones.
   */
  const setupRoutines = useCallback(async () => {
    // Clean start
    await notificationService.clearAll();

    const prefs = await getNotificationPrefs();

    // Fetch real medications from backend
    const medications = await syncMedicationsFromBackend();
    prefs.medications = medications;
    medicationAlertsRef.current = medications;

    // Save prefs for future reference
    await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));

    // Schedule personalized notifications
    await notificationService.scheduleHydrationReminders(prefs);
    await notificationService.setMorningWellnessNotification(prefs);
    await notificationService.setNightRoutineReminder(prefs);
    await notificationService.scheduleDailyHealthReminder(prefs);

    // Schedule ACTUAL medication alerts (not hardcoded ones)
    if (medications.length > 0) {
      await notificationService.scheduleMedicationAlerts(medications);
      console.log(`[NotifScheduler] Scheduled ${medications.length} personalized medication alerts`);
    }
  }, [getNotificationPrefs, syncMedicationsFromBackend]);

  useEffect(() => {
    if (!preferences.enabled || !user) {
      notificationService.clearAll();
      setupDoneRef.current = false;
      return;
    }

    // Only run setup once per session (or when user changes)
    if (!setupDoneRef.current) {
      setupDoneRef.current = true;
      setupRoutines();
    }

    // Check dynamic rules based on app state
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      // App opened → log physical interaction
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        await healthComplianceChecker.logActivity();
      }

      // App closed/backgrounded → smart checks
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        const userName = user?.name?.split(' ')[0] || '';

        // Social isolation check
        const isSocial = await healthComplianceChecker.checkSocialInteraction();
        if (!isSocial) {
          await notificationService.triggerNotification(
            '💬 Stay Connected',
            `${userName ? `${userName}, would` : 'Would'} you like to call or message your family today?`,
            'social'
          );
          await healthComplianceChecker.logSocialInteraction();
        }

        // Inactivity check
        const isInactive = await healthComplianceChecker.checkInactivity();
        if (isInactive) {
          await notificationService.triggerNotification(
            '🚶 Movement Reminder',
            `${userName ? `${userName}, you've` : "You've"} been inactive for a while. A short walk or stretch can help keep you healthy.`
          );
          await healthComplianceChecker.logActivity();
        }
      }
      appState.current = nextAppState;
    });

    // Handle notification actions (snooze, confirm, etc.)
    const responseSub = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const actionIdentifier = response.actionIdentifier;
      const data = response.notification.request.content.data as any;

      if (actionIdentifier === 'snooze') {
        // Reschedule the SPECIFIC missed medication, not a generic one
        const medName = data?.medName || 'your medication';
        const medDosage = data?.medDosage || '';

        setTimeout(async () => {
          await notificationService.triggerMissedMedNotification({
            id: data?.medId || 'unknown',
            time: { hour: 0, minute: 0 }, // not used for immediate trigger
            name: medName,
            dosage: medDosage,
          });
        }, 10 * 60 * 1000); // 10 minutes

      } else if (actionIdentifier === 'confirm') {
        // Log compliance for the specific medication
        await healthComplianceChecker.logVitals();

        const userName = user?.name?.split(' ')[0] || '';
        const medName = data?.medName || '';
        if (medName) {
          await notificationService.triggerNotification(
            '✅ Great job!',
            `${userName ? `${userName}, ` : ''}${medName} has been marked as taken. Keep it up!`
          );
        }

      } else if (actionIdentifier === 'call') {
        // Could deep link into /videocall
      }
    });

    return () => {
      subscription.remove();
      responseSub.remove();
    };
  }, [preferences.enabled, user, setupRoutines]);

  // Periodic compliance check for missed medications (every 30 mins)
  useEffect(() => {
    if (!user?.id || !preferences.enabled) return;

    const checkMissed = async () => {
      if (medicationAlertsRef.current.length > 0) {
        await healthComplianceChecker.checkMissedMedications(medicationAlertsRef.current);
      }
    };
    
    // Initial check
    checkMissed();
    
    const interval = setInterval(checkMissed, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id, preferences.enabled]);

  // Schedule Daily Summary at 8:00 PM
  useEffect(() => {
    if (!user?.id || !preferences.enabled) return;

    const scheduleDailySummary = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(20, 0, 0, 0); // 8:00 PM

      if (now < target) {
        const delay = target.getTime() - now.getTime();
        const timeout = setTimeout(async () => {
          await notificationService.sendPersonalizedNotification(user.id!, 'DAILY_SUMMARY');
        }, delay);
        return () => clearTimeout(timeout);
      }
    };

    const cleanup = scheduleDailySummary();
    return cleanup;
  }, [user?.id, preferences.enabled]);

  return {
    triggerSafetyAlert: (msg: string) => {
      const name = user?.name?.split(' ')[0] || '';
      notificationService.triggerNotification(
        '🚨 Safety Alert',
        `${name ? `${name}, ` : ''}${msg}`,
        'safety'
      );
    },
    triggerDeviceBattery: () => {
      const name = user?.name?.split(' ')[0] || '';
      notificationService.triggerNotification(
        '🔋 Device Battery Low',
        `${name ? `${name}, your` : 'Your'} fall detection device battery is low. Please charge it to stay protected.`,
        'system'
      );
    },
    triggerHealthTrendAlert: () => {
      const name = user?.name?.split(' ')[0] || '';
      notificationService.triggerNotification(
        '📈 Health Alert',
        `${name ? `${name}, your` : 'Your'} recent blood pressure readings are higher than usual. Consider contacting your caregiver.`,
        'health'
      );
    },
    triggerMissedMedication: (med: MedicationAlert) => {
      notificationService.triggerMissedMedNotification(med);
    },
    resyncMedications: async () => {
      // Call this after adding/removing a medication to re-schedule alerts
      await setupRoutines();
    },
  };
}
