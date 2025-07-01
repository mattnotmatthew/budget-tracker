import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBudget } from "../../context/BudgetContext";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import ExportCustomizer from "../ExportCustomizer/ExportCustomizer";
import "./ExecutiveSummary.css";

// Import our modular utilities
import {
  getKPIData,
  getTopVarianceCategories,
  formatCurrencyFull,
  getLastFinalMonthName,
  KPIData,
  VarianceCategory,
} from "./utils/kpiCalculations";
import { formatCurrencyExcelStyle } from "../../utils/currencyFormatter";
import { getResourceData, ResourceData } from "./utils/resourceCalculations";
import {
  getVendorTrackingData,
  getTotalVendorSpend,
} from "./utils/vendorCalculations";
import { getTrendData, TrendDataPoint } from "./utils/trendCalculations";
import {
  getKPITooltipContent,
  getHiringTooltipContent,
  getVendorTooltipContent,
  getVendorPortfolioTooltipContent,
} from "./utils/tooltipUtils";
import { generateIntelligentSummary } from "./utils/summaryGenerator";
import {
  generateAlerts,
  handleBasicExport,
  handlePrintExport,
} from "./utils/exportUtils";

// Import components
import Tooltip from "./components/Tooltip";
import KPICard from "./components/KPICard";
import VendorPortfolioSection from "./components/VendorPortfolioSection";

// Import vendor portfolio CSS
import "./components/VendorPortfolio.css";

interface TooltipState {
  visible: boolean;
  content: any;
  x: number;
  y: number;
  showBelow?: boolean;
}

