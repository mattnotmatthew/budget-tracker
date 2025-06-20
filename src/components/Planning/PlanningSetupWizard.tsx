/**
 * Planning Setup Wizard - Phase 3.1
 *
 * This component provides a comprehensive wizard for creating planning data.
 * It guides users through setting up planning assumptions, methods, and initial scenarios.
 *
 * Features:
 * - Step-by-step wizard interface
 * - Planning method selection (trend-based, zero-based, percentage-increase)
 * - Global assumptions configuration
 * - Scenario creation
 * - Historical data analysis integration
 */

import React, { useState, useEffect } from "react";
import { useBudget } from "../../context/BudgetContext";
import { isFeatureEnabled } from "../../utils/featureFlags";
import { getCurrentYear, getNextPlanningYear } from "../../utils/yearUtils";
import { createPlanningData } from "../../utils/planningUtils";
import { PlanningAssumptions as PlanningAssumptionsType } from "../../types/planning";

interface SetupStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

const PlanningSetupWizard: React.FC = () => {
  const { state, setPlanningData } = useBudget();
  const [currentStep, setCurrentStep] = useState(1);
  const [planningMethod, setPlanningMethod] = useState<
    "trend-based" | "zero-based" | "percentage-increase"
  >("trend-based");
  const [assumptions, setAssumptions] = useState<PlanningAssumptionsType>({
    inflationRate: 3.0,
    headcountGrowth: 10.0,
    salaryIncrease: 4.0,
    revenueGrowth: 8.0,
    costOptimization: 2.0,
  });
  const [scenarioName, setScenarioName] = useState("Base Case");
  const [isCreating, setIsCreating] = useState(false);
  const planningYear = getNextPlanningYear();
  const baseYear = getCurrentYear();
  const hasHistoricalData =
    state.entries &&
    state.entries.filter((entry) => entry.year === baseYear).length > 0;

  const steps: SetupStep[] = [
    {
      id: 1,
      title: "Planning Method",
      description: "Choose how to generate your planning baseline",
      completed: currentStep > 1,
    },
    {
      id: 2,
      title: "Global Assumptions",
      description: "Set company-wide planning assumptions",
      completed: currentStep > 2,
    },
    {
      id: 3,
      title: "Initial Scenario",
      description: "Create your first planning scenario",
      completed: currentStep > 3,
    },
    {
      id: 4,
      title: "Review & Create",
      description: "Review settings and create planning data",
      completed: false,
    },
  ];

  // Validate if we can proceed to next step
  const canProceed = (step: number) => {
    switch (step) {
      case 1:
        return planningMethod !== null;
      case 2:
        return assumptions.inflationRate > 0 && assumptions.salaryIncrease > 0;
      case 3:
        return scenarioName.trim().length > 0;
      default:
        return true;
    }
  };

  const handleCreatePlanningData = async () => {
    if (!canProceed(currentStep)) return;
    setIsCreating(true);
    try {
      // Create planning data with user selections
      const historicalEntries = hasHistoricalData
        ? state.entries.filter((entry) => entry.year === baseYear)
        : [];

      const planningData = createPlanningData(
        planningYear,
        baseYear,
        state.categories,
        historicalEntries,
        planningMethod
      );

      // Update planning data with user assumptions
      planningData.globalAssumptions = assumptions;
      planningData.scenarios = [
        {
          id: "initial-scenario",
          name: scenarioName,
          description: `Initial planning scenario: ${scenarioName}`,
          assumptions: assumptions,
          isActive: true,
          createdAt: new Date(),
          modifiedAt: new Date(),
        },
      ];
      planningData.activeScenarioId = "initial-scenario";

      // Save to context
      await setPlanningData(planningYear, planningData);

      // Move to completion step
      setCurrentStep(5);
    } catch (error) {
      console.error("Error creating planning data:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="setup-step-indicator">
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={`step-item ${
            currentStep === step.id
              ? "active"
              : step.completed
              ? "completed"
              : "pending"
          }`}
        >
          <div className="step-number">{step.completed ? "✓" : step.id}</div>
          <div className="step-info">
            <div className="step-title">{step.title}</div>
            <div className="step-description">{step.description}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderMethodSelection = () => (
    <div className="setup-step-content">
      <h3>Choose Planning Method</h3>
      <p>
        Select how you want to generate your {planningYear} budget baseline:
      </p>

      <div className="method-options">
        <div
          className={`method-option ${
            planningMethod === "trend-based" ? "selected" : ""
          }`}
          onClick={() => setPlanningMethod("trend-based")}
        >
          <div className="method-icon">📈</div>
          <div className="method-info">
            <h4>Trend-Based Planning</h4>
            <p>
              Analyze {baseYear} spending patterns and project trends forward.
              Best for established budgets with historical data.
            </p>
            {hasHistoricalData && (
              <div className="method-benefit">
                ✅ Your {baseYear} data will be analyzed for trends
              </div>
            )}
          </div>
        </div>

        <div
          className={`method-option ${
            planningMethod === "zero-based" ? "selected" : ""
          }`}
          onClick={() => setPlanningMethod("zero-based")}
        >
          <div className="method-icon">🎯</div>
          <div className="method-info">
            <h4>Zero-Based Planning</h4>
            <p>
              Start from zero and justify each expense. Best for cost
              optimization or when changing business direction.
            </p>
            <div className="method-benefit">
              💡 Forces review of all spending decisions
            </div>
          </div>
        </div>

        <div
          className={`method-option ${
            planningMethod === "percentage-increase" ? "selected" : ""
          }`}
          onClick={() => setPlanningMethod("percentage-increase")}
        >
          <div className="method-icon">📊</div>
          <div className="method-info">
            <h4>Percentage Increase</h4>
            <p>
              Apply consistent percentage increases to {baseYear} actuals.
              Simple and quick for stable businesses.
            </p>
            <div className="method-benefit">
              ⚡ Fastest setup for initial planning
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAssumptions = () => (
    <div className="setup-step-content">
      <h3>Global Planning Assumptions</h3>
      <p>
        Set company-wide assumptions that will influence your planning
        calculations:
      </p>

      <div className="assumptions-grid">
        <div className="assumption-item">
          <label htmlFor="inflationRate">Inflation Rate</label>
          <div className="input-with-suffix">
            <input
              id="inflationRate"
              type="number"
              step="0.1"
              min="0"
              max="20"
              value={assumptions.inflationRate}
              onChange={(e) =>
                setAssumptions({
                  ...assumptions,
                  inflationRate: parseFloat(e.target.value) || 0,
                })
              }
            />
            <span className="input-suffix">%</span>
          </div>
          <div className="assumption-help">
            Expected inflation rate for goods and services
          </div>
        </div>
        <div className="assumption-item">
          <label htmlFor="headcountGrowth">Headcount Growth</label>
          <div className="input-with-suffix">
            <input
              id="headcountGrowth"
              type="number"
              step="0.1"
              min="-50"
              max="100"
              value={assumptions.headcountGrowth}
              onChange={(e) =>
                setAssumptions({
                  ...assumptions,
                  headcountGrowth: parseFloat(e.target.value) || 0,
                })
              }
            />
            <span className="input-suffix">%</span>
          </div>
          <div className="assumption-help">
            Expected change in team size (affects salary and related costs)
          </div>
        </div>
        <div className="assumption-item">
          <label htmlFor="salaryIncrease">Salary Increase</label>
          <div className="input-with-suffix">
            <input
              id="salaryIncrease"
              type="number"
              step="0.1"
              min="0"
              max="20"
              value={assumptions.salaryIncrease}
              onChange={(e) =>
                setAssumptions({
                  ...assumptions,
                  salaryIncrease: parseFloat(e.target.value) || 0,
                })
              }
            />
            <span className="input-suffix">%</span>
          </div>
          <div className="assumption-help">
            Average salary increase for existing employees
          </div>
        </div>{" "}
        <div className="assumption-item">
          <label htmlFor="costOptimization">Cost Optimization</label>
          <div className="input-with-suffix">
            <input
              id="costOptimization"
              type="number"
              step="0.1"
              min="0"
              max="20"
              value={assumptions.costOptimization}
              onChange={(e) =>
                setAssumptions({
                  ...assumptions,
                  costOptimization: parseFloat(e.target.value) || 0,
                })
              }
            />
            <span className="input-suffix">%</span>
          </div>
          <div className="assumption-help">
            Target cost reduction through optimization
          </div>
        </div>
      </div>

      <div className="assumptions-preview">
        <h4>Impact Preview</h4>
        <p>
          These assumptions will be applied to generate your planning baseline:
        </p>
        <ul>
          <li>
            <strong>
              {planningMethod === "trend-based"
                ? "Trend analysis"
                : planningMethod === "zero-based"
                ? "Zero-based review"
                : "Percentage increase"}
            </strong>{" "}
            will be the primary method
          </li>
          <li>
            <strong>{assumptions.inflationRate}% inflation</strong> will be
            factored into cost projections
          </li>
          <li>
            <strong>
              {assumptions.headcountGrowth > 0
                ? `${assumptions.headcountGrowth}% team growth`
                : assumptions.headcountGrowth < 0
                ? `${Math.abs(assumptions.headcountGrowth)}% team reduction`
                : "No headcount changes"}
            </strong>{" "}
            planned
          </li>
          <li>
            <strong>{assumptions.salaryIncrease}% salary increases</strong> for
            existing team members
          </li>
        </ul>
      </div>
    </div>
  );

  const renderScenarioSetup = () => (
    <div className="setup-step-content">
      <h3>Initial Planning Scenario</h3>
      <p>
        Create your first planning scenario. You can add more scenarios later.
      </p>

      <div className="scenario-setup">
        <div className="scenario-item">
          <label htmlFor="scenarioName">Scenario Name</label>
          <input
            id="scenarioName"
            type="text"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            placeholder="e.g., Base Case, Conservative, Optimistic"
          />
          <div className="scenario-help">
            Give your scenario a descriptive name
          </div>
        </div>

        <div className="scenario-preview">
          <h4>Scenario Preview</h4>
          <div className="scenario-card">
            <div className="scenario-header">
              <span className="scenario-name">
                {scenarioName || "Unnamed Scenario"}
              </span>
              <span className="scenario-method">{planningMethod}</span>
            </div>
            <div className="scenario-assumptions">
              {" "}
              <div className="assumption-preview">
                📈 Inflation: {assumptions.inflationRate}%
              </div>
              <div className="assumption-preview">
                👥 Headcount: {assumptions.headcountGrowth > 0 ? "+" : ""}
                {assumptions.headcountGrowth}%
              </div>
              <div className="assumption-preview">
                💰 Salary: +{assumptions.salaryIncrease}%
              </div>
              <div className="assumption-preview">
                � Revenue: +{assumptions.revenueGrowth}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="setup-step-content">
      <h3>Review & Create Planning Data</h3>
      <p>
        Review your planning configuration and create your {planningYear}{" "}
        planning data:
      </p>

      <div className="review-summary">
        <div className="review-section">
          <h4>📋 Planning Configuration</h4>
          <div className="review-item">
            <span className="review-label">Planning Year:</span>
            <span className="review-value">{planningYear}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Base Year:</span>
            <span className="review-value">{baseYear}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Planning Method:</span>
            <span className="review-value">{planningMethod}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Historical Data:</span>
            <span className="review-value">
              {hasHistoricalData
                ? `✅ Available for ${baseYear}`
                : "❌ Not available"}
            </span>
          </div>
        </div>

        <div className="review-section">
          <h4>⚙️ Global Assumptions</h4>
          <div className="review-item">
            <span className="review-label">Inflation Rate:</span>
            <span className="review-value">{assumptions.inflationRate}%</span>
          </div>
          <div className="review-item">
            <span className="review-label">Headcount Growth:</span>
            <span className="review-value">
              {assumptions.headcountGrowth > 0 ? "+" : ""}
              {assumptions.headcountGrowth}%
            </span>
          </div>
          <div className="review-item">
            <span className="review-label">Salary Increase:</span>
            <span className="review-value">{assumptions.salaryIncrease}%</span>
          </div>{" "}
          <div className="review-item">
            <span className="review-label">Cost Optimization:</span>
            <span className="review-value">
              {assumptions.costOptimization}%
            </span>
          </div>
        </div>

        <div className="review-section">
          <h4>🎯 Initial Scenario</h4>
          <div className="review-item">
            <span className="review-label">Scenario Name:</span>
            <span className="review-value">{scenarioName}</span>
          </div>
        </div>
      </div>

      <div className="creation-info">
        <h4>What will be created:</h4>
        <ul>
          <li>Planning data structure for {planningYear}</li>
          <li>Initial scenario with your selected assumptions</li>
          {hasHistoricalData && (
            <li>
              Analysis of {baseYear} historical data for trend calculations
            </li>
          )}
          <li>
            Category-specific planning baseline using {planningMethod} method
          </li>
          <li>Planning calculations ready for further customization</li>
        </ul>
      </div>
    </div>
  );

  const renderCompletion = () => (
    <div className="setup-step-content completion">
      <div className="completion-icon">🎉</div>
      <h3>Planning Data Created Successfully!</h3>
      <p>
        Your {planningYear} planning data has been created and is ready for use.
      </p>

      <div className="completion-actions">
        <button
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          🔄 Return to Planning Dashboard
        </button>
      </div>

      <div className="next-steps">
        <h4>Next Steps:</h4>
        <ul>
          <li>Review and adjust category-specific planning data</li>
          <li>
            Create additional scenarios for different planning assumptions
          </li>
          <li>Use planning tools to refine your budget</li>
          <li>Export and share your planning data when ready</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="planning-setup-wizard">
      <div className="wizard-header">
        <h2>🚀 Planning Setup Wizard</h2>
        <p>Let's create your {planningYear} planning data step by step</p>
      </div>

      {renderStepIndicator()}

      <div className="wizard-content">
        {currentStep === 1 && renderMethodSelection()}
        {currentStep === 2 && renderAssumptions()}
        {currentStep === 3 && renderScenarioSetup()}
        {currentStep === 4 && renderReview()}
        {currentStep === 5 && renderCompletion()}
      </div>

      {currentStep < 5 && (
        <div className="wizard-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            ← Back
          </button>

          {currentStep < 4 ? (
            <button
              className="btn btn-primary"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed(currentStep)}
            >
              Next →
            </button>
          ) : (
            <button
              className="btn btn-success"
              onClick={handleCreatePlanningData}
              disabled={!canProceed(currentStep) || isCreating}
            >
              {isCreating ? "Creating..." : "🎯 Create Planning Data"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PlanningSetupWizard;
