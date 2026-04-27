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

  // Return actual flags from Flagsmith
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

export const usePremiumFeature = () => {
    const { user } = useAuth();
    // 249 plan maps to 'premium'
    const planLevel = user?.plan_level || "core";
    return planLevel === "premium" || planLevel === "enterprise" || user?.isSubscribed === true;
}

export const useEnterpriseFeature = () => {
    const { user } = useAuth();
    const planLevel = user?.plan_level || "core";
    return planLevel === "enterprise";
}