const ExecutiveSummary = () => {
  const { state } = useBudget();
  const navigate = useNavigate();

  // State for UI toggles
  const [isStrategicContextExpanded, setIsStrategicContextExpanded] =
    useState(false);
  const [isYTDPerformanceExpanded, setIsYTDPerformanceExpanded] =
    useState(false);
  const [isForwardLookingExpanded, setIsForwardLookingExpanded] =
    useState(false);
  const [isRiskVelocityExpanded, setIsRiskVelocityExpanded] = useState(false);
  const [isVendorSpendingExpanded, setIsVendorSpendingExpanded] =
    useState(true);
  const [isVendorPortfolioExpanded, setIsVendorPortfolioExpanded] =
    useState(false);
  const [trendTableCollapsed, setTrendTableCollapsed] = useState(true);
  const [monthlyTrendTableCollapsed, setMonthlyTrendTableCollapsed] =
    useState(true);
  const [rollingTrendTableCollapsed, setRollingTrendTableCollapsed] =
    useState(true);
  const [
    totalCompCapitalizationCollapsed,
    setTotalCompCapitalizationCollapsed,
  ] = useState(true);

  // Tooltip state - initialize with invalid coordinates to prevent flash
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    content: null,
    x: -9999, // Use invalid coordinates to prevent initial render
    y: -9999,
    showBelow: false,
  });

  // Export state
  const [showExportCustomizer, setShowExportCustomizer] = useState(false);
  const [currentExportTemplate, setCurrentExportTemplate] = useState(null);

  // Memoized calculations
  const kpis = useMemo(() => getKPIData(state), [state]);
  const topVariance = useMemo(
    () => getTopVarianceCategories(state, 3),
    [state]
  );
  const trend = useMemo(() => getTrendData(state), [state]);
  const resourceData = useMemo(() => getResourceData(state), [state]);
  const vendorData = useMemo(() => getVendorTrackingData(state), [state]);
  const alerts = useMemo(
    () => generateAlerts(state.entries, state.categories, state.selectedYear),
    [state.entries, state.categories, state.selectedYear]
  );

  // Generate intelligent summary
  const intelligentSummary = useMemo(() => {
    return generateIntelligentSummary(state, kpis);
  }, [state.entries, state.categories, state.selectedYear, kpis]);

  // User notes state - initialize with intelligent summary
  const [userNotes, setUserNotes] = useState(intelligentSummary);

  // Update userNotes when intelligent summary changes (e.g., year change)
  useEffect(() => {
    setUserNotes(intelligentSummary);
  }, [intelligentSummary]);

  // Get distinct finance mapped categories from both vendor tracking and vendor budget data
  const getDistinctFinanceMappedCategories = useMemo(() => {
    const categories = new Set<string>();

    // Add categories from vendor tracking data
    const vendorTrackingData =
      state.vendorTrackingData?.filter(
        (tracking) => tracking.year === state.selectedYear
      ) || [];

    vendorTrackingData.forEach((tracking) => {
      if (tracking.financeMappedCategory?.trim()) {
        categories.add(tracking.financeMappedCategory.trim());
      }
    });

    // Add categories from vendor budget data
    const vendorBudgetData =
      state.vendorData?.filter(
        (vendor) => vendor.year === state.selectedYear
      ) || [];

    vendorBudgetData.forEach((vendor) => {
      if (vendor.financeMappedCategory?.trim()) {
        categories.add(vendor.financeMappedCategory.trim());
      }
    });

    // Convert to sorted array
    return Array.from(categories).sort((a, b) => a.localeCompare(b));
  }, [state.vendorTrackingData, state.vendorData, state.selectedYear]);

  // Calculate vendor budget amounts by category and month
  const getVendorBudgetByCategory = useMemo(() => {
    const budgetByCategory: Record<string, Record<string, number>> = {};

    const vendorBudgetData =
      state.vendorData?.filter(
        (vendor) => vendor.year === state.selectedYear
      ) || [];

    vendorBudgetData.forEach((vendor) => {
      const category = vendor.financeMappedCategory?.trim();
      if (!category) return;

      if (!budgetByCategory[category]) {
        budgetByCategory[category] = {
          jan: 0,
          feb: 0,
          mar: 0,
          apr: 0,
          may: 0,
          jun: 0,
          jul: 0,
          aug: 0,
          sep: 0,
          oct: 0,
          nov: 0,
          dec: 0,
        };
      }

      // VendorData has budget per month entry, so we need to map month to budget
      const monthLower = vendor.month?.toLowerCase();
      if (monthLower && budgetByCategory[category][monthLower] !== undefined) {
        budgetByCategory[category][monthLower] += vendor.budget || 0;
      }
    });

    return budgetByCategory;
  }, [state.vendorData, state.selectedYear]);

  // Calculate vendor actual amounts by category and month
  const getVendorActualByCategory = useMemo(() => {
    const actualByCategory: Record<string, Record<string, number>> = {};

    const vendorTrackingData =
      state.vendorTrackingData?.filter(
        (tracking) => tracking.year === state.selectedYear
      ) || [];

    vendorTrackingData.forEach((tracking) => {
      const category = tracking.financeMappedCategory?.trim();
      if (!category) return;

      if (!actualByCategory[category]) {
        actualByCategory[category] = {
          jan: 0,
          feb: 0,
          mar: 0,
          apr: 0,
          may: 0,
          jun: 0,
          jul: 0,
          aug: 0,
          sep: 0,
          oct: 0,
          nov: 0,
          dec: 0,
        };
      }

      // Sum actual amounts from tracking data
      actualByCategory[category].jan += parseFloat(tracking.jan) || 0;
      actualByCategory[category].feb += parseFloat(tracking.feb) || 0;
      actualByCategory[category].mar += parseFloat(tracking.mar) || 0;
      actualByCategory[category].apr += parseFloat(tracking.apr) || 0;
      actualByCategory[category].may += parseFloat(tracking.may) || 0;
      actualByCategory[category].jun += parseFloat(tracking.jun) || 0;
      actualByCategory[category].jul += parseFloat(tracking.jul) || 0;
      actualByCategory[category].aug += parseFloat(tracking.aug) || 0;
      actualByCategory[category].sep += parseFloat(tracking.sep) || 0;
      actualByCategory[category].oct += parseFloat(tracking.oct) || 0;
      actualByCategory[category].nov += parseFloat(tracking.nov) || 0;
      actualByCategory[category].dec += parseFloat(tracking.dec) || 0;
    });

    return actualByCategory;
  }, [state.vendorTrackingData, state.selectedYear]);

  // Calculate totals for budget and actual across all categories
  const getVendorTotalsByMonth = useMemo(() => {
    const totals = {
      budget: {
        jan: 0,
        feb: 0,
        mar: 0,
        apr: 0,
        may: 0,
        jun: 0,
        jul: 0,
        aug: 0,
        sep: 0,
        oct: 0,
        nov: 0,
        dec: 0,
      },
      actual: {
        jan: 0,
        feb: 0,
        mar: 0,
        apr: 0,
        may: 0,
        jun: 0,
        jul: 0,
        aug: 0,
        sep: 0,
        oct: 0,
        nov: 0,
        dec: 0,
      },
    };

    // Sum budget totals
    Object.values(getVendorBudgetByCategory).forEach((categoryBudget) => {
      Object.entries(categoryBudget).forEach(([month, amount]) => {
        totals.budget[month as keyof typeof totals.budget] += amount;
      });
    });

    // Sum actual totals
    Object.values(getVendorActualByCategory).forEach((categoryActual) => {
      Object.entries(categoryActual).forEach(([month, amount]) => {
        totals.actual[month as keyof typeof totals.actual] += amount;
      });
    });

    return totals;
  }, [getVendorBudgetByCategory, getVendorActualByCategory]);

  // Get the last final month number for vendor table display
  const getLastFinalMonthNumber = useMemo(() => {
    const currentYear = state.selectedYear;
    let lastFinalMonth = 0;

    if (state.monthlyForecastModes && state.monthlyForecastModes[currentYear]) {
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
        const hasActualData = state.entries.some(
          (entry: any) =>
            entry.year === currentYear &&
            entry.month === month &&
            entry.actualAmount !== null &&
            entry.actualAmount !== undefined &&
            entry.actualAmount !== 0
        );
        if (hasActualData) {
          lastFinalMonth = month;
          break;
        }
      }
    }

    // Default to current month if no data found
    return lastFinalMonth > 0 ? lastFinalMonth : new Date().getMonth() + 1;
  }, [state.monthlyForecastModes, state.selectedYear, state.entries]);

  // Generate month columns based on final month
  const getVendorTableMonths = useMemo(() => {
    const allMonths = [
      { short: "jan", long: "Jan", number: 1 },
      { short: "feb", long: "Feb", number: 2 },
      { short: "mar", long: "Mar", number: 3 },
      { short: "apr", long: "Apr", number: 4 },
      { short: "may", long: "May", number: 5 },
      { short: "jun", long: "Jun", number: 6 },
      { short: "jul", long: "Jul", number: 7 },
      { short: "aug", long: "Aug", number: 8 },
      { short: "sep", long: "Sep", number: 9 },
      { short: "oct", long: "Oct", number: 10 },
      { short: "nov", long: "Nov", number: 11 },
      { short: "dec", long: "Dec", number: 12 },
    ];

    return allMonths.filter((month) => month.number <= getLastFinalMonthNumber);
  }, [getLastFinalMonthNumber]);

  // Calculate quarter groupings for header
  const getQuarterGroups = useMemo(() => {
    const quarters: Array<{
      quarter: number;
      months: Array<{ short: string; long: string; number: number }>;
    }> = [];
    let currentQuarter = 1;
    let quarterMonths: Array<{ short: string; long: string; number: number }> =
      [];

    getVendorTableMonths.forEach((month) => {
      const monthQuarter = Math.ceil(month.number / 3);
      if (monthQuarter === currentQuarter) {
        quarterMonths.push(month);
      } else {
        if (quarterMonths.length > 0) {
          quarters.push({ quarter: currentQuarter, months: quarterMonths });
        }
        currentQuarter = monthQuarter;
        quarterMonths = [month];
      }
    });

    if (quarterMonths.length > 0) {
      quarters.push({ quarter: currentQuarter, months: quarterMonths });
    }

    return quarters;
  }, [getVendorTableMonths]);

  // Tooltip event handlers
  const handleMouseEnter = (event: React.MouseEvent, kpiType: string) => {
    const content = getKPITooltipContent(kpiType, kpis, state);

    const tooltipHeight = 320;
    const minSpaceRequired = 350;
    const spaceAbove = event.clientY;
    const shouldShowBelow = spaceAbove < minSpaceRequired;

    setTooltip({
      visible: true,
      content,
      x: event.clientX, // Use exact mouse X position
      y: event.clientY, // Use exact mouse Y position
      showBelow: shouldShowBelow,
    });
  };

  const handleMouseMove = (event: React.MouseEvent, kpiType: string) => {
    // Update tooltip position if it's already visible
    if (tooltip.visible && tooltip.content) {
      const tooltipHeight = 320;
      const minSpaceRequired = 350;
      const spaceAbove = event.clientY;
      const shouldShowBelow = spaceAbove < minSpaceRequired;

      setTooltip((prev) => ({
        ...prev,
        x: event.clientX,
        y: event.clientY,
        showBelow: shouldShowBelow,
      }));
    }
  };

  const handleMouseLeave = () => {
    setTooltip({
      visible: false,
      content: null,
      x: -9999, // Use invalid coordinates to prevent flash
      y: -9999,
      showBelow: false,
    });
  };

  // Hiring tooltip handlers
  const handleHiringMouseEnter = (
    event: React.MouseEvent,
    metricType: string
  ) => {
    const monthsElapsed = Math.min(new Date().getMonth() + 1, 12);
    const content = getHiringTooltipContent(
      metricType,
      resourceData,
      monthsElapsed
    );

    const tooltipHeight = 320;
    const minSpaceRequired = 350;
    const spaceAbove = event.clientY;
    const shouldShowBelow = spaceAbove < minSpaceRequired;

    setTooltip({
      visible: true,
      content,
      x: event.clientX, // Use exact mouse X position
      y: event.clientY, // Use exact mouse Y position
      showBelow: shouldShowBelow,
    });
  };

  const handleHiringMouseMove = (
    event: React.MouseEvent,
    metricType: string
  ) => {
    // Update tooltip position if it's already visible
    if (tooltip.visible && tooltip.content) {
      const tooltipHeight = 320;
      const minSpaceRequired = 350;
      const spaceAbove = event.clientY;
      const shouldShowBelow = spaceAbove < minSpaceRequired;

      setTooltip((prev) => ({
        ...prev,
        x: event.clientX,
        y: event.clientY,
        showBelow: shouldShowBelow,
      }));
    }
  };

  const handleHiringMouseLeave = () => {
    setTooltip({
      visible: false,
      content: null,
      x: -9999,
      y: -9999,
      showBelow: false,
    });
  };

  // Vendor tooltip handlers
  const handleVendorMouseEnter = (
    event: React.MouseEvent,
    metricType: string
  ) => {
    // Check if this is a vendor portfolio metric
    const vendorPortfolioMetrics = [
      'vendorConcentration', 'vendorRisk', 'spendVelocity', 'compliance',
      'velocityTotalBudget', 'velocityActualSpend', 'velocityUtilizationRate', 'velocityBurnRate'
    ];
    const content = vendorPortfolioMetrics.includes(metricType) 
      ? getVendorPortfolioTooltipContent(metricType, state)
      : getVendorTooltipContent(metricType, vendorData, state);

    const tooltipHeight = 320;
    const minSpaceRequired = 350;
    const spaceAbove = event.clientY;
    const shouldShowBelow = spaceAbove < minSpaceRequired;

    setTooltip({
      visible: true,
      content,
      x: event.clientX, // Use exact mouse X position
      y: event.clientY, // Use exact mouse Y position
      showBelow: shouldShowBelow,
    });
  };

  const handleVendorMouseMove = (
    event: React.MouseEvent,
    metricType: string
  ) => {
    // Update tooltip position if it's already visible
    if (tooltip.visible && tooltip.content) {
      const tooltipHeight = 320;
      const minSpaceRequired = 350;
      const spaceAbove = event.clientY;
      const shouldShowBelow = spaceAbove < minSpaceRequired;

      setTooltip((prev) => ({
        ...prev,
        x: event.clientX,
        y: event.clientY,
        showBelow: shouldShowBelow,
      }));
    }
  };

  const handleVendorMouseLeave = () => {
    setTooltip({
      visible: false,
      content: null,
      x: -9999,
      y: -9999,
      showBelow: false,
    });
  };

  // Export handlers
  const handleExport = () => {
    handleBasicExport({
      kpis,
      topVariance,
      trend,
      alerts,
      userNotes,
    });
  };

  const expandAllSections = () => {
    setIsStrategicContextExpanded(true);
    setIsYTDPerformanceExpanded(true);
    setIsForwardLookingExpanded(true);
    setIsRiskVelocityExpanded(true);
    setIsVendorSpendingExpanded(true);
    setIsVendorPortfolioExpanded(true);
    setTrendTableCollapsed(false);
    setTotalCompCapitalizationCollapsed(false);
  };

  const restoreOriginalStates = () => {
    setIsStrategicContextExpanded(false);
    setIsYTDPerformanceExpanded(false);
    setIsForwardLookingExpanded(false);
    setIsRiskVelocityExpanded(false);
    setIsVendorSpendingExpanded(true);
    setIsVendorPortfolioExpanded(false);
    setTrendTableCollapsed(true);
    setTotalCompCapitalizationCollapsed(true);
  };

  const handlePrintExportClick = () => {
    handlePrintExport(expandAllSections, restoreOriginalStates);
  };

  const handleCustomizeExport = () => {
    setShowExportCustomizer(true);
  };

  const handleApplyTemplateAndExport = (template: any) => {
    setCurrentExportTemplate(template);
    // handlePowerPointExport(template); // This would need to be implemented separately
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
        if (value > 1000000) return "performance-warning"; // greater than $1M variance is concerning
        if (value < -1000000) return "performance-danger"; // less than -$1M is over spend
        if (value > 0 && value <= 1000000) return "performance-good"; // under budget is good
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
      {/* Header */}
      <div className="executive-header">
        <div>
          <h1 className="executive-title">Executive Summary</h1>
          <p className="executive-subtitle">
            {state.selectedYear} Budget Performance Overview
          </p>
        </div>

        <div className="header-buttons">
          <button onClick={handleExport} className="btn-primary">
            Export Summary
          </button>
          <button onClick={handlePrintExportClick} className="btn-success">
            Print/PDF
          </button>
          <button onClick={handleCustomizeExport} className="btn-purple">
            Customize Export
          </button>
        </div>
      </div>

      {/* Executive Commentary Section */}
      <div className="commentary-section">
        <h2 className="commentary-header">Executive Commentary</h2>
        <textarea
          value={userNotes}
          onChange={(e) => setUserNotes(e.target.value)}
          className="commentary-textarea"
          placeholder="Add your executive notes and insights here..."
        />
        {/* Print-only version of commentary text */}
        <div className="commentary-print-text" style={{ display: "none" }}>
          {userNotes.split("\n").map((line, index) => (
            <p key={index}>{line || "\u00A0"}</p>
          ))}
        </div>
      </div>

      {/* Strategic Context Section */}

      <div className="kpi-section strategic-context">
        <div
          className="section-header"
          onClick={() =>
            setIsStrategicContextExpanded(!isStrategicContextExpanded)
          }
        >
          {" "}
          <h4 className="section-title">
            {" "}
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
                Variance:{" "}
                <strong>
                  {formatCurrencyFull(kpis.ytdActual)} (
                  {kpis.variancePct >= 0 ? "+" : ""}
                  {kpis.variancePct.toFixed(1)}%)
                </strong>
              </span>
            </div>
          )}{" "}
        </div>

        {/* Expandable content */}
        {isStrategicContextExpanded && (
          <>
            <div className="kpi-row">
              <div className="kpi-cards">
                <KPICard
                  title="Annual Budget Target"
                  value={kpis.annualBudgetTarget}
                  isCurrency={true}
                  kpiType="annualBudgetTarget"
                  onMouseEnter={(e) =>
                    handleMouseEnter(e, "annualBudgetTarget")
                  }
                  onMouseMove={(e) => handleMouseMove(e, "annualBudgetTarget")}
                  onMouseLeave={handleMouseLeave}
                />
                <KPICard
                  title="YTD Actual Spend"
                  value={kpis.ytdActual}
                  isCurrency={true}
                  kpiType="ytdActual"
                  onMouseEnter={(e) => handleMouseEnter(e, "ytdActual")}
                  onMouseMove={(e) => handleMouseMove(e, "ytdActual")}
                  onMouseLeave={handleMouseLeave}
                />
              </div>
            </div>

            <div className="kpi-row">
              <div className="kpi-cards">
                <KPICard
                  title="Annual Variance"
                  value={kpis.annualVariance}
                  isCurrency={true}
                  kpiType={getPerformanceClass(
                    "annualVariance",
                    kpis.annualVariance,
                    kpis.annualVariancePct
                  )}
                  percentage={kpis.annualVariancePct}
                  onMouseEnter={(e) => handleMouseEnter(e, "annualVariance")}
                  onMouseMove={(e) => handleMouseMove(e, "annualVariance")}
                  onMouseLeave={handleMouseLeave}
                />
                <KPICard
                  title="Budget Utilization"
                  value={kpis.budgetUtilization}
                  isPercentage={true}
                  kpiType={getPerformanceClass(
                    "budgetUtilization",
                    kpis.budgetUtilization
                  )}
                  onMouseEnter={(e) => handleMouseEnter(e, "budgetUtilization")}
                  onMouseMove={(e) => handleMouseMove(e, "budgetUtilization")}
                  onMouseLeave={handleMouseLeave}
                />
                <KPICard
                  title="Target Achievement"
                  value={kpis.targetAchievement}
                  isPercentage={true}
                  kpiType={getPerformanceClass(
                    "targetAchievement",
                    kpis.targetAchievement
                  )}
                  onMouseEnter={(e) => handleMouseEnter(e, "targetAchievement")}
                  onMouseMove={(e) => handleMouseMove(e, "targetAchievement")}
                  onMouseLeave={handleMouseLeave}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* YTD Performance - Collapsible */}
      <div className="kpi-section ytd-performance">
        <div
          className="section-header"
          onClick={() => setIsYTDPerformanceExpanded(!isYTDPerformanceExpanded)}
        >
          {" "}
          <h4 className="section-title">
            <span className="expand-icon">
              {isYTDPerformanceExpanded ? "−" : "+"}
            </span>
            YTD Performance (thru {getLastFinalMonthName(state)})
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
              <KPICard
                title="YTD Budget"
                value={kpis.ytdBudget}
                isCurrency={true}
                kpiType="ytdBudget"
                onMouseEnter={(e) => handleMouseEnter(e, "ytdBudget")}
                onMouseMove={(e) => handleMouseMove(e, "ytdBudget")}
                onMouseLeave={handleMouseLeave}
                className="kpi-card"
              />
              <KPICard
                title="YTD Variance"
                value={kpis.variance}
                isCurrency={true}
                kpiType={getPerformanceClass(
                  "ytdVariance",
                  kpis.variance,
                  kpis.variancePct
                )}
                percentage={kpis.variancePct}
                onMouseEnter={(e) => handleMouseEnter(e, "ytdVariance")}
                onMouseMove={(e) => handleMouseMove(e, "ytdVariance")}
                onMouseLeave={handleMouseLeave}
                className={`kpi-card ${getPerformanceClass(
                  "ytdVariance",
                  kpis.variance,
                  kpis.variancePct
                )}`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Forward Looking - Collapsible */}
      <div className="mb-2">
        <div
          className="collapsible-section-header"
          onClick={() => setIsForwardLookingExpanded(!isForwardLookingExpanded)}
        >
          <h2 className="section-heading">Forward Looking</h2>
          <span className="expand-toggle">
            {isForwardLookingExpanded ? "−" : "+"}
          </span>
        </div>

        {!isForwardLookingExpanded && (
          <div className="compact-section-summary">
            <span>
              Forecast:{" "}
              <strong>{formatCurrencyFull(kpis.fullYearForecast)}</strong>
            </span>
            <span>
              vs Target:{" "}
              <strong>
                {kpis.forecastVsTargetVariance >= 0 ? "+" : ""}
                {formatCurrencyFull(kpis.forecastVsTargetVariance)}
              </strong>
            </span>
          </div>
        )}

        {isForwardLookingExpanded && (
          <div className="kpi-cards">
            <KPICard
              title="Full-Year Forecast"
              value={kpis.fullYearForecast}
              isCurrency={true}
              kpiType="fullYearForecast"
              onMouseEnter={(e) => handleMouseEnter(e, "fullYearForecast")}
              onMouseMove={(e) => handleMouseMove(e, "fullYearForecast")}
              onMouseLeave={handleMouseLeave}
            />
            <KPICard
              title="Forecast vs Target"
              value={kpis.forecastVsTargetVariance}
              isCurrency={true}
              kpiType={getPerformanceClass(
                "forecastVariance",
                kpis.forecastVsTargetVariance
              )}
              onMouseEnter={(e) => handleMouseEnter(e, "forecastVsTarget")}
              onMouseMove={(e) => handleMouseMove(e, "forecastVsTarget")}
              onMouseLeave={handleMouseLeave}
            />
          </div>
        )}
      </div>

      {/* Risk & Velocity - Collapsible */}
      <div className="mb-2">
        <div
          className="collapsible-section-header"
          onClick={() => setIsRiskVelocityExpanded(!isRiskVelocityExpanded)}
        >
          <h2 className="section-heading">Risk & Velocity</h2>
          <span className="expand-toggle">
            {isRiskVelocityExpanded ? "−" : "+"}
          </span>
        </div>

        {!isRiskVelocityExpanded && (
          <div className="compact-section-summary">
            <span>
              Burn Rate: <strong>{formatCurrencyFull(kpis.burnRate)}</strong>
            </span>
            <span>
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

        {isRiskVelocityExpanded && (
          <div className="kpi-cards">
            <KPICard
              title="Monthly Burn Rate"
              value={kpis.burnRate}
              isCurrency={true}
              kpiType="burnRate"
              onMouseEnter={(e) => handleMouseEnter(e, "burnRate")}
              onMouseMove={(e) => handleMouseMove(e, "burnRate")}
              onMouseLeave={handleMouseLeave}
            />
            <KPICard
              title="Months Remaining"
              value={`${
                kpis.monthsRemaining > 0 ? kpis.monthsRemaining.toFixed(1) : "∞"
              } months`}
              kpiType={getPerformanceClass(
                "monthsRemaining",
                kpis.monthsRemaining
              )}
              onMouseEnter={(e) => handleMouseEnter(e, "monthsRemaining")}
              onMouseMove={(e) => handleMouseMove(e, "monthsRemaining")}
              onMouseLeave={handleMouseLeave}
            />
            <KPICard
              title="Variance Trend"
              value={kpis.varianceTrend}
              kpiType="varianceTrend"
              onMouseEnter={(e) => handleMouseEnter(e, "varianceTrend")}
              onMouseMove={(e) => handleMouseMove(e, "varianceTrend")}
              onMouseLeave={handleMouseLeave}
            />
          </div>
        )}
      </div>

      {/* Budget vs Actual Trend Chart - Rolling */}
      <div className="trend-chart-section">
        <h2 className="section-heading">Budget vs Actual Trend, Rolling</h2>
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
            <RechartsTooltip
              formatter={(value: number, name: string) => [
                formatCurrencyFull(value),
                name === "budget"
                  ? "Rolling Budget"
                  : name === "actual"
                  ? "Rolling Actual"
                  : name === "forecast"
                  ? "Rolling Forecast"
                  : name === "adjActual"
                  ? "Rolling Adj Actual"
                  : name,
              ]}
              labelFormatter={(label) => `Through ${label}`}
            />
            <Legend />
            {/* Budget as bar */}
            <Bar
              dataKey="budget"
              fill="#2D78FB"
              name="Rolling Budget"
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
              name="Rolling Actual"
              connectNulls={false}
            />
            {/* Forecast spending line */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#FF8C00"
              strokeWidth={4}
              strokeDasharray="5 1"
              name="Rolling Forecast"
              connectNulls={false}
            />
            {/* Rolling Adj Actual line */}
            <Line
              type="monotone"
              dataKey="adjActual"
              stroke="#9932CC"
              strokeWidth={4}
              name="Rolling Adj Actual"
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Rolling Trend Data Table - Collapsible */}
      <div className="trend-data-table-section">
        <div
          className="collapsible-header"
          onClick={() =>
            setRollingTrendTableCollapsed(!rollingTrendTableCollapsed)
          }
        >
          <h3>
            {rollingTrendTableCollapsed ? "+" : "−"} Rolling Trend Chart Data
          </h3>
        </div>

        {!rollingTrendTableCollapsed && (
          <div className="trend-data-table">
            <table className="trend-table rolling-trend-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Rolling Budget</th>
                  <th>Rolling Actual</th>
                  <th>Rolling Forecast</th>
                  <th>Rolling Adj Actual</th>
                </tr>
              </thead>
              <tbody>
                {trend.map((data, index) => (
                  <tr key={index}>
                    <td>{data.period}</td>
                    <td>{formatCurrencyFull(data.budget)}</td>
                    <td>
                      {data.actual !== null
                        ? formatCurrencyFull(data.actual)
                        : "-"}
                    </td>
                    <td>
                      {data.forecast !== null
                        ? formatCurrencyFull(data.forecast)
                        : "-"}
                    </td>
                    <td>
                      {data.adjActual !== null
                        ? formatCurrencyFull(data.adjActual)
                        : data.adjForecast !== null
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

      {/* Budget vs Actual Trend Chart - Monthly */}
      <div className="trend-chart-section">
        <h2 className="section-heading">Budget vs Actual Trend, Monthly</h2>
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
            <RechartsTooltip
              formatter={(value: number, name: string) => [
                value !== null ? formatCurrencyFull(value) : "-",
                name === "monthlyBudget"
                  ? "Monthly Budget"
                  : name === "monthlyActual"
                  ? "Monthly Actual"
                  : name === "monthlyReforecast"
                  ? "Monthly Forecast"
                  : name === "monthlyAdjusted"
                  ? "Monthly Adj Actual"
                  : name,
              ]}
              labelFormatter={(label) => `${label}`}
            />
            <Legend />
            {/* Monthly Budget as bar */}
            <Bar
              dataKey="monthlyBudget"
              fill="#2D78FB"
              name="Monthly Budget"
              barSize={30}
              opacity={0.5}
            />
            {/* Monthly Actual spending line */}
            <Line
              type="monotone"
              dataKey="monthlyActual"
              stroke="#33CA7F"
              strokeWidth={4}
              strokeDasharray="5 1"
              name="Monthly Actual"
              connectNulls={false}
            />
            {/* Monthly Forecast spending line */}
            <Line
              type="monotone"
              dataKey="monthlyReforecast"
              stroke="#FF8C00"
              strokeWidth={4}
              strokeDasharray="5 1"
              name="Monthly Forecast"
              connectNulls={false}
            />
            {/* Monthly Adjusted actual line */}
            <Line
              type="monotone"
              dataKey="monthlyAdjusted"
              stroke="#8B0000"
              strokeWidth={4}
              name="Monthly Adj Actual"
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Spending KPIs */}
      <div
        style={{
          marginBottom: "1.5rem",
          padding: "1rem",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          border: "1px solid #e1e8ed",
        }}
      >
        <h4 style={{ marginBottom: "1rem", color: "#2d3a4a" }}>
          Monthly Spending Analysis
        </h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1rem",
          }}
        >
          {(() => {
            // Calculate Average Monthly Spend YTD (Regular and Adjusted)
            const finalMonths = trend.filter((data) => data.isFinalMonth);
            const totalMonthlyActual = finalMonths.reduce((sum, data) => {
              return sum + (data.monthlyActual || 0);
            }, 0);
            const totalMonthlyAdjusted = finalMonths.reduce((sum, data) => {
              return sum + (data.monthlyAdjusted || 0);
            }, 0);

            const avgMonthlySpendYTD =
              finalMonths.length > 0
                ? totalMonthlyActual / finalMonths.length
                : 0;
            const avgMonthlyAdjustedYTD =
              finalMonths.length > 0
                ? totalMonthlyAdjusted / finalMonths.length
                : 0;

            // Calculate Average Quarterly Spend (last completed quarter)
            const currentMonth = new Date().getMonth() + 1;
            const currentQuarter = Math.ceil(currentMonth / 3);
            const lastCompletedQuarter =
              currentQuarter > 1 ? currentQuarter - 1 : 4;

            let quarterMonths: number[] = [];
            if (lastCompletedQuarter === 1) quarterMonths = [1, 2, 3];
            else if (lastCompletedQuarter === 2) quarterMonths = [4, 5, 6];
            else if (lastCompletedQuarter === 3) quarterMonths = [7, 8, 9];
            else quarterMonths = [10, 11, 12];

            const quarterData = trend.filter((data) => {
              const monthNum =
                [
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
                ].indexOf(data.period) + 1;
              return quarterMonths.includes(monthNum) && data.isFinalMonth;
            });

            const totalQuarterlyActual = quarterData.reduce((sum, data) => {
              return sum + (data.monthlyActual || 0);
            }, 0);
            const totalQuarterlyAdjusted = quarterData.reduce((sum, data) => {
              return sum + (data.monthlyAdjusted || 0);
            }, 0);

            const avgQuarterlySpend =
              quarterData.length > 0
                ? totalQuarterlyActual / quarterData.length
                : avgMonthlySpendYTD;
            const avgQuarterlyAdjusted =
              quarterData.length > 0
                ? totalQuarterlyAdjusted / quarterData.length
                : avgMonthlyAdjustedYTD;

            return (
              <>
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "1rem",
                    borderRadius: "6px",
                    border: "1px solid #dee2e6",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#6b7a8f",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Avg Monthly Spend YTD
                  </div>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "700",
                      color: "#2d3a4a",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {formatCurrencyFull(avgMonthlyAdjustedYTD)}
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#6b7a8f",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Regular: {formatCurrencyFull(avgMonthlySpendYTD)}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#8b949e",
                      marginTop: "0.25rem",
                    }}
                  >
                    Based on {finalMonths.length} completed months
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "white",
                    padding: "1rem",
                    borderRadius: "6px",
                    border: "1px solid #dee2e6",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#6b7a8f",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Avg Quarterly Spend
                  </div>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "700",
                      color: "#2d3a4a",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {formatCurrencyFull(avgQuarterlyAdjusted)}
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#6b7a8f",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Regular: {formatCurrencyFull(avgQuarterlySpend)}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#8b949e",
                      marginTop: "0.25rem",
                    }}
                  >
                    Q{lastCompletedQuarter} average ({quarterData.length}{" "}
                    months)
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Monthly Trend Data Table - Collapsible */}
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
            cursor: "pointer",
          }}
          onClick={() =>
            setMonthlyTrendTableCollapsed(!monthlyTrendTableCollapsed)
          }
        >
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#2d3a4a",
              margin: 0,
            }}
          >
            {monthlyTrendTableCollapsed ? "+" : "−"} Monthly Trend Chart Data
          </h3>
        </div>

        {!monthlyTrendTableCollapsed && (
          <div
            style={{
              overflowX: "auto",
              border: "1px solid #e1e8ed",
              borderRadius: "8px",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.875rem",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th
                    style={{
                      padding: "0.75rem",
                      textAlign: "left",
                      borderBottom: "2px solid #dee2e6",
                    }}
                  >
                    Period
                  </th>
                  <th
                    style={{
                      padding: "0.75rem",
                      textAlign: "right",
                      borderBottom: "2px solid #dee2e6",
                    }}
                  >
                    Monthly Budget
                  </th>
                  <th
                    style={{
                      padding: "0.75rem",
                      textAlign: "right",
                      borderBottom: "2px solid #dee2e6",
                    }}
                  >
                    Monthly Actual
                  </th>
                  <th
                    style={{
                      padding: "0.75rem",
                      textAlign: "right",
                      borderBottom: "2px solid #dee2e6",
                    }}
                  >
                    Monthly Forecast
                  </th>
                  <th
                    style={{
                      padding: "0.75rem",
                      textAlign: "right",
                      borderBottom: "2px solid #dee2e6",
                    }}
                  >
                    Monthly Adj Actual
                  </th>
                </tr>
              </thead>
              <tbody>
                {trend.map((data, index) => (
                  <tr
                    key={index}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#fff" : "#f8f9fa",
                      borderBottom: "1px solid #dee2e6",
                      ...(!data.isFinalMonth
                        ? { fontStyle: "italic", opacity: 0.85 }
                        : {}),
                    }}
                  >
                    <td style={{ padding: "0.75rem", fontWeight: "500" }}>
                      {data.period}
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>
                      {data.monthlyBudget !== null
                        ? formatCurrencyFull(data.monthlyBudget)
                        : "-"}
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>
                      {data.monthlyActual !== null
                        ? formatCurrencyFull(data.monthlyActual)
                        : "-"}
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>
                      {data.monthlyReforecast !== null
                        ? formatCurrencyFull(data.monthlyReforecast)
                        : "-"}
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>
                      {data.monthlyAdjusted !== null
                        ? formatCurrencyFull(data.monthlyAdjusted)
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Divider between Vendor Tracking and Resource Allocation */}
      <div className="section-divider"></div>

      {/* Resource Allocation & Hiring Capacity - Detailed Analysis */}
      <div style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "600",
            color: "#2d3a4a",
            marginBottom: "1rem",
          }}
        >
          Resource Allocation & Hiring Capacity
        </h2>

        <div style={{ marginBottom: "2rem" }}>
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#2d3a4a",
              marginBottom: "1rem",
            }}
          >
            Hiring Runway Analysis
          </h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.8rem",
              margin: "24px 0",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: "1rem",
                alignItems: "center",
                padding: "0.75rem",
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                borderLeft: "4px solid #3498db",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
              }}
              onMouseEnter={(e) =>
                handleHiringMouseEnter(e, "netCompAvailable")
              }
              onMouseLeave={handleHiringMouseLeave}
            >
              <span
                style={{
                  fontWeight: "600",
                  color: "#2d3a4a",
                  fontSize: "0.95rem",
                }}
              >
                Net Compensation Available
              </span>
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "#666",
                  fontStyle: "italic",
                }}
              >
                Annual compensation budget minus YTD actual spend
              </span>
              <span
                style={{
                  fontWeight: "700",
                  color: "#3498db",
                  fontSize: "1rem",
                  textAlign: "right",
                  minWidth: "120px",
                }}
              >
                {formatCurrencyFull(
                  resourceData.hiringCapacity.netCompensationAvailable
                )}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: "1rem",
                alignItems: "center",
                padding: "0.75rem",
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                borderLeft: "4px solid #3498db",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
              }}
              onMouseEnter={(e) =>
                handleHiringMouseEnter(e, "lastThreeMonthAvg")
              }
              onMouseLeave={handleHiringMouseLeave}
            >
              <span
                style={{
                  fontWeight: "600",
                  color: "#2d3a4a",
                  fontSize: "0.95rem",
                }}
              >
                Last 3-Month Average
              </span>
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "#666",
                  fontStyle: "italic",
                }}
              >
                Recent monthly compensation spend trend
              </span>
              <span
                style={{
                  fontWeight: "700",
                  color: "#3498db",
                  fontSize: "1rem",
                  textAlign: "right",
                  minWidth: "120px",
                }}
              >
                {formatCurrencyFull(
                  resourceData.hiringCapacity.lastThreeMonthAverage
                )}
                /month
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: "1rem",
                alignItems: "center",
                padding: "0.75rem",
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                borderLeft: "4px solid #3498db",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
              }}
              onMouseEnter={(e) => handleHiringMouseEnter(e, "remainingMonths")}
              onMouseLeave={handleHiringMouseLeave}
            >
              <span
                style={{
                  fontWeight: "600",
                  color: "#2d3a4a",
                  fontSize: "0.95rem",
                }}
              >
                Remaining Months
              </span>
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "#666",
                  fontStyle: "italic",
                }}
              >
                Months left in fiscal year
              </span>
              <span
                style={{
                  fontWeight: "700",
                  color: "#3498db",
                  fontSize: "1rem",
                  textAlign: "right",
                  minWidth: "120px",
                }}
              >
                {resourceData.hiringCapacity.remainingMonths} months
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: "1rem",
                alignItems: "center",
                padding: "0.75rem",
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                borderLeft: "4px solid #3498db",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
              }}
              onMouseEnter={(e) =>
                handleHiringMouseEnter(e, "projectedRemainingSpend")
              }
              onMouseLeave={handleHiringMouseLeave}
            >
              <span
                style={{
                  fontWeight: "600",
                  color: "#2d3a4a",
                  fontSize: "0.95rem",
                }}
              >
                Projected Remaining Spend
              </span>
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "#666",
                  fontStyle: "italic",
                }}
              >
                {resourceData.hiringCapacity.remainingMonths} months × 3-month
                average
              </span>
              <span
                style={{
                  fontWeight: "700",
                  color: "#3498db",
                  fontSize: "1rem",
                  textAlign: "right",
                  minWidth: "120px",
                }}
              >
                {formatCurrencyFull(
                  resourceData.hiringCapacity.projectedRemainingSpend
                )}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: "1rem",
                alignItems: "center",
                padding: "0.75rem",
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                borderLeft: "4px solid #3498db",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
              }}
              onMouseEnter={(e) =>
                handleHiringMouseEnter(e, "projectedTotalSpend")
              }
              onMouseLeave={handleHiringMouseLeave}
            >
              <span
                style={{
                  fontWeight: "600",
                  color: "#2d3a4a",
                  fontSize: "0.95rem",
                }}
              >
                Projected Total Spend
              </span>
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "#666",
                  fontStyle: "italic",
                }}
              >
                YTD actual + projected remaining spend
              </span>
              <span
                style={{
                  fontWeight: "700",
                  color: "#3498db",
                  fontSize: "1rem",
                  textAlign: "right",
                  minWidth: "120px",
                }}
              >
                {formatCurrencyFull(
                  resourceData.totalCompensation.ytdActual +
                    resourceData.hiringCapacity.projectedRemainingSpend
                )}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: "1rem",
                alignItems: "center",
                padding: "0.75rem",
                backgroundColor:
                  resourceData.hiringCapacity.budgetVsProjection > 0
                    ? "#f2fdf5"
                    : "#fdf2f2",
                borderRadius: "8px",
                borderLeft: `4px solid ${
                  resourceData.hiringCapacity.budgetVsProjection > 0
                    ? "#27ae60"
                    : "#e74c3c"
                }`,
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
              }}
              onMouseEnter={(e) =>
                handleHiringMouseEnter(e, "budgetVsProjection")
              }
              onMouseLeave={handleHiringMouseLeave}
            >
              <span
                style={{
                  fontWeight: "600",
                  color: "#2d3a4a",
                  fontSize: "0.95rem",
                }}
              >
                Budget vs Projection
              </span>
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "#666",
                  fontStyle: "italic",
                }}
              >
                {resourceData.hiringCapacity.budgetVsProjection < 0
                  ? "Projected total spend exceeds annual budget - budget adjustments needed"
                  : "Projected total spend under annual budget - additional hiring capacity available"}
              </span>
              <span
                style={{
                  fontWeight: "700",
                  color:
                    resourceData.hiringCapacity.budgetVsProjection > 0
                      ? "#27ae60"
                      : "#e74c3c",
                  fontSize: "1rem",
                  textAlign: "right",
                  minWidth: "120px",
                }}
              >
                {resourceData.hiringCapacity.budgetVsProjection >= 0 ? "+" : ""}
                {formatCurrencyFull(
                  resourceData.hiringCapacity.budgetVsProjection
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Total Comp & Capitalization Section */}
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
            cursor: "pointer",
          }}
          onClick={() =>
            setTotalCompCapitalizationCollapsed(
              !totalCompCapitalizationCollapsed
            )
          }
        >
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              color: "#2d3a4a",
              margin: 0,
            }}
          >
            {totalCompCapitalizationCollapsed ? "+" : "−"} Total Comp &
            Capitalization
          </h2>
        </div>

        {totalCompCapitalizationCollapsed && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              fontSize: "0.875rem",
              color: "#6b7a8f",
            }}
          >
            <span style={{ fontWeight: "600" }}>Total Compensation:</span>
            <span>
              YTD:{" "}
              {formatCurrencyFull(resourceData.totalCompensation.ytdActual)} |
              Budget:{" "}
              {formatCurrencyFull(resourceData.totalCompensation.annualBudget)}{" "}
              | Remaining:{" "}
              {formatCurrencyFull(resourceData.totalCompensation.remaining)}
            </span>
          </div>
        )}

        {!totalCompCapitalizationCollapsed && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2rem",
              margin: "2rem 0",
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "1.5rem",
                border: "2px solid #e1e8ed",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              }}
            >
              <h3
                style={{
                  color: "#2d3a4a",
                  marginBottom: "1rem",
                  fontSize: "1.2rem",
                }}
              >
                Total Compensation
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem 0",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <span style={{ color: "#6b7a8f", fontWeight: "500" }}>
                    YTD Actual
                  </span>
                  <span style={{ fontWeight: "700", color: "#2d3a4a" }}>
                    {formatCurrencyFull(
                      resourceData.totalCompensation.ytdActual
                    )}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem 0",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <span style={{ color: "#6b7a8f", fontWeight: "500" }}>
                    Annual Budget
                  </span>
                  <span style={{ fontWeight: "700", color: "#2d3a4a" }}>
                    {formatCurrencyFull(
                      resourceData.totalCompensation.annualBudget
                    )}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem 0",
                  }}
                >
                  <span style={{ color: "#6b7a8f", fontWeight: "500" }}>
                    Remaining
                  </span>
                  <span style={{ fontWeight: "700", color: "#3498db" }}>
                    {formatCurrencyFull(
                      resourceData.totalCompensation.remaining
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "1.5rem",
                border: "2px solid #e1e8ed",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              }}
            >
              <h3
                style={{
                  color: "#2d3a4a",
                  marginBottom: "1rem",
                  fontSize: "1.2rem",
                }}
              >
                Capitalized Salaries
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem 0",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <span style={{ color: "#6b7a8f", fontWeight: "500" }}>
                    YTD Actual
                  </span>
                  <span style={{ fontWeight: "700", color: "#2d3a4a" }}>
                    {formatCurrencyFull(
                      Math.abs(resourceData.capitalizedSalaries.ytdActual)
                    )}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem 0",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <span style={{ color: "#6b7a8f", fontWeight: "500" }}>
                    Monthly Avg
                  </span>
                  <span style={{ fontWeight: "700", color: "#2d3a4a" }}>
                    {formatCurrencyFull(
                      Math.abs(resourceData.capitalizedSalaries.monthlyAverage)
                    )}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem 0",
                  }}
                >
                  <span style={{ color: "#6b7a8f", fontWeight: "500" }}>
                    Offset Rate
                  </span>
                  <span style={{ fontWeight: "700", color: "#2d3a4a" }}>
                    {resourceData.capitalizedSalaries.offsetRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Divider between Vendor Tracking and Resource Allocation */}
      <div className="section-divider"></div>
      {/* Vendor Tracking Section with Variance Analysis */}
      <div className="vendor-tracking-section">
        <h2 className="vendor-tracking-title">Vendor Tracking</h2>

        <div className="vendor-tracking-subtitle">
          Total vendor spend from budget monthly tracking report.
        </div>

        <div className="vendor-kpi-grid">
          <div
            className="vendor-kpi-card"
            onMouseEnter={(e) => handleVendorMouseEnter(e, "total")}
            onMouseLeave={handleVendorMouseLeave}
          >
            <div className="vendor-kpi-title">Total Vendor Spend</div>
            <div className="vendor-kpi-value">
              {formatCurrencyFull(vendorData.total)}
            </div>
            <div className="vendor-kpi-label">YTD</div>
            <div className="vendor-kpi-description">
              YTD from monthly budget vs actual report.
            </div>
          </div>

          <div
            className="vendor-kpi-card"
            onMouseEnter={(e) => handleVendorMouseEnter(e, "totalVendorSpend")}
            onMouseLeave={handleVendorMouseLeave}
          >
            <div className="vendor-kpi-title">Total Vendor Spend</div>
            <div className="vendor-kpi-value">
              {formatCurrencyFull(getTotalVendorSpend(state))}
            </div>
            <div className="vendor-kpi-label">YTD</div>
            <div className="vendor-kpi-description">
              Total vendor spend from vendor tracking sheet.
            </div>
          </div>

          <div
            className={`vendor-kpi-card ${(() => {
              const variance = getTotalVendorSpend(state) - vendorData.total;
              if (variance === 0) return "variance-positive";
              if (variance < 0) return "variance-warning";
              return "variance-negative";
            })()}`}
            onMouseEnter={(e) => handleVendorMouseEnter(e, "vendorVariance")}
            onMouseLeave={handleVendorMouseLeave}
          >
            <div className="vendor-variance-title">Vendor Variance</div>
            <div
              className={`vendor-variance-amount ${(() => {
                const variance = getTotalVendorSpend(state) - vendorData.total;
                if (variance === 0) return "positive";
                if (variance < 0) return "warning";
                return "negative";
              })()}`}
            >
              {(() => {
                const variance = getTotalVendorSpend(state) - vendorData.total;
                return `${variance >= 0 ? "+" : ""}${formatCurrencyFull(
                  variance
                )}`;
              })()}
            </div>
            <div className="vendor-variance-label">Difference</div>
            <div className="vendor-variance-description">
              Delta on Monthly Budget vs Actual and Vendor Tracking sheet.
            </div>
          </div>
        </div>

        {/* Vendor Spend by Category Table */}
        <div className="vendor-spend-table-container">
          <h3 className="vendor-spend-table-title">
            Vendor Spend by Category - Budget vs Actual
          </h3>

          <div className="vendor-spend-table-wrapper">
            <table className="vendor-spend-table">
              <thead>
                <tr>
                  <th rowSpan={2}>Finance Mapped Category</th>
                  <th rowSpan={2}>Type</th>
                  {getQuarterGroups.map((quarter) => (
                    <th key={quarter.quarter} colSpan={quarter.months.length}>
                      Q{quarter.quarter}
                    </th>
                  ))}
                </tr>
                <tr>
                  {getVendorTableMonths.map((month) => (
                    <th key={month.short}>{month.long}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getDistinctFinanceMappedCategories.length > 0 ? (
                  getDistinctFinanceMappedCategories.map((category, index) => {
                    const categoryBudget =
                      getVendorBudgetByCategory[category] || {};
                    const categoryActual =
                      getVendorActualByCategory[category] || {};

                    return (
                      <React.Fragment key={category}>
                        {/* Budget Row */}
                        <tr className="budget-row">
                          <td rowSpan={2} className="category-cell">
                            {category}
                          </td>
                          <td className="type-cell budget">Budget</td>
                          {getVendorTableMonths.map((month) => (
                            <td key={month.short} className="amount-cell">
                              {categoryBudget[
                                month.short as keyof typeof categoryBudget
                              ]
                                ? formatCurrencyExcelStyle(
                                    categoryBudget[
                                      month.short as keyof typeof categoryBudget
                                    ] * 1000
                                  )
                                : "-"}
                            </td>
                          ))}
                        </tr>
                        {/* Actual Row */}
                        <tr className="actual-row">
                          <td className="type-cell actual">Actual</td>
                          {getVendorTableMonths.map((month) => (
                            <td key={month.short} className="amount-cell">
                              {categoryActual[
                                month.short as keyof typeof categoryActual
                              ]
                                ? formatCurrencyExcelStyle(
                                    categoryActual[
                                      month.short as keyof typeof categoryActual
                                    ] * 1000
                                  )
                                : "-"}
                            </td>
                          ))}
                        </tr>
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={getVendorTableMonths.length + 2}
                      className="no-data-row"
                    >
                      No vendor data available for {state.selectedYear}. Add
                      vendor tracking data to see category breakdown.
                    </td>
                  </tr>
                )}

                {/* Summary Totals Row */}
                {getDistinctFinanceMappedCategories.length > 0 && (
                  <React.Fragment>
                    <tr className="summary-spacer">
                      <td colSpan={getVendorTableMonths.length + 2}></td>
                    </tr>
                    <tr className="total-budget-row">
                      <td className="category-cell total">Total</td>
                      <td className="type-cell budget">Budget</td>
                      {getVendorTableMonths.map((month) => (
                        <td key={month.short} className="amount-cell total">
                          {getVendorTotalsByMonth.budget[
                            month.short as keyof typeof getVendorTotalsByMonth.budget
                          ]
                            ? formatCurrencyExcelStyle(
                                getVendorTotalsByMonth.budget[
                                  month.short as keyof typeof getVendorTotalsByMonth.budget
                                ] * 1000
                              )
                            : "-"}
                        </td>
                      ))}
                    </tr>
                    <tr className="total-actual-row">
                      <td className="category-cell total"></td>
                      <td className="type-cell actual">Actual</td>
                      {getVendorTableMonths.map((month) => (
                        <td key={month.short} className="amount-cell total">
                          {getVendorTotalsByMonth.actual[
                            month.short as keyof typeof getVendorTotalsByMonth.actual
                          ]
                            ? formatCurrencyExcelStyle(
                                getVendorTotalsByMonth.actual[
                                  month.short as keyof typeof getVendorTotalsByMonth.actual
                                ] * 1000
                              )
                            : "-"}
                        </td>
                      ))}
                    </tr>
                  </React.Fragment>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Vendor Portfolio Management Section */}
      <VendorPortfolioSection
        state={state}
        isExpanded={isVendorPortfolioExpanded}
        onToggleExpanded={() => setIsVendorPortfolioExpanded(!isVendorPortfolioExpanded)}
        onMouseEnter={handleVendorMouseEnter}
        onMouseMove={handleVendorMouseMove}
        onMouseLeave={handleVendorMouseLeave}
      />

      {/* Floating Export Buttons */}
      <button
        onClick={handlePrintExportClick}
        title="Export Executive Summary to PDF"
        className="floating-export-button"
      >
        📊 Print to PDF
      </button>

      <button
        onClick={handleCustomizeExport}
        title="Export as Presentation Slides"
        className="floating-customize-button"
      >
        📊 Export as Slides
      </button>

      {/* Tooltip */}
      <Tooltip
        visible={tooltip.visible}
        content={tooltip.content}
        x={tooltip.x}
        y={tooltip.y}
        showBelow={tooltip.showBelow}
      />

      {/* Export Customizer */}
      <ExportCustomizer
        isOpen={showExportCustomizer}
        onClose={() => setShowExportCustomizer(false)}
        onApplyTemplate={handleApplyTemplateAndExport}
      />
    </div>
  );
};

export default ExecutiveSummary;
