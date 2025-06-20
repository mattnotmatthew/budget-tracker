/**
 * Scenario Management Component - Phase 3.2
 *
 * This component provides comprehensive scenario management functionality.
 * Users can create, edit, delete, and switch between different planning scenarios.
 *
 * Features:
 * - View all scenarios for the current planning year
 * - Create new scenarios with custom assumptions
 * - Edit existing scenario assumptions
 * - Delete scenarios (with confirmation)
 * - Switch active scenario
 * - Scenario comparison tools
 */

import React, { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useBudget } from "../../context/BudgetContext";
import { isFeatureEnabled } from "../../utils/featureFlags";
import { isValidPlanningYear } from "../../utils/yearUtils";
import { PlanningScenario, PlanningAssumptions } from "../../types/planning";

interface ScenarioFormData {
  name: string;
  description: string;
  assumptions: PlanningAssumptions;
}

const ScenarioManagement: React.FC = () => {
  const { state, updatePlanningData } = useBudget();
  const [editingScenario, setEditingScenario] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<ScenarioFormData>({
    name: "",
    description: "",
    assumptions: {
      inflationRate: 3.0,
      headcountGrowth: 5.0,
      salaryIncrease: 4.0,
      revenueGrowth: 8.0,
      costOptimization: 2.0,
    },
  });

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
  const scenarios = currentPlanningData?.scenarios || [];
  const activeScenario = scenarios.find(
    (s) => s.id === currentPlanningData?.activeScenarioId
  );

  // If no planning data exists, redirect to planning dashboard
  if (!currentPlanningData) {
    return <Navigate to="/planning" replace />;
  }

  const handleCreateScenario = async () => {
    if (!formData.name.trim()) return;

    const newScenario: PlanningScenario = {
      id: `scenario-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      assumptions: formData.assumptions,
      isActive: scenarios.length === 0, // First scenario becomes active
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    const updatedScenarios = [...scenarios, newScenario];

    await updatePlanningData(state.selectedYear, {
      scenarios: updatedScenarios,
      activeScenarioId: newScenario.isActive
        ? newScenario.id
        : currentPlanningData.activeScenarioId,
    });

    // Reset form
    setFormData({
      name: "",
      description: "",
      assumptions: {
        inflationRate: 3.0,
        headcountGrowth: 5.0,
        salaryIncrease: 4.0,
        revenueGrowth: 8.0,
        costOptimization: 2.0,
      },
    });
    setShowCreateForm(false);
  };

  const handleEditScenario = async (scenarioId: string) => {
    if (!editingScenario) return;

    const updatedScenarios = scenarios.map((scenario) =>
      scenario.id === scenarioId
        ? {
            ...scenario,
            name: formData.name,
            description: formData.description,
            assumptions: formData.assumptions,
            modifiedAt: new Date(),
          }
        : scenario
    );

    await updatePlanningData(state.selectedYear, {
      scenarios: updatedScenarios,
    });

    setEditingScenario(null);
  };

  const handleDeleteScenario = async (scenarioId: string) => {
    if (scenarios.length <= 1) {
      alert(
        "Cannot delete the last scenario. At least one scenario is required."
      );
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete this scenario? This action cannot be undone."
      )
    ) {
      return;
    }

    const updatedScenarios = scenarios.filter((s) => s.id !== scenarioId);
    let newActiveScenarioId = currentPlanningData.activeScenarioId;

    // If we deleted the active scenario, select the first remaining one
    if (scenarioId === currentPlanningData.activeScenarioId) {
      newActiveScenarioId = updatedScenarios[0]?.id || "";
    }

    await updatePlanningData(state.selectedYear, {
      scenarios: updatedScenarios,
      activeScenarioId: newActiveScenarioId,
    });
  };

  const handleSetActiveScenario = async (scenarioId: string) => {
    const updatedScenarios = scenarios.map((scenario) => ({
      ...scenario,
      isActive: scenario.id === scenarioId,
    }));

    await updatePlanningData(state.selectedYear, {
      scenarios: updatedScenarios,
      activeScenarioId: scenarioId,
    });
  };

  const startEditingScenario = (scenario: PlanningScenario) => {
    setFormData({
      name: scenario.name,
      description: scenario.description || "",
      assumptions: scenario.assumptions,
    });
    setEditingScenario(scenario.id);
  };

  const cancelEditing = () => {
    setEditingScenario(null);
    setShowCreateForm(false);
    setFormData({
      name: "",
      description: "",
      assumptions: {
        inflationRate: 3.0,
        headcountGrowth: 5.0,
        salaryIncrease: 4.0,
        revenueGrowth: 8.0,
        costOptimization: 2.0,
      },
    });
  };

  const renderScenarioForm = (isEditing: boolean = false) => (
    <div className="scenario-form">
      <h4>{isEditing ? "Edit Scenario" : "Create New Scenario"}</h4>

      <div className="form-group">
        <label htmlFor="scenarioName">Scenario Name</label>
        <input
          id="scenarioName"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Conservative, Optimistic, High Growth"
        />
      </div>

      <div className="form-group">
        <label htmlFor="scenarioDescription">Description (Optional)</label>
        <textarea
          id="scenarioDescription"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Describe this scenario's key assumptions..."
          rows={3}
        />
      </div>

      <div className="assumptions-form">
        <h5>Planning Assumptions</h5>
        <div className="assumptions-grid">
          <div className="form-group">
            <label htmlFor="inflationRate">Inflation Rate (%)</label>
            <input
              id="inflationRate"
              type="number"
              step="0.1"
              min="0"
              max="20"
              value={formData.assumptions.inflationRate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  assumptions: {
                    ...formData.assumptions,
                    inflationRate: parseFloat(e.target.value) || 0,
                  },
                })
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="headcountGrowth">Headcount Growth (%)</label>
            <input
              id="headcountGrowth"
              type="number"
              step="0.1"
              min="-50"
              max="100"
              value={formData.assumptions.headcountGrowth}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  assumptions: {
                    ...formData.assumptions,
                    headcountGrowth: parseFloat(e.target.value) || 0,
                  },
                })
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="salaryIncrease">Salary Increase (%)</label>
            <input
              id="salaryIncrease"
              type="number"
              step="0.1"
              min="0"
              max="20"
              value={formData.assumptions.salaryIncrease}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  assumptions: {
                    ...formData.assumptions,
                    salaryIncrease: parseFloat(e.target.value) || 0,
                  },
                })
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="revenueGrowth">Revenue Growth (%)</label>
            <input
              id="revenueGrowth"
              type="number"
              step="0.1"
              min="-50"
              max="100"
              value={formData.assumptions.revenueGrowth}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  assumptions: {
                    ...formData.assumptions,
                    revenueGrowth: parseFloat(e.target.value) || 0,
                  },
                })
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="costOptimization">Cost Optimization (%)</label>
            <input
              id="costOptimization"
              type="number"
              step="0.1"
              min="0"
              max="20"
              value={formData.assumptions.costOptimization}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  assumptions: {
                    ...formData.assumptions,
                    costOptimization: parseFloat(e.target.value) || 0,
                  },
                })
              }
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button
          className="btn btn-primary"
          onClick={
            isEditing
              ? () => handleEditScenario(editingScenario!)
              : handleCreateScenario
          }
          disabled={!formData.name.trim()}
        >
          {isEditing ? "Update Scenario" : "Create Scenario"}
        </button>
        <button className="btn btn-secondary" onClick={cancelEditing}>
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="scenario-management">
      {/* Navigation Breadcrumb */}
      <div className="planning-breadcrumb">
        <Link to="/planning" className="breadcrumb-link">
          📋 Planning Dashboard
        </Link>
        <span className="breadcrumb-separator"> / </span>
        <span className="breadcrumb-current">🎯 Scenarios</span>
      </div>

      {/* Header */}
      <div className="planning-header">
        <h1>🎯 Scenario Management - {state.selectedYear}</h1>
        <div className="planning-mode-badge">Planning Mode Active</div>
      </div>

      {/* Active Scenario Summary */}
      {activeScenario && (
        <div className="active-scenario-summary">
          <h3>📊 Currently Active Scenario</h3>
          <div className="scenario-card active">
            <div className="scenario-header">
              <div className="scenario-info">
                <h4>{activeScenario.name}</h4>
                <p>{activeScenario.description || "No description provided"}</p>
              </div>
              <div className="scenario-badge">Active</div>
            </div>
            <div className="scenario-assumptions">
              <div className="assumption-item">
                <span className="assumption-label">Inflation:</span>
                <span className="assumption-value">
                  {activeScenario.assumptions.inflationRate}%
                </span>
              </div>
              <div className="assumption-item">
                <span className="assumption-label">Headcount:</span>
                <span className="assumption-value">
                  {activeScenario.assumptions.headcountGrowth > 0 ? "+" : ""}
                  {activeScenario.assumptions.headcountGrowth}%
                </span>
              </div>
              <div className="assumption-item">
                <span className="assumption-label">Salary:</span>
                <span className="assumption-value">
                  +{activeScenario.assumptions.salaryIncrease}%
                </span>
              </div>
              <div className="assumption-item">
                <span className="assumption-label">Revenue:</span>
                <span className="assumption-value">
                  {activeScenario.assumptions.revenueGrowth > 0 ? "+" : ""}
                  {activeScenario.assumptions.revenueGrowth}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scenarios List */}
      <div className="scenarios-section">
        <div className="section-header">
          <h3>All Scenarios ({scenarios.length})</h3>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
            disabled={showCreateForm || editingScenario !== null}
          >
            ➕ Create New Scenario
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && !editingScenario && renderScenarioForm(false)}

        {/* Scenarios Grid */}
        <div className="scenarios-grid">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`scenario-card ${scenario.isActive ? "active" : ""}`}
            >
              {editingScenario === scenario.id ? (
                renderScenarioForm(true)
              ) : (
                <>
                  <div className="scenario-header">
                    <div className="scenario-info">
                      <h4>{scenario.name}</h4>
                      <p>{scenario.description || "No description"}</p>
                      <div className="scenario-meta">
                        Created: {scenario.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                    <div className="scenario-actions">
                      {!scenario.isActive && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleSetActiveScenario(scenario.id)}
                          title="Set as active scenario"
                        >
                          ✓ Activate
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => startEditingScenario(scenario)}
                        disabled={editingScenario !== null || showCreateForm}
                        title="Edit scenario"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteScenario(scenario.id)}
                        disabled={scenarios.length <= 1}
                        title={
                          scenarios.length <= 1
                            ? "Cannot delete the last scenario"
                            : "Delete scenario"
                        }
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>

                  <div className="scenario-assumptions">
                    <div className="assumption-item">
                      <span className="assumption-label">Inflation:</span>
                      <span className="assumption-value">
                        {scenario.assumptions.inflationRate}%
                      </span>
                    </div>
                    <div className="assumption-item">
                      <span className="assumption-label">Headcount:</span>
                      <span className="assumption-value">
                        {scenario.assumptions.headcountGrowth > 0 ? "+" : ""}
                        {scenario.assumptions.headcountGrowth}%
                      </span>
                    </div>
                    <div className="assumption-item">
                      <span className="assumption-label">Salary:</span>
                      <span className="assumption-value">
                        +{scenario.assumptions.salaryIncrease}%
                      </span>
                    </div>
                    <div className="assumption-item">
                      <span className="assumption-label">Revenue:</span>
                      <span className="assumption-value">
                        {scenario.assumptions.revenueGrowth > 0 ? "+" : ""}
                        {scenario.assumptions.revenueGrowth}%
                      </span>
                    </div>
                    <div className="assumption-item">
                      <span className="assumption-label">Cost Opt:</span>
                      <span className="assumption-value">
                        {scenario.assumptions.costOptimization}%
                      </span>
                    </div>
                  </div>

                  {scenario.isActive && (
                    <div className="scenario-status">
                      <span className="active-indicator">
                        🎯 Active Scenario
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

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
          <strong>Phase 3.2:</strong> Scenario management with full CRUD
          operations
        </p>
        <p>
          <strong>Features:</strong> Create, edit, delete, and activate
          scenarios with custom assumptions
        </p>
        <p>
          <strong>Next Phase:</strong> Planning calculations and historical
          analysis
        </p>
      </div>
    </div>
  );
};

export default ScenarioManagement;
