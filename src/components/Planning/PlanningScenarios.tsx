/**
 * Planning Scenario Management - Phase 3.2
 *
 * This component provides comprehensive scenario management for planning data.
 * Users can create, edit, delete, and switch between different planning scenarios.
 *
 * Features:
 * - Scenario CRUD operations
 * - Real-time scenario switching
 * - Scenario comparison tools
 * - Assumption editing per scenario
 * - Scenario impact analysis
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

const PlanningScenarios: React.FC = () => {
  const { state, setPlanningData, updatePlanningData } = useBudget();
  const [activeTab, setActiveTab] = useState<"list" | "create" | "compare">(
    "list"
  );
  const [editingScenario, setEditingScenario] = useState<string | null>(null);
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

  const handleCreateScenario = async () => {
    if (!currentPlanningData || !formData.name.trim()) return;

    const newScenario: PlanningScenario = {
      id: `scenario-${Date.now()}`,
      name: formData.name.trim(),
      description:
        formData.description.trim() || `${formData.name} planning scenario`,
      assumptions: { ...formData.assumptions },
      isActive: scenarios.length === 0, // First scenario is automatically active
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    const updatedPlanningData = {
      ...currentPlanningData,
      scenarios: [...scenarios, newScenario],
      activeScenarioId: newScenario.isActive
        ? newScenario.id
        : currentPlanningData.activeScenarioId,
    };

    await updatePlanningData(state.selectedYear, updatedPlanningData);

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
    setActiveTab("list");
  };

  const handleEditScenario = async (scenarioId: string) => {
    if (!currentPlanningData) return;

    const updatedScenarios = scenarios.map((scenario) =>
      scenario.id === scenarioId
        ? {
            ...scenario,
            name: formData.name.trim(),
            description: formData.description.trim(),
            assumptions: { ...formData.assumptions },
            modifiedAt: new Date(),
          }
        : scenario
    );

    const updatedPlanningData = {
      ...currentPlanningData,
      scenarios: updatedScenarios,
    };

    await updatePlanningData(state.selectedYear, updatedPlanningData);

    setEditingScenario(null);
    setActiveTab("list");
  };

  const handleDeleteScenario = async (scenarioId: string) => {
    if (!currentPlanningData || scenarios.length <= 1) {
      alert(
        "Cannot delete the last scenario. At least one scenario is required."
      );
      return;
    }

    if (!confirm("Are you sure you want to delete this scenario?")) return;

    const updatedScenarios = scenarios.filter((s) => s.id !== scenarioId);
    let newActiveScenarioId = currentPlanningData.activeScenarioId;

    // If we're deleting the active scenario, switch to the first remaining one
    if (scenarioId === currentPlanningData.activeScenarioId) {
      newActiveScenarioId = updatedScenarios[0]?.id || "";
    }

    const updatedPlanningData = {
      ...currentPlanningData,
      scenarios: updatedScenarios,
      activeScenarioId: newActiveScenarioId,
    };

    await updatePlanningData(state.selectedYear, updatedPlanningData);
  };

  const handleActivateScenario = async (scenarioId: string) => {
    if (!currentPlanningData) return;

    const updatedScenarios = scenarios.map((scenario) => ({
      ...scenario,
      isActive: scenario.id === scenarioId,
    }));

    const updatedPlanningData = {
      ...currentPlanningData,
      scenarios: updatedScenarios,
      activeScenarioId: scenarioId,
    };

    await updatePlanningData(state.selectedYear, updatedPlanningData);
  };
  const startEditingScenario = (scenario: PlanningScenario) => {
    setFormData({
      name: scenario.name,
      description: scenario.description || "",
      assumptions: { ...scenario.assumptions },
    });
    setEditingScenario(scenario.id);
    setActiveTab("create");
  };

  const renderBreadcrumb = () => (
    <div className="planning-breadcrumb">
      <Link to="/planning" className="breadcrumb-link">
        📋 Planning Dashboard
      </Link>
      <span className="breadcrumb-separator"> / </span>
      <span className="breadcrumb-current">🎯 Scenarios</span>
    </div>
  );

  const renderHeader = () => (
    <div className="scenarios-header">
      <h1>🎯 Planning Scenarios - {state.selectedYear}</h1>
      <div className="planning-mode-badge">Planning Mode Active</div>
    </div>
  );

  const renderTabs = () => (
    <div className="scenarios-tabs">
      <button
        className={`tab-button ${activeTab === "list" ? "active" : ""}`}
        onClick={() => setActiveTab("list")}
      >
        📋 Manage Scenarios
      </button>
      <button
        className={`tab-button ${activeTab === "create" ? "active" : ""}`}
        onClick={() => {
          setEditingScenario(null);
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
          setActiveTab("create");
        }}
      >
        ➕ Create Scenario
      </button>
      <button
        className={`tab-button ${activeTab === "compare" ? "active" : ""}`}
        onClick={() => setActiveTab("compare")}
        disabled={scenarios.length < 2}
        title={
          scenarios.length < 2
            ? "Need at least 2 scenarios to compare"
            : "Compare scenarios"
        }
      >
        📊 Compare Scenarios
      </button>
    </div>
  );

  const renderScenarioList = () => (
    <div className="scenarios-list">
      <div className="scenarios-summary">
        <h3>Scenario Overview</h3>
        <p>
          <strong>Total Scenarios:</strong> {scenarios.length}
        </p>
        <p>
          <strong>Active Scenario:</strong> {activeScenario?.name || "None"}
        </p>
      </div>

      <div className="scenario-cards">
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            className={`scenario-card ${
              scenario.id === currentPlanningData?.activeScenarioId
                ? "active"
                : ""
            }`}
          >
            <div className="scenario-card-header">
              <div className="scenario-info">
                <h4>{scenario.name}</h4>
                <p>{scenario.description}</p>
              </div>
              <div className="scenario-status">
                {scenario.id === currentPlanningData?.activeScenarioId && (
                  <span className="active-badge">Active</span>
                )}
              </div>
            </div>

            <div className="scenario-assumptions">
              <h5>Key Assumptions</h5>
              <div className="assumptions-grid">
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
                    +{scenario.assumptions.revenueGrowth}%
                  </span>
                </div>
              </div>
            </div>

            <div className="scenario-actions">
              {scenario.id !== currentPlanningData?.activeScenarioId && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleActivateScenario(scenario.id)}
                >
                  🎯 Activate
                </button>
              )}
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => startEditingScenario(scenario)}
              >
                ✏️ Edit
              </button>
              <button
                className="btn btn-danger btn-sm"
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

            <div className="scenario-meta">
              <small>
                Created: {scenario.createdAt.toLocaleDateString()} | Modified:{" "}
                {scenario.modifiedAt.toLocaleDateString()}
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderScenarioForm = () => (
    <div className="scenario-form">
      <h3>{editingScenario ? "Edit Scenario" : "Create New Scenario"}</h3>

      <div className="form-section">
        <h4>Basic Information</h4>
        <div className="form-grid">
          <div className="form-item">
            <label htmlFor="scenarioName">Scenario Name *</label>
            <input
              id="scenarioName"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Conservative, Base Case, Optimistic"
              required
            />
          </div>
          <div className="form-item full-width">
            <label htmlFor="scenarioDescription">Description</label>
            <textarea
              id="scenarioDescription"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Optional description of this scenario"
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4>Planning Assumptions</h4>
        <div className="form-grid">
          <div className="form-item">
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
          <div className="form-item">
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
          <div className="form-item">
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
          <div className="form-item">
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
          <div className="form-item">
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
          className="btn btn-secondary"
          onClick={() => {
            setActiveTab("list");
            setEditingScenario(null);
          }}
        >
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={
            editingScenario
              ? () => handleEditScenario(editingScenario)
              : handleCreateScenario
          }
          disabled={!formData.name.trim()}
        >
          {editingScenario ? "Update Scenario" : "Create Scenario"}
        </button>
      </div>
    </div>
  );

  const renderScenarioComparison = () => (
    <div className="scenario-comparison">
      <h3>Scenario Comparison</h3>
      <p>Compare assumptions and impacts across different scenarios:</p>

      <div className="comparison-table">
        <table>
          <thead>
            <tr>
              <th>Assumption</th>
              {scenarios.map((scenario) => (
                <th key={scenario.id}>
                  {scenario.name}
                  {scenario.id === currentPlanningData?.activeScenarioId && (
                    <span className="active-indicator"> (Active)</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Inflation Rate</strong>
              </td>
              {scenarios.map((scenario) => (
                <td key={scenario.id}>{scenario.assumptions.inflationRate}%</td>
              ))}
            </tr>
            <tr>
              <td>
                <strong>Headcount Growth</strong>
              </td>
              {scenarios.map((scenario) => (
                <td key={scenario.id}>
                  {scenario.assumptions.headcountGrowth > 0 ? "+" : ""}
                  {scenario.assumptions.headcountGrowth}%
                </td>
              ))}
            </tr>
            <tr>
              <td>
                <strong>Salary Increase</strong>
              </td>
              {scenarios.map((scenario) => (
                <td key={scenario.id}>
                  +{scenario.assumptions.salaryIncrease}%
                </td>
              ))}
            </tr>
            <tr>
              <td>
                <strong>Revenue Growth</strong>
              </td>
              {scenarios.map((scenario) => (
                <td key={scenario.id}>
                  {scenario.assumptions.revenueGrowth > 0 ? "+" : ""}
                  {scenario.assumptions.revenueGrowth}%
                </td>
              ))}
            </tr>
            <tr>
              <td>
                <strong>Cost Optimization</strong>
              </td>
              {scenarios.map((scenario) => (
                <td key={scenario.id}>
                  {scenario.assumptions.costOptimization}%
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="comparison-notes">
        <h4>Comparison Notes:</h4>
        <ul>
          <li>The active scenario is used for all planning calculations</li>
          <li>Switch scenarios to see real-time impact on planning data</li>
          <li>
            Consider creating Conservative, Base Case, and Optimistic scenarios
          </li>
          <li>Scenario comparison helps with sensitivity analysis</li>
        </ul>
      </div>
    </div>
  );

  if (!currentPlanningData) {
    return (
      <div className="planning-scenarios">
        {renderBreadcrumb()}
        <div className="no-planning-data">
          <h2>No Planning Data Available</h2>
          <p>Planning data for {state.selectedYear} hasn't been created yet.</p>
          <Link to="/planning" className="btn btn-primary">
            🔙 Back to Planning Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="planning-scenarios">
      {renderBreadcrumb()}
      {renderHeader()}
      {renderTabs()}

      <div className="scenarios-content">
        {activeTab === "list" && renderScenarioList()}
        {activeTab === "create" && renderScenarioForm()}
        {activeTab === "compare" && renderScenarioComparison()}
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
          <strong>Phase 3.2:</strong> Complete scenario management with CRUD
          operations
        </p>
        <p>
          <strong>Features:</strong> Create, edit, delete, activate scenarios
          with assumption management
        </p>
        <p>
          <strong>Next Phase:</strong> Planning calculations and historical
          analysis integration
        </p>
      </div>
    </div>
  );
};

export default PlanningScenarios;
