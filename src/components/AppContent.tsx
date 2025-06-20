import React from "react";
import { useBudget } from "../context/BudgetContext";
import { isFeatureEnabled } from "../utils/featureFlags";
import FirstTimeSetup from "../components/FirstTimeSetup/FirstTimeSetup";
import PersistenceIndicator from "../components/PersistenceIndicator";
import Dashboard from "../components/Dashboard";
import ExecutiveSummary from "../components/ExecutiveSummary/ExecutiveSummary";
import PlanningDashboard from "../components/Planning/PlanningDashboard";
import PlanningCategories from "../components/Planning/PlanningCategories";
import ScenarioManagement from "../components/Planning/PlanningScenarios";
import FeatureFlagTest from "../components/FeatureFlagTest"; // ADD THIS LINE
import { BrowserRouter, Routes, Route } from "react-router-dom";

const AppContent: React.FC = () => {
  const { state, loadFromFile, createNewFile, dispatch } = useBudget();

  const handleLoadFromFile = async (): Promise<void> => {
    await loadFromFile();
  };

  const handleCreateNewFile = async (): Promise<void> => {
    await createNewFile();
  };

  const handleSkipForNow = (): void => {
    dispatch({ type: "SET_FIRST_TIME_USER", payload: false });
  };

  // Show first-time setup if user is new
  if (state.persistence.isFirstTimeUser) {
    return (
      <FirstTimeSetup
        onLoadFromFile={handleLoadFromFile}
        onCreateNewFile={handleCreateNewFile}
        onSkipForNow={handleSkipForNow}
      />
    );
  } // Show main application
  return (
    <BrowserRouter>
      <div className="App">
        <header className="app-header">
          <h1>Budget vs Actual Tracker 2025</h1>
        </header>

        <main className="app-main">
          <Routes>
            {/* Existing routes - UNCHANGED */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/executive-summary" element={<ExecutiveSummary />} />
            {/* NEW: Planning routes (feature-flagged) */}
            {isFeatureEnabled("BUDGET_PLANNING") && (
              <>
                {" "}
                <Route path="/planning" element={<PlanningDashboard />} />
                <Route
                  path="/planning/dashboard"
                  element={<PlanningDashboard />}
                />
                <Route
                  path="/planning/categories"
                  element={<PlanningCategories />}
                />
                <Route
                  path="/planning/scenarios"
                  element={<ScenarioManagement />}
                />
              </>
            )}
          </Routes>
        </main>
        <PersistenceIndicator />
      </div>
    </BrowserRouter>
  );
};

export default AppContent;
