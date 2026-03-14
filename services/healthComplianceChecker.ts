import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from './notificationService';

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
    // Extremely crucial constraint:
    // User already completed task. Kill the 8PM scheduled push notification natively.
    await notificationService.cancelDailyHealthReminder();
  }

  /**
   * Detects extensive lack of interaction
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
   * Ensures seniors are interacting with Caregivers directly combating loneliness
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
