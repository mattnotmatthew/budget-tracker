import React, { useState, useEffect } from "react";
import { useBudget } from "../context/BudgetContext";
import { MonthlyData } from "../types";
import {
  calculateYTDData,
  calculateBudgetTracking,
  calculateMonthlyData,
} from "../utils/budgetCalculations";
import { formatCurrencyExcelStyle } from "../utils/currencyFormatter";
import { smartAutoSave } from "../utils/fileManager";

interface YearlyBudgetDashboardProps {
  collapseAll?: boolean;
}

const YearlyBudgetDashboard: React.FC<YearlyBudgetDashboardProps> = ({
  collapseAll = false,
}) => {
  const { state, dispatch } = useBudget();
  const [isEditing, setIsEditing] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const currentYearTarget = state.yearlyBudgetTargets[state.selectedYear] || 0;
  // Calculate YTD actuals for comparison
  const ytdResult = calculateYTDData(
    state.entries,
    state.categories,
    state.selectedYear
  );
  const ytdData = ytdResult.data; // Calculate adjusted YTD actual (factoring in adjustments)
  const ytdBudgetTracking = calculateBudgetTracking(ytdData.netTotal);
  const actualToDate = ytdBudgetTracking.actual; // Use adjusted actual instead of raw actual

  // Utility function to get months for a specific quarter
  const getQuarterMonths = (quarter: number): number[] => {
    const quarterToMonths: { [key: number]: number[] } = {
      1: [1, 2, 3], // Q1: Jan, Feb, Mar
      2: [4, 5, 6], // Q2: Apr, May, Jun
      3: [7, 8, 9], // Q3: Jul, Aug, Sep
      4: [10, 11, 12], // Q4: Oct, Nov, Dec
    };
    return quarterToMonths[quarter] || [];
  };

  // Function to get the forecast mode for a specific month
  const getMonthForecastMode = (month: number): boolean => {
    return state.monthlyForecastModes[state.selectedYear]?.[month] ?? false;
  };

  // Function to calculate quarterly summary (similar to MonthlyView)
  const calculateQuarterlySummary = (monthsData: MonthlyData[]) => {
    const summary = {
      costOfSales: { actual: 0, budget: 0, reforecast: 0, variance: 0 },
      opex: { actual: 0, budget: 0, reforecast: 0, variance: 0 },
      netTotal: { actual: 0, budget: 0, reforecast: 0, variance: 0 },
      adjustments: { actual: 0, budget: 0, reforecast: 0, variance: 0 },
      budgetTracking: { actual: 0, budget: 0, reforecast: 0, variance: 0 },
    };

    monthsData.forEach((month) => {
      // Cost of Sales
      summary.costOfSales.actual += month.costOfSales.total.actual;
      summary.costOfSales.budget += month.costOfSales.total.budget;
      summary.costOfSales.reforecast += month.costOfSales.total.reforecast;
      summary.costOfSales.variance += month.costOfSales.total.variance;

      // OpEx
      summary.opex.actual += month.opex.total.actual;
      summary.opex.budget += month.opex.total.budget;
      summary.opex.reforecast += month.opex.total.reforecast;
      summary.opex.variance += month.opex.total.variance;

      // Net Total
      summary.netTotal.actual += month.netTotal.actual;
      summary.netTotal.budget += month.netTotal.budget;
      summary.netTotal.reforecast += month.netTotal.reforecast;
      summary.netTotal.variance += month.netTotal.variance; // Adjustments - follow IOSToggle logic
      if (getMonthForecastMode(month.month)) {
        // If month is "Final", adjustments go to actual
        summary.adjustments.actual += month.netTotal.adjustments;
      } else {
        // If month is "Forecast", adjustments go to reforecast
        summary.adjustments.reforecast += month.netTotal.adjustments;
      } // Budget Tracking - follow IOSToggle logic
      const budgetTracking = calculateBudgetTracking(
        month.netTotal,
        !getMonthForecastMode(month.month)
      );

      if (getMonthForecastMode(month.month)) {
        // If month is "Final", budget tracking goes to actual
        summary.budgetTracking.actual += budgetTracking.actual;
      } else {
        // If month is "Forecast", budget tracking goes to reforecast
        summary.budgetTracking.reforecast += budgetTracking.reforecast;
      }

      // Budget and variance are always included
      summary.budgetTracking.budget += budgetTracking.budget;
      summary.budgetTracking.variance += budgetTracking.variance;
    });

    return summary;
  };

  // Function to determine if ALL months in a quarter are in "Final" mode
  const areAllMonthsFinal = (monthsData: MonthlyData[]): boolean => {
    return monthsData.every((month) => getMonthForecastMode(month.month));
  };

  // Calculate full year forecast from quarterly summaries
  const calculateFullYearForecast = (): number => {
    let totalForecast = 0;

    // Generate monthly data for all 12 months
    const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
    const monthlyData: MonthlyData[] = allMonths.map((month) =>
      calculateMonthlyData(
        state.entries,
        state.categories,
        month,
        state.selectedYear
      )
    );

    // Group months into quarters and calculate forecast
    for (let quarter = 1; quarter <= 4; quarter++) {
      const quarterMonths = getQuarterMonths(quarter);
      const quarterData = monthlyData.filter((month) =>
        quarterMonths.includes(month.month)
      );

      if (quarterData.length > 0) {
        const quarterlySummary = calculateQuarterlySummary(quarterData);
        const areAllFinal = areAllMonthsFinal(quarterData);

        // Apply the same logic as quarterly summary cards:
        // If all months are final, use actual + 0 (no forecast)
        // If any month is not final, use actual + forecast
        totalForecast += quarterlySummary.budgetTracking.actual;
        if (!areAllFinal) {
          totalForecast += quarterlySummary.budgetTracking.reforecast;
        }
      }
    }

    return totalForecast;
  };
  const fullYearForecast = calculateFullYearForecast();

  // Calculate projected full year based on adjusted YTD (kept for potential future use)
  // Use actual months with data, not current calendar month
  const monthsElapsed = ytdResult.lastMonthWithActuals;

  // Calculate YTD budget based on the same period as YTD actual (through final months only)
  const ytdBudgetTotal = ytdData.netTotal.budget; // Budget total through final months

  // Calculate YTD budget performance percentage using the corrected formula
  const ytdBudgetPerformance =
    ytdBudgetTotal > 0 ? (actualToDate / ytdBudgetTotal - 1) * 100 : 0;
  const ytdPerformanceLabel =
    ytdBudgetPerformance >= 0 ? "Over Budget" : "Under Budget";

  // Helper function to get month name
  const getMonthName = (monthNumber: number): string => {
    const months = [
      "",
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months[monthNumber] || "";
  };

  // Calculate variance
  const variance = currentYearTarget > 0 ? actualToDate - currentYearTarget : 0;
  const variancePercent =
    currentYearTarget > 0 ? (variance / currentYearTarget) * 100 : 0;
  useEffect(() => {
    setBudgetInput(currentYearTarget > 0 ? currentYearTarget.toString() : "");
  }, [currentYearTarget]);

  // Effect to handle collapse all functionality from parent Dashboard
  useEffect(() => {
    if (collapseAll !== undefined) {
      setIsCollapsed(collapseAll);
    }
  }, [collapseAll]);

  const formatCurrency = (amount: number): string => {
    return formatCurrencyExcelStyle(amount);
  };

  const getVarianceClass = (variance: number): string => {
    if (variance > 0) return "positive-variance";
    if (variance < 0) return "negative-variance";
    return "neutral-variance";
  };
  const handleEditClick = () => {
    setIsEditing(true);
    setBudgetInput(currentYearTarget > 0 ? currentYearTarget.toString() : "");
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleSave = async () => {
    const amount = parseFloat(budgetInput.replace(/,/g, "")) || 0;

    // Update the state
    dispatch({
      type: "SET_YEARLY_BUDGET_TARGET",
      payload: { year: state.selectedYear, amount },
    });

    // Auto-save to file if one is attached
    try {
      if (state.currentFile) {
        const updatedState = {
          ...state,
          yearlyBudgetTargets: {
            ...state.yearlyBudgetTargets,
            [state.selectedYear]: amount,
          },
        };

        await smartAutoSave(updatedState, state.currentFile);
        setSaveMessage("✅ Yearly budget saved to file");
      } else {
        setSaveMessage("✅ Yearly budget saved (file not attached)");
      }
    } catch (error) {
      console.error("Failed to save yearly budget:", error);
      setSaveMessage("⚠️ Yearly budget saved locally, but file save failed");
    }

    setIsEditing(false);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setBudgetInput(currentYearTarget > 0 ? currentYearTarget.toString() : "");
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div className="yearly-budget-dashboard">
      <div className="yearly-header">
        <h3
          className="collapsible"
          onClick={toggleCollapse}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleCollapse();
            }
          }}
        >
          <span className="collapse-icon">{isCollapsed ? "▶" : "▼"}</span>
          📊 {state.selectedYear} Budget Overview
        </h3>
        {saveMessage && (
          <div className="save-message-inline">{saveMessage}</div>
        )}
      </div>

      {!isCollapsed && (
        <div className="yearly-budget-section">
          <div className="budget-target-card">
            <div className="card-header">
              <h4>Annual Budget Target</h4>
              {!isEditing && (
                <button
                  className="edit-btn"
                  onClick={handleEditClick}
                  title="Edit yearly budget target"
                >
                  ✏️ Edit
                </button>
              )}
            </div>
            <div className="card-content">
              {isEditing ? (
                <div className="budget-edit-form">
                  <input
                    type="text"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Enter yearly budget (e.g., 1200000)"
                    className="budget-input"
                    autoFocus
                  />
                  <div className="edit-buttons">
                    <button className="save-btn-small" onClick={handleSave}>
                      💾 Save
                    </button>
                    <button className="cancel-btn-small" onClick={handleCancel}>
                      ❌ Cancel
                    </button>
                  </div>
                  <small className="input-hint">
                    Press Enter to save, Escape to cancel
                  </small>
                </div>
              ) : (
                <div className="budget-display">
                  <span className="budget-amount-large">
                    {currentYearTarget > 0
                      ? formatCurrency(currentYearTarget)
                      : "Not Set"}
                  </span>
                  {currentYearTarget === 0 && (
                    <p className="no-budget-hint">
                      Click Edit to set your {state.selectedYear} budget target
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {currentYearTarget > 0 && (
            <div className="budget-performance-grid">
              {" "}
              <div className="performance-card">
                <h5>YTD Actual</h5>
                <span className="performance-amount">
                  {formatCurrency(actualToDate)}
                </span>{" "}
                <small>
                  Through{" "}
                  {monthsElapsed > 0 ? getMonthName(monthsElapsed) : "N/A"}
                </small>
              </div>{" "}
              <div className="performance-card">
                <h5>YTD vs Budget</h5>
                <span
                  className={`performance-amount ${
                    ytdBudgetPerformance > 0
                      ? "negative-variance"
                      : ytdBudgetPerformance < 0
                      ? "positive-variance"
                      : "neutral-variance"
                  }`}
                >
                  {Math.abs(ytdBudgetPerformance).toFixed(1)}%
                </span>
                <small>
                  {ytdPerformanceLabel} ({formatCurrency(ytdBudgetTotal)}{" "}
                  budgeted)
                </small>
              </div>
              <div className="performance-card">
                <h5>Remaining Budget</h5>
                <span
                  className={`performance-amount ${getVarianceClass(
                    currentYearTarget - actualToDate
                  )}`}
                >
                  {formatCurrency(currentYearTarget - actualToDate)}
                </span>
                <small>Available to spend</small>
              </div>
              <div className="performance-card">
                <h5>Full Year Forecast</h5>
                <span className="performance-amount">
                  {formatCurrency(fullYearForecast)}
                </span>
                <small>Sum of quarterly actual + forecast</small>
              </div>{" "}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default YearlyBudgetDashboard;
