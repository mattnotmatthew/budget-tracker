/**
 * Feature Flag System for Budget Tracker
 *
 * This utility provides a centralized way to control feature availability
 * using environment variables. Features can be enabled/disabled without
 * code changes by setting environment variables.
 */

// Feature flag configuration
export const FEATURE_FLAGS = {
  BUDGET_PLANNING_2026: process.env.REACT_APP_ENABLE_PLANNING === "true",
  PLANNING_SCENARIOS: process.env.REACT_APP_ENABLE_SCENARIOS === "true",
  PLANNING_AI_SUGGESTIONS:
    process.env.REACT_APP_ENABLE_AI_SUGGESTIONS === "true",
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Check if a specific feature flag is enabled
 * @param flag - The feature flag to check
 * @returns true if the feature is enabled, false otherwise
 */
export const isFeatureEnabled = (flag: FeatureFlag): boolean => {
  return FEATURE_FLAGS[flag] || false;
};

/**
 * React hook for accessing feature flags
 * @param flag - The feature flag to check
 * @returns true if the feature is enabled, false otherwise
 */
export const useFeatureFlag = (flag: FeatureFlag): boolean => {
  // Note: Since feature flags are environment-based and don't change during runtime,
  // we don't need useState or useEffect here. The value is static per session.
  return isFeatureEnabled(flag);
};

/**
 * Get all enabled features (useful for debugging/logging)
 * @returns Object with all feature flags and their current state
 */
export const getAllFeatureFlags = (): Record<FeatureFlag, boolean> => {
  return { ...FEATURE_FLAGS };
};

/**
 * Development helper: Log all feature flag states to console
 * Only runs in development mode
 */
export const logFeatureFlags = (): void => {
  if (process.env.NODE_ENV === "development") {
    console.group("🎛️ Feature Flags");
    Object.entries(FEATURE_FLAGS).forEach(([flag, enabled]) => {
      console.log(`${flag}: ${enabled ? "✅ ENABLED" : "❌ DISABLED"}`);
    });
    console.groupEnd();
  }
};
