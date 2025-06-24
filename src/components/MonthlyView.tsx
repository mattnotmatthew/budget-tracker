import React, { useState, useEffect } from "react";
import { useBudget } from "../context/BudgetContext";
import { MonthlyData, CategorySummary } from "../types";
import {
  calculateMonthlyData,
  calculateBudgetTracking,
} from "../utils/budgetCalculations";
import { formatCurrencyExcelStyle } from "../utils/currencyFormatter";
import IOSToggle from "./IOSToggle";

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

interface MonthlyViewProps {
  collapseAll?: boolean;
  selectedQuarters?: number[];
}

const MonthlyView: React.FC<MonthlyViewProps> = ({
  collapseAll = false,
  selectedQuarters = [],
}) => {
  const { state, dispatch } = useBudget();
  const [collapsedSections, setCollapsedSections] = useState<{
    [key: string]: boolean;
  }>({}); // Effect to handle collapse all functionality
  useEffect(() => {
    if (collapseAll !== undefined) {
      const newCollapsedState: { [key: string]: boolean } = {};
      // Get months to show based on selected quarters
      const monthsToShow =
        selectedQuarters.length > 0
          ? selectedQuarters.flatMap((quarter) => getQuarterMonths(quarter))
          : Array.from({ length: 12 }, (_, i) => i + 1); // Set all sections to the collapseAll state
      monthsToShow.forEach((month) => {
        newCollapsedState[`${month}-Cost of Sales`] = collapseAll;
        newCollapsedState[`${month}-OpEx`] = collapseAll;
        newCollapsedState[`${month}-Comp and Benefits`] = collapseAll;
        newCollapsedState[`${month}-Other`] = collapseAll;
      });
      setCollapsedSections(newCollapsedState);
    }
  }, [collapseAll, selectedQuarters]); // Generate monthly data - filter by selected quarters if any are specified
  const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
  const monthsToShow =
    selectedQuarters.length > 0
      ? selectedQuarters.flatMap((quarter) => getQuarterMonths(quarter))
      : allMonths;

  const monthlyData: MonthlyData[] = monthsToShow.map((month) =>
    calculateMonthlyData(
      state.entries,
      state.categories,
      month,
      state.selectedYear
    )
  );

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };
  const formatCurrency = (amount: number): string => {
    return formatCurrencyExcelStyle(amount);
  };
  const getVarianceClass = (variance: number): string => {
    // Normalize the variance using the same logic as the formatter
    const varianceInThousands = variance / 1000;
    const normalizedVariance =
      Math.abs(varianceInThousands) < 0.001 ? 0 : variance;

    if (normalizedVariance === 0) return "neutral";
    if (normalizedVariance > 0) return "positive";
    if (normalizedVariance < -5000) return "danger";
    if (normalizedVariance < 0) return "negative";
    return "neutral";
  };

  const getMonthName = (month: number): string => {
    return new Date(2025, month - 1, 1).toLocaleString("default", {
      month: "long",
    });
  };

  const renderCategoryGroup = (
    groupName: string,
    categories: CategorySummary[],
    total: any,
    monthNumber: number
  ) => {
    const sectionKey = `${monthNumber}-${groupName}`;
    const isCollapsed = collapsedSections[sectionKey];

    return (
      <div className="category-group">
        {" "}
        <h4
          className="group-title collapsible"
          onClick={() => toggleSection(sectionKey)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleSection(sectionKey);
            }
          }}
        >
          <div className="group-header-cell">
            <span className="collapse-icon">{isCollapsed ? "▶" : "▼"}</span>
            <span className="group-name">{groupName}</span>
          </div>{" "}
          {isCollapsed ? (
            <>
              <span className="inline-actual">
                {formatCurrency(total.actual)}
              </span>
              <span className="inline-budget">
                {formatCurrency(total.budget)}
              </span>
              <span className="inline-reforecast">
                {formatCurrency(total.reforecast)}
              </span>
              <span
                className={`inline-variance ${getVarianceClass(
                  total.variance
                )}`}
              >
                {formatCurrency(total.variance)}
              </span>
            </>
          ) : (
            <>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </>
          )}
        </h4>
        {!isCollapsed && (
          <>
            {" "}
            <div className="category-list">
              {categories.map((cat) => (
                <div key={cat.categoryId} className="category-row">
                  <span className="category-name">{cat.categoryName}</span>
                  <span className="actual-amount">
                    {formatCurrency(cat.actual)}
                  </span>
                  <span className="budget-amount">
                    {formatCurrency(cat.budget)}
                  </span>
                  <span className="reforecast-amount">
                    {formatCurrency(cat.reforecast)}
                  </span>
                  <span
                    className={`variance-amount ${getVarianceClass(
                      cat.variance
                    )}`}
                  >
                    {formatCurrency(cat.variance)}
                  </span>
                </div>
              ))}
            </div>{" "}
            <div className="group-total">
              <span className="total-label">Total {groupName}</span>
              <span className="actual-amount">
                {formatCurrency(total.actual)}
              </span>
              <span className="budget-amount">
                {formatCurrency(total.budget)}
              </span>
              <span className="reforecast-amount">
                {formatCurrency(total.reforecast)}
              </span>
              <span
                className={`variance-amount ${getVarianceClass(
                  total.variance
                )}`}
              >
                {formatCurrency(total.variance)}
              </span>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderSubGroup = (subGroup: any, monthNumber: number) => {
    const sectionKey = `${monthNumber}-${subGroup.name}`;
    const isCollapsed = collapsedSections[sectionKey];

    return (
      <div key={subGroup.id} className="category-group sub-group">
        {" "}
        <h5
          className="group-title collapsible"
          onClick={() => toggleSection(sectionKey)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleSection(sectionKey);
            }
          }}
        >
          <div className="group-header-cell">
            <span className="collapse-icon">{isCollapsed ? "▶" : "▼"}</span>
            <span className="group-name">{subGroup.name}</span>
          </div>{" "}
          {isCollapsed ? (
            <>
              <span className="inline-actual">
                {formatCurrency(subGroup.total.actual)}
              </span>
              <span className="inline-budget">
                {formatCurrency(subGroup.total.budget)}
              </span>
              <span className="inline-reforecast">
                {formatCurrency(subGroup.total.reforecast)}
              </span>
              <span
                className={`inline-variance ${getVarianceClass(
                  subGroup.total.variance
                )}`}
              >
                {formatCurrency(subGroup.total.variance)}
              </span>
            </>
          ) : (
            <>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </>
          )}
        </h5>
        {!isCollapsed && (
          <>
            {" "}
            <div className="category-list">
              {subGroup.categories.map((cat: any) => (
                <div key={cat.categoryId} className="category-row">
                  <span className="category-name">{cat.categoryName}</span>
                  <span className="actual-amount">
                    {formatCurrency(cat.actual)}
                  </span>
                  <span className="budget-amount">
                    {formatCurrency(cat.budget)}
                  </span>
                  <span className="reforecast-amount">
                    {formatCurrency(cat.reforecast)}
                  </span>
                  <span
                    className={`variance-amount ${getVarianceClass(
                      cat.variance
                    )}`}
                  >
                    {formatCurrency(cat.variance)}
                  </span>
                </div>
              ))}
            </div>
            <div className="group-total">
              {" "}
              <span className="total-label">Total {subGroup.name}</span>
              <span className="actual-amount">
                {formatCurrency(subGroup.total.actual)}
              </span>
              <span className="budget-amount">
                {formatCurrency(subGroup.total.budget)}
              </span>
              <span className="reforecast-amount">
                {formatCurrency(subGroup.total.reforecast)}
              </span>
              <span
                className={`variance-amount ${getVarianceClass(
                  subGroup.total.variance
                )}`}
              >
                {formatCurrency(subGroup.total.variance)}
              </span>
            </div>
          </>
        )}
      </div>
    );
  };

  // Function to get the forecast mode for a specific month
  const getMonthForecastMode = (month: number): boolean => {
    return state.monthlyForecastModes[state.selectedYear]?.[month] ?? false;
  };
  // Function to toggle forecast mode for a specific month
  const toggleMonthForecastMode = (month: number) => {
    const currentMode = getMonthForecastMode(month);
    dispatch({
      type: "SET_MONTHLY_FORECAST_MODE",
      payload: {
        year: state.selectedYear,
        month: month,
        isFinal: !currentMode,
      },
    });
  };

  // Function to calculate quarterly summary
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
  }; // Function to render quarterly summary card
  const renderQuarterlySummary = (
    monthsData: MonthlyData[],
    quarterName: string
  ) => {
    const summary = calculateQuarterlySummary(monthsData);
    const areAllFinal = areAllMonthsFinal(monthsData);

    return (
      <div className="month-card">
        <div className="month-header-summary">
          <h4>{quarterName} Summary</h4>
        </div>{" "}
        <div className="data-headers">
          <span className="header-category">Category</span>
          <span className="header-actual">Actual</span>
          <span className="header-budget">Budget</span>
          <span className="header-reforecast">Forecast</span>
          <span className="header-variance">Variance</span>
        </div>
        {/* Cost of Sales Group */}
        <div className="category-group">
          <h4 className="group-title collapsible">
            <div className="group-header-cell">
              <span className="group-name">Cost of Sales</span>
            </div>{" "}
            <span className="inline-actual">
              {formatCurrency(summary.costOfSales.actual)}
            </span>
            <span className="inline-budget">
              {formatCurrency(summary.costOfSales.budget)}
            </span>
            <span className="inline-reforecast">
              {formatCurrency(areAllFinal ? 0 : summary.costOfSales.reforecast)}
            </span>
            <span
              className={`inline-variance ${getVarianceClass(
                summary.costOfSales.variance
              )}`}
            >
              {formatCurrency(summary.costOfSales.variance)}
            </span>
          </h4>
        </div>
        {/* OpEx Group */}
        <div className="category-group">
          <h4 className="group-title collapsible">
            <div className="group-header-cell">
              <span className="group-name">OpEx</span>
            </div>{" "}
            <span className="inline-actual">
              {formatCurrency(summary.opex.actual)}
            </span>
            <span className="inline-budget">
              {formatCurrency(summary.opex.budget)}
            </span>
            <span className="inline-reforecast">
              {formatCurrency(areAllFinal ? 0 : summary.opex.reforecast)}
            </span>
            <span
              className={`inline-variance ${getVarianceClass(
                summary.opex.variance
              )}`}
            >
              {formatCurrency(summary.opex.variance)}
            </span>
          </h4>
        </div>
        {/* Net Total */}
        <div className="net-total">
          <span className="total-label">Net Total</span>{" "}
          <span className="actual-amount">
            {formatCurrency(summary.netTotal.actual)}
          </span>
          <span className="budget-amount">
            {formatCurrency(summary.netTotal.budget)}
          </span>
          <span className="reforecast-amount">
            {formatCurrency(areAllFinal ? 0 : summary.netTotal.reforecast)}
          </span>
          <span
            className={`variance-amount ${getVarianceClass(
              summary.netTotal.variance
            )}`}
          >
            {formatCurrency(summary.netTotal.variance)}
          </span>
        </div>{" "}
        {/* Adjustments */}{" "}
        <div className="adjustments">
          <span className="total-label">Adjustments</span>
          <span className="actual-amount">
            {formatCurrency(summary.adjustments.actual)}
          </span>
          <span className="budget-amount">-</span>{" "}
          <span className="reforecast-amount">
            {formatCurrency(areAllFinal ? 0 : summary.adjustments.reforecast)}
          </span>
          <span className="variance-amount">{formatCurrency(0)}</span>
        </div>
        {/* Tracking */}
        <div className="budget-tracking">
          <span className="total-label">Tracking</span>{" "}
          <span className="actual-amount">
            {formatCurrency(summary.budgetTracking.actual)}
          </span>
          <span className="budget-amount">
            {formatCurrency(summary.budgetTracking.budget)}
          </span>
          <span className="reforecast-amount">
            {formatCurrency(
              areAllFinal ? 0 : summary.budgetTracking.reforecast
            )}
          </span>
          <span
            className={`variance-amount ${getVarianceClass(
              summary.budgetTracking.variance
            )}`}
          >
            {formatCurrency(summary.budgetTracking.variance)}
          </span>
        </div>
      </div>
    );
  };

  // Group months into quarters for rendering
  const groupedMonths = [];
  for (let i = 0; i < monthlyData.length; i += 3) {
    const quarterMonths = monthlyData.slice(i, i + 3);
    if (quarterMonths.length > 0) {
      const firstMonth = quarterMonths[0].month;
      const quarterNumber = Math.ceil(firstMonth / 3);
      const quarterName = `Q${quarterNumber}`;
      groupedMonths.push({ months: quarterMonths, quarterName });
    }
  }
  return (
    <div className="monthly-view">
      <div className="month-grid">
        {groupedMonths.map((group, groupIndex) => (
          <React.Fragment key={groupIndex}>
            {group.months.map((month) => (
              <div key={month.month} className="month-card">
                {" "}
                <div className="month-header">
                  <h4>
                    {getMonthName(month.month)} {state.selectedYear}
                  </h4>
                  <div className="month-toggle-container">
                    <IOSToggle
                      isOn={getMonthForecastMode(month.month)}
                      onToggle={() => toggleMonthForecastMode(month.month)}
                      offLabel="Forecast"
                      onLabel="Final"
                    />
                  </div>
                </div>{" "}
                <div className="data-headers">
                  <span className="header-category">Category</span>
                  <span className="header-actual">Actual</span>
                  <span className="header-budget">Budget</span>
                  <span className="header-reforecast">Forecast</span>
                  <span className="header-variance">Variance</span>
                </div>{" "}
                {renderCategoryGroup(
                  "Cost of Sales",
                  month.costOfSales.categories,
                  month.costOfSales.total,
                  month.month
                )}
                {/* OpEx Section with subgroups - now collapsible */}
                <div className="category-group">
                  {" "}
                  <h4
                    className="group-title collapsible"
                    onClick={() => toggleSection(`${month.month}-OpEx`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleSection(`${month.month}-OpEx`);
                      }
                    }}
                  >
                    <div className="group-header-cell">
                      <span className="collapse-icon">
                        {collapsedSections[`${month.month}-OpEx`] ? "▶" : "▼"}
                      </span>
                      <span className="group-name">OpEx</span>
                    </div>{" "}
                    {collapsedSections[`${month.month}-OpEx`] ? (
                      <>
                        <span className="inline-actual">
                          {formatCurrency(month.opex.total.actual)}
                        </span>
                        <span className="inline-budget">
                          {formatCurrency(month.opex.total.budget)}
                        </span>
                        <span className="inline-reforecast">
                          {formatCurrency(month.opex.total.reforecast)}
                        </span>
                        <span
                          className={`inline-variance ${getVarianceClass(
                            month.opex.total.variance
                          )}`}
                        >
                          {formatCurrency(month.opex.total.variance)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                      </>
                    )}
                  </h4>
                  {!collapsedSections[`${month.month}-OpEx`] && (
                    <>
                      {/* Render subgroups first (Comp and Benefits) */}
                      {month.opex.subGroups &&
                        month.opex.subGroups.map((subGroup) =>
                          renderSubGroup(subGroup, month.month)
                        )}
                      {/* Render remaining OpEx categories */}
                      {month.opex.categories.map((cat) => (
                        <div key={cat.categoryId} className="category-row">
                          {" "}
                          <span className="category-name">
                            {cat.categoryName}
                          </span>
                          <span className="actual-amount">
                            {formatCurrency(cat.actual)}
                          </span>
                          <span className="budget-amount">
                            {formatCurrency(cat.budget)}
                          </span>
                          <span className="reforecast-amount">
                            {formatCurrency(cat.reforecast)}
                          </span>
                          <span
                            className={`variance-amount ${getVarianceClass(
                              cat.variance
                            )}`}
                          >
                            {formatCurrency(cat.variance)}
                          </span>
                        </div>
                      ))}
                      {/* OpEx Total */}{" "}
                      <div className="group-total">
                        <span className="total-label">Total OpEx</span>
                        <span className="actual-amount">
                          {formatCurrency(month.opex.total.actual)}
                        </span>
                        <span className="budget-amount">
                          {formatCurrency(month.opex.total.budget)}
                        </span>
                        <span className="reforecast-amount">
                          {formatCurrency(month.opex.total.reforecast)}
                        </span>
                        <span
                          className={`variance-amount ${getVarianceClass(
                            month.opex.total.variance
                          )}`}
                        >
                          {formatCurrency(month.opex.total.variance)}
                        </span>
                      </div>
                    </>
                  )}
                </div>{" "}
                <div className="net-total">
                  <span className="total-label">Net Total</span>
                  <span className="actual-amount">
                    {formatCurrency(month.netTotal.actual)}
                  </span>
                  <span className="budget-amount">
                    {formatCurrency(month.netTotal.budget)}
                  </span>
                  <span className="reforecast-amount">
                    {formatCurrency(month.netTotal.reforecast)}
                  </span>
                  <span
                    className={`variance-amount ${getVarianceClass(
                      month.netTotal.variance
                    )}`}
                  >
                    {formatCurrency(month.netTotal.variance)}
                  </span>{" "}
                </div>{" "}
                {/* Adjustments */}
                <div className="adjustments">
                  <span className="total-label">Adjustments</span>{" "}
                  <span className="actual-amount">
                    {formatCurrency(
                      getMonthForecastMode(month.month)
                        ? month.netTotal.adjustments
                        : 0
                    )}
                  </span>
                  <span className="budget-amount">{"-"}</span>
                  <span className="reforecast-amount">
                    {formatCurrency(
                      !getMonthForecastMode(month.month)
                        ? month.netTotal.adjustments
                        : 0
                    )}
                  </span>
                  <span className="variance-amount">{formatCurrency(0)}</span>
                </div>{" "}
                {/* Tracking */}{" "}
                <div className="budget-tracking">
                  <span className="total-label">Tracking</span>
                  <span className="actual-amount">
                    {formatCurrency(
                      getMonthForecastMode(month.month)
                        ? calculateBudgetTracking(
                            month.netTotal,
                            !getMonthForecastMode(month.month)
                          ).actual
                        : 0
                    )}
                  </span>
                  <span className="budget-amount">
                    {formatCurrency(
                      calculateBudgetTracking(
                        month.netTotal,
                        !getMonthForecastMode(month.month)
                      ).budget
                    )}
                  </span>
                  <span className="reforecast-amount">
                    {formatCurrency(
                      !getMonthForecastMode(month.month)
                        ? calculateBudgetTracking(
                            month.netTotal,
                            !getMonthForecastMode(month.month)
                          ).reforecast
                        : 0
                    )}
                  </span>
                  <span
                    className={`variance-amount ${getVarianceClass(
                      calculateBudgetTracking(
                        month.netTotal,
                        !getMonthForecastMode(month.month)
                      ).variance
                    )}`}
                  >
                    {formatCurrency(
                      calculateBudgetTracking(
                        month.netTotal,
                        !getMonthForecastMode(month.month)
                      ).variance
                    )}
                  </span>
                </div>
              </div>
            ))}
            {/* Render quarterly summary card */}
            {renderQuarterlySummary(group.months, group.quarterName)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default MonthlyView;
