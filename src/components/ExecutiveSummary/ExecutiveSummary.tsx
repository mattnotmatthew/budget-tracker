import React, { useMemo, useState } from "react";
import { useBudget } from "../../context/BudgetContext";
import {
  ComposedChart,
  Bar,
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
  const [isStrategicContextExpanded, setIsStrategicContextExpanded] =
    useState(false);
  const [isYTDPerformanceExpanded, setIsYTDPerformanceExpanded] =
    useState(false);
  const [isForwardLookingExpanded, setIsForwardLookingExpanded] =
    useState(false);
  const [isRiskVelocityExpanded, setIsRiskVelocityExpanded] = useState(false);
  const [trendTableCollapsed, setTrendTableCollapsed] = useState(true);
  const [
    totalCompCapitalizationCollapsed,
    setTotalCompCapitalizationCollapsed,
  ] = useState(true);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    content: any;
    x: number;
    y: number;
    showBelow?: boolean;
  }>({
    visible: false,
    content: null,
    x: 0,
    y: 0,
    showBelow: false,
  });

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
  }; // Memoized calculations
  const kpis = useMemo(() => getKPIData(state), [state]);
  const topVariance = useMemo(
    () => getTopVarianceCategories(state, 3),
    [state]
  );
  const trend = useMemo(() => getTrendData(state), [state]);
  const alerts = useMemo(() => getAlerts(state), [state]);
  const commentary = useMemo(() => getAutoCommentary(state), [state]);

  // Resource allocation data calculation
  const getResourceData = () => {
    const ytdData = calculateYTDData(
      state.entries,
      state.categories,
      state.selectedYear
    ).data;

    // Find base pay and capitalized salaries categories
    const basePayCategory = state.categories.find(
      (cat) => cat.id === "opex-base-pay"
    );
    const capSalariesCategory = state.categories.find(
      (cat) => cat.id === "opex-capitalized-salaries"
    ); // Get YTD data for base pay and capitalized salaries
    const basePayData = ytdData.opex.subGroups
      .find((sg: any) => sg.id === "ytd-comp-and-benefits")
      ?.categories.find((cat: any) => cat.categoryId === "opex-base-pay") || {
      actual: 0,
      budget: 0,
    };

    const capSalariesData = ytdData.opex.subGroups
      .find((sg: any) => sg.id === "ytd-comp-and-benefits")
      ?.categories.find(
        (cat: any) => cat.categoryId === "opex-capitalized-salaries"
      ) || { actual: 0, budget: 0 }; // Get all compensation categories from Comp and Benefits subgroup
    const compBenefitsSubgroup = ytdData.opex.subGroups.find(
      (sg: any) => sg.id === "ytd-comp-and-benefits"
    );
    const totalCompYTD = compBenefitsSubgroup?.total.actual || 0;

    // Calculate ANNUAL budget for all compensation categories (full year, not just YTD)
    const compAndBenefitsCategories = [
      "opex-base-pay",
      "opex-capitalized-salaries",
      "opex-commissions",
      "opex-reclass-cogs",
      "opex-bonus",
      "opex-benefits",
      "opex-payroll-taxes",
      "opex-other-compensation",
    ];

    const totalCompAnnualBudget = compAndBenefitsCategories.reduce(
      (total, categoryId) => {
        // Sum budget amounts for all 12 months for this category
        const categoryAnnualBudget = state.entries
          .filter(
            (entry) =>
              entry.categoryId === categoryId &&
              entry.year === state.selectedYear
          )
          .reduce((sum, entry) => sum + entry.budgetAmount, 0);
        return total + categoryAnnualBudget;
      },
      0
    );

    // Calculate monthly averages
    const monthsElapsed = calculateYTDData(
      state.entries,
      state.categories,
      state.selectedYear
    ).lastMonthWithActuals;
    const basePayMonthly =
      monthsElapsed > 0 ? basePayData.actual / monthsElapsed : 0;
    const capSalariesMonthly =
      monthsElapsed > 0 ? capSalariesData.actual / monthsElapsed : 0;

    // Calculate metrics
    const basePayUtilization =
      basePayData.budget > 0
        ? (basePayData.actual / basePayData.budget) * 100
        : 0;
    const capSalariesOffset =
      basePayData.actual > 0
        ? (Math.abs(capSalariesData.actual) / basePayData.actual) * 100
        : 0; // Hiring capacity calculations
    // Note: If budget already accounts for capitalized salaries as offsets,
    // we should NOT add them back (they're already reflected in the net budget)
    const netCompAvailable = totalCompAnnualBudget - totalCompYTD;
    const estimatedHiringBudget = netCompAvailable * 0.75; // Conservative 75% available for hiring
    const avgNewHireComp = 120000; // $120k average annual compensation
    const potentialHires = Math.floor(estimatedHiringBudget / avgNewHireComp);
    const currentCompBurnRate =
      monthsElapsed > 0 ? totalCompYTD / monthsElapsed : 0;
    const monthsRunway =
      currentCompBurnRate > 0 ? netCompAvailable / currentCompBurnRate : 12;

    // Calculate last 3-month average for more accurate projection
    const getLastThreeMonthsAverage = () => {
      if (monthsElapsed < 3) return currentCompBurnRate;

      // Get the last 3 months with data
      const lastThreeMonthsStart = Math.max(1, monthsElapsed - 2);
      const lastThreeMonthsSpend = compAndBenefitsCategories.reduce(
        (total, categoryId) => {
          const categorySpend = state.entries
            .filter(
              (entry) =>
                entry.categoryId === categoryId &&
                entry.year === state.selectedYear &&
                entry.month >= lastThreeMonthsStart &&
                entry.month <= monthsElapsed
            )
            .reduce((sum, entry) => sum + (entry.actualAmount || 0), 0);
          return total + categorySpend;
        },
        0
      );

      const monthsInPeriod = monthsElapsed - lastThreeMonthsStart + 1;
      return monthsInPeriod > 0 ? lastThreeMonthsSpend / monthsInPeriod : 0;
    };
    const lastThreeMonthAvg = getLastThreeMonthsAverage();
    const remainingMonths = 12 - monthsElapsed;
    const projectedRemainingSpend = lastThreeMonthAvg * remainingMonths;
    const projectedTotalSpend = totalCompYTD + projectedRemainingSpend;
    const budgetVsProjection =
      (projectedTotalSpend - totalCompAnnualBudget) * -1;
    const isProjectedOverBudget = budgetVsProjection < 0;

    return {
      totalCompensation: {
        ytdActual: totalCompYTD,
        annualBudget: totalCompAnnualBudget,
        remaining: totalCompAnnualBudget - totalCompYTD,
      },
      basePay: {
        ytdActual: basePayData.actual,
        monthlyAverage: basePayMonthly,
        utilization: basePayUtilization,
      },
      capitalizedSalaries: {
        ytdActual: capSalariesData.actual,
        monthlyAverage: capSalariesMonthly,
        offsetRate: capSalariesOffset,
      },
      hiringCapacity: {
        netCompensationAvailable: netCompAvailable,
        estimatedHiringBudget: estimatedHiringBudget,
        potentialNewHires: potentialHires,
        monthsOfRunway: monthsRunway,
        lastThreeMonthAverage: lastThreeMonthAvg,
        projectedRemainingSpend: projectedRemainingSpend,
        budgetVsProjection: budgetVsProjection,
        isProjectedOverBudget: isProjectedOverBudget,
        remainingMonths: remainingMonths,
      },
    };
  };

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

  // Helper to generate tooltip content for each KPI
  const getKPITooltipContent = (kpiType: string, kpis: any) => {
    const currentMonth = new Date().getMonth() + 1;
    const monthsElapsed = Math.min(currentMonth, 12);
    const yearProgress = monthsElapsed / 12;

    switch (kpiType) {
      case "annualBudgetTarget":
        return {
          definition: "The total budget allocated for the entire fiscal year",
          interpretation: `Your organization has set aside ${formatCurrencyFull(
            kpis.annualBudgetTarget
          )} as the target budget for ${state.selectedYear}`,
          formula: "Annual Budget Target",
          calculation: `${formatCurrencyFull(
            kpis.annualBudgetTarget
          )} (set target)`,
        };

      case "ytdActual":
        return {
          definition:
            "Total amount actually spent from the beginning of the fiscal year to date",
          interpretation: `You have spent ${formatCurrencyFull(
            kpis.ytdActual
          )} so far this year, which is ${(
            (kpis.ytdActual / kpis.annualBudgetTarget) *
            100
          ).toFixed(1)}% of your annual budget`,
          formula: "Sum of all actual expenses YTD",
          calculation: `${formatCurrencyFull(
            kpis.ytdActual
          )} (actual spend through ${getLastFinalMonthName()})`,
        };

      case "remainingBudget":
        return {
          definition: "Amount of annual budget still available to spend",
          interpretation: `You have ${formatCurrencyFull(
            kpis.remainingBudget
          )} remaining to spend, which should last ${kpis.monthsRemaining.toFixed(
            1
          )} months at current spending rate`,
          formula: "Annual Budget Target - YTD Actual",
          calculation: `${formatCurrencyFull(
            kpis.annualBudgetTarget
          )} - ${formatCurrencyFull(kpis.ytdActual)} = ${formatCurrencyFull(
            kpis.remainingBudget
          )}`,
        };

      case "annualVariance":
        const isUnder = kpis.annualVariancePct > 0;
        return {
          definition:
            "Difference between YTD actual spending and annual budget target",
          interpretation: `You are currently ${
            isUnder ? "under" : "over"
          } your annual budget by ${formatCurrencyFull(
            Math.abs(kpis.annualVariance)
          )} (${Math.abs(kpis.annualVariancePct).toFixed(1)}%)`,
          formula: "(YTD Actual - Annual Budget Target) × -1",
          calculation: `(${formatCurrencyFull(
            kpis.ytdActual
          )} - ${formatCurrencyFull(
            kpis.annualBudgetTarget
          )}) × -1 = ${formatCurrencyFull(kpis.annualVariance)}`,
        };

      case "budgetUtilization":
        return {
          definition: "Percentage of annual budget consumed year-to-date",
          interpretation: `You have used ${kpis.budgetUtilization.toFixed(
            1
          )}% of your annual budget in ${monthsElapsed} months`,
          formula: "(YTD Actual ÷ Annual Budget Target) × 100",
          calculation: `(${formatCurrencyFull(
            kpis.ytdActual
          )} ÷ ${formatCurrencyFull(
            kpis.annualBudgetTarget
          )}) × 100 = ${kpis.budgetUtilization.toFixed(1)}%`,
        };

      case "targetAchievement":
        const expectedSpend = kpis.annualBudgetTarget * yearProgress;
        return {
          definition:
            "How well you're pacing toward your annual budget target based on time elapsed",
          interpretation: `You're spending at ${kpis.targetAchievement.toFixed(
            1
          )}% of the pace needed to reach your annual target`,
          formula: "(YTD Actual ÷ Expected YTD Target) × 100",
          calculation: `(${formatCurrencyFull(
            kpis.ytdActual
          )} ÷ ${formatCurrencyFull(
            expectedSpend
          )}) × 100 = ${kpis.targetAchievement.toFixed(1)}%`,
        };

      case "ytdBudget":
        return {
          definition:
            "Total amount planned to be spent from beginning of fiscal year to date",
          interpretation: `You planned to spend ${formatCurrencyFull(
            kpis.ytdBudget
          )} by this point in the year`,
          formula: "Sum of all budgeted amounts YTD",
          calculation: `${formatCurrencyFull(
            kpis.ytdBudget
          )} (planned spend through ${getLastFinalMonthName()})`,
        };

      case "ytdVariance":
        const ytdIsUnder = kpis.variancePct > 0;
        return {
          definition:
            "Difference between YTD actual spending and YTD planned budget",
          interpretation: `You are ${
            ytdIsUnder ? "under" : "over"
          } your YTD budget by ${formatCurrencyFull(
            Math.abs(kpis.variance)
          )} (${Math.abs(kpis.variancePct).toFixed(1)}%)`,
          formula: "(YTD Actual - YTD Budget) × -1",
          calculation: `(${formatCurrencyFull(
            kpis.ytdActual
          )} - ${formatCurrencyFull(
            kpis.ytdBudget
          )}) × -1 = ${formatCurrencyFull(kpis.variance)}`,
        };

      case "fullYearForecast":
        return {
          definition:
            "Projected total spending for the entire fiscal year based on current data",
          interpretation: `Based on current trends, you're projected to spend ${formatCurrencyFull(
            kpis.fullYearForecast
          )} by year-end`,
          formula: "Sum of actual (final months) + forecast (non-final months)",
          calculation: `${formatCurrencyFull(
            kpis.fullYearForecast
          )} (calculated using IOSToggle states)`,
        };

      case "forecastVsTarget":
        const forecastIsUnder = kpis.forecastVsTargetVariance > 0;
        return {
          definition:
            "Difference between full-year forecast and annual budget target",
          interpretation: `You're projected to finish ${
            forecastIsUnder ? "under" : "over"
          } target by ${formatCurrencyFull(
            Math.abs(kpis.forecastVsTargetVariance)
          )}`,
          formula: "(Full-Year Forecast - Annual Budget Target) × -1",
          calculation: `(${formatCurrencyFull(
            kpis.fullYearForecast
          )} - ${formatCurrencyFull(
            kpis.annualBudgetTarget
          )}) × -1 = ${formatCurrencyFull(kpis.forecastVsTargetVariance)}`,
        };

      case "burnRate":
        return {
          definition: "Average amount spent per month year-to-date",
          interpretation: `You're spending an average of ${formatCurrencyFull(
            kpis.burnRate
          )} per month`,
          formula: "YTD Actual ÷ Months Elapsed",
          calculation: `${formatCurrencyFull(
            kpis.ytdActual
          )} ÷ ${monthsElapsed} months = ${formatCurrencyFull(kpis.burnRate)}`,
        };

      case "monthsRemaining":
        return {
          definition:
            "How many months the remaining budget will last at current spending rate",
          interpretation: `At your current burn rate, you have ${kpis.monthsRemaining.toFixed(
            1
          )} months of budget remaining`,
          formula: "Remaining Budget ÷ Monthly Burn Rate",
          calculation: `${formatCurrencyFull(
            kpis.remainingBudget
          )} ÷ ${formatCurrencyFull(
            kpis.burnRate
          )} = ${kpis.monthsRemaining.toFixed(1)} months`,
        };

      case "varianceTrend":
        return {
          definition:
            "Direction of budget variance performance over recent months",
          interpretation: `Your budget performance trend is "${kpis.varianceTrend}" based on recent variance patterns`,
          formula: "Historical variance analysis over last 2-3 months",
          calculation: `${kpis.varianceTrend} (calculated from monthly variance trends)`,
        };

      default:
        return {
          definition: "Key performance indicator",
          interpretation: "This metric helps track budget performance",
          formula: "N/A",
          calculation: "N/A",
        };
    }
  }; // Tooltip event handlers
  const handleMouseEnter = (event: React.MouseEvent, kpiType: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const content = getKPITooltipContent(kpiType, kpis);

    // Simple but reliable positioning logic
    const tooltipHeight = 320;
    const minSpaceRequired = 350; // Total space needed above element

    // Check space above the element in viewport
    const spaceAbove = rect.top;
    const shouldShowBelow = spaceAbove < minSpaceRequired;
    // Position tooltip
    const tooltipY = shouldShowBelow
      ? rect.bottom + 15 // Show below with more spacing
      : rect.top - 15; // Show above with more spacing

    setTooltip({
      visible: true,
      content,
      x: rect.left + rect.width / 2,
      y: tooltipY,
      showBelow: shouldShowBelow,
    });
  };
  const handleMouseLeave = () => {
    setTooltip({
      visible: false,
      content: null,
      x: 0,
      y: 0,
      showBelow: false,
    });
  };

  // Helper to generate tooltip content for hiring runway metrics
  const getHiringTooltipContent = (metricType: string) => {
    const resourceData = getResourceData();
    const monthsElapsed = calculateYTDData(
      state.entries,
      state.categories,
      state.selectedYear
    ).lastMonthWithActuals;

    switch (metricType) {
      case "netCompAvailable":
        return {
          definition:
            "Amount of annual compensation budget still available to spend",
          interpretation: `You have ${formatCurrencyFull(
            resourceData.hiringCapacity.netCompensationAvailable
          )} remaining from your annual compensation budget of ${formatCurrencyFull(
            resourceData.totalCompensation.annualBudget
          )}`,
          formula: "Annual Compensation Budget - YTD Actual Spend",
          calculation: `${formatCurrencyFull(
            resourceData.totalCompensation.annualBudget
          )} - ${formatCurrencyFull(
            resourceData.totalCompensation.ytdActual
          )} = ${formatCurrencyFull(
            resourceData.hiringCapacity.netCompensationAvailable
          )}`,
        };

      case "lastThreeMonthAvg":
        return {
          definition:
            "Average monthly compensation spend over the most recent 3-month period",
          interpretation: `Your recent compensation spending trend is ${formatCurrencyFull(
            resourceData.hiringCapacity.lastThreeMonthAverage
          )} per month, which may differ from your overall YTD average`,
          formula: "Sum of last 3 months compensation spend ÷ 3",
          calculation: `${formatCurrencyFull(
            resourceData.hiringCapacity.lastThreeMonthAverage
          )}/month (based on months ${Math.max(
            1,
            monthsElapsed - 2
          )} through ${monthsElapsed})`,
        };

      case "remainingMonths":
        return {
          definition: "Number of months remaining in the current fiscal year",
          interpretation: `There are ${resourceData.hiringCapacity.remainingMonths} months left in ${state.selectedYear} for compensation spending and hiring decisions`,
          formula: "12 - Months Elapsed",
          calculation: `12 - ${monthsElapsed} = ${resourceData.hiringCapacity.remainingMonths} months`,
        };

      case "projectedRemainingSpend":
        return {
          definition:
            "Estimated compensation spend for the remainder of the fiscal year",
          interpretation: `If you continue spending at the recent 3-month average pace, you'll spend ${formatCurrencyFull(
            resourceData.hiringCapacity.projectedRemainingSpend
          )} in the remaining ${
            resourceData.hiringCapacity.remainingMonths
          } months`,
          formula: "Last 3-Month Average × Remaining Months",
          calculation: `${formatCurrencyFull(
            resourceData.hiringCapacity.lastThreeMonthAverage
          )} × ${
            resourceData.hiringCapacity.remainingMonths
          } = ${formatCurrencyFull(
            resourceData.hiringCapacity.projectedRemainingSpend
          )}`,
        };
      case "projectedTotalSpend":
        const ytdActualCompensation = resourceData.totalCompensation.ytdActual;
        const totalProjectedSpend =
          ytdActualCompensation +
          resourceData.hiringCapacity.projectedRemainingSpend;
        return {
          definition:
            "Estimated total compensation spend for the entire fiscal year",
          interpretation: `Based on current trends, you're projected to spend ${formatCurrencyFull(
            totalProjectedSpend
          )} total on compensation this year`,
          formula: "YTD Actual + Projected Remaining Spend",
          calculation: `${formatCurrencyFull(
            ytdActualCompensation
          )} + ${formatCurrencyFull(
            resourceData.hiringCapacity.projectedRemainingSpend
          )} = ${formatCurrencyFull(totalProjectedSpend)}`,
        };
      case "budgetVsProjection":
        const isUnder = resourceData.hiringCapacity.budgetVsProjection > 0;
        const fullYearProjection =
          resourceData.totalCompensation.ytdActual +
          resourceData.hiringCapacity.projectedRemainingSpend;
        return {
          definition:
            "Difference between annual budget and projected total spend (positive = under budget)",
          interpretation: `You are projected to finish ${
            isUnder ? "under" : "over"
          } budget by ${formatCurrencyFull(
            Math.abs(resourceData.hiringCapacity.budgetVsProjection)
          )}, ${
            isUnder
              ? "providing additional hiring capacity"
              : "requiring budget adjustments or spending cuts"
          }`,
          formula: "(Projected Total Spend - Annual Compensation Budget) × -1",
          calculation: `(${formatCurrencyFull(
            fullYearProjection
          )} - ${formatCurrencyFull(
            resourceData.totalCompensation.annualBudget
          )}) × -1 = ${formatCurrencyFull(
            resourceData.hiringCapacity.budgetVsProjection
          )}`,
        };

      default:
        return {
          definition: "Hiring runway metric",
          interpretation:
            "This metric helps track compensation budget and hiring capacity",
          formula: "N/A",
          calculation: "N/A",
        };
    }
  };

  // Hiring tooltip event handlers
  const handleHiringMouseEnter = (
    event: React.MouseEvent,
    metricType: string
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const content = getHiringTooltipContent(metricType);

    // Simple but reliable positioning logic
    const tooltipHeight = 320;
    const minSpaceRequired = 350;

    const spaceAbove = rect.top;
    const shouldShowBelow = spaceAbove < minSpaceRequired;

    const tooltipY = shouldShowBelow ? rect.bottom + 15 : rect.top - 15;

    setTooltip({
      visible: true,
      content,
      x: rect.left + rect.width / 2,
      y: tooltipY,
      showBelow: shouldShowBelow,
    });
  };
  const handleHiringMouseLeave = () => {
    setTooltip({
      visible: false,
      content: null,
      x: 0,
      y: 0,
      showBelow: false,
    });
  };

  return (
    <div className="executive-summary">
      <h2>
        Executive Summary – {state.selectedYear}
        {state.selectedQuarter ? ` Q${state.selectedQuarter}` : ""}
      </h2>{" "}
      <div className="kpi-grid">
        {/* Strategic Context - Collapsible */}
        <div className="kpi-section strategic-context">
          <div
            className="section-header"
            onClick={() =>
              setIsStrategicContextExpanded(!isStrategicContextExpanded)
            }
          >
            {" "}
            <h4 className="section-title">
              <span className="expand-icon">
                {isStrategicContextExpanded ? "−" : "+"}
              </span>
              Strategic Context
            </h4>
            {!isStrategicContextExpanded && (
              <div className="compact-summary">
                <span className="compact-metric">
                  Budget:{" "}
                  <strong>{formatCurrencyFull(kpis.annualBudgetTarget)}</strong>
                </span>
                <span className="compact-metric">
                  YTD: <strong>{formatCurrencyFull(kpis.ytdActual)}</strong>
                </span>
                <span className="compact-metric">
                  Remaining:{" "}
                  <strong>{formatCurrencyFull(kpis.remainingBudget)}</strong>
                </span>
              </div>
            )}
          </div>

          {isStrategicContextExpanded && (
            <>
              {/* Row 1 - Strategic Context */}
              <div className="kpi-row">
                <div className="kpi-cards">
                  <div
                    className="kpi-card"
                    onMouseEnter={(e) =>
                      handleMouseEnter(e, "annualBudgetTarget")
                    }
                    onMouseLeave={handleMouseLeave}
                  >
                    <span>Annual Budget Target</span>
                    <strong>
                      {formatCurrencyFull(kpis.annualBudgetTarget)}
                    </strong>
                  </div>
                  <div
                    className="kpi-card"
                    onMouseEnter={(e) => handleMouseEnter(e, "ytdActual")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <span>YTD Actual</span>
                    <strong>{formatCurrencyFull(kpis.ytdActual)}</strong>
                  </div>
                  <div
                    className="kpi-card"
                    onMouseEnter={(e) => handleMouseEnter(e, "remainingBudget")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <span>Remaining Budget</span>
                    <strong>{formatCurrencyFull(kpis.remainingBudget)}</strong>
                  </div>
                </div>
              </div>

              {/* Row 2 - Strategic Context (Row 2) */}
              <div className="kpi-row">
                <div className="kpi-cards">
                  <div
                    className={`kpi-card ${getPerformanceClass(
                      "annualVariance",
                      kpis.annualVariance,
                      kpis.annualVariancePct
                    )}`}
                    onMouseEnter={(e) => handleMouseEnter(e, "annualVariance")}
                    onMouseLeave={handleMouseLeave}
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
                    onMouseEnter={(e) =>
                      handleMouseEnter(e, "budgetUtilization")
                    }
                    onMouseLeave={handleMouseLeave}
                  >
                    <span>Budget Utilization</span>
                    <strong>{kpis.budgetUtilization.toFixed(1)}%</strong>
                  </div>
                  <div
                    className={`kpi-card ${getPerformanceClass(
                      "targetAchievement",
                      kpis.targetAchievement
                    )}`}
                    onMouseEnter={(e) =>
                      handleMouseEnter(e, "targetAchievement")
                    }
                    onMouseLeave={handleMouseLeave}
                  >
                    <span>Target Achievement</span>
                    <strong>{kpis.targetAchievement.toFixed(1)}%</strong>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>{" "}
        {/* YTD Performance - Collapsible */}
        <div className="kpi-section ytd-performance">
          <div
            className="section-header"
            onClick={() =>
              setIsYTDPerformanceExpanded(!isYTDPerformanceExpanded)
            }
          >
            {" "}
            <h4 className="section-title">
              <span className="expand-icon">
                {isYTDPerformanceExpanded ? "−" : "+"}
              </span>
              YTD Performance (thru {getLastFinalMonthName()})
            </h4>
            {!isYTDPerformanceExpanded && (
              <div className="compact-summary">
                <span className="compact-metric">
                  Budget: <strong>{formatCurrencyFull(kpis.ytdBudget)}</strong>
                </span>
                <span className="compact-metric">
                  Variance:{" "}
                  <strong>
                    {formatCurrencyFull(kpis.variance)} (
                    {kpis.variancePct >= 0 ? "+" : ""}
                    {kpis.variancePct.toFixed(1)}%)
                  </strong>
                </span>
              </div>
            )}
          </div>

          {isYTDPerformanceExpanded && (
            <div className="kpi-row">
              <div className="kpi-cards">
                <div
                  className="kpi-card"
                  onMouseEnter={(e) => handleMouseEnter(e, "ytdBudget")}
                  onMouseLeave={handleMouseLeave}
                >
                  <span>YTD Budget</span>
                  <strong>{formatCurrencyFull(kpis.ytdBudget)}</strong>
                </div>
                <div
                  className={`kpi-card ${getPerformanceClass(
                    "ytdVariance",
                    kpis.variance,
                    kpis.variancePct
                  )}`}
                  onMouseEnter={(e) => handleMouseEnter(e, "ytdVariance")}
                  onMouseLeave={handleMouseLeave}
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
          )}
        </div>{" "}
        {/* Forward Looking - Collapsible */}
        <div className="kpi-section forward-looking">
          <div
            className="section-header"
            onClick={() =>
              setIsForwardLookingExpanded(!isForwardLookingExpanded)
            }
          >
            {" "}
            <h4 className="section-title">
              <span className="expand-icon">
                {isForwardLookingExpanded ? "−" : "+"}
              </span>
              Forward Looking
            </h4>
            {!isForwardLookingExpanded && (
              <div className="compact-summary">
                <span className="compact-metric">
                  Forecast:{" "}
                  <strong>{formatCurrencyFull(kpis.fullYearForecast)}</strong>
                </span>
                <span className="compact-metric">
                  vs Target:{" "}
                  <strong>
                    {kpis.forecastVsTargetVariance >= 0 ? "+" : ""}
                    {formatCurrencyFull(kpis.forecastVsTargetVariance)}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {isForwardLookingExpanded && (
            <div className="kpi-row">
              <div className="kpi-cards">
                <div
                  className="kpi-card"
                  onMouseEnter={(e) => handleMouseEnter(e, "fullYearForecast")}
                  onMouseLeave={handleMouseLeave}
                >
                  <span>Full-Year Forecast</span>
                  <strong>{formatCurrencyFull(kpis.fullYearForecast)}</strong>
                </div>
                <div
                  className={`kpi-card ${getPerformanceClass(
                    "forecastVariance",
                    kpis.forecastVsTargetVariance
                  )}`}
                  onMouseEnter={(e) => handleMouseEnter(e, "forecastVsTarget")}
                  onMouseLeave={handleMouseLeave}
                >
                  <span>Forecast vs Target</span>
                  <strong>
                    {kpis.forecastVsTargetVariance >= 0 ? "+" : ""}
                    {formatCurrencyFull(kpis.forecastVsTargetVariance)}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Risk & Velocity - Collapsible */}
        <div className="kpi-section risk-velocity">
          <div
            className="section-header"
            onClick={() => setIsRiskVelocityExpanded(!isRiskVelocityExpanded)}
          >
            <h4 className="section-title">
              <span className="expand-icon">
                {isRiskVelocityExpanded ? "−" : "+"}
              </span>
              Risk & Velocity
            </h4>
            {!isRiskVelocityExpanded && (
              <div className="compact-summary">
                <span className="compact-metric">
                  Burn Rate:{" "}
                  <strong>{formatCurrencyFull(kpis.burnRate)}</strong>
                </span>
                <span className="compact-metric">
                  Months Left:{" "}
                  <strong>
                    {kpis.monthsRemaining > 0
                      ? kpis.monthsRemaining.toFixed(1)
                      : "∞"}{" "}
                    months
                  </strong>
                </span>
              </div>
            )}
          </div>
          {isRiskVelocityExpanded && (
            <div className="kpi-row">
              <div className="kpi-cards">
                <div
                  className="kpi-card"
                  onMouseEnter={(e) => handleMouseEnter(e, "burnRate")}
                  onMouseLeave={handleMouseLeave}
                >
                  <span>Monthly Burn Rate</span>
                  <strong>{formatCurrencyFull(kpis.burnRate)}</strong>
                </div>
                <div
                  className={`kpi-card ${getPerformanceClass(
                    "monthsRemaining",
                    kpis.monthsRemaining
                  )}`}
                  onMouseEnter={(e) => handleMouseEnter(e, "monthsRemaining")}
                  onMouseLeave={handleMouseLeave}
                >
                  <span>Months Remaining</span>
                  <strong>
                    {kpis.monthsRemaining > 0
                      ? kpis.monthsRemaining.toFixed(1)
                      : "∞"}{" "}
                    months
                  </strong>
                </div>
                <div
                  className="kpi-card"
                  onMouseEnter={(e) => handleMouseEnter(e, "varianceTrend")}
                  onMouseLeave={handleMouseLeave}
                >
                  <span>Variance Trend</span>
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
          )}{" "}
        </div>
      </div>{" "}
      <div className="trend-chart-section">
        <div className="trend-chart-header">
          <h3>Budget vs Actual Trend</h3>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis
              tickFormatter={(value) =>
                `$${(value / 1000).toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}k`
              }
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatCurrencyFull(value),
                name === "Budget"
                  ? "Budget Target"
                  : name === "Actual"
                  ? "Actual Spend"
                  : name === "Forecast"
                  ? "Forecast Spend"
                  : name === "Adj Actual"
                  ? "Adj Actual Spend"
                  : name === "Adj Forecast"
                  ? "Adj Forecast Spend"
                  : name,
              ]}
              labelFormatter={(label) => `Through ${label}`}
            />
            <Legend />

            {/* Budget as bar */}
            <Bar
              dataKey="budget"
              fill="#2D78FB"
              name="Budget Target"
              barSize={30}
              opacity={0.5}
            />

            {/* Actual spending line */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#33CA7F"
              strokeWidth={4}
              strokeDasharray="5 1"
              name="Actual Spend"
              connectNulls={false}
            />

            {/* Forecast spending line */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#FF8C00"
              strokeWidth={4}
              strokeDasharray="5 1"
              name="Forecast Spend"
              connectNulls={false}
            />

            {/* Adjusted actual line */}
            <Line
              type="monotone"
              dataKey="adjActual"
              stroke="#8B0000"
              strokeWidth={4}
              name="Adj Actual"
              connectNulls={false}
            />

            {/* Adjusted forecast line */}
            <Line
              type="monotone"
              dataKey="adjForecast"
              stroke="#9932CC"
              strokeWidth={4}
              name="Adj Forecast"
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {/* Trend Data Table - Collapsible */}
      <div className="trend-data-table-section">
        <div
          className="collapsible-header"
          onClick={() => setTrendTableCollapsed(!trendTableCollapsed)}
          style={{ cursor: "pointer" }}
        >
          <h3>{trendTableCollapsed ? "+" : "−"} Trend Chart Data</h3>
        </div>
        {!trendTableCollapsed && (
          <div className="trend-data-table">
            <table className="trend-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Budget</th>
                  <th>Actual</th>
                  <th>Forecast</th>
                  <th>Adj Actual</th>
                  <th>Adj Forecast</th>
                </tr>
              </thead>{" "}
              <tbody>
                {trend.map((data, index) => (
                  <tr key={index}>
                    <td>{data.period}</td>
                    <td>{formatCurrencyFull(data.budget)}</td>
                    <td>
                      {data.actual ? formatCurrencyFull(data.actual) : "-"}
                    </td>
                    <td>
                      {data.forecast ? formatCurrencyFull(data.forecast) : "-"}
                    </td>
                    <td>
                      {data.adjActual
                        ? formatCurrencyFull(data.adjActual)
                        : "-"}
                    </td>
                    <td>
                      {data.adjForecast
                        ? formatCurrencyFull(data.adjForecast)
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Divider between Trend Chart Data and Resource Allocation */}
      <div className="section-divider"></div>
      <div className="resource-allocation-section">
        <h2>Resource Allocation & Hiring Capacity</h2>{" "}
        <div className="resource-overview">
          <div className="hiring-capacity-analysis-section">
            <div className="hiring-analysis-header">
              <h2>Hiring Runway Analysis</h2>
            </div>
            <div className="capacity-table">
              <div
                className="capacity-row"
                onMouseEnter={(e) =>
                  handleHiringMouseEnter(e, "netCompAvailable")
                }
                onMouseLeave={handleHiringMouseLeave}
              >
                <span className="capacity-label">
                  Net Compensation Available
                </span>
                <span className="capacity-value">
                  {formatCurrencyFull(
                    getResourceData().hiringCapacity.netCompensationAvailable
                  )}
                </span>
                <span className="capacity-note">
                  Annual compensation budget minus YTD actual spend
                </span>
              </div>
              <div
                className="capacity-row"
                onMouseEnter={(e) =>
                  handleHiringMouseEnter(e, "lastThreeMonthAvg")
                }
                onMouseLeave={handleHiringMouseLeave}
              >
                <span className="capacity-label">Last 3-Month Average</span>
                <span className="capacity-value">
                  {formatCurrencyFull(
                    getResourceData().hiringCapacity.lastThreeMonthAverage
                  )}
                  /month
                </span>
                <span className="capacity-note">
                  Recent monthly compensation spend trend
                </span>
              </div>
              <div
                className="capacity-row"
                onMouseEnter={(e) =>
                  handleHiringMouseEnter(e, "remainingMonths")
                }
                onMouseLeave={handleHiringMouseLeave}
              >
                <span className="capacity-label">Remaining Months</span>
                <span className="capacity-value">
                  {getResourceData().hiringCapacity.remainingMonths} months
                </span>
                <span className="capacity-note">
                  Months left in fiscal year
                </span>
              </div>{" "}
              <div
                className="capacity-row"
                onMouseEnter={(e) =>
                  handleHiringMouseEnter(e, "projectedRemainingSpend")
                }
                onMouseLeave={handleHiringMouseLeave}
              >
                <span className="capacity-label">
                  Projected Remaining Spend
                </span>
                <span className="capacity-value">
                  {formatCurrencyFull(
                    getResourceData().hiringCapacity.projectedRemainingSpend
                  )}
                </span>
                <span className="capacity-note">
                  {getResourceData().hiringCapacity.remainingMonths} months ×
                  3-month average
                </span>
              </div>{" "}
              <div
                className="capacity-row"
                onMouseEnter={(e) =>
                  handleHiringMouseEnter(e, "projectedTotalSpend")
                }
                onMouseLeave={handleHiringMouseLeave}
              >
                <span className="capacity-label">Projected Total Spend</span>
                <span className="capacity-value">
                  {formatCurrencyFull(
                    getResourceData().totalCompensation.ytdActual +
                      getResourceData().hiringCapacity.projectedRemainingSpend
                  )}
                </span>
                <span className="capacity-note">
                  YTD actual + projected remaining spend
                </span>
              </div>{" "}
              <div
                className={`capacity-row ${
                  getResourceData().hiringCapacity.budgetVsProjection > 0
                    ? "budget-under"
                    : "budget-over"
                }`}
                onMouseEnter={(e) =>
                  handleHiringMouseEnter(e, "budgetVsProjection")
                }
                onMouseLeave={handleHiringMouseLeave}
              >
                <span className="capacity-label">Budget vs Projection</span>
                <span
                  className={`capacity-value ${
                    getResourceData().hiringCapacity.budgetVsProjection > 0
                      ? "value-positive"
                      : "value-negative"
                  }`}
                >
                  {getResourceData().hiringCapacity.budgetVsProjection >= 0
                    ? "+"
                    : ""}
                  {formatCurrencyFull(
                    getResourceData().hiringCapacity.budgetVsProjection
                  )}
                </span>{" "}
                <span className="capacity-note">
                  {getResourceData().hiringCapacity.budgetVsProjection < 0
                    ? "Projected total spend exceeds annual budget - budget adjustments needed"
                    : "Projected total spend under annual budget - additional hiring capacity available"}
                </span>{" "}
              </div>
            </div>
          </div>
        </div>
      </div>{" "}
      {/* Total Comp & Capitalization Section */}
      <div className="total-comp-capitalization-section">
        <div
          className="collapsible-header"
          onClick={() =>
            setTotalCompCapitalizationCollapsed(
              !totalCompCapitalizationCollapsed
            )
          }
          style={{ cursor: "pointer" }}
        >
          <h4>
            {totalCompCapitalizationCollapsed ? "+" : "−"} Total Comp &
            Capitalization
          </h4>
        </div>

        {totalCompCapitalizationCollapsed && (
          <div className="comp-summary-line">
            <span className="summary-label">Total Compensation:</span>
            <span className="summary-values">
              YTD:{" "}
              {formatCurrencyFull(
                getResourceData().totalCompensation.ytdActual
              )}{" "}
              | Budget:{" "}
              {formatCurrencyFull(
                getResourceData().totalCompensation.annualBudget
              )}{" "}
              | Remaining:{" "}
              {formatCurrencyFull(
                getResourceData().totalCompensation.remaining
              )}
            </span>
          </div>
        )}

        {!totalCompCapitalizationCollapsed && (
          <div className="resource-summary-cards">
            <div className="resource-card total-compensation">
              <h4>Total Compensation</h4>
              <div className="resource-metrics">
                <div className="metric">
                  <span className="metric-label">YTD Actual</span>
                  <span className="metric-value">
                    {formatCurrencyFull(
                      getResourceData().totalCompensation.ytdActual
                    )}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Annual Budget</span>
                  <span className="metric-value">
                    {formatCurrencyFull(
                      getResourceData().totalCompensation.annualBudget
                    )}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Remaining</span>
                  <span className="metric-value remaining">
                    {formatCurrencyFull(
                      getResourceData().totalCompensation.remaining
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="resource-card capitalized-salaries">
              <h4>Capitalized Salaries</h4>
              <div className="resource-metrics">
                <div className="metric">
                  <span className="metric-label">YTD Actual</span>
                  <span className="metric-value">
                    {formatCurrencyFull(
                      Math.abs(getResourceData().capitalizedSalaries.ytdActual)
                    )}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Monthly Avg</span>
                  <span className="metric-value">
                    {formatCurrencyFull(
                      Math.abs(
                        getResourceData().capitalizedSalaries.monthlyAverage
                      )
                    )}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Offset Rate</span>{" "}
                  <span className="metric-value">
                    {getResourceData().capitalizedSalaries.offsetRate.toFixed(
                      1
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
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
      </div>{" "}
      <div className="commentary-section">
        <div className="commentary-header">
          <h3>Executive Commentary</h3>
        </div>
        <div className="auto-commentary">{commentary}</div>
        <textarea
          placeholder="Add your notes for leadership..."
          value={userNotes}
          onChange={(e) => setUserNotes(e.target.value)}
        />
      </div>{" "}
      <div className="summary-actions">
        <button onClick={() => window.location.reload()}>Refresh</button>
        <button onClick={handleExport}>Export</button>
      </div>{" "}
      {/* Tooltip */}
      {tooltip.visible && tooltip.content && (
        <div
          className={`kpi-tooltip ${tooltip.showBelow ? "show-below" : ""}`}
          style={{
            position: "fixed",
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: tooltip.showBelow
              ? "translateX(-50%)"
              : "translateX(-50%) translateY(-100%)",
            zIndex: 1000,
            pointerEvents: "none",
          }}
        >
          <div className="tooltip-content">
            <h4>{tooltip.content.definition}</h4>
            <p className="interpretation">{tooltip.content.interpretation}</p>
            <div className="formula-section">
              <strong>Formula:</strong> {tooltip.content.formula}
            </div>
            <div className="calculation-section">
              <strong>Calculation:</strong> {tooltip.content.calculation}
            </div>
          </div>
        </div>
      )}
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
  let cumulativeAdjActual = 0;
  let cumulativeAdjForecast = 0;

  const trendData = months
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

      const monthlyAdjustments = monthEntries.reduce(
        (sum: number, entry: any) => sum + (entry.adjustmentAmount || 0),
        0
      );

      const monthlyReforecast = monthEntries.reduce(
        (sum: number, entry: any) => sum + (entry.reforecastAmount || 0),
        0
      );

      // Check if this month is in "Final" mode (true) or "Forecast" mode (false)
      const isFinalMonth =
        state.monthlyForecastModes[state.selectedYear]?.[month] ?? false; // Add to cumulative totals
      cumulativeBudget += monthlyBudget; // Only add to cumulative actual if this month is final
      if (isFinalMonth) {
        cumulativeActual += monthlyActual;
      }

      // Only add to cumulative adjusted actual if this month is final (subtract adjustments)
      if (isFinalMonth) {
        cumulativeAdjActual += monthlyActual - monthlyAdjustments;
      }

      // For forecast: build cumulative total including actuals from final months + forecasts from forecast months
      if (isFinalMonth) {
        cumulativeForecast += monthlyActual; // Add actuals from final months to build the base
      } else {
        cumulativeForecast += monthlyReforecast; // Add reforecasts from forecast months
      }

      // For adjusted forecast: build cumulative total including adjusted actuals from final months + adjusted forecasts from forecast months
      if (isFinalMonth) {
        cumulativeAdjForecast += monthlyActual - monthlyAdjustments; // Add adjusted actuals from final months to build the base
      } else {
        cumulativeAdjForecast += monthlyReforecast - monthlyAdjustments; // Add adjusted reforecasts from forecast months
      }
      return {
        period: monthNames[month],
        budget: cumulativeBudget,
        actual: isFinalMonth ? cumulativeActual : null, // Only show actual for final months
        forecast: !isFinalMonth ? cumulativeForecast : null, // Only show forecast for forecast months
        adjActual: isFinalMonth ? cumulativeAdjActual : null, // Only show adjusted actual for final months
        adjForecast: !isFinalMonth ? cumulativeAdjForecast : null, // Only show adjusted forecast for forecast months
        monthlyBudget,
        monthlyActual,
        monthlyAdjustments,
        monthlyReforecast,
        isFinalMonth,
      };
    })
    .filter(
      (data) =>
        data.budget > 0 ||
        (data.actual && data.actual > 0) ||
        (data.forecast && data.forecast > 0) ||
        (data.adjActual && data.adjActual > 0) ||
        (data.adjForecast && data.adjForecast > 0)
    ); // Only show months with data

  return trendData;
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
