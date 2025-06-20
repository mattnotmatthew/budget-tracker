/**
 * Planning Categories Component - Phase 2.2
 *
 * This is a shell component for managing planning categories.
 * It will be expanded in Phase 3 with actual category management functionality.
 *
 * Current Status: Shell implementation with route guards
 * Future: Will contain category-specific planning UI
 */

import React from "react";
import { Navigate, Link } from "react-router-dom";
import { useBudget } from "../../context/BudgetContext";
import { isFeatureEnabled } from "../../utils/featureFlags";
import { isValidPlanningYear } from "../../utils/yearUtils";

const PlanningCategories: React.FC = () => {
  const { state } = useBudget();

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

  return (
    <div className="planning-categories">
      {/* Navigation Breadcrumb */}
      <div className="planning-breadcrumb">
        <Link to="/planning" className="breadcrumb-link">
          📋 Planning Dashboard
        </Link>
        <span className="breadcrumb-separator"> / </span>
        <span className="breadcrumb-current">📊 Categories</span>
      </div>

      {/* Header */}
      <div className="planning-header">
        <h1>📊 Planning Categories - {state.selectedYear}</h1>
        <div className="planning-mode-badge">Planning Mode Active</div>
      </div>

      {/* Categories Content */}
      {currentPlanningData ? (
        <div className="categories-content">
          <div className="categories-summary">
            <h3>Category Overview</h3>
            <p>
              <strong>Total Categories:</strong>{" "}
              {currentPlanningData.categories.length}
            </p>
            <p>
              <strong>Planning Method:</strong> {currentPlanningData.method}
            </p>
          </div>

          <div className="categories-list">
            <h3>Available Categories</h3>{" "}
            {currentPlanningData.categories.length > 0 ? (
              <div className="category-items">
                {currentPlanningData.categories.map((category, index) => (
                  <div key={index} className="category-item">
                    <span className="category-name">
                      Category ID: {category.categoryId}
                    </span>
                    <span className="category-method">
                      Method: {category.planningMethod}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p>
                No categories defined yet. Categories will be available in Phase
                3.
              </p>
            )}
          </div>

          <div className="categories-actions">
            <button className="btn btn-primary" disabled>
              ➕ Add Category (Phase 3)
            </button>
            <button className="btn btn-secondary" disabled>
              ⚙️ Configure Categories (Phase 3)
            </button>
          </div>
        </div>
      ) : (
        <div className="categories-no-data">
          <div className="no-data-card">
            <h3>No Planning Data Available</h3>
            <p>
              Planning data for {state.selectedYear} hasn't been created yet.
              Return to the planning dashboard to set up your planning data.
            </p>
            <Link to="/planning" className="btn btn-primary">
              🔙 Back to Planning Dashboard
            </Link>
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
        <h4>🔧 Development Status</h4>
        <p>
          <strong>Phase 2.2:</strong> Categories shell with route guards and
          navigation
        </p>
        <p>
          <strong>Route Protection:</strong> Feature flag and year validation
          active
        </p>
        <p>
          <strong>Next Phase:</strong> Category management and planning tools
        </p>
      </div>
    </div>
  );
};

export default PlanningCategories;
