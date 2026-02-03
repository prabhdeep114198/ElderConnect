/**
 * User-scoped AsyncStorage keys.
 * All user-specific data must use these keys to prevent data leakage between users.
 */
export const getDiaryKey = (userId: string) => `user_diary_entries_${userId}`;
export const getProfileKey = (userId: string) => `user_profile_data_${userId}`;
export const getTicketsKey = (userId: string) => `user_tickets_${userId}`;
export const getHealthMetricsKey = (userId: string) => `health_metrics_${userId}`;
export const getVitalSignsKey = (userId: string) => `vital_signs_${userId}`;
export const getRemindersKey = (userId: string) => `reminders_${userId}`;

/** Legacy keys (no userId) - for migration fallback. Prefer scoped keys. */
export const LEGACY_KEYS = {
  diary: 'user_diary_entries',
  profile: 'user_profile_data',
  tickets: 'user_tickets',
  healthMetrics: 'health_metrics',
  vitalSigns: 'vital_signs',
  reminders: 'reminders',
};
