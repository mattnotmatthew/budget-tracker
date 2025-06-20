/**
 * Feature Flag Test Component
 *
 * This component can be temporarily added to your app to test
 * that feature flags and planning data models are working correctly.
 * Remove after testing.
 */

import React from "react";
import {
  isFeatureEnabled,
  useFeatureFlag,
  logFeatureFlags,
} from "../utils/featureFlags";
import { useBudget } from "../context/BudgetContext";
import { createPlanningData } from "../utils/planningUtils";
import { getNextPlanningYear, getDefaultBaseYear } from "../utils/yearUtils";

export const FeatureFlagTest: React.FC = () => {
  const planningEnabled = useFeatureFlag("BUDGET_PLANNING");
  const { state, isPlanningEnabled, setPlanningData, getCurrentPlanningData } =
    useBudget();

  // Log feature flags on component mount (development only)
  React.useEffect(() => {
    logFeatureFlags();
  }, []);
  // Calculate next planning year dynamically
  const nextPlanningYear = getNextPlanningYear(); // Always plan for next year
  const basePlanningYear = getDefaultBaseYear(); // Base it on current year data

  // Test planning data creation
  const handleCreateTestPlanningData = () => {
    if (!isPlanningEnabled()) {
      alert("Planning feature is not enabled");
      return;
    }

    try {
      const testPlanningData = createPlanningData(
        nextPlanningYear,
        basePlanningYear,
        state.categories,
        state.entries,
        "trend-based"
      );

      setPlanningData(nextPlanningYear, testPlanningData);

      // Log the created data to console for inspection
      console.log("📋 Planning Data Created:", testPlanningData);
      console.log("📊 Scenarios:", testPlanningData.scenarios);
      console.log("🏷️ Categories:", testPlanningData.categories);

      alert(
        `Test planning data created successfully for ${nextPlanningYear}! Check browser console for details.`
      );
    } catch (error) {
      console.error("Error creating planning data:", error);
      alert("Error creating planning data");
    }
  };
  const currentPlanningData = getCurrentPlanningData();
  // Add function to inspect all planning data
  const handleInspectPlanningData = () => {
    console.log("=== PLANNING DATA INSPECTION ===");
    console.log("📊 Full planning data object:", state.planningData);
    console.log(
      "📅 Available years:",
      state.planningData ? Object.keys(state.planningData) : "None"
    );
    console.log("🎯 Current year planning data:", currentPlanningData);
    console.log("🔢 Selected year:", state.selectedYear);

    if (currentPlanningData) {
      console.log("--- DETAILED BREAKDOWN ---");
      console.log(
        "Scenarios:",
        currentPlanningData.scenarios.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          isActive: s.isActive,
          assumptions: s.assumptions,
        }))
      );
      console.log("Active Scenario ID:", currentPlanningData.activeScenarioId);
      console.log(
        "Planning Categories:",
        currentPlanningData.categories.map((c) => ({
          categoryId: c.categoryId,
          planningMethod: c.planningMethod,
          monthlyValuesLength: c.monthlyValues.length,
          monthlyValues: c.monthlyValues,
          assumptions: c.assumptions,
          notes: c.notes,
        }))
      );
      console.log("Global Assumptions:", currentPlanningData.globalAssumptions);
      console.log("Metadata:", currentPlanningData.metadata);
    }

    alert(
      "Planning data inspection complete! Check browser console for detailed breakdown."
    );
  };

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
      <h3>🎛️ Feature Flag & Planning Test</h3>
      <div style={{ marginBottom: "1rem" }}>
        <h4>Feature Flags:</h4>
        <p>
          <strong>Planning Feature:</strong>{" "}
          {planningEnabled ? "✅ ENABLED" : "❌ DISABLED"}
        </p>{" "}
        <p>
          <strong>Scenarios Feature:</strong>{" "}
          {isFeatureEnabled("PLANNING_SCENARIOS")
            ? "✅ ENABLED"
            : "❌ DISABLED"}
        </p>
        <p>
          <strong>AI Suggestions:</strong>{" "}
          {isFeatureEnabled("PLANNING_AI_SUGGESTIONS")
            ? "✅ ENABLED"
            : "❌ DISABLED"}
        </p>
      </div>
      {planningEnabled && (
        <div style={{ marginBottom: "1rem" }}>
          <h4>Planning State:</h4>
          <p>
            <strong>Planning Mode:</strong>{" "}
            {state.planningMode ? "✅ ON" : "❌ OFF"}
          </p>
          <p>
            <strong>Selected Year:</strong> {state.selectedYear}
          </p>
          <p>
            <strong>Planning Data:</strong>{" "}
            {currentPlanningData ? "✅ EXISTS" : "❌ NONE"}
          </p>{" "}
          {currentPlanningData && (
            <div style={{ fontSize: "0.875rem", color: "#666" }}>
              <p>• Scenarios: {currentPlanningData.scenarios.length}</p>
              <p>• Categories: {currentPlanningData.categories.length}</p>
              <p>• Active Scenario: {currentPlanningData.activeScenarioId}</p>
              <p>• Planning Year: {currentPlanningData.year}</p>
              <p>• Based on Year: {currentPlanningData.basedOnYear}</p>
              <p>• Primary Method: {currentPlanningData.method}</p>

              <details style={{ marginTop: "0.5rem" }}>
                <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
                  📋 View Planning Data Summary
                </summary>
                <div
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.5rem",
                    backgroundColor: "#f0f0f0",
                    borderRadius: "4px",
                  }}
                >
                  <h5>Scenarios:</h5>
                  {currentPlanningData.scenarios.map((scenario) => (
                    <div key={scenario.id} style={{ marginBottom: "0.25rem" }}>
                      • {scenario.name} {scenario.isActive ? "(Active)" : ""}
                    </div>
                  ))}

                  <h5 style={{ marginTop: "0.5rem" }}>Category Planning:</h5>
                  {currentPlanningData.categories.slice(0, 3).map((cat) => (
                    <div
                      key={cat.categoryId}
                      style={{ marginBottom: "0.25rem", fontSize: "0.8rem" }}
                    >
                      • Category {cat.categoryId}: {cat.planningMethod}
                      (Total: $
                      {cat.monthlyValues
                        .reduce((sum, val) => sum + val, 0)
                        .toLocaleString()}
                      )
                    </div>
                  ))}
                  {currentPlanningData.categories.length > 3 && (
                    <div style={{ fontSize: "0.8rem", fontStyle: "italic" }}>
                      ...and {currentPlanningData.categories.length - 3} more
                      categories
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}
        </div>
      )}{" "}
      {planningEnabled && (
        <div style={{ marginBottom: "1rem" }}>
          <button
            onClick={handleCreateTestPlanningData}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginRight: "0.5rem",
            }}
          >
            Create Test Planning Data ({nextPlanningYear})
          </button>

          <button
            onClick={handleInspectPlanningData}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#059669",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Inspect Planning Data
          </button>
        </div>
      )}
      <div style={{ fontSize: "0.875rem", color: "#666" }}>
        <p>
          <strong>To test:</strong>
        </p>
        <ul>
          <li>
            Set <code>REACT_APP_ENABLE_PLANNING=true</code> in{" "}
            <code>.env.local</code>
          </li>
          <li>
            Restart the app with <code>npm run start:planning</code>
          </li>
          <li>Planning feature should show as ENABLED</li>
          <li>
            Click "Create Test Planning Data" to test data model for{" "}
            {nextPlanningYear}
          </li>
          <li>Planning will be based on {basePlanningYear} data</li>
        </ul>
      </div>
    </div>
  );
};

export default FeatureFlagTest;
