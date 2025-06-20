/**
 * Feature Flag Test Component
 *
 * This component can be temporarily added to your app to test
 * that feature flags are working correctly. Remove after testing.
 */

import React from "react";
import {
  isFeatureEnabled,
  useFeatureFlag,
  logFeatureFlags,
} from "../utils/featureFlags";

export const FeatureFlagTest: React.FC = () => {
  const planningEnabled = useFeatureFlag("BUDGET_PLANNING_2026");

  // Log feature flags on component mount (development only)
  React.useEffect(() => {
    logFeatureFlags();
  }, []);

  return (
    <div
      style={{
        padding: "1rem",
        margin: "1rem",
        border: "2px solid #ccc",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
      }}
    >
      <h3>🎛️ Feature Flag Test</h3>
      <p>
        <strong>Planning Feature:</strong>{" "}
        {planningEnabled ? "✅ ENABLED" : "❌ DISABLED"}
      </p>
      <p>
        <strong>Scenarios Feature:</strong>{" "}
        {isFeatureEnabled("PLANNING_SCENARIOS") ? "✅ ENABLED" : "❌ DISABLED"}
      </p>
      <p>
        <strong>AI Suggestions:</strong>{" "}
        {isFeatureEnabled("PLANNING_AI_SUGGESTIONS")
          ? "✅ ENABLED"
          : "❌ DISABLED"}
      </p>

      <div style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#666" }}>
        <p>
          <strong>To test:</strong>
        </p>
        <ul>
          <li>
            Set <code>REACT_APP_ENABLE_PLANNING=true</code> in{" "}
            <code>.env.local</code>
          </li>
          <li>Restart the app</li>
          <li>Planning feature should show as ENABLED</li>
        </ul>
      </div>
    </div>
  );
};

export default FeatureFlagTest;
