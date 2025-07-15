import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBudget } from "../../../../context/BudgetContext";
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
  BarChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import ExportCustomizer from "../../../../components/ExportCustomizer/ExportCustomizer";
import "./ExecutiveSummary.css";

// Import our modular utilities
import {
  getKPIData,
  getTopVarianceCategories,
  formatCurrencyFull,
  getLastFinalMonthName,
  getTargetAchievementSubtitle,
  KPIData,
  VarianceCategory,
} from "./utils/kpiCalculations";
import { formatCurrencyExcelStyle } from "../../../../utils/currencyFormatter";
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
import {
  generateIntelligentSummary,
  generateModularSummary,
  summaryRegistry,
  SummaryToggles,
} from "./utils/summaryGenerator";
import { generateAlerts } from "./utils/exportUtils";
import { generatePDF } from "./utils/pdfGenerator";
import { generatePPTX } from "./utils/pptxGenerator";
import {
  getTeamMetrics,
  getHeadcountChartData,
  getCostDistributionChartData,
  getCostCenterColor,
  calculateTeamEfficiency,
  groupTeamsByCostCenter,
  CHART_COLORS,
} from "./utils/teamCalculations";

// Import components
import Tooltip from "../../../../components/shared/Tooltip";
import KPICard from "./components/KPICard";
import VendorPortfolioSection from "./components/VendorPortfolioSection";
import ExportModal from "./components/ExportModal";

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
  const [
    totalCompCapitalizationCollapsed,
    setTotalCompCapitalizationCollapsed,
  ] = useState(true);
  const [isTeamCompositionExpanded, setIsTeamCompositionExpanded] =
    useState(false);
  const [
    isHistoricalTeamCompositionExpanded,
    setIsHistoricalTeamCompositionExpanded,
  ] = useState(true);

  // Resources tab state for individual sections
  const [isAllTeamsOverviewExpanded, setIsAllTeamsOverviewExpanded] =
    useState(false);
  const [isTeamAnalyticsExpanded, setIsTeamAnalyticsExpanded] = useState(false);

  // Resources tab state for collapsible cost centers
  const [costCenterExpanded, setCostCenterExpanded] = useState<
    Record<string, boolean>
  >({});

  // Export modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

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

  // Tab navigation state
  const TAB_STORAGE_KEY = "executiveSummary.activeTab";

  const tabs = [
    { id: "executive-commentary", label: "Executive Commentary" },
    { id: "overall-budget", label: "Overall Budget" },
    { id: "budget-visuals", label: "Budget Visuals" },
    { id: "resource-spend", label: "Team Spend" },
    { id: "vendor-info", label: "Vendor Info" },
    { id: "resource-allocation", label: "Hiring Capacity" },
  ];

  // Load active tab from localStorage
  const loadActiveTab = (): string => {
    try {
      const saved = localStorage.getItem(TAB_STORAGE_KEY);
      if (saved && tabs.some((tab) => tab.id === saved)) {
        return saved;
      }
    } catch (error) {
      console.warn("Failed to load active tab from localStorage:", error);
    }
    return "executive-commentary"; // Default tab
  };

  const [activeTab, setActiveTab] = useState<string>(loadActiveTab);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(TAB_STORAGE_KEY, activeTab);
    } catch (error) {
      console.warn("Failed to save active tab to localStorage:", error);
    }
  }, [activeTab]);

  // Tab change handler
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

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

  // Load summary toggles from localStorage
  const loadSummaryToggles = (): SummaryToggles => {
    try {
      const saved = localStorage.getItem("executiveSummary.sectionToggles");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn("Failed to load summary toggles from localStorage:", error);
    }
    return summaryRegistry.getDefaultToggles();
  };

  // Summary toggles state
  const [summaryToggles, setSummaryToggles] =
    useState<SummaryToggles>(loadSummaryToggles);

  // Save toggles to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(
        "executiveSummary.sectionToggles",
        JSON.stringify(summaryToggles)
      );
    } catch (error) {
      console.warn("Failed to save summary toggles to localStorage:", error);
    }
  }, [summaryToggles]);

  // Generate intelligent summary with toggles
  const intelligentSummary = useMemo(() => {
    return generateModularSummary(state, kpis, summaryToggles);
  }, [
    state.entries,
    state.categories,
    state.selectedYear,
    kpis,
    summaryToggles,
  ]);

  // User notes state - initialize with intelligent summary
  const [userNotes, setUserNotes] = useState(intelligentSummary);

  // Update userNotes when intelligent summary changes (e.g., year change)
  useEffect(() => {
    setUserNotes(intelligentSummary);
  }, [intelligentSummary]);

  // Memoize team metrics calculation (current month for Current Costs section)
  const teamMetrics = useMemo(() => {
    return getTeamMetrics(state.teams || []);
  }, [state.teams]);

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

  // Memoize historical team metrics for last final month
  const historicalTeamMetrics = useMemo(() => {
    const lastFinalMonth = getLastFinalMonthNumber;
    const filteredTeams = (state.teams || []).filter(
      (team) =>
        team.month === lastFinalMonth && team.year === state.selectedYear
    );
    return getTeamMetrics(filteredTeams);
  }, [state.teams, state.selectedYear, getLastFinalMonthNumber]);

  // Memoize chart data calculations using historical data
  const headcountChartData = useMemo(() => {
    return getHeadcountChartData(historicalTeamMetrics.costCenterGroups);
  }, [historicalTeamMetrics.costCenterGroups]);

  const costDistributionData = useMemo(() => {
    return getCostDistributionChartData(historicalTeamMetrics.costCenterGroups);
  }, [historicalTeamMetrics.costCenterGroups]);

  // Get filtered teams for overview sections (last final month)
  const historicalTeams = useMemo(() => {
    const lastFinalMonth = getLastFinalMonthNumber;
    return (state.teams || []).filter(
      (team) =>
        team.month === lastFinalMonth && team.year === state.selectedYear
    );
  }, [state.teams, state.selectedYear, getLastFinalMonthNumber]);

  // Get vendor breakdown data
  const vendorBreakdownData = useMemo(() => {
    const currentYearTrackingData =
      state.vendorTrackingData?.filter(
        (tracking) => tracking.year === state.selectedYear
      ) || [];

    // Get vendor budget data for matching
    const currentYearVendorBudget =
      state.vendorData?.filter(
        (vendor) => vendor.year === state.selectedYear
      ) || [];

    return currentYearTrackingData
      .map((vendor) => {
        // Calculate YTD sum for this vendor
        const monthlyAmounts = [
          vendor.jan,
          vendor.feb,
          vendor.mar,
          vendor.apr,
          vendor.may,
          vendor.jun,
          vendor.jul,
          vendor.aug,
          vendor.sep,
          vendor.oct,
          vendor.nov,
          vendor.dec,
        ];

        const ytdTotal = monthlyAmounts.reduce((sum, amount) => {
          return sum + (parseFloat(amount) || 0);
        }, 0);

        // Get current month amount based on getLastFinalMonthNumber
        const monthNames = [
          "jan",
          "feb",
          "mar",
          "apr",
          "may",
          "jun",
          "jul",
          "aug",
          "sep",
          "oct",
          "nov",
          "dec",
        ];
        const currentMonthIndex = getLastFinalMonthNumber - 1;
        const currentMonthKey = monthNames[
          currentMonthIndex
        ] as keyof typeof vendor;
        const currentMonthAmount =
          parseFloat(vendor[currentMonthKey] as string) || 0;

        // Find matching annual budget by matching financeMappedCategory from tracking to financeMappedCategory in vendor budget
        const matchingBudgetEntries = currentYearVendorBudget.filter(
          (budgetVendor) =>
            budgetVendor.financeMappedCategory === vendor.financeMappedCategory
        );

        // Sum all matching budget entries (in case there are multiple entries for same category)
        const annualBudget = matchingBudgetEntries.reduce(
          (sum, budgetVendor) => {
            return sum + (budgetVendor.budget || 0); // Budget is already in actual dollars
          },
          0
        );

        return {
          id: vendor.id,
          vendor: vendor.financeMappedCategory || "Unknown Vendor",
          vendorCategory: vendor.vendorName || "Unknown Category",
          currentMonthSpend: currentMonthAmount,
          ytdSpend: ytdTotal,
          annualBudget: annualBudget,
        };
      })
      .filter((vendor) => vendor.ytdSpend > 0); // Only show vendors with actual spending
  }, [
    state.vendorTrackingData,
    state.vendorData,
    state.selectedYear,
    getLastFinalMonthNumber,
  ]);

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
      "vendorConcentration",
      "vendorRisk",
      "spendVelocity",
      "compliance",
      "velocityTotalBudget",
      "velocityActualSpend",
      "velocityUtilizationRate",
      "velocityBurnRate",
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

  // Export presentation handler
  const handleExportPresentation = () => {
    setIsExportModalOpen(true);
  };

  // Print current tab handler
  const handlePrint = () => {
    // Add print mode class to body
    document.body.classList.add("print-mode");

    // Set the current tab for CSS targeting
    document.body.setAttribute("data-print-tab", activeTab);

    // Store current section states
    const currentStates = {
      isStrategicContextExpanded,
      isYTDPerformanceExpanded,
      isForwardLookingExpanded,
      isRiskVelocityExpanded,
      isVendorSpendingExpanded,
      isVendorPortfolioExpanded,
      trendTableCollapsed,
      monthlyTrendTableCollapsed,
      totalCompCapitalizationCollapsed,
      isTeamCompositionExpanded,
      isHistoricalTeamCompositionExpanded,
      costCenterExpanded,
    };

    // Expand all sections for the current tab
    if (activeTab === "executive-commentary") {
      setIsStrategicContextExpanded(true);
      setIsYTDPerformanceExpanded(true);
      setIsForwardLookingExpanded(true);
      setIsRiskVelocityExpanded(true);
    } else if (
      activeTab === "overall-budget" ||
      activeTab === "budget-visuals"
    ) {
      setTrendTableCollapsed(false);
      setMonthlyTrendTableCollapsed(false);
    } else if (activeTab === "resource-spend") {
      setTotalCompCapitalizationCollapsed(false);
      setIsTeamCompositionExpanded(true);
      setIsHistoricalTeamCompositionExpanded(true);
      setCostCenterExpanded(
        Object.keys(costCenterExpanded).reduce(
          (acc, key) => ({
            ...acc,
            [key]: true,
          }),
          {}
        )
      );
    } else if (activeTab === "vendor-info") {
      setIsVendorSpendingExpanded(true);
      setIsVendorPortfolioExpanded(true);
    }

    // Add afterprint event listener for cleanup
    const handleAfterPrint = () => {
      // Remove print mode class
      document.body.classList.remove("print-mode");
      document.body.removeAttribute("data-print-tab");

      // Restore original states
      setIsStrategicContextExpanded(currentStates.isStrategicContextExpanded);
      setIsYTDPerformanceExpanded(currentStates.isYTDPerformanceExpanded);
      setIsForwardLookingExpanded(currentStates.isForwardLookingExpanded);
      setIsRiskVelocityExpanded(currentStates.isRiskVelocityExpanded);
      setIsVendorSpendingExpanded(currentStates.isVendorSpendingExpanded);
      setIsVendorPortfolioExpanded(currentStates.isVendorPortfolioExpanded);
      setTrendTableCollapsed(currentStates.trendTableCollapsed);
      setMonthlyTrendTableCollapsed(currentStates.monthlyTrendTableCollapsed);
      setTotalCompCapitalizationCollapsed(
        currentStates.totalCompCapitalizationCollapsed
      );
      setIsTeamCompositionExpanded(currentStates.isTeamCompositionExpanded);
      setIsHistoricalTeamCompositionExpanded(
        currentStates.isHistoricalTeamCompositionExpanded
      );
      setCostCenterExpanded(currentStates.costCenterExpanded);

      // Remove event listener
      window.removeEventListener("afterprint", handleAfterPrint);
    };

    // Add event listener for after print
    window.addEventListener("afterprint", handleAfterPrint);

    // Trigger print after DOM updates
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Export modal handlers
  const handleCloseExportModal = () => {
    setIsExportModalOpen(false);
  };

  const handleExport = async (format: string, layout: string) => {
    try {
      // The slides will be passed from the ExportModal component
      // For now, we'll handle the export logic in the modal's onExport handler
      console.log("Export requested:", format, layout);
      return { success: true, filename: `executive-summary.${format}` };
    } catch (error) {
      console.error("Export failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Export failed",
      };
    }
  };

  // Export customizer handler (for legacy ExportCustomizer component)
  const handleApplyTemplateAndExport = (template: any) => {
    console.log("Apply template:", template);
    // TODO: This could be integrated with the new export system later
  };

  // Store original states for restoration
  const [originalSectionStates, setOriginalSectionStates] = useState<any>(null);

  const expandAllSectionsForExport = () => {
    console.log("Expanding all sections for export...");

    // Save current states before expanding
    if (!originalSectionStates) {
      setOriginalSectionStates({
        isStrategicContextExpanded,
        isYTDPerformanceExpanded,
        isForwardLookingExpanded,
        isRiskVelocityExpanded,
        isVendorSpendingExpanded,
        isVendorPortfolioExpanded,
        trendTableCollapsed,
        monthlyTrendTableCollapsed,
        totalCompCapitalizationCollapsed,
        isTeamCompositionExpanded,
        isHistoricalTeamCompositionExpanded,
        isAllTeamsOverviewExpanded,
        isTeamAnalyticsExpanded,
        costCenterExpanded,
      });
    }

    // Expand all sections
    setIsStrategicContextExpanded(true);
    setIsYTDPerformanceExpanded(true);
    setIsForwardLookingExpanded(true);
    setIsRiskVelocityExpanded(true);
    setIsVendorSpendingExpanded(true);
    setIsVendorPortfolioExpanded(true);
    setTrendTableCollapsed(false);
    setMonthlyTrendTableCollapsed(false);
    setTotalCompCapitalizationCollapsed(false);
    setIsTeamCompositionExpanded(true);
    setIsHistoricalTeamCompositionExpanded(true);
    setIsAllTeamsOverviewExpanded(true);
    setIsTeamAnalyticsExpanded(true);

    // Expand all cost centers
    const expandedCostCenters: Record<string, boolean> = {};
    if (state.teams && state.teams.length > 0) {
      const costCenterGroups = groupTeamsByCostCenter(state.teams);
      costCenterGroups.forEach((group) => {
        expandedCostCenters[group.costCenter] = true;
      });
      setCostCenterExpanded(expandedCostCenters);
    }
  };

  const restoreOriginalSectionStates = () => {
    console.log("Restoring original section states...");

    if (originalSectionStates) {
      setIsStrategicContextExpanded(
        originalSectionStates.isStrategicContextExpanded
      );
      setIsYTDPerformanceExpanded(
        originalSectionStates.isYTDPerformanceExpanded
      );
      setIsForwardLookingExpanded(
        originalSectionStates.isForwardLookingExpanded
      );
      setIsRiskVelocityExpanded(originalSectionStates.isRiskVelocityExpanded);
      setIsVendorSpendingExpanded(
        originalSectionStates.isVendorSpendingExpanded
      );
      setIsVendorPortfolioExpanded(
        originalSectionStates.isVendorPortfolioExpanded
      );
      setTrendTableCollapsed(originalSectionStates.trendTableCollapsed);
      setMonthlyTrendTableCollapsed(
        originalSectionStates.monthlyTrendTableCollapsed
      );
      setTotalCompCapitalizationCollapsed(
        originalSectionStates.totalCompCapitalizationCollapsed
      );
      setIsTeamCompositionExpanded(
        originalSectionStates.isTeamCompositionExpanded
      );
      setIsHistoricalTeamCompositionExpanded(
        originalSectionStates.isHistoricalTeamCompositionExpanded
      );
      setIsAllTeamsOverviewExpanded(
        originalSectionStates.isAllTeamsOverviewExpanded
      );
      setIsTeamAnalyticsExpanded(originalSectionStates.isTeamAnalyticsExpanded);
      setCostCenterExpanded(originalSectionStates.costCenterExpanded);

      // Clear saved states
      setOriginalSectionStates(null);
    }
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

  // Export mode state to render all tabs during export
  const [isExportMode, setIsExportMode] = useState(false);

  const showAllTabsForExport = () => {
    // Enable export mode to render all tabs
    setIsExportMode(true);
  };

  const restoreTabVisibility = () => {
    // Disable export mode to return to normal tab behavior
    setIsExportMode(false);
  };

  // Helper to get performance class for dynamic styling
  const getPerformanceClass = (
    kpiType: string,
    value: number | string,
    percentage?: number
  ) => {
    switch (kpiType) {
      case "annualVariance":
        if (percentage && percentage > 10) return "performance-good"; // Under budget
        if (percentage && percentage < -10) return "performance-danger"; // Over budget
        return "performance-warning";

      case "budgetUtilization":
        if (typeof value === "number") {
          if (value > 80) return "performance-warning"; // High utilization
          if (value < 30) return "performance-good"; // Low utilization
        }
        return "";

      case "targetAchievement":
        if (typeof value === "number") {
          if (value >= 85 && value <= 115) return "performance-good"; // More forgiving range
          if (value > 130 || value < 50) return "performance-danger"; // Much more forgiving thresholds
          return "performance-warning";
        }
        return "";

      case "ytdVariance":
        // Positive variance = under budget (good), negative = over budget (bad)
        if (percentage && percentage > 5) return "performance-good"; // Under budget is good
        if (percentage && percentage < -15) return "performance-danger"; // Only show red for significant overspend
        return ""; // Neutral for small variances

      case "forecastVariance":
        if (typeof value === "number") {
          if (value > 1000000) return "performance-warning"; // greater than $1M variance is concerning
          if (value < -1000000) return "performance-danger"; // less than -$1M is over spend
          if (value > 0 && value <= 1000000) return "performance-good"; // under budget is good
          return "performance-warning";
        }
        return "";

      case "monthsRemaining":
        if (typeof value === "number") {
          if (value > 6) return "performance-good"; // Plenty of runway
          if (value < 2) return "performance-danger"; // Low runway
          return "performance-warning";
        }
        return "";

      case "fullYearForecast":
        // Compare forecast to annual budget target to determine performance
        if (typeof value === "number") {
          const annualTarget = kpis?.annualBudgetTarget || 0;
          if (annualTarget > 0) {
            const forecastVsTarget =
              ((value - annualTarget) / annualTarget) * 100;
            if (forecastVsTarget > 10) return "performance-danger"; // Significantly over budget
            if (forecastVsTarget < -5) return "performance-good"; // Under budget
            return "performance-warning"; // Close to budget
          }
        }
        return "";

      case "burnRate":
        // Compare burn rate to expected monthly budget
        if (typeof value === "number") {
          const expectedMonthlyBudget = (kpis?.annualBudgetTarget || 0) / 12;
          if (expectedMonthlyBudget > 0) {
            const burnRateRatio = value / expectedMonthlyBudget;
            if (burnRateRatio > 1.2) return "performance-danger"; // Burning too fast
            if (burnRateRatio < 0.8) return "performance-good"; // Burning slower than expected
            return "performance-warning"; // Normal burn rate
          }
        }
        return "";

      case "varianceTrend":
        if (typeof value === "string") {
          if (value === "Improving") return "performance-good";
          if (value === "Declining") return "performance-danger";
          if (value === "Stable") return "performance-warning";
        }
        return "";

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
          <button onClick={handlePrint} className="btn-primary">
            🖨️ Print Current Tab
          </button>
          <button onClick={handleExportPresentation} className="btn-primary">
            📊 Export Presentation
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`view-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Executive Commentary Tab */}
        {(activeTab === "executive-commentary" || isExportMode) && (
          <div
            className="tab-panel"
            role="tabpanel"
            aria-labelledby="tab-executive-commentary"
            data-tab-title="Executive Commentary"
          >
            {/* Executive Commentary Section */}
            <div className="section-container">
              <h2 className="section-heading">Executive Commentary</h2>

              {/* Summary Section Toggle Controls */}
              <div className="summary-toggles">
                <h4 className="toggles-header">Summary Sections:</h4>
                <div className="toggle-controls">
                  {summaryRegistry.getAllSections().map((section) => (
                    <label key={section.id} className="toggle-label">
                      <input
                        type="checkbox"
                        checked={
                          summaryToggles[section.id as keyof SummaryToggles]
                        }
                        onChange={(e) => {
                          setSummaryToggles((prev) => ({
                            ...prev,
                            [section.id]: e.target.checked,
                          }));
                        }}
                        className="toggle-checkbox"
                      />
                      <span className="toggle-text">{section.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                className="commentary-textarea"
                placeholder="Add your executive notes and insights here..."
              />
              {/* Print-only version of commentary text */}
              <div
                className="commentary-print-text"
                style={{ display: "none" }}
              >
                {userNotes.split("\n").map((line, index) => (
                  <p key={index}>{line || "\u00A0"}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Overall Budget Tab */}
        {(activeTab === "overall-budget" || isExportMode) && (
          <div
            className="tab-panel"
            role="tabpanel"
            aria-labelledby="tab-overall-budget"
            data-tab-title="Overall Budget"
          >
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
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.95rem",
                    color: "#2d3a4a",
                    background: "#f5f7fa",
                    borderRadius: "6px",
                    padding: "0.25rem 0.75rem",
                    marginLeft: "1rem",
                  }}
                >
                  <span
                    style={{
                      color: "#3498db",
                      fontSize: "1.2em",
                      marginRight: "0.25em",
                      display: "flex",
                      alignItems: "center",
                    }}
                    aria-label="Info"
                    title="Summary"
                  >
                    ℹ️
                  </span>
                  <span>
                    Annual Budget and YTD Actual Spend both sourced from MM-YYYY
                    Financial Reporting.xlsx and Vendor Reconciliation
                    Model.xlsm.{" "}
                  </span>
                </span>
                {!isStrategicContextExpanded && (
                  <div className="compact-summary">
                    <span className="compact-metric">
                      Budget:{" "}
                      <strong>
                        {formatCurrencyFull(kpis.annualBudgetTarget)}
                      </strong>
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
                )}
              </div>

              {/* Expandable content */}
              {(isStrategicContextExpanded || isExportMode) && (
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
                        onMouseMove={(e) =>
                          handleMouseMove(e, "annualBudgetTarget")
                        }
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
                        onMouseEnter={(e) =>
                          handleMouseEnter(e, "annualVariance")
                        }
                        onMouseMove={(e) =>
                          handleMouseMove(e, "annualVariance")
                        }
                        onMouseLeave={handleMouseLeave}
                        className={`kpi-card ${getPerformanceClass(
                          "annualVariance",
                          kpis.annualVariance,
                          kpis.annualVariancePct
                        )}`}
                      />
                      <KPICard
                        title="Budget Utilization"
                        value={kpis.budgetUtilization}
                        isPercentage={true}
                        kpiType={getPerformanceClass(
                          "budgetUtilization",
                          kpis.budgetUtilization
                        )}
                        onMouseEnter={(e) =>
                          handleMouseEnter(e, "budgetUtilization")
                        }
                        onMouseMove={(e) =>
                          handleMouseMove(e, "budgetUtilization")
                        }
                        onMouseLeave={handleMouseLeave}
                        className={`kpi-card ${getPerformanceClass(
                          "budgetUtilization",
                          kpis.budgetUtilization
                        )}`}
                      />
                      <KPICard
                        title="Target Achievement"
                        value={kpis.targetAchievement}
                        isPercentage={true}
                        subtitle={getTargetAchievementSubtitle(
                          kpis.targetAchievement
                        )}
                        kpiType={getPerformanceClass(
                          "targetAchievement",
                          kpis.targetAchievement
                        )}
                        onMouseEnter={(e) =>
                          handleMouseEnter(e, "targetAchievement")
                        }
                        onMouseMove={(e) =>
                          handleMouseMove(e, "targetAchievement")
                        }
                        onMouseLeave={handleMouseLeave}
                        className={`kpi-card ${getPerformanceClass(
                          "targetAchievement",
                          kpis.targetAchievement
                        )}`}
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
                onClick={() =>
                  setIsYTDPerformanceExpanded(!isYTDPerformanceExpanded)
                }
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
                      Budget:{" "}
                      <strong>{formatCurrencyFull(kpis.ytdBudget)}</strong>
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

              {(isYTDPerformanceExpanded || isExportMode) && (
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
                      <strong>
                        {formatCurrencyFull(kpis.fullYearForecast)}
                      </strong>
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

              {(isForwardLookingExpanded || isExportMode) && (
                <div className="kpi-row">
                  <div className="kpi-cards">
                    <KPICard
                      title="Full-Year Forecast"
                      value={kpis.fullYearForecast}
                      isCurrency={true}
                      kpiType={getPerformanceClass(
                        "fullYearForecast",
                        kpis.fullYearForecast
                      )}
                      onMouseEnter={(e) =>
                        handleMouseEnter(e, "fullYearForecast")
                      }
                      onMouseMove={(e) =>
                        handleMouseMove(e, "fullYearForecast")
                      }
                      onMouseLeave={handleMouseLeave}
                      className={`kpi-card ${getPerformanceClass(
                        "fullYearForecast",
                        kpis.fullYearForecast
                      )}`}
                    />
                    <KPICard
                      title="Forecast vs Target"
                      value={kpis.forecastVsTargetVariance}
                      isCurrency={true}
                      kpiType={getPerformanceClass(
                        "forecastVariance",
                        kpis.forecastVsTargetVariance
                      )}
                      onMouseEnter={(e) =>
                        handleMouseEnter(e, "forecastVsTarget")
                      }
                      onMouseMove={(e) =>
                        handleMouseMove(e, "forecastVsTarget")
                      }
                      onMouseLeave={handleMouseLeave}
                      className={`kpi-card ${getPerformanceClass(
                        "forecastVariance",
                        kpis.forecastVsTargetVariance
                      )}`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Risk & Velocity - Collapsible */}
            <div className="kpi-section risk-velocity">
              <div
                className="section-header"
                onClick={() =>
                  setIsRiskVelocityExpanded(!isRiskVelocityExpanded)
                }
              >
                {" "}
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
                    <span className="compact-metric">
                      Trend: <strong>{kpis.varianceTrend}</strong>
                    </span>
                  </div>
                )}
              </div>

              {(isRiskVelocityExpanded || isExportMode) && (
                <div className="kpi-row">
                  <div className="kpi-cards">
                    <KPICard
                      title="Monthly Burn Rate"
                      value={kpis.burnRate}
                      isCurrency={true}
                      kpiType={getPerformanceClass("burnRate", kpis.burnRate)}
                      className={`kpi-card ${getPerformanceClass(
                        "burnRate",
                        kpis.burnRate
                      )}`}
                      onMouseEnter={(e) => handleMouseEnter(e, "burnRate")}
                      onMouseMove={(e) => handleMouseMove(e, "burnRate")}
                      onMouseLeave={handleMouseLeave}
                    />
                    <KPICard
                      title="Months Remaining"
                      value={`${
                        kpis.monthsRemaining > 0
                          ? kpis.monthsRemaining.toFixed(1)
                          : "∞"
                      } months`}
                      kpiType={getPerformanceClass(
                        "monthsRemaining",
                        kpis.monthsRemaining
                      )}
                      className={`kpi-card ${getPerformanceClass(
                        "monthsRemaining",
                        kpis.monthsRemaining
                      )}`}
                      onMouseEnter={(e) =>
                        handleMouseEnter(e, "monthsRemaining")
                      }
                      onMouseMove={(e) => handleMouseMove(e, "monthsRemaining")}
                      onMouseLeave={handleMouseLeave}
                    />
                    <KPICard
                      title="Variance Trend"
                      value={kpis.varianceTrend}
                      kpiType={getPerformanceClass(
                        "varianceTrend",
                        kpis.varianceTrend
                      )}
                      className={`kpi-card ${getPerformanceClass(
                        "varianceTrend",
                        kpis.varianceTrend
                      )}`}
                      onMouseEnter={(e) => handleMouseEnter(e, "varianceTrend")}
                      onMouseMove={(e) => handleMouseMove(e, "varianceTrend")}
                      onMouseLeave={handleMouseLeave}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Budget Visuals Tab */}
        {(activeTab === "budget-visuals" || isExportMode) && (
          <div
            className="tab-panel"
            role="tabpanel"
            aria-labelledby="tab-budget-visuals"
            data-tab-title="Budget Visuals"
          >
            {/* Budget vs Actual Trend Chart - Monthly */}
            <div className="trend-chart-section">
              <h2 className="section-heading">
                Budget vs Actual Trend, Monthly
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
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
                    stroke="#007255ff"
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
                  {/* Monthly Adjusted actual line - HIDDEN */}
                  {/* <Line
                    type="monotone"
                    dataKey="monthlyAdjusted"
                    stroke="#8B0000"
                    strokeWidth={4}
                    name="Monthly Adj Actual"
                    connectNulls={false}
                  /> */}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Trend Data Table - Collapsible */}
            <div className="trend-data-table-section">
              <div
                className="collapsible-header"
                onClick={() =>
                  setMonthlyTrendTableCollapsed(!monthlyTrendTableCollapsed)
                }
              >
                <h3>
                  {monthlyTrendTableCollapsed ? "+" : "−"} Monthly Trend Chart
                  Data
                </h3>
              </div>

              {!monthlyTrendTableCollapsed && (
                <div className="trend-data-table">
                  <table className="trend-table monthly-trend-table">
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th className="text-blue">Monthly Budget</th>
                        <th className="text-green">Monthly Actual</th>
                        <th className="text-orange">Monthly Forecast</th>
                        {/* <th className="text-dark-red">Monthly Adj Actual</th> */}
                        <th>Variance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trend.map((data, index) => (
                        <tr
                          key={index}
                          className={
                            !data.isFinalMonth ? "table-row-forecast" : ""
                          }
                        >
                          <td>{data.period}</td>
                          <td>
                            {data.monthlyBudget !== null
                              ? formatCurrencyFull(data.monthlyBudget)
                              : "-"}
                          </td>
                          <td>
                            {data.monthlyActual !== null
                              ? formatCurrencyFull(data.monthlyActual)
                              : "-"}
                          </td>
                          <td>
                            {data.monthlyReforecast !== null
                              ? formatCurrencyFull(data.monthlyReforecast)
                              : "-"}
                          </td>
                          {/* <td>
                            {data.monthlyAdjusted !== null
                              ? formatCurrencyFull(data.monthlyAdjusted)
                              : "-"}
                          </td> */}
                          <td>
                            {(() => {
                              // Calculate variance: if Monthly Actual > 0 use that, otherwise use Monthly Forecast
                              const budget = data.monthlyBudget;
                              const actual = data.monthlyActual;
                              const forecast = data.monthlyReforecast;

                              if (budget === null) return "-";

                              let compareValue = null;
                              if (actual !== null && actual > 0) {
                                compareValue = actual;
                              } else if (forecast !== null) {
                                compareValue = forecast;
                              }

                              if (compareValue === null) return "-";

                              const variance = compareValue - budget;
                              const isPositive = variance >= 0;

                              return (
                                <span
                                  style={{
                                    color: isPositive ? "#e74c3c" : "#27ae60",
                                    fontWeight: "600",
                                  }}
                                >
                                  {isPositive ? "+" : ""}
                                  {formatCurrencyFull(variance)}
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                      ))}

                      {/* Totals Row */}
                      <tr className="table-row-totals">
                        <td>
                          <strong>Total</strong>
                        </td>
                        <td>
                          <strong>
                            {formatCurrencyFull(
                              trend.reduce(
                                (sum, data) => sum + (data.monthlyBudget || 0),
                                0
                              )
                            )}
                          </strong>
                        </td>
                        <td>
                          <strong>
                            {formatCurrencyFull(
                              trend.reduce(
                                (sum, data) => sum + (data.monthlyActual || 0),
                                0
                              )
                            )}
                          </strong>
                        </td>
                        <td>
                          <strong>
                            {formatCurrencyFull(
                              trend.reduce(
                                (sum, data) =>
                                  sum + (data.monthlyReforecast || 0),
                                0
                              )
                            )}
                          </strong>
                        </td>
                        <td>
                          <strong>
                            {(() => {
                              // Calculate total variance by summing individual month variances using same logic as rows
                              const totalVariance = trend.reduce(
                                (sum, data) => {
                                  const budget = data.monthlyBudget;
                                  const actual = data.monthlyActual;
                                  const forecast = data.monthlyReforecast;

                                  if (budget === null) return sum;

                                  let compareValue = null;
                                  if (actual !== null && actual > 0) {
                                    compareValue = actual;
                                  } else if (forecast !== null) {
                                    compareValue = forecast;
                                  }

                                  if (compareValue === null) return sum;

                                  const monthVariance = compareValue - budget;
                                  return sum + monthVariance;
                                },
                                0
                              );

                              const isPositive = totalVariance >= 0;

                              return (
                                <span
                                  style={{
                                    color: isPositive ? "#e74c3c" : "#27ae60",
                                    fontWeight: "600",
                                  }}
                                >
                                  {isPositive ? "+" : ""}
                                  {formatCurrencyFull(totalVariance)}
                                </span>
                              );
                            })()}
                          </strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Monthly Spending KPIs */}
            <div className="section-container">
              <h4 className="monthly-spending-header">
                Monthly Spending Analysis
              </h4>
              <div className="kpi-row">
                {(() => {
                  // Calculate Average Monthly Spend YTD (Regular and Adjusted)
                  const finalMonths = trend.filter((data) => data.isFinalMonth);
                  const totalMonthlyActual = finalMonths.reduce((sum, data) => {
                    return sum + (data.monthlyActual || 0);
                  }, 0);
                  const totalMonthlyAdjusted = finalMonths.reduce(
                    (sum, data) => {
                      return sum + (data.monthlyAdjusted || 0);
                    },
                    0
                  );

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
                  else if (lastCompletedQuarter === 2)
                    quarterMonths = [4, 5, 6];
                  else if (lastCompletedQuarter === 3)
                    quarterMonths = [7, 8, 9];
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
                    return (
                      quarterMonths.includes(monthNum) && data.isFinalMonth
                    );
                  });

                  const totalQuarterlyActual = quarterData.reduce(
                    (sum, data) => {
                      return sum + (data.monthlyActual || 0);
                    },
                    0
                  );
                  const totalQuarterlyAdjusted = quarterData.reduce(
                    (sum, data) => {
                      return sum + (data.monthlyAdjusted || 0);
                    },
                    0
                  );

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
                      <div className="kpi-cards">
                        <div className="kpi-card">
                          <span>Avg Monthly Spend YTD</span>
                          <strong>
                            {formatCurrencyFull(avgMonthlyAdjustedYTD)}
                          </strong>
                          <div className="kpi-description-text">
                            Regular: {formatCurrencyFull(avgMonthlySpendYTD)}
                          </div>
                          <div className="kpi-summary-text">
                            Based on {finalMonths.length} completed months
                          </div>
                        </div>

                        <div className="kpi-card">
                          <span>Avg Quarterly Spend</span>
                          <strong>
                            {formatCurrencyFull(avgQuarterlyAdjusted)}
                          </strong>
                          <div className="kpi-description-text">
                            Regular: {formatCurrencyFull(avgQuarterlySpend)}
                          </div>
                          <div className="kpi-summary-text">
                            Q{lastCompletedQuarter} average (
                            {quarterData.length} months)
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Resource Allocation and Spend Tab */}
        {(activeTab === "resource-allocation" || isExportMode) && (
          <div
            className="tab-panel"
            role="tabpanel"
            aria-labelledby="tab-resource-allocation"
            data-tab-title="Resource Allocation"
          >
            {/* Resource Allocation & Hiring Capacity - Detailed Analysis */}
            <div className="section-container">
              <h2 className="section-heading">
                Resource Allocation & Hiring Capacity
              </h2>

              <div className="mb-2">
                <h3 className="hiring-analysis-header">
                  Hiring Runway Analysis
                </h3>

                <div className="hiring-analysis-container">
                  <div
                    className="hiring-analysis-item"
                    onMouseEnter={(e) =>
                      handleHiringMouseEnter(e, "netCompAvailable")
                    }
                    onMouseLeave={handleHiringMouseLeave}
                  >
                    <span className="hiring-analysis-label">
                      Net Compensation Available
                    </span>
                    <span className="hiring-analysis-note">
                      Annual compensation budget minus YTD actual spend
                    </span>
                    <span className="hiring-analysis-value">
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
                    onMouseEnter={(e) =>
                      handleHiringMouseEnter(e, "remainingMonths")
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
                      {resourceData.hiringCapacity.remainingMonths} months ×
                      3-month average
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
                      {resourceData.hiringCapacity.budgetVsProjection >= 0
                        ? "+"
                        : ""}
                      {formatCurrencyFull(
                        resourceData.hiringCapacity.budgetVsProjection
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Comp & Capitalization Section */}
            <div className="kpi-section total-comp-capitalization">
              <div
                className="section-header"
                onClick={() =>
                  setTotalCompCapitalizationCollapsed(
                    !totalCompCapitalizationCollapsed
                  )
                }
              >
                <h4 className="section-title">
                  <span className="expand-icon">
                    {totalCompCapitalizationCollapsed ? "+" : "−"}
                  </span>
                  Total Comp & Capitalization
                </h4>
                {totalCompCapitalizationCollapsed && (
                  <div className="compact-summary">
                    <span className="compact-metric">
                      <strong>Total Compensation:</strong>
                    </span>
                    <span className="compact-metric">
                      YTD:{" "}
                      <strong>
                        {formatCurrencyFull(
                          resourceData.totalCompensation.ytdActual
                        )}
                      </strong>
                    </span>
                    <span className="compact-metric">
                      Budget:{" "}
                      <strong>
                        {formatCurrencyFull(
                          resourceData.totalCompensation.annualBudget
                        )}
                      </strong>
                    </span>
                    <span className="compact-metric">
                      Remaining:{" "}
                      <strong>
                        {formatCurrencyFull(
                          resourceData.totalCompensation.remaining
                        )}
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              {(!totalCompCapitalizationCollapsed || isExportMode) && (
                <>
                  <div className="kpi-row">
                    <div
                      className="kpi-cards"
                      style={{ gridTemplateColumns: "1fr 1fr" }}
                    >
                      <div className="kpi-subsection">
                        <h5 className="kpi-subsection-title">
                          Total Compensation
                        </h5>
                        <div className="kpi-cards">
                          <KPICard
                            title="YTD Actual"
                            value={resourceData.totalCompensation.ytdActual}
                            isCurrency={true}
                            kpiType="neutral"
                          />
                          <KPICard
                            title="Annual Budget"
                            value={resourceData.totalCompensation.annualBudget}
                            isCurrency={true}
                            kpiType="neutral"
                          />
                          <KPICard
                            title="Remaining"
                            value={resourceData.totalCompensation.remaining}
                            isCurrency={true}
                            kpiType="neutral"
                          />
                        </div>
                      </div>
                      <div className="kpi-subsection">
                        <h5 className="kpi-subsection-title">
                          Capitalized Salaries
                        </h5>
                        <div className="kpi-cards">
                          <KPICard
                            title="YTD Actual"
                            value={Math.abs(
                              resourceData.capitalizedSalaries.ytdActual
                            )}
                            isCurrency={true}
                            kpiType="neutral"
                          />
                          <KPICard
                            title="Monthly Avg"
                            value={Math.abs(
                              resourceData.capitalizedSalaries.monthlyAverage
                            )}
                            isCurrency={true}
                            kpiType="neutral"
                          />
                          <KPICard
                            title="Offset Rate"
                            value={resourceData.capitalizedSalaries.offsetRate}
                            isPercentage={true}
                            kpiType="neutral"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Vendor Info Tab */}
        {(activeTab === "vendor-info" || isExportMode) && (
          <div
            className="tab-panel"
            role="tabpanel"
            aria-labelledby="tab-vendor-info"
            data-tab-title="Vendor Info"
          >
            {/* Vendor Tracking Section with Variance Analysis */}
            <div className="section-container">
              <h2 className="section-heading">Vendor Tracking</h2>

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
                  onMouseEnter={(e) =>
                    handleVendorMouseEnter(e, "totalVendorSpend")
                  }
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
                    const variance =
                      getTotalVendorSpend(state) - vendorData.total;
                    if (variance === 0) return "variance-positive";
                    if (variance < 0) return "variance-warning";
                    return "variance-negative";
                  })()}`}
                  onMouseEnter={(e) =>
                    handleVendorMouseEnter(e, "vendorVariance")
                  }
                  onMouseLeave={handleVendorMouseLeave}
                >
                  <div className="vendor-variance-title">Vendor Variance</div>
                  <div
                    className={`vendor-variance-amount ${(() => {
                      const variance =
                        getTotalVendorSpend(state) - vendorData.total;
                      if (variance === 0) return "positive";
                      if (variance < 0) return "warning";
                      return "negative";
                    })()}`}
                  >
                    {(() => {
                      const variance =
                        getTotalVendorSpend(state) - vendorData.total;
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
            </div>

            {/* Vendor Portfolio Management Section */}
            <VendorPortfolioSection
              state={state}
              isExpanded={isVendorPortfolioExpanded}
              onToggleExpanded={() =>
                setIsVendorPortfolioExpanded(!isVendorPortfolioExpanded)
              }
              onMouseEnter={handleVendorMouseEnter}
              onMouseMove={handleVendorMouseMove}
              onMouseLeave={handleVendorMouseLeave}
            />

            {/* Top 10 Vendors Section */}
            <div className="section-container">
              <h2 className="section-heading">Top 10 Vendors</h2>

              <div className="vendor-breakdown-subtitle">
                Top 10 YTD vendor spend in {getLastFinalMonthName(state)}.
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="team-details-table">
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>Vendor Category</th>
                      <th>Spend ({getLastFinalMonthName(state)})</th>
                      <th>Spend YTD</th>
                      <th>Annual Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorBreakdownData.length > 0 ? (
                      <>
                        {vendorBreakdownData
                          .sort(
                            (a, b) => b.currentMonthSpend - a.currentMonthSpend
                          ) // Sort by current month spend descending
                          .slice(0, 10) // Take only top 10 vendors
                          .map((vendor) => (
                            <tr key={vendor.id}>
                              <td>{vendor.vendor}</td>
                              <td>{vendor.vendorCategory}</td>
                              <td>
                                {formatCurrencyFull(vendor.currentMonthSpend)}
                              </td>
                              <td>{formatCurrencyFull(vendor.ytdSpend)}</td>
                              <td>{formatCurrencyFull(vendor.annualBudget)}</td>
                            </tr>
                          ))}
                        {/* Totals row */}
                        <tr
                          style={{
                            fontWeight: "bold",
                            backgroundColor: "#f8f9fa",
                            borderTop: "2px solid #dee2e6",
                          }}
                        >
                          <td>Total (Top 10)</td>
                          <td>-</td>
                          <td>
                            {formatCurrencyFull(
                              vendorBreakdownData
                                .sort(
                                  (a, b) =>
                                    b.currentMonthSpend - a.currentMonthSpend
                                )
                                .slice(0, 10)
                                .reduce(
                                  (sum, vendor) =>
                                    sum + vendor.currentMonthSpend,
                                  0
                                )
                            )}
                          </td>
                          <td>
                            {formatCurrencyFull(
                              vendorBreakdownData
                                .sort(
                                  (a, b) =>
                                    b.currentMonthSpend - a.currentMonthSpend
                                )
                                .slice(0, 10)
                                .reduce(
                                  (sum, vendor) => sum + vendor.ytdSpend,
                                  0
                                )
                            )}
                          </td>
                          <td>
                            {formatCurrencyFull(
                              vendorBreakdownData
                                .sort(
                                  (a, b) =>
                                    b.currentMonthSpend - a.currentMonthSpend
                                )
                                .slice(0, 10)
                                .reduce(
                                  (sum, vendor) => sum + vendor.annualBudget,
                                  0
                                )
                            )}
                          </td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            textAlign: "center",
                            fontStyle: "italic",
                            color: "#666",
                          }}
                        >
                          No vendor data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {(activeTab === "resource-spend" || isExportMode) && (
          <div
            className="tab-panel"
            role="tabpanel"
            aria-labelledby="tab-resource-spend"
            data-tab-title="Resource Spend"
          >
            {/* Empty state check */}
            {state.teams.length === 0 ? (
              <div className="empty-state-container">
                <p className="empty-state-message">
                  No teams have been added yet. Visit the Resources section to
                  add teams.
                </p>
              </div>
            ) : (
              <>
                {/* Team Cost Summary Section */}
                <div className="section-container">
                  <h2 className="section-heading">Team Cost Summary</h2>

                  {/* Historical Team Costs Subsection */}
                  <div className="kpi-section team-composition-summary">
                    <div
                      className="section-header"
                      onClick={() =>
                        setIsHistoricalTeamCompositionExpanded(
                          !isHistoricalTeamCompositionExpanded
                        )
                      }
                    >
                      <h4 className="section-title">
                        <span className="expand-icon">
                          {isHistoricalTeamCompositionExpanded ? "−" : "+"}
                        </span>
                        Team Costs as of {getLastFinalMonthName(state)}
                      </h4>
                      {!isHistoricalTeamCompositionExpanded && (
                        <div className="compact-summary">
                          <span className="compact-metric">
                            Teams:{" "}
                            <strong>{historicalTeamMetrics.totalTeams}</strong>
                          </span>
                          <span className="compact-metric">
                            Headcount:{" "}
                            <strong>
                              {historicalTeamMetrics.totalHeadcount}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {(isHistoricalTeamCompositionExpanded || isExportMode) && (
                      <div className="kpi-row">
                        <div className="kpi-cards">
                          <KPICard
                            title="Total Teams"
                            value={historicalTeamMetrics.totalTeams}
                            isCurrency={false}
                            kpiType="neutral"
                            className="kpi-card neutral"
                          />
                          <KPICard
                            title="Total Headcount"
                            value={historicalTeamMetrics.totalHeadcount}
                            isCurrency={false}
                            kpiType="neutral"
                            className="kpi-card neutral"
                          />
                          <KPICard
                            title="Total Annual Cost"
                            value={historicalTeamMetrics.totalCost}
                            isCurrency={true}
                            kpiType="neutral"
                            className="kpi-card neutral"
                          />
                          <KPICard
                            title="Total Monthly Cost"
                            value={historicalTeamMetrics.totalCost / 12}
                            isCurrency={true}
                            kpiType="neutral"
                            className="kpi-card neutral"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Current Team Costs Subsection */}
                  <div className="kpi-section team-composition-summary">
                    <div
                      className="section-header"
                      onClick={() =>
                        setIsTeamCompositionExpanded(!isTeamCompositionExpanded)
                      }
                    >
                      <h4 className="section-title">
                        <span className="expand-icon">
                          {isTeamCompositionExpanded ? "−" : "+"}
                        </span>
                        Current Costs as of{" "}
                        {new Date().toLocaleDateString("en-US", {
                          month: "long",
                        })}
                      </h4>
                      {!isTeamCompositionExpanded && (
                        <div className="compact-summary">
                          <span className="compact-metric">
                            Teams: <strong>{teamMetrics.totalTeams}</strong>
                          </span>
                          <span className="compact-metric">
                            Headcount:{" "}
                            <strong>{teamMetrics.totalHeadcount}</strong>
                          </span>
                          <span className="compact-metric">
                            Total Annual Cost:{" "}
                            <strong>
                              {formatCurrencyFull(teamMetrics.totalCost)}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {(isTeamCompositionExpanded || isExportMode) && (
                      <div className="kpi-row">
                        <div className="kpi-cards">
                          <KPICard
                            title="Total Teams"
                            value={teamMetrics.totalTeams}
                            isCurrency={false}
                            kpiType="neutral"
                            className="kpi-card neutral"
                          />
                          <KPICard
                            title="Total Headcount"
                            value={teamMetrics.totalHeadcount}
                            isCurrency={false}
                            kpiType="neutral"
                            className="kpi-card neutral"
                          />
                          <KPICard
                            title="Total Annual Cost"
                            value={teamMetrics.totalCost}
                            isCurrency={true}
                            kpiType="neutral"
                            className="kpi-card neutral"
                          />
                          <KPICard
                            title="Total Monthly Cost"
                            value={teamMetrics.totalCost / 12}
                            isCurrency={true}
                            kpiType="neutral"
                            className="kpi-card neutral"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* All Teams Table Section */}
                <div className="section-container">
                  <h2 className="section-heading">
                    All Teams Overview as of {getLastFinalMonthName(state)}
                  </h2>
                  <div className="kpi-section cost-center-section">
                    <div
                      className="section-header"
                      onClick={() =>
                        setIsAllTeamsOverviewExpanded(
                          !isAllTeamsOverviewExpanded
                        )
                      }
                    >
                      <h4 className="section-title">
                        <span className="expand-icon">
                          {isAllTeamsOverviewExpanded ? "−" : "+"}
                        </span>
                        All Teams
                      </h4>
                      {!isAllTeamsOverviewExpanded && (
                        <div className="compact-summary">
                          <span className="compact-metric">
                            Teams:{" "}
                            <strong>{historicalTeamMetrics.totalTeams}</strong>
                          </span>
                          <span className="compact-metric">
                            Headcount:{" "}
                            <strong>
                              {historicalTeamMetrics.totalHeadcount}
                            </strong>
                          </span>
                          <span className="compact-metric">
                            Total Cost:{" "}
                            <strong>
                              {formatCurrencyFull(
                                historicalTeamMetrics.totalCost
                              )}
                            </strong>
                          </span>
                          <span className="compact-metric">
                            Avg Cost/Head:{" "}
                            <strong>
                              {formatCurrencyFull(
                                historicalTeamMetrics.averageCostPerHead
                              )}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>
                    {isAllTeamsOverviewExpanded && (
                      <div className="cost-center-content">
                        <div style={{ overflowX: "auto" }}>
                          <table className="team-details-table">
                            <thead>
                              <tr>
                                <th>Team Name</th>
                                <th>Cost Center</th>
                                <th>Headcount</th>
                                <th>Location</th>
                                <th>Total Cost</th>
                                <th>Cost per Head</th>
                                {historicalTeams.some((team) => team.notes) && (
                                  <th>Notes</th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {[...historicalTeams]
                                .sort((a, b) => b.cost - a.cost)
                                .map((team) => {
                                  const efficiency =
                                    calculateTeamEfficiency(team);
                                  return (
                                    <tr key={team.id}>
                                      <td>{team.teamName}</td>
                                      <td>
                                        {team.currentCostCenter || "Unassigned"}
                                      </td>
                                      <td>{team.headcount}</td>
                                      <td>{team.location || "-"}</td>
                                      <td>{formatCurrencyFull(team.cost)}</td>
                                      <td>
                                        {efficiency
                                          ? formatCurrencyFull(efficiency)
                                          : "-"}
                                      </td>
                                      {historicalTeams.some((t) => t.notes) && (
                                        <td>{team.notes || "-"}</td>
                                      )}
                                    </tr>
                                  );
                                })}
                            </tbody>
                            <tfoot>
                              <tr
                                style={{
                                  fontWeight: "bold",
                                  backgroundColor: "#f8f9fa",
                                }}
                              >
                                <td>Total</td>
                                <td>-</td>
                                <td>{historicalTeamMetrics.totalHeadcount}</td>
                                <td>-</td>
                                <td>
                                  {formatCurrencyFull(
                                    historicalTeamMetrics.totalCost
                                  )}
                                </td>
                                <td>
                                  {formatCurrencyFull(
                                    historicalTeamMetrics.averageCostPerHead
                                  )}
                                </td>
                                {historicalTeams.some((team) => team.notes) && (
                                  <td>-</td>
                                )}
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cost Center Groups Section */}
                <div className="section-container">
                  <h2 className="section-heading">
                    Teams by Cost Center as of {getLastFinalMonthName(state)}
                  </h2>
                  {historicalTeamMetrics.costCenterGroups.map(
                    (group, index) => {
                      const isExpanded =
                        costCenterExpanded[group.costCenter] === true; // Default to collapsed
                      return (
                        <div
                          key={group.costCenter}
                          className="kpi-section cost-center-section"
                        >
                          <div
                            className="section-header"
                            onClick={() =>
                              setCostCenterExpanded((prev) => ({
                                ...prev,
                                [group.costCenter]: !isExpanded,
                              }))
                            }
                          >
                            <h4 className="section-title">
                              <span className="expand-icon">
                                {isExpanded ? "−" : "+"}
                              </span>
                              {group.costCenter}
                            </h4>
                            {!isExpanded && (
                              <div className="compact-summary">
                                <span className="compact-metric">
                                  Teams: <strong>{group.teams.length}</strong>
                                </span>
                                <span className="compact-metric">
                                  Headcount:{" "}
                                  <strong>{group.totalHeadcount}</strong>
                                </span>
                                <span className="compact-metric">
                                  Total Cost:{" "}
                                  <strong>
                                    {formatCurrencyFull(group.totalCost)}
                                  </strong>
                                </span>
                                <span className="compact-metric">
                                  Avg Cost/Head:{" "}
                                  <strong>
                                    {formatCurrencyFull(
                                      group.averageCostPerHead
                                    )}
                                  </strong>
                                </span>
                              </div>
                            )}
                          </div>
                          {isExpanded && (
                            <div className="cost-center-content">
                              <table className="team-details-table">
                                <thead>
                                  <tr>
                                    <th>Team Name</th>
                                    <th>Headcount</th>
                                    <th>Location</th>
                                    <th>Total Cost</th>
                                    <th>Cost per Head</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.teams.map((team) => {
                                    const efficiency =
                                      calculateTeamEfficiency(team);
                                    return (
                                      <tr key={team.id}>
                                        <td>{team.teamName}</td>
                                        <td>{team.headcount}</td>
                                        <td>{team.location || "-"}</td>
                                        <td>{formatCurrencyFull(team.cost)}</td>
                                        <td>
                                          {efficiency
                                            ? formatCurrencyFull(efficiency)
                                            : "-"}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>

                {/* Visualizations Section */}
                <div className="chart-section">
                  <div className="kpi-section">
                    <div
                      className="section-header"
                      onClick={() =>
                        setIsTeamAnalyticsExpanded(!isTeamAnalyticsExpanded)
                      }
                    >
                      <h2 className="section-title">
                        <span className="expand-icon">
                          {isTeamAnalyticsExpanded ? "−" : "+"}
                        </span>
                        Team Analytics as of {getLastFinalMonthName(state)}
                      </h2>
                      {!isTeamAnalyticsExpanded && (
                        <div className="compact-summary">
                          <span className="compact-metric">
                            Charts: <strong>2</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {(isTeamAnalyticsExpanded || isExportMode) && (
                      <div className="analytics-content">
                        {/* Headcount Distribution Bar Chart */}
                        <div className="chart-container">
                          <h3>Headcount Distribution by Team</h3>
                          <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={headcountChartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="name"
                                angle={-45}
                                textAnchor="end"
                                height={100}
                              />
                              <YAxis />
                              <RechartsTooltip />
                              <Bar dataKey="headcount">
                                {headcountChartData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={getCostCenterColor(
                                      entry.costCenter,
                                      teamMetrics.costCenterGroups
                                    )}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Cost Distribution Pie Chart */}
                        <div className="chart-container">
                          <h3>Cost Distribution by Cost Center</h3>
                          <ResponsiveContainer width="100%" height={400}>
                            <PieChart>
                              <Pie
                                data={costDistributionData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) =>
                                  `${name} (${(percent * 100).toFixed(0)}%)`
                                }
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {costDistributionData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={
                                      CHART_COLORS[index % CHART_COLORS.length]
                                    }
                                  />
                                ))}
                              </Pie>
                              <RechartsTooltip
                                formatter={(value) =>
                                  formatCurrencyFull(value as number)
                                }
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

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

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={handleCloseExportModal}
        onExport={handleExport}
        setExportMode={setIsExportMode}
        expandAllSections={expandAllSectionsForExport}
        restoreSectionStates={restoreOriginalSectionStates}
      />
    </div>
  );
};

export default React.memo(ExecutiveSummary);
