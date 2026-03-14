import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../services/notificationService';
import { healthComplianceChecker } from '../services/healthComplianceChecker';

export function useNotificationScheduler(preferences: { enabled: boolean; maxDaily: number }) {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!preferences.enabled) {
      notificationService.clearAll();
      return;
    }

    const setupRoutines = async () => {
      // Clean start to override potential stale daily routines
      await notificationService.clearAll();

      // Enqueue static predictable daytime checks
      await notificationService.scheduleHydrationReminders();
      await notificationService.setMorningWellnessNotification();
      await notificationService.setNightRoutineReminder();

      // Schedules the 8:00 PM health reminder natively.
      // (This will be cancelled automatically if healthComplianceChecker.logVitals() is triggered earlier)
      await notificationService.scheduleDailyHealthReminder();

      // Mock DB pull: Setting generic meds times
      await notificationService.scheduleMedicationAlerts([
        { id: "med_morn", time: { hour: 8, minute: 30 }, name: "Morning Vitamins" },
        { id: "med_eve", time: { hour: 20, minute: 30 }, name: "Evening Medicine" }
      ]);
    };

    setupRoutines();

    // Check dynamic rules based on active app state
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      // App opened -> logged physical interaction
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        await healthComplianceChecker.logActivity();
      }

      // App closed/backgrounded -> Simulate smart offline/inactivity rule verification dynamically
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        const isSocial = await healthComplianceChecker.checkSocialInteraction();
        const socialMissedLimit = 1; // Assuming we want isolated triggers

        if (!isSocial) {
           await notificationService.triggerNotification(
             'Stay Connected',
             'Would you like to call or message your family today?',
             'social'
           );
           // Prevent multiple immediate triggers
           await healthComplianceChecker.logSocialInteraction();
        }

        const isInactive = await healthComplianceChecker.checkInactivity();
        if (isInactive) {
            await notificationService.triggerNotification(
                'Inactivity Alert',
                "You've been inactive for a while. A short walk or stretch can help keep you healthy."
            );
            await healthComplianceChecker.logActivity(); // Re-baseline to avoid spam
        }
      }
      appState.current = nextAppState;
    });

    // Handle user interacting with push overlays and customized categorizations
    const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
       const actionIdentifier = response.actionIdentifier;
       
       if (actionIdentifier === 'snooze') {
           // Reschedule identical missed notification 10 minutes logically via timeouts
           setTimeout(async () => {
               await notificationService.triggerNotification(
                 'Medication Missed', 
                 'You may have missed your medication. Please check your schedule.', 
                 'medication'
               );
           }, 10 * 60 * 1000); // 10 minutes
           
       } else if (actionIdentifier === 'confirm') {
           // Automatically log health compliance
           healthComplianceChecker.logVitals();
       } else if (actionIdentifier === 'call') {
           // Could deep link into the /videocall router
       }
    });

    return () => {
      subscription.remove();
      responseSub.remove();
    };
  }, [preferences.enabled]);

  return {
    triggerSafetyAlert: (msg: string) => {
      notificationService.triggerNotification('Safety Alert', msg, 'safety');
    },
    triggerDeviceBattery: () => {
      notificationService.triggerNotification('Device Battery Low', 'Your fall detection device battery is low. Please charge it to stay protected.', 'system');
    },
    triggerHealthTrendAlert: () => {
      notificationService.triggerNotification('Health Alert', 'Your recent blood pressure readings are higher than usual. Consider contacting your caregiver.', 'health');
    }
  };
}
