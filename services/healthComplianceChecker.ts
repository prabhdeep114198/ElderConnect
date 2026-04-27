import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService, MedicationAlert } from './notificationService';

const MED_TAKEN_PREFIX = 'med_taken_';

class HealthComplianceChecker {
  /**
   * Evaluates if vitals have been logged today.
   */
  async checkVitalsCompliance(): Promise<boolean> {
    try {
      const lastVitalsLog = await AsyncStorage.getItem('last_vitals_logged');
      if (!lastVitalsLog) return false;
      const isToday = new Date(lastVitalsLog).toDateString() === new Date().toDateString();
      return isToday;
    } catch (e) {
      return false;
    }
  }

  /**
   * Logs a health event and dynamically strips away scheduled adherence notifications 
   * to avoid pinging the user since they already took action.
   */
  async logVitals() {
    await AsyncStorage.setItem('last_vitals_logged', new Date().toISOString());
    // User already completed task. Kill the scheduled push notification natively.
    await notificationService.cancelDailyHealthReminder();
  }

  /**
   * Check if a SPECIFIC medication has been marked as taken today.
   */
  async isMedicationTakenToday(medId: string): Promise<boolean> {
    try {
      const key = `${MED_TAKEN_PREFIX}${medId}`;
      const lastTaken = await AsyncStorage.getItem(key);
      if (!lastTaken) return false;
      return new Date(lastTaken).toDateString() === new Date().toDateString();
    } catch (e) {
      return false;
    }
  }

  /**
   * Mark a specific medication as taken right now.
   */
  async logMedicationTaken(medId: string) {
    const key = `${MED_TAKEN_PREFIX}${medId}`;
    await AsyncStorage.setItem(key, new Date().toISOString());
  }

  /**
   * Check all given medications and trigger missed notifications for any not taken
   * past their scheduled time.
   */
  async checkMissedMedications(medications: MedicationAlert[]): Promise<string[]> {
    const missed: string[] = [];
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const med of medications) {
      const schedMinutes = med.time.hour * 60 + med.time.minute;
      // Grace period: 30 minutes past scheduled time
      if (currentMinutes > schedMinutes + 30) {
        const taken = await this.isMedicationTakenToday(med.id);
        if (!taken) {
          missed.push(med.name);
          await notificationService.triggerMissedMedNotification(med);
        }
      }
    }

    return missed;
  }

  /**
   * Detects extensive lack of interaction.
   */
  async checkInactivity(): Promise<boolean> {
    const lastActivity = await AsyncStorage.getItem('last_user_activity');
    if (!lastActivity) return true;
    const diffHours = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);
    // Rule: More than 3 hours since touching screen
    return diffHours >= 3;
  }

  async logActivity() {
    await AsyncStorage.setItem('last_user_activity', new Date().toISOString());
  }

  /**
   * Ensures seniors are interacting with caregivers — combats loneliness.
   */
  async checkSocialInteraction(): Promise<boolean> {
    const lastSocial = await AsyncStorage.getItem('last_social_interaction');
    if (!lastSocial) return false;
    const diffHours = (Date.now() - new Date(lastSocial).getTime()) / (1000 * 60 * 60);
    // Rule: Must be less than 24 hours
    return diffHours < 24;
  }

  async logSocialInteraction() {
    await AsyncStorage.setItem('last_social_interaction', new Date().toISOString());
  }
}

export const healthComplianceChecker = new HealthComplianceChecker();
