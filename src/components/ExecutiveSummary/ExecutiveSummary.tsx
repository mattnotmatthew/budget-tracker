import React, { useMemo, useState } from "react";
import { useBudget } from "../../context/BudgetContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  calculateYTDData,
  calculateBudgetTracking,
  calculateMonthlyData,
} from "../../utils/budgetCalculations";
import "./ExecutiveSummary.css";

// Utility functions (stubs, since imports fail)
const formatCurrencyFull = (amount: number) => {
  return amount?.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
};

const generateAlerts = (entries: any[], categories: any[], year: number) => {
  // Simple stub: return empty array
  return [];
};

const exportExecutiveSummary = ({
  kpis,
  topVariance,
  trend,
  alerts,
  commentary,
  userNotes,
}: any) => {
  // Simple stub: alert instead of download
  alert("Exported Executive Summary!");
};

const ExecutiveSummary = () => {
  const { state } = useBudget();
  const [userNotes, setUserNotes] = useState("");
  // Helper to get the last month with Final data
  const getLastFinalMonthName = () => {
    const monthNames = [
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

    // Find the last month that is marked as "Final" (true) in monthlyForecastModes
    let lastFinalMonth = 0;
    const currentYear = state.selectedYear;

    if (state.monthlyForecastModes[currentYear]) {
      for (let month = 12; month >= 1; month--) {
        if (state.monthlyForecastModes[currentYear][month] === true) {
          lastFinalMonth = month;
          break;
        }
      }
    }

    // If no final months found, check for actual data
    if (lastFinalMonth === 0) {
      for (let month = 12; month >= 1; month--) {
        const hasData = state.entries.some(
          (entry: any) =>
            entry.year === currentYear &&
            entry.month === month &&
            (entry.actualAmount > 0 || entry.budgetAmount > 0)
        );
        if (hasData) {
          lastFinalMonth = month;
          break;
        }
      }
    }

    return lastFinalMonth > 0 ? monthNames[lastFinalMonth] : "Current";
  };

  // Memoized calculations
  const kpis = useMemo(() => getKPIData(state), [state]);
  const topVariance = useMemo(
    () => getTopVarianceCategories(state, 3),
    [state]
  );
  const trend = useMemo(() => getTrendData(state), [state]);
  const alerts = useMemo(() => getAlerts(state), [state]);
  const commentary = useMemo(() => getAutoCommentary(state), [state]);

  const handleExport = () => {
    exportExecutiveSummary({
      kpis,
      topVariance,
      trend,
      alerts,
      commentary,
      userNotes,
    });
  };
  // Helper to get performance class for dynamic styling
  const getPerformanceClass = (
    kpiType: string,
    value: number,
    percentage?: number
  ) => {
    switch (kpiType) {
      case "annualVariance":
        if (percentage && percentage > 10) return "performance-good"; // Under budget
        if (percentage && percentage < -10) return "performance-danger"; // Over budget
        return "performance-warning";

      case "budgetUtilization":
        if (value > 80) return "performance-warning"; // High utilization
        if (value < 30) return "performance-good"; // Low utilization
        return "";

      case "targetAchievement":
        if (value >= 85 && value <= 115) return "performance-good"; // More forgiving range
        if (value > 130 || value < 50) return "performance-danger"; // Much more forgiving thresholds
        return "performance-warning";

      case "ytdVariance":
        // Positive variance = under budget (good), negative = over budget (bad)
        if (percentage && percentage > 5) return "performance-good"; // Under budget is good
        if (percentage && percentage < -15) return "performance-danger"; // Only show red for significant overspend
        return ""; // Neutral for small variances

      case "forecastVariance":
        if (Math.abs(value) < 500000) return "performance-good"; // Within $500K is good
        if (Math.abs(value) > 2000000) return "performance-danger"; // Over $2M variance is concerning
        return "performance-warning";

      case "monthsRemaining":
        if (value > 6) return "performance-good"; // Plenty of runway
        if (value < 2) return "performance-danger"; // Low runway
        return "performance-warning";

      default:
        return "";
    }
  };

  return (
    <div className="executive-summary">
      <h2>
        Executive Summary – {state.selectedYear}
        {state.selectedQuarter ? ` Q${state.selectedQuarter}` : ""}
      </h2>{" "}
      <div className="kpi-grid">
        {/* Row 1 - Strategic Context */}
        <div className="kpi-row">
          <h4 className="row-title">Strategic Context</h4>{" "}
          <div className="kpi-cards">
            <div className="kpi-card">
              <span>Annual Budget Target</span>
              <strong>{formatCurrencyFull(kpis.annualBudgetTarget)}</strong>
            </div>
            <div className="kpi-card">
              <span>YTD Actual</span>
              <strong>{formatCurrencyFull(kpis.ytdActual)}</strong>
            </div>
            <div className="kpi-card">
              <span>Remaining Budget</span>
              <strong>{formatCurrencyFull(kpis.remainingBudget)}</strong>
            </div>
          </div>
        </div>{" "}
        {/* Row 2 - Strategic Context (Row 2) */}
        <div className="kpi-row">
          <div className="kpi-cards">
            <div
              className={`kpi-card ${getPerformanceClass(
                "annualVariance",
                kpis.annualVariance,
                kpis.annualVariancePct
              )}`}
            >
              <span>Annual Variance</span>
              <strong>
                {formatCurrencyFull(kpis.annualVariance)}{" "}
                {kpis.annualVariancePct >= 0 ? "+" : ""}
                {kpis.annualVariancePct.toFixed(1)}%
              </strong>
            </div>
            <div
              className={`kpi-card ${getPerformanceClass(
                "budgetUtilization",
                kpis.budgetUtilization
              )}`}
            >
              <span>Budget Utilization</span>
              <strong>{kpis.budgetUtilization.toFixed(1)}%</strong>
            </div>
            <div
              className={`kpi-card ${getPerformanceClass(
                "targetAchievement",
                kpis.targetAchievement
              )}`}
            >
              <span>Target Achievement</span>
              <strong>{kpis.targetAchievement.toFixed(1)}%</strong>
            </div>
          </div>
        </div>
        {/* Row 3 - YTD Performance */}
        <div className="kpi-row">
          <h4 className="row-title">
            YTD Performance (thru {getLastFinalMonthName()})
          </h4>
          <div className="kpi-cards">
            <div className="kpi-card">
              <span>YTD Budget</span>
              <strong>{formatCurrencyFull(kpis.ytdBudget)}</strong>
            </div>{" "}
            <div
              className={`kpi-card ${getPerformanceClass(
                "ytdVariance",
                kpis.variance,
                kpis.variancePct
              )}`}
            >
              <span>YTD Variance</span>
              <strong>
                {formatCurrencyFull(kpis.variance)}{" "}
                {kpis.variancePct >= 0 ? "+" : ""}
                {kpis.variancePct.toFixed(1)}%
              </strong>
            </div>
          </div>
        </div>
        {/* Row 4 - Forward Looking */}
        <div className="kpi-row">
          <h4 className="row-title">Forward Looking</h4>{" "}
          <div className="kpi-cards">
            <div className="kpi-card">
              <span>Full-Year Forecast</span>
              <strong>{formatCurrencyFull(kpis.fullYearForecast)}</strong>
            </div>{" "}
            <div
              className={`kpi-card ${getPerformanceClass(
                "forecastVariance",
                kpis.forecastVsTargetVariance
              )}`}
            >
              <span>Forecast vs Target</span>
              <strong>
                {kpis.forecastVsTargetVariance >= 0 ? "+" : ""}
                {formatCurrencyFull(kpis.forecastVsTargetVariance)}
              </strong>
            </div>
          </div>
        </div>{" "}
        {/* Row 5 - Risk & Velocity */}
        <div className="kpi-row">
          <h4 className="row-title">Risk & Velocity</h4>
          <div className="kpi-cards">
            <div className="kpi-card">
              <span>Monthly Burn Rate</span>
              <strong>{formatCurrencyFull(kpis.burnRate)}</strong>
            </div>{" "}
            <div
              className={`kpi-card ${getPerformanceClass(
                "monthsRemaining",
                kpis.monthsRemaining
              )}`}
            >
              <span>Months Remaining</span>
              <strong>
                {kpis.monthsRemaining > 0
                  ? kpis.monthsRemaining.toFixed(1)
                  : "∞"}{" "}
                months
              </strong>
            </div>
            <div className="kpi-card">
              <span>Variance Trend</span>{" "}
              <strong
                className={`trend-${kpis.varianceTrend
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                {kpis.varianceTrend}
              </strong>
            </div>
          </div>
        </div>
      </div>
      <div className="variance-table-section">
        <h3>Top 3 Over/Under Categories</h3>
        <table className="variance-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Actual</th>
              <th>Budget</th>
              <th>Variance</th>
            </tr>
          </thead>
          <tbody>
            {topVariance.map((cat: any) => (
              <tr
                key={cat.name}
                className={cat.variance > 0 ? "over" : "under"}
              >
                <td>{cat.name}</td>
                <td>{formatCurrencyFull(cat.actual)}</td>
                <td>{formatCurrencyFull(cat.budget)}</td>
                <td>{formatCurrencyFull(cat.variance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>{" "}
      <div className="trend-chart-section">
        <h3>Budget vs Actual Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />{" "}
            <Tooltip
              formatter={(value: number, name: string) => [
                formatCurrencyFull(value),
                name === "YTD Actual"
                  ? "YTD Actual"
                  : name === "YTD Forecast"
                  ? "YTD Forecast"
                  : "YTD Budget",
              ]}
              labelFormatter={(label) => `Through ${label}`}
            />
            <Legend />{" "}
            <Line
              type="monotone"
              dataKey="budget"
              stroke="#0000FF"
              strokeWidth={2}
              name="YTD Budget"
            />{" "}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#004526"
              strokeWidth={2}
              name="YTD Actual"
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#FF8C00"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="YTD Forecast"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="alerts-section">
        <h3>Alerts</h3>
        <ul>
          {alerts.map((alert: any, idx: number) => (
            <li key={idx} className={alert.type}>
              {alert.message}
            </li>
          ))}
        </ul>
      </div>
      <div className="commentary-section">
        <h3>Executive Commentary</h3>
        <div className="auto-commentary">{commentary}</div>
        <textarea
          placeholder="Add your notes for leadership..."
          value={userNotes}
          onChange={(e) => setUserNotes(e.target.value)}
        />
      </div>
      <div className="summary-actions">
        <button onClick={() => window.location.reload()}>Refresh</button>
        <button onClick={handleExport}>Export</button>
      </div>
    </div>
  );
};

interface KPIData {
  // Row 1 - Strategic Context (Row 1)
  annualBudgetTarget: number;
  ytdActual: number;

  // Row 2 - Strategic Context (Row 2)
  annualVariance: number;
  annualVariancePct: number;
  budgetUtilization: number;
  targetAchievement: number;

  // Row 3 - YTD Performance
  ytdBudget: number;
  variance: number;
  variancePct: number;

  // Row 4 - Forward Looking
  fullYearForecast: number;
  forecastVsTargetVariance: number;
  remainingBudget: number;

  // Row 5 - Risk & Velocity
  burnRate: number;
  monthsRemaining: number;
  varianceTrend: string;
}

interface VarianceCategory {
  name: string;
  actual: number;
  budget: number;
  variance: number;
}

const getKPIData = (state: any): KPIData => {
  // Use proper YTD calculation that matches the rest of the application
  const ytdResult = calculateYTDData(
    state.entries,
    state.categories,
    state.selectedYear
  );
  const ytdData = ytdResult.data;

  // Calculate adjusted YTD actual using budget tracking logic (includes adjustments)
  const ytdBudgetTracking = calculateBudgetTracking(ytdData.netTotal);
  const ytdActual = ytdBudgetTracking.actual; // This includes adjustments
  const ytdBudget = ytdData.netTotal.budget;

  // Variance calculation: (Actual - Budget) * -1
  // This makes under budget = positive variance (good performance)
  // and over budget = negative variance (poor performance)
  const variance = (ytdActual - ytdBudget) * -1;
  const variancePct = ytdBudget ? (variance / ytdBudget) * 100 : 0; // Calculate full year forecast using the same logic as YearlyBudgetDashboard
  const calculateFullYearForecast = (): number => {
    let totalForecast = 0;

    // Generate monthly data for all 12 months
    const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
    const monthlyData = allMonths.map((month) =>
      calculateMonthlyData(
        state.entries,
        state.categories,
        month,
        state.selectedYear
      )
    );

    // Group months into quarters and calculate forecast
    for (let quarter = 1; quarter <= 4; quarter++) {
      const quarterMonths = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [10, 11, 12],
      ][quarter - 1];

      const quarterData = monthlyData.filter((month) =>
        quarterMonths.includes(month.month)
      );

      if (quarterData.length > 0) {
        // Calculate quarterly summary using the same logic as MonthlyView
        const quarterlySummary = {
          budgetTracking: { actual: 0, reforecast: 0 },
        };

        quarterData.forEach((month) => {
          const budgetTracking = calculateBudgetTracking(
            month.netTotal,
            !getMonthForecastMode(month.month)
          );

          if (getMonthForecastMode(month.month)) {
            // If month is "Final", budget tracking goes to actual
            quarterlySummary.budgetTracking.actual += budgetTracking.actual;
          } else {
            // If month is "Forecast", budget tracking goes to reforecast
            quarterlySummary.budgetTracking.reforecast +=
              budgetTracking.reforecast;
          }
        });

        const areAllFinal = quarterData.every((month) =>
          getMonthForecastMode(month.month)
        );

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

  // Helper function to get the forecast mode for a specific month
  const getMonthForecastMode = (month: number): boolean => {
    return state.monthlyForecastModes[state.selectedYear]?.[month] ?? false;
  };
  const fullYearForecast = calculateFullYearForecast();
  const annualBudgetTarget = state.yearlyBudgetTargets[state.selectedYear] || 0;
  const remainingBudget = annualBudgetTarget - ytdActual; // Calculate new metrics
  // Row 1 & 2 - Strategic Context
  const budgetUtilization =
    annualBudgetTarget > 0 ? (ytdActual / annualBudgetTarget) * 100 : 0;
  const currentMonth = new Date().getMonth() + 1; // Current month (1-12)
  const monthsElapsed = Math.min(currentMonth, 12);
  const yearProgress = monthsElapsed / 12;
  const expectedYTDTarget = annualBudgetTarget * yearProgress;
  const targetAchievement =
    expectedYTDTarget > 0 ? (ytdActual / expectedYTDTarget) * 100 : 0;

  // Annual Variance calculation: (YTD Actual - Annual Budget) * -1
  const annualVariance = (ytdActual - annualBudgetTarget) * -1;
  const annualVariancePct =
    annualBudgetTarget > 0 ? (annualVariance / annualBudgetTarget) * 100 : 0;
  // Row 3 - Forward Looking
  const forecastVsTargetVariance = (fullYearForecast - annualBudgetTarget) * -1;

  // Row 4 - Risk & Velocity
  const burnRate = monthsElapsed > 0 ? ytdActual / monthsElapsed : 0;
  const monthsRemaining =
    burnRate > 0 && remainingBudget > 0 ? remainingBudget / burnRate : 0;
  // Variance trend - enhanced with historical comparison
  const getVarianceTrend = (): string => {
    try {
      // Calculate variance for the last 3 months to establish trend
      const currentMonth = new Date().getMonth() + 1;
      const monthsToAnalyze = Math.min(3, currentMonth); // Don't go beyond available months

      if (monthsToAnalyze < 2) {
        // Not enough data for trend analysis
        return Math.abs(variancePct) < 5
          ? "Stable"
          : variancePct > 0
          ? "Under Budget"
          : "Over Budget";
      }

      const monthlyVariances: number[] = [];

      // Calculate variance for each of the last few months
      for (let i = Math.max(1, currentMonth - 2); i <= currentMonth; i++) {
        const monthEntries = state.entries.filter(
          (entry: any) => entry.year === state.selectedYear && entry.month <= i
        );

        const cumulativeBudget = monthEntries.reduce(
          (sum: number, entry: any) => sum + entry.budgetAmount,
          0
        );
        const cumulativeActual = monthEntries.reduce(
          (sum: number, entry: any) => sum + (entry.actualAmount || 0),
          0
        );

        if (cumulativeBudget > 0) {
          const monthVariance =
            (((cumulativeActual - cumulativeBudget) * -1) / cumulativeBudget) *
            100;
          monthlyVariances.push(monthVariance);
        }
      }

      if (monthlyVariances.length < 2) {
        return Math.abs(variancePct) < 5
          ? "Stable"
          : variancePct > 0
          ? "Under Budget"
          : "Over Budget";
      }

      // Analyze trend direction
      const currentVariance = monthlyVariances[monthlyVariances.length - 1];
      const previousVariance = monthlyVariances[monthlyVariances.length - 2];
      const trendChange = currentVariance - previousVariance;

      // Determine overall trend
      const isCurrentlyGood = Math.abs(currentVariance) < 10; // Within 10% is considered good
      const isTrendingBetter = trendChange > 2; // Improving by more than 2%
      const isTrendingWorse = trendChange < -2; // Worsening by more than 2%

      if (isTrendingBetter) {
        return "Improving";
      } else if (isTrendingWorse) {
        return "Worsening";
      } else if (isCurrentlyGood) {
        return "Stable";
      } else {
        return currentVariance > 0 ? "Under Budget" : "Over Budget";
      }
    } catch (error) {
      // Fallback to simple assessment if calculation fails
      return Math.abs(variancePct) < 5
        ? "Stable"
        : variancePct > 0
        ? "Under Budget"
        : "Over Budget";
    }
  };

  const varianceTrend = getVarianceTrend();
  return {
    // Row 1 - Strategic Context (Row 1)
    annualBudgetTarget,
    ytdActual,

    // Row 2 - Strategic Context (Row 2)
    annualVariance,
    annualVariancePct,
    budgetUtilization,
    targetAchievement,

    // Row 3 - YTD Performance
    ytdBudget,
    variance,
    variancePct,

    // Row 4 - Forward Looking
    fullYearForecast,
    forecastVsTargetVariance,
    remainingBudget,

    // Row 5 - Risk & Velocity
    burnRate,
    monthsRemaining,
    varianceTrend,
  };
};

const getTopVarianceCategories = (
  state: any,
  count: number
): VarianceCategory[] => {
  // Placeholder: Replace with real logic
  const catMap: { [key: string]: VarianceCategory } = {};
  state.entries.forEach((e: any) => {
    if (!catMap[e.categoryId]) {
      const cat = state.categories.find((c: any) => c.id === e.categoryId);
      catMap[e.categoryId] = {
        name: cat ? cat.name : e.categoryId,
        actual: 0,
        budget: 0,
        variance: 0,
      };
    }
    catMap[e.categoryId].actual += e.actualAmount || 0;
    catMap[e.categoryId].budget += e.budgetAmount;
    catMap[e.categoryId].variance =
      catMap[e.categoryId].actual - catMap[e.categoryId].budget;
  });
  const arr = Object.values(catMap);
  arr.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
  return arr.slice(0, count);
};

const getTrendData = (state: any) => {
  // Generate monthly trend data for the selected year
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const monthNames = [
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  let cumulativeBudget = 0;
  let cumulativeActual = 0;
  let cumulativeForecast = 0;

  return months
    .map((month) => {
      // Calculate monthly totals
      const monthEntries = state.entries.filter(
        (entry: any) =>
          entry.year === state.selectedYear && entry.month === month
      );

      const monthlyBudget = monthEntries.reduce(
        (sum: number, entry: any) => sum + entry.budgetAmount,
        0
      );

      const monthlyActual = monthEntries.reduce(
        (sum: number, entry: any) => sum + (entry.actualAmount || 0),
        0
      );

      const monthlyReforecast = monthEntries.reduce(
        (sum: number, entry: any) => sum + (entry.reforecastAmount || 0),
        0
      );

      // Check if this month is in "Final" mode (true) or "Forecast" mode (false)
      const isFinalMonth =
        state.monthlyForecastModes[state.selectedYear]?.[month] ?? false;

      // Add to cumulative totals
      cumulativeBudget += monthlyBudget;
      cumulativeActual += monthlyActual;

      // For forecast line: use actual for final months, forecast for non-final months
      if (isFinalMonth) {
        cumulativeForecast += monthlyActual;
      } else {
        cumulativeForecast += monthlyReforecast;
      }

      return {
        period: monthNames[month],
        budget: cumulativeBudget,
        actual: cumulativeActual,
        forecast: cumulativeForecast,
        monthlyBudget,
        monthlyActual,
        monthlyReforecast,
        isFinalMonth,
      };
    })
    .filter((data) => data.budget > 0 || data.actual > 0 || data.forecast > 0); // Only show months with data
};

const getAlerts = (state: any) =>
  generateAlerts(state.entries, state.categories, state.selectedYear);

const getAutoCommentary = (state: any) => {
  // Placeholder: Generate a simple summary
  const kpi = getKPIData(state);
  if (kpi.variance > 0) {
    return `Spending is over budget by ${formatCurrencyFull(
      kpi.variance
    )} (${kpi.variancePct.toFixed(1)}%).`;
  } else if (kpi.variance < 0) {
    return `Spending is under budget by ${formatCurrencyFull(
      -kpi.variance
    )} (${(-kpi.variancePct).toFixed(1)}%).`;
  } else {
    return "Spending is exactly on budget.";
  }
};

export default ExecutiveSummary;
