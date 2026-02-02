import { useFlags } from "react-native-flagsmith/react";
import { useAuth } from "../context/AuthContext";

/**
 * Custom hook that wraps useFlags to ensure flags are only enabled for subscribed users.
 * Returns all flags as false if user doesn't have a valid subscription.
 * 
 * @param flagKeys - Array of flag keys to retrieve
 * @returns Object with flag values, all false if user doesn't have subscription
 */
export const useFeatureFlags = (flagKeys: string[]) => {
  const { user } = useAuth();
  const flags = useFlags(flagKeys);

  // Check if user has valid subscription
  const hasValidSubscription = user?.isSubscribed === true || 
                               (user?.plan_level && user.plan_level !== "free");

  // If no subscription, return all flags as false
  if (!hasValidSubscription) {
    const defaultFlags: Record<string, { enabled: boolean; value: any }> = {};
    flagKeys.forEach(key => {
      defaultFlags[key] = { enabled: false, value: null };
    });
    return defaultFlags;
  }

  // User has subscription - return actual flags from Flagsmith
  return flags;
};

/**
 * Helper function to check if a specific feature flag is enabled.
 * Automatically returns false if user doesn't have subscription.
 * 
 * @param flagKey - The flag key to check
 * @returns boolean indicating if the feature is enabled
 */
export const useFeatureFlag = (flagKey: string): boolean => {
  const flags = useFeatureFlags([flagKey]);
  return flags[flagKey]?.enabled ?? false;
};
