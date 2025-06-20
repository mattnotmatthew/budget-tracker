/**
 * Planning Dashboard Component - Phase 2.2
 *
 * This is a basic shell component for the planning dashboard.
 * It serves as the main view when users select a planning year.
 *
 * Current Status: Shell implementation with route guards
 * Future: Will contain planning-specific UI components
 */

import React, { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useBudget } from "../../context/BudgetContext";
import { isFeatureEnabled } from "../../utils/featureFlags";
import { isValidPlanningYear } from "../../utils/yearUtils";
import PlanningSetupWizard from "./PlanningSetupWizard";

const PlanningDashboard: React.FC = () => {
  const { state } = useBudget();
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  // Route guard: Only render if planning feature is enabled
  if (!isFeatureEnabled("BUDGET_PLANNING")) {
    console.warn(
      "Planning feature is disabled - redirecting to main dashboard"
    );
    return <Navigate to="/" replace />;
  }

  // Route guard: Only render if we're in a valid planning year
  if (!isValidPlanningYear(state.selectedYear)) {
    console.warn(
      `Year ${state.selectedYear} is not a valid planning year - redirecting to main dashboard`
    );
    return <Navigate to="/" replace />;
  }

  const currentPlanningData = state.planningData?.[state.selectedYear];

  // Show setup wizard if requested or no planning data exists
  if (showSetupWizard || !currentPlanningData) {
    return <PlanningSetupWizard />;
  }

  return (
    <div className="planning-dashboard">
      {/* Header */}
      <div className="planning-header">
        <h1>📋 Planning Dashboard - {state.selectedYear}</h1>
        <div className="planning-mode-badge">Planning Mode Active</div>
      </div>

      {/* Planning Status */}
      <div className="planning-status">
        <div className="status-card">
          <h3>Planning Status</h3>
          <p>
            <strong>Planning Year:</strong> {state.selectedYear}
          </p>
          <p>
            <strong>Base Year:</strong> {state.selectedYear - 1}
          </p>
          <p>
            <strong>Planning Data:</strong>{" "}
            {currentPlanningData ? "✅ Available" : "❌ Not Created"}
          </p>
          {currentPlanningData && (
            <>
              <p>
                <strong>Scenarios:</strong>{" "}
                {currentPlanningData.scenarios.length}
              </p>
              <p>
                <strong>Categories:</strong>{" "}
                {currentPlanningData.categories.length}
              </p>
              <p>
                <strong>Planning Method:</strong> {currentPlanningData.method}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Planning Actions */}
      <div className="planning-actions">
        <div className="action-card">
          <h3>Quick Actions</h3>{" "}
          <div className="action-buttons">
            <Link
              to="/planning/categories"
              className={`btn btn-primary ${
                !currentPlanningData ? "btn-disabled" : ""
              }`}
              title={
                !currentPlanningData
                  ? "Create planning data first"
                  : "View planning categories"
              }
            >
              📊 View Categories
            </Link>{" "}
            <Link
              to="/planning/scenarios"
              className={`btn btn-secondary ${
                !currentPlanningData ? "btn-disabled" : ""
              }`}
              title={
                !currentPlanningData
                  ? "Create planning data first"
                  : "Manage scenarios"
              }
            >
              🎯 Scenarios
            </Link>
            <button
              className="btn btn-secondary"
              onClick={() => setShowSetupWizard(true)}
              title="Reconfigure planning settings"
            >
              ⚙️ Setup Wizard
            </button>
          </div>
        </div>
      </div>

      {/* Planning Data Creation */}
      {!currentPlanningData && (
        <div className="planning-setup">
          <div className="setup-card">
            <h3>🚀 Get Started with Planning</h3>
            <p>
              No planning data found for {state.selectedYear}. Use the Feature
              Flag Test component to create initial planning data, or planning
              tools will be available in future phases.
            </p>
            <div className="setup-info">
              <p>
                <strong>Next Steps:</strong>
              </p>
              <ul>
                <li>Use "Create Test Planning Data" from the test component</li>
                <li>Planning tools will be available in Phase 3</li>
                <li>
                  Switch back to {state.selectedYear - 1} for tracking mode
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Development Info */}
      <div
        className="dev-info"
        style={{
          marginTop: "2rem",
          padding: "1rem",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
          fontSize: "0.875rem",
          color: "#666",
        }}
      >
        {" "}
        <h4>🔧 Development Status</h4>
        <p>
          <strong>Phase 3.1:</strong> Planning setup wizard and data creation
          tools implemented
        </p>
        <p>
          <strong>New Features:</strong> Comprehensive planning data setup with
          method selection
        </p>
        <p>
          <strong>Next Phase:</strong> Scenario management and planning
          calculations
        </p>
      </div>
    </div>
  );
};

export default PlanningDashboard;
