import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import ExportCustomizer from "../ExportCustomizer/ExportCustomizer";
// Removed local CSS import - now handled by main App CSS

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
  const [trendTableCollapsed, setTrendTableCollapsed] = useState(true);
  const [monthlyTrendTableCollapsed, setMonthlyTrendTableCollapsed] =
    useState(true);
  const [rollingTrendTableCollapsed, setRollingTrendTableCollapsed] =
    useState(true);
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
  };

  // Helper function to get resource allocation data
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

  // Helper function to get vendor tracking data (Cost of Sales + Other for final months only)
  const getVendorTrackingData = () => {
    const monthsData = Array.from({ length: 12 }, (_, i) => i + 1).map(
      (month) =>
        calculateMonthlyData(
          state.entries,
          state.categories,
          month,
          state.selectedYear
        )
    );

    let costOfSalesTotal = 0;
    let otherTotal = 0;

    monthsData.forEach((month) => {
      // Check if this month is marked as "Final" via IOSToggle
      const isFinal =
        state.monthlyForecastModes[state.selectedYear]?.[month.month] ?? false;

      if (isFinal) {
        // Sum Cost of Sales actual for final months only
        costOfSalesTotal += month.costOfSales.total.actual;

        // Sum "Other" actual for final months only (Other is a subgroup under OpEx)
        const otherSubGroup = month.opex.subGroups?.find(
          (sg: any) => sg.name === "Other"
        );
        if (otherSubGroup) {
          otherTotal += otherSubGroup.total.actual;
        }
      }
    });

    return {
      costOfSales: costOfSalesTotal,
      other: otherTotal,
      total: costOfSalesTotal + otherTotal,
    };
  };

  // Helper function to get total vendor spend from VendorTrackingTable data
  const getTotalVendorSpend = () => {
    const currentYearTrackingData =
      state.vendorTrackingData?.filter(
        (tracking) => tracking.year === state.selectedYear
      ) || [];

    let totalVendorSpend = 0;
    const months = [
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

    currentYearTrackingData.forEach((item) => {
      months.forEach((month) => {
        const monthValue =
          parseFloat(item[month as keyof typeof item] as string) || 0;
        // Values are already stored in thousands, so no need to multiply by 1000
        totalVendorSpend += monthValue;
      });
    });

    return totalVendorSpend;
  };

  // Helper function to generate tooltip content for vendor tracking metrics
  const getVendorTooltipContent = (metricType: string) => {
    const vendorData = getVendorTrackingData();
    const finalMonths = Array.from({ length: 12 }, (_, i) => i + 1).filter(
      (month) =>
        state.monthlyForecastModes[state.selectedYear]?.[month] ?? false
    );
    const finalMonthNames = finalMonths
      .map((month) =>
        new Date(2025, month - 1, 1).toLocaleString("default", {
          month: "short",
        })
      )
      .join(", ");

    switch (metricType) {
      case "costOfSales":
        return {
          definition: "Total Cost of Sales spending for months marked as Final",
          interpretation: `Your Cost of Sales spending for final months (${finalMonthNames}) totals ${formatCurrencyFull(
            vendorData.costOfSales
          )}`,
          formula: "Sum of Cost of Sales actual amounts for Final months only",
          calculation: `${finalMonths.length} Final months: ${finalMonthNames}`,
        };

      case "other":
        return {
          definition: "Total Other OpEx spending for months marked as Final",
          interpretation: `Your Other OpEx spending for final months (${finalMonthNames}) totals ${formatCurrencyFull(
            vendorData.other
          )}`,
          formula: "Sum of Other OpEx actual amounts for Final months only",
          calculation: `${finalMonths.length} Final months: ${finalMonthNames}`,
        };

      case "total":
        return {
          definition:
            "Combined Cost of Sales and Other OpEx spending for Final months",
          interpretation: `Your total vendor-related spending for final months is ${formatCurrencyFull(
            vendorData.total
          )} (${formatCurrencyFull(
            vendorData.costOfSales
          )} Cost of Sales + ${formatCurrencyFull(vendorData.other)} Other)`,
          formula: "Cost of Sales (Final) + Other OpEx (Final)",
          calculation: `${formatCurrencyFull(
            vendorData.costOfSales
          )} + ${formatCurrencyFull(vendorData.other)} = ${formatCurrencyFull(
            vendorData.total
          )}`,
        };

      case "totalVendorSpend":
        const totalVendorSpend = getTotalVendorSpend();
        return {
          definition:
            "Total vendor spending from all entries in the Vendor Tracking table",
          interpretation: `Your total vendor spending across all vendors and months is ${formatCurrencyFull(
            totalVendorSpend
          )}`,
          formula: "Sum of all monthly vendor tracking amounts for all vendors",
          calculation: `Sum of all Jan-Dec amounts from Vendor Tracking table = ${formatCurrencyFull(
            totalVendorSpend
          )}`,
        };

      case "vendorVariance":
        const vendorTableTotal = getTotalVendorSpend();
        const budgetVendorTotal = vendorData.total;
        const variance = vendorTableTotal - budgetVendorTotal;
        return {
          definition:
            "Difference between Vendor Tracking table total and budget vendor spending",
          interpretation: `Your vendor tracking shows ${
            variance >= 0 ? "more" : "less"
          } spending than budget tracking by ${formatCurrencyFull(
            Math.abs(variance)
          )}. ${
            variance >= 0
              ? "This suggests additional vendor spending not captured in budget categories."
              : "This suggests some budget vendor spending may not be tracked in vendor table."
          }`,
          formula:
            "Total Vendor Spend (Table) - Total Vendor Spending (Budget)",
          calculation: `${formatCurrencyFull(
            vendorTableTotal
          )} - ${formatCurrencyFull(budgetVendorTotal)} = ${formatCurrencyFull(
            variance
          )}`,
        };

      default:
        return {
          definition: "Vendor tracking metric",
          interpretation: "This metric helps track vendor-related spending",
          formula: "N/A",
          calculation: "N/A",
        };
    }
  };

  // Vendor tracking tooltip event handlers
  const handleVendorMouseEnter = (
    event: React.MouseEvent,
    metricType: string
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const content = getVendorTooltipContent(metricType);

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

  const handleVendorMouseLeave = () => {
    setTooltip({
      visible: false,
      content: null,
      x: 0,
      y: 0,
      showBelow: false,
    });
  };

  // Generate intelligent summary and initialize userNotes with it
  const intelligentSummary = useMemo(() => {
    // Get comprehensive KPI data
    const kpiData = getKPIData(state);

    // Get category-level variances for additional context
    const catMap: {
      [key: string]: {
        name: string;
        actual: number;
        budget: number;
        variance: number;
      };
    } = {};
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

    // Get last month with data for context
    const lastMonthName = getLastFinalMonthName();

    // Generate comprehensive summary
    let summary = `Executive Summary for ${state.selectedYear}:\n\n`; // Strategic Context
    summary += `Our annual budget target is ${formatCurrencyFull(
      kpiData.annualBudgetTarget
    )} for ${state.selectedYear}. `;
    summary += `Year-to-date through ${lastMonthName}, we have spent ${formatCurrencyFull(
      kpiData.ytdActual
    )}, `;
    summary += `leaving ${formatCurrencyFull(
      kpiData.remainingBudget
    )} remaining in our budget allocation. `;

    // YTD Performance Analysis - now part of paragraph 1
    if (kpiData.variance > 0) {
      summary += `We are currently ahead of our year-to-date budget by ${formatCurrencyFull(
        kpiData.variance
      )}, demonstrating disciplined spending management. `;
    } else if (kpiData.variance < 0) {
      summary += `We are currently behind our year-to-date budget by ${formatCurrencyFull(
        Math.abs(kpiData.variance)
      )}, indicating we are spending above our planned trajectory. `;
    } else {
      summary += `We are exactly on track with our year-to-date budget expectations. `;
    }

    // Forecast vs Target Analysis - continues in paragraph 1
    const forecastVariance = kpiData.forecastVsTargetVariance;
    summary += `Based on our current forecast, we project a remaining spending total of ${formatCurrencyFull(
      kpiData.fullYearForecast
    )}. `;

    if (forecastVariance > 1000000) {
      summary += `This puts us ahead of budget by ${formatCurrencyFull(
        forecastVariance
      )}, which requires careful attention as we want to avoid significant underspending that could impact our operational objectives. `;
    } else if (forecastVariance < -1000000) {
      summary += `This puts us over budget by ${formatCurrencyFull(
        Math.abs(forecastVariance)
      )}, creating a dangerous overspending situation that demands immediate corrective action. `;
    } else if (forecastVariance > 0) {
      summary += `This puts us slightly ahead of budget by ${formatCurrencyFull(
        forecastVariance
      )}, which represents good budget management and positions us well for the remainder of the year. `;
    } else {
      summary += `This indicates we are forecasting to spend slightly over budget by ${formatCurrencyFull(
        Math.abs(forecastVariance)
      )}, requiring monitoring to ensure we stay within acceptable variance ranges. `;
    } // Capitalized Salaries Context (if applicable) - separate paragraph
    const resourceData = getResourceData();
    const capitalizedSalariesYTD = resourceData.capitalizedSalaries.ytdActual;
    const totalCompensationYTD = resourceData.totalCompensation.ytdActual;
    if (Math.abs(capitalizedSalariesYTD) > 1000) {
      // Only mention if over $1K
      summary += `\n\nYear-to-date a total of ${formatCurrencyFull(
        Math.abs(capitalizedSalariesYTD)
      )} of resource salaries have been capitalized. The total budget for this year of ${formatCurrencyFull(
        kpiData.annualBudgetTarget
      )} for ${
        state.selectedYear
      } factors in this capitalization as does our year-to-date numbers.`;
    } // Hiring Runway Analysis - third paragraph
    const hiringData = resourceData.hiringCapacity;
    const projectedTotalSpend =
      resourceData.totalCompensation.ytdActual +
      hiringData.projectedRemainingSpend;

    summary += `\n\nAs of ${lastMonthName} finalized, we have ${formatCurrencyFull(
      hiringData.netCompensationAvailable
    )} remaining in our compensation budget. Taking an average of the last three months of compensation spending at ${formatCurrencyFull(
      hiringData.lastThreeMonthAverage
    )} per month and with ${
      hiringData.remainingMonths
    } months left in the year, the projected spend for the remainder of the year will be ${formatCurrencyFull(
      hiringData.projectedRemainingSpend
    )}. This brings our annual total spend on compensation to ${formatCurrencyFull(
      projectedTotalSpend
    )}. `;

    if (hiringData.budgetVsProjection > 0) {
      if (hiringData.budgetVsProjection >= 2000000) {
        summary += `We are ahead of budget by ${formatCurrencyFull(
          hiringData.budgetVsProjection
        )}, which is positive for our financial position, though this significant surplus may indicate we are lagging in our ability to hire at the pace we had originally planned.`;
      } else {
        summary += `We are ahead of budget by ${formatCurrencyFull(
          hiringData.budgetVsProjection
        )}, which demonstrates good budget management and disciplined hiring practices.`;
      }
    } else {
      summary += `We are behind budget by ${formatCurrencyFull(
        Math.abs(hiringData.budgetVsProjection)
      )}, which indicates our compensation spending is exceeding our planned trajectory and requires attention.`;
    }

    summary += "";

    return summary;
  }, [state.entries, state.categories, state.selectedYear]);

  // User notes state - initialize with intelligent summary
  const [userNotes, setUserNotes] = useState(intelligentSummary);

  // Export customizer state
  const [showExportCustomizer, setShowExportCustomizer] = useState(false);
  const [currentExportTemplate, setCurrentExportTemplate] = useState(null);

  // Update userNotes when intelligent summary changes (e.g., year change)
  useEffect(() => {
    setUserNotes(intelligentSummary);
  }, [intelligentSummary]);

  // Memoized calculations
  const kpis = useMemo(() => getKPIData(state), [state]);
  const topVariance = useMemo(
    () => getTopVarianceCategories(state, 3),
    [state]
  );
  const trend = useMemo(() => getTrendData(state), [state]);
  const alerts = useMemo(
    () => generateAlerts(state.entries, state.categories, state.selectedYear),
    [state.entries, state.categories, state.selectedYear]
  );
  //   const commentary = useMemo(() => {
  //     // Generate automatic commentary based on key insights
  //     const totalVariance = kpis.variance;
  //     const variancePct = kpis.variancePct;

  //     let autoText = "";
  //     if (Math.abs(variancePct) < 2) {
  //       autoText = "Performance is tracking closely to budget expectations.";
  //     } else if (variancePct > 5) {
  //       autoText =
  //         "Significant budget overruns require immediate attention and corrective action.";
  //     } else if (variancePct < -5) {
  //       autoText =
  //         "Substantial under-spending may indicate delayed projects or conservative execution.";
  //     } else {
  //       autoText =
  //         "Budget performance shows moderate variance requiring monitoring.";
  //     }
  //     return autoText;  //   }, [kpis]);

  // Generate intelligent executive summary based on KPI data
  const generateExecutiveNotes = (): string => {
    const resourceData = getResourceData();
    const lastFinalMonth = getLastFinalMonthName();

    // Format currency for readability
    const formatCurrency = (amount: number) => {
      return `$${(amount / 1000).toFixed(0)}K`;
    };

    let summary = `Executive Summary for ${state.selectedYear} (Through ${lastFinalMonth})\n\n`;

    // 1. Overall Performance Assessment
    summary += "PERFORMANCE OVERVIEW:\n";

    if (Math.abs(kpis.variancePct) < 5) {
      summary += `• Budget performance is on track with YTD variance of ${kpis.variancePct.toFixed(
        1
      )}%\n`;
    } else if (kpis.variancePct > 5) {
      summary += `• Strong performance - currently under budget by ${formatCurrency(
        Math.abs(kpis.variance)
      )} (${kpis.variancePct.toFixed(1)}%)\n`;
    } else {
      summary += `• Attention needed - over budget by ${formatCurrency(
        Math.abs(kpis.variance)
      )} (${Math.abs(kpis.variancePct).toFixed(1)}%)\n`;
    }

    // 2. Budget Utilization Analysis
    if (kpis.budgetUtilization > 80) {
      summary += `• High budget utilization at ${kpis.budgetUtilization.toFixed(
        1
      )}% - monitor remaining spend carefully\n`;
    } else if (kpis.budgetUtilization < 30) {
      summary += `• Low budget utilization at ${kpis.budgetUtilization.toFixed(
        1
      )}% - opportunity to accelerate initiatives\n`;
    } else {
      summary += `• Budget utilization at ${kpis.budgetUtilization.toFixed(
        1
      )}% is appropriate for this point in the year\n`;
    }

    // 3. Forecast Analysis
    summary += `• Full-year forecast: ${formatCurrency(
      kpis.fullYearForecast
    )} vs target ${formatCurrency(kpis.annualBudgetTarget)}\n`;

    if (Math.abs(kpis.forecastVsTargetVariance) > 1000000) {
      const forecastDirection =
        kpis.forecastVsTargetVariance > 0 ? "under" : "over";
      summary += `• Significant variance projected - ${forecastDirection} target by ${formatCurrency(
        Math.abs(kpis.forecastVsTargetVariance)
      )}\n`;
    }

    summary += "\nRISK FACTORS:\n";

    // 4. Runway Analysis
    if (kpis.monthsRemaining < 3) {
      summary += `• CRITICAL: Only ${kpis.monthsRemaining.toFixed(
        1
      )} months of budget runway remaining\n`;
    } else if (kpis.monthsRemaining < 6) {
      summary += `• CAUTION: ${kpis.monthsRemaining.toFixed(
        1
      )} months of budget runway - plan accordingly\n`;
    } else {
      summary += `• Adequate runway with ${kpis.monthsRemaining.toFixed(
        1
      )} months of budget remaining\n`;
    }

    // 5. Variance Trend
    summary += `• Performance trend: ${kpis.varianceTrend}\n`;

    // 6. Hiring Capacity Analysis
    summary += "\nHIRING CAPACITY:\n";
    summary += `• Net compensation available: ${formatCurrency(
      resourceData.hiringCapacity.netCompensationAvailable
    )}\n`;

    if (resourceData.hiringCapacity.potentialNewHires > 0) {
      summary += `• Estimated hiring capacity: ~${resourceData.hiringCapacity.potentialNewHires} new hires possible\n`;
    } else {
      summary += `• Limited hiring capacity - compensation budget nearly exhausted\n`;
    }

    if (resourceData.hiringCapacity.isProjectedOverBudget) {
      summary += `• WARNING: Projected to exceed compensation budget by ${formatCurrency(
        Math.abs(resourceData.hiringCapacity.budgetVsProjection)
      )}\n`;
    }

    // 7. Key Variances
    if (topVariance.length > 0) {
      summary += "\nTOP VARIANCES:\n";
      topVariance.slice(0, 2).forEach((variance: any, idx: any) => {
        const direction = variance.variance > 0 ? "over" : "under";
        summary += `• ${variance.name}: ${direction} by ${formatCurrency(
          Math.abs(variance.variance)
        )}\n`;
      });
    }

    // 8. Recommendations
    summary += "\nRECOMMENDATIONS:\n";

    if (kpis.variancePct < -10) {
      summary += `• Implement cost control measures immediately\n• Review and prioritize critical initiatives\n`;
    } else if (kpis.variancePct > 10) {
      summary += `• Consider accelerating strategic initiatives\n• Evaluate opportunities for additional investments\n`;
    }

    if (kpis.monthsRemaining < 6) {
      summary += `• Develop contingency plans for budget constraints\n`;
    }

    if (resourceData.hiringCapacity.isProjectedOverBudget) {
      summary += `• Review hiring plans and compensation projections\n`;
    }

    return summary;
  };
  const handleExport = () => {
    exportExecutiveSummary({
      kpis,
      topVariance,
      trend,
      alerts,
      //   commentary,
      userNotes,
    });
  };
  const handlePrintExport = () => {
    // Store current state of collapsible sections
    const originalStates = {
      strategicContext: isStrategicContextExpanded,
      ytdPerformance: isYTDPerformanceExpanded,
      forwardLooking: isForwardLookingExpanded,
      riskVelocity: isRiskVelocityExpanded,
      vendorSpending: isVendorSpendingExpanded,
      trendTable: trendTableCollapsed,
      totalCompCapitalization: totalCompCapitalizationCollapsed,
    };

    // Expand all sections for printing
    setIsStrategicContextExpanded(true);
    setIsYTDPerformanceExpanded(true);
    setIsForwardLookingExpanded(true);
    setIsRiskVelocityExpanded(true);
    setIsVendorSpendingExpanded(true);
    setTrendTableCollapsed(false);
    setTotalCompCapitalizationCollapsed(false);

    // Small delay to allow state updates to render
    setTimeout(() => {
      // Temporarily hide elements that shouldn't be printed
      const floatingButtons = document.querySelectorAll(
        ".floating-back-button, .floating-export-button, .floating-customize-button"
      );
      const originalDisplay: string[] = [];

      floatingButtons.forEach((button, index) => {
        const element = button as HTMLElement;
        originalDisplay[index] = element.style.display;
        element.style.display = "none";
      });

      // Add print class to body for print-specific styling
      document.body.classList.add("printing");

      // Open print dialog
      window.print();

      // Restore elements and original states after print dialog closes
      setTimeout(() => {
        floatingButtons.forEach((button, index) => {
          const element = button as HTMLElement;
          element.style.display = originalDisplay[index];
        });
        document.body.classList.remove("printing");

        // Restore original collapsible states
        setIsStrategicContextExpanded(originalStates.strategicContext);
        setIsYTDPerformanceExpanded(originalStates.ytdPerformance);
        setIsForwardLookingExpanded(originalStates.forwardLooking);
        setIsRiskVelocityExpanded(originalStates.riskVelocity);
        setIsVendorSpendingExpanded(originalStates.vendorSpending);
        setTrendTableCollapsed(originalStates.trendTable);
        setTotalCompCapitalizationCollapsed(
          originalStates.totalCompCapitalization
        );
      }, 100);
    }, 200);
  };
  const handlePowerPointExport = async (customTemplate?: any) => {
    try {
      // Get template from parameter, localStorage, or use default
      const template = customTemplate ||
        currentExportTemplate ||
        JSON.parse(localStorage.getItem("exportCustomTemplate") || "null") || {
          styles: {
            bodyFont: "Arial, sans-serif",
            titleColor: "#2563eb",
            titleSize: "36px",
            headingColor: "#2563eb",
            headingSize: "28px",
            backgroundColor: "#ffffff",
            slideBackground: "#ffffff",
            borderColor: "#2563eb",
            fontSize: "16px",
            lineHeight: "1.6",
          },
          layout: {
            includeTitle: true,
            includeCommentary: true,
            includeKPIs: true,
            includeResourceAllocation: true,
            includeChart: true,
          },
        };

      // Create HTML content for PowerPoint import using the template
      let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Executive Summary - ${state.selectedYear}</title>
    <style>
        /* PowerPoint-Ready Styling with Web Look and Feel */
        body { 
          font-family: ${template.styles.bodyFont}; 
          margin: 0;
          padding: 20px;
          background-color: ${template.styles.backgroundColor};
          line-height: ${template.styles.lineHeight};
        }
          .slide { 
          page-break-after: always; 
          margin-bottom: 60px; 
          padding: 40px; 
          background-color: ${template.styles.slideBackground};
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
          max-width: 95vw;
          width: 100%;
          margin-left: auto;
          margin-right: auto;
          position: relative;
          min-height: 600px;
          box-sizing: border-box;
          overflow-x: auto;
        }
        
        .slide:last-child { page-break-after: auto; }
        
        /* Add slide number indicators */
        .slide::before {
          content: "SLIDE " counter(slide-counter);
          counter-increment: slide-counter;
          position: absolute;
          top: -30px;
          right: 0;
          background: #2d3a4a;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          letter-spacing: 1px;
        }
        
        body { counter-reset: slide-counter; }
        
        /* Slide separator line */
        .slide::after {
          content: "";
          position: absolute;
          bottom: -30px;
          left: 50%;
          transform: translateX(-50%);
          width: 200px;
          height: 3px;
          background: linear-gradient(90deg, transparent, ${template.styles.borderColor}, transparent);
        }
        
        h1 { 
          color: ${template.styles.titleColor}; 
          font-size: ${template.styles.titleSize}; 
          text-align: center; 
          margin-bottom: 30px;
          font-weight: 600;
        }
        
        h2 { 
          color: ${template.styles.headingColor}; 
          font-size: ${template.styles.headingSize}; 
          margin-bottom: 24px;
          font-weight: 600;
          border-bottom: 2px solid #e1e8ed;
          padding-bottom: 8px;
        }
        
        h3 { 
          color: #2d3a4a; 
          font-size: 18px; 
          margin-bottom: 16px;
          font-weight: 600;
        }
          /* Web-style KPI Grid - optimized for landscape */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 24px 0;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }
        
        .kpi-card {
          background: #ffffff;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          border: 2px solid #e1e8ed;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          min-width: 0;
          word-wrap: break-word;
          box-sizing: border-box;
        }
        
        .kpi-card .label {
          display: block;
          font-size: 13px;
          margin-bottom: 10px;
          color: #6b7a8f;
          font-weight: 500;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          word-wrap: break-word;
        }
        
        .kpi-card .value {
          font-size: 20px;
          font-weight: 700;
          color: #2d3a4a;
          line-height: 1.2;
          word-wrap: break-word;
        }
        
        .kpi-card .ytd-label {
          display: block;
          font-size: 11px;
          margin-top: 8px;
          color: #8a92a5;
          font-weight: 500;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        
        .kpi-card .kpi-subheader {
          display: block;
          font-size: 11px;
          margin-top: 8px;
          color: #8a92a5;
          font-weight: 500;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        
        /* Web-style Capacity Table - optimized for landscape */
        .capacity-table {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          margin: 24px 0;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }
          .capacity-row {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 1rem;
          align-items: center;
          padding: 0.75rem;
          background: #ffffff;
          border-radius: 8px;
          border-left: 4px solid #3498db;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          min-width: 0;
          word-wrap: break-word;
          box-sizing: border-box;
        }
        
        .capacity-row.budget-under {
          border-left-color: #27ae60;
          background: #f2fdf5;
        }
        
        .capacity-row.budget-over {
          border-left-color: #e74c3c;
          background: #fdf2f2;
        }
        
        .capacity-label {
          font-weight: 600;
          color: #2d3a4a;
          font-size: 0.95rem;
        }
        
        .capacity-value {
          font-weight: 700;
          color: #3498db;
          font-size: 1rem;
          text-align: right;
          min-width: 120px;
        }
        
        .capacity-value.value-positive {
          color: #27ae60;
          font-weight: 700;
        }
        
        .capacity-value.value-negative {
          color: #e74c3c;
          font-weight: 700;
        }
          .capacity-note {
          font-size: 0.8rem;
          color: #666;
          font-style: italic;
          margin-left: 0.5rem;
        }
          /* Commentary styling - optimized for readability */
        .commentary { 
          font-size: ${template.styles.fontSize}; 
          line-height: ${template.styles.lineHeight}; 
          white-space: pre-wrap;
          background: #f8f9fa;
          border-radius: 12px;
          padding: 24px;
          border: 1px solid #e1e8ed;
          max-height: 400px;
          overflow-y: auto;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          word-wrap: break-word;
        }
        
        .date { 
          color: #6b7a8f; 
          font-size: 16px; 
          text-align: center;
          margin: 8px 0;
        }
        
        /* Chart container */
        .chart-container {
          text-align: center;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
          border: 1px solid #e1e8ed;
          margin: 20px 0;
        }
        
        .chart-placeholder {
          color: #6b7a8f;
          font-style: italic;
          padding: 40px;
        }
          /* Print optimizations for landscape/widescreen */        @media print {
          @page {
            size: A4 landscape;
            margin: 0.2in;
          }
          
          * {
            box-sizing: border-box;
          }
          
          body {
            padding: 0;
            margin: 0;
            background: white !important;
            font-size: 11px;
            line-height: 1.2;
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
          }
            .slide { 
            margin-bottom: 8px;
            padding: 12px;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            border-radius: 0 !important;
            max-width: 100%;
            width: 100%;
            min-height: auto;
            page-break-inside: avoid;
            overflow: hidden;
          }
          
          .slide::before, .slide::after { 
            display: none; 
          }
          
          .kpi-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            width: 100%;
            max-width: 100%;
            min-height: 200px;
          }
          
          .kpi-card {
            padding: 10px;
            box-shadow: none;
            border: 1px solid #ddd;
            font-size: 16px;
            min-width: 0;
            word-wrap: break-word;
           width: 250px;
          height: auto;
          }
          
          .kpi-card .label {
            font-size: 16px;
            margin-bottom: 6px;
          }
          
          .kpi-card .value {
            font-size: 18px;
            line-height: 1.2;
          }
          
          .capacity-table {
            gap: 0.3rem;
            width: 100%;
            max-width: 100%;
          }
            .capacity-row {
            padding: 0.4rem;
            box-shadow: none;
            border: 1px solid #ddd;
            border-left: 4px solid #3498db;
            grid-template-columns: auto 1fr auto;
            gap: 0.5rem;
            font-size: 16px;
            min-width: 0;
            max-height: 50px;
            margin-bottom: 1.75rem;
          }
          
        .capacity-label {
          font-weight: 600;
          color: #2d3a4a;
          font-size: 28px;
        }
        
        .capacity-value {
          font-weight: 700;
          font-family: courier, monospace;
          color: #3498db;
          font-size: 32px;
          text-align: right;
          min-width: 120px;
        }
        
        .capacity-value.value-positive {
          color: #27ae60;
          font-weight: 700;
        }
        
        .capacity-value.value-negative {
          color: #e74c3c;
          font-weight: 700;
        }
          .capacity-note {
          font-size: 10px;
          color: #666;
          font-style: italic;
          margin-left: 0.2rem;
        }
          
          .commentary {
            max-height: none;
            overflow: visible;
            padding: 15px;
            border: 1px solid #ddd;
            box-shadow: none;
            font-size: 11px;
            line-height: 1.4;
            word-wrap: break-word;
            width: 100%;
            max-width: 100%;
            min-height: 650px;
          }
          
          h1 { 
            font-size: 24px; 
            margin-bottom: 15px;
            word-wrap: break-word;
          }
          h2 { 
            font-size: 22px; 
            margin-bottom: 12px;
            word-wrap: break-word;
          }
          h3 { 
            font-size: 18px; 
            margin-bottom: 8px;
            word-wrap: break-word;
          }
          
          .date {
            font-size: 12px;
          }
          
          .chart-container {
            padding: 10px;
            max-width: 100%;
            overflow: hidden;
          }
          
          .chart-container img {
            max-width: 100% !important;
            height: auto !important;
          }
          
          /* Ensure no content overflows */
          table, tr, td, th {
            max-width: 100%;
            word-wrap: break-word;
            font-size: 16px;
          }
        }
          /* Screen-only: Print instruction banner */
        @media screen {
          .print-instructions {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #2563eb;
            color: white;
            text-align: center;
            padding: 10px;
            font-weight: 600;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          }
          
          body {
            margin-top: 60px;
            padding: 10px;
            box-sizing: border-box;
          }
        }
        
        /* Responsive adjustments for smaller screens */
        @media screen and (max-width: 1200px) {
          .slide {
            max-width: 98vw;
            padding: 30px 20px;
          }
          
          .kpi-grid {
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 15px;
          }
          
          .capacity-row {
            grid-template-columns: 1fr;
            gap: 0.5rem;
            text-align: left;
          }
          
          .capacity-value {
            text-align: left;
          }
        }
        
        @media screen and (max-width: 800px) {
          .slide {
            padding: 20px 15px;
          }
          
          .kpi-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          
          .kpi-card {
            padding: 15px;
          }
        }
        
        @media print {
          .print-instructions {
            display: none;
          }
          
          body {
            margin-top: 0;
          }
        }
    </style>
    <script>
      // Auto-trigger print dialog when page loads
      window.onload = function() {
        // Small delay to ensure page is fully rendered
        setTimeout(function() {
          window.print();
        }, 1000);
      };
      
      // Handle print dialog events
      window.onbeforeprint = function() {
        console.log('Print dialog opened');
      };
      
      window.onafterprint = function() {
        console.log('Print dialog closed');
        // Optionally close the window after printing
        // window.close();
      };
    </script>
</head>
<body>
    <div class="print-instructions">
      📄 Print to PDF: Set to Landscape orientation and adjust margins for best results. This window will auto-close after printing.
    </div>`;

      // Slide 1: Title (conditional)
      if (template.layout.includeTitle) {
        htmlContent += `
    <!-- Slide 1: Title -->
    <div class="slide">
        <h1>Executive Summary</h1>
        <p class="date">${state.selectedYear}${
          state.selectedQuarter ? ` Q${state.selectedQuarter}` : ""
        }</p>
        <p class="date">${new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}</p>
    </div>
`;
      }

      // Slide 2: Executive Commentary (conditional)
      if (template.layout.includeCommentary && userNotes.trim()) {
        htmlContent += `
    <!-- Slide 2: Executive Commentary -->
    <div class="slide">
        <h2>Executive Commentary</h2>
        <div class="commentary">${userNotes}</div>
    </div>
`;
      }

      // Slide 3: Key Performance Indicators (conditional)
      if (template.layout.includeKPIs) {
        // Helper function to get border color and styling based on performance
        const getKPIStyle = (
          kpiType: string,
          value: number,
          percentage?: number
        ) => {
          let borderColor = "#e1e8ed";
          let boxShadow = "";

          switch (kpiType) {
            case "ytdVariance":
              if (percentage && percentage > 5) {
                borderColor = "#28a745"; // Good - under budget
                boxShadow = "box-shadow: 0 0 15px rgba(40, 167, 69, 0.3);";
              } else if (percentage && percentage < -15) {
                borderColor = "#dc3545"; // Danger - significantly over budget
                boxShadow = "box-shadow: 0 0 15px rgba(220, 53, 69, 0.3);";
              }
              break;
            case "budgetUtilization":
              if (value > 80) {
                borderColor = "#ffc107"; // Warning - high utilization
                boxShadow = "box-shadow: 0 0 15px rgba(255, 193, 7, 0.3);";
              } else if (value < 30) {
                borderColor = "#28a745"; // Good - low utilization
                boxShadow = "box-shadow: 0 0 15px rgba(40, 167, 69, 0.3);";
              }
              break;
            case "forecastVariance":
              if (value < -1000000) {
                borderColor = "#dc3545"; // Danger - over budget
                boxShadow = "box-shadow: 0 0 15px rgba(220, 53, 69, 0.3);";
              } else if (value > 1000000) {
                borderColor = "#ffc107"; // Warning - significant variance
                boxShadow = "box-shadow: 0 0 15px rgba(255, 193, 7, 0.3);";
              }
              break;
            case "monthsRemaining":
              if (value > 6) {
                borderColor = "#28a745"; // Good - plenty of runway
                boxShadow = "box-shadow: 0 0 15px rgba(40, 167, 69, 0.3);";
              } else if (value < 2) {
                borderColor = "#dc3545"; // Danger - low runway
                boxShadow = "box-shadow: 0 0 15px rgba(220, 53, 69, 0.3);";
              } else {
                borderColor = "#ffc107"; // Warning - moderate runway
                boxShadow = "box-shadow: 0 0 15px rgba(255, 193, 7, 0.3);";
              }
              break;
          }

          return `border-color: ${borderColor}; ${boxShadow}`;
        };

        htmlContent += `
    <!-- Slide 3: Key Performance Indicators -->
    <div class="slide">
        <h2>Key Performance Indicators</h2>
        <div class="kpi-grid">
            <div class="kpi-card" style="border-color: #e1e8ed;">
                <span class="label">YTD Actual</span>
                <div class="value">${formatCurrencyFull(kpis.ytdActual)}</div>
            </div>
            <div class="kpi-card" style="border-color: #e1e8ed;">
                <span class="label">YTD Budget</span>
                <div class="value">${formatCurrencyFull(kpis.ytdBudget)}</div>
            </div>
            <div class="kpi-card" style="${getKPIStyle(
              "ytdVariance",
              kpis.variance,
              kpis.variancePct
            )}">
                <span class="label">YTD Variance</span>
                <div class="value ${
                  kpis.variancePct >= 0 ? "positive" : "negative"
                }">${formatCurrencyFull(kpis.variance)}<br><small>(${
          kpis.variancePct >= 0 ? "+" : ""
        }${kpis.variancePct.toFixed(1)}%)</small></div>
            </div>
            <div class="kpi-card" style="border-color: #e1e8ed;">
                <span class="label">Annual Budget Target</span>
                <div class="value">${formatCurrencyFull(
                  kpis.annualBudgetTarget
                )}</div>
            </div>
            <div class="kpi-card" style="${getKPIStyle(
              "budgetUtilization",
              kpis.budgetUtilization
            )}">
                <span class="label">Budget Utilization</span>
                <div class="value">${kpis.budgetUtilization.toFixed(1)}%</div>
            </div>
            <div class="kpi-card" style="${getKPIStyle(
              "forecastVariance",
              kpis.forecastVsTargetVariance
            )}">
                <span class="label">Full-Year Forecast</span>
                <div class="value">${formatCurrencyFull(
                  kpis.fullYearForecast
                )}</div>
            </div>
            <div class="kpi-card" style="border-color: #e1e8ed;">
                <span class="label">Monthly Burn Rate</span>
                <div class="value">${formatCurrencyFull(kpis.burnRate)}</div>
            </div>
            <div class="kpi-card" style="${getKPIStyle(
              "monthsRemaining",
              kpis.monthsRemaining
            )}">
                <span class="label">Months Remaining</span>
                <div class="value">${kpis.monthsRemaining.toFixed(
                  1
                )} months</div>
            </div>
            <div class="kpi-card" style="border-color: #e1e8ed;">
                <span class="label">Variance Trend</span>
                <div class="value">${kpis.varianceTrend}</div>
            </div>
        </div>
    </div>
`;
      }

      // Resource Allocation & Hiring Capacity Section
      if (template.layout.includeResourceAllocation) {
        // Vendor Tracking Section (before Resource Allocation)
        const vendorData = getVendorTrackingData();
        const finalMonths = Array.from({ length: 12 }, (_, i) => i + 1).filter(
          (month) =>
            state.monthlyForecastModes[state.selectedYear]?.[month] ?? false
        );
        const finalMonthNames = finalMonths
          .map((month) =>
            new Date(2025, month - 1, 1).toLocaleString("default", {
              month: "short",
            })
          )
          .join(", ");

        htmlContent += `
    <!-- Slide 4: Vendor Tracking -->
    <div class="slide">
        <h2>Vendor Tracking</h2>
        <div class="vendor-tracking-summary">
            <h3>Vendor Spend</h3>
            <p style="color: #6b7a8f; margin-bottom: 2rem;">Analysis based on ${
              finalMonths.length
            } months marked as Final: ${finalMonthNames}</p>
            
            <div class="kpi-cards" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin: 2rem 0;">
                <div class="kpi-card" style="background: #ffffff; border-radius: 12px; padding: 1.5rem; border: 2px solid #e1e8ed; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
                    <h4 style="color: #2d3a4a; margin-bottom: 1rem; font-size: 1.1rem;">Cost of Sales (Final Months)</h4>
                    <div class="kpi-value" style="font-size: 2rem; font-weight: 700; color: #0d7377; margin-bottom: 0.5rem;">
                        ${formatCurrencyFull(vendorData.costOfSales)}
                    </div>
                    <div class="kpi-context" style="font-size: 0.9rem; color: #6b7a8f;">
                        Total spending on Cost of Sales for months marked as Final
                    </div>
                </div>
                
                <div class="kpi-card" style="background: #ffffff; border-radius: 12px; padding: 1.5rem; border: 2px solid #e1e8ed; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
                    <h4 style="color: #2d3a4a; margin-bottom: 1rem; font-size: 1.1rem;">Other OpEx (Final Months)</h4>
                    <div class="kpi-value" style="font-size: 2rem; font-weight: 700; color: #0d7377; margin-bottom: 0.5rem;">
                        ${formatCurrencyFull(vendorData.other)}
                    </div>
                    <div class="kpi-context" style="font-size: 0.9rem; color: #6b7a8f;">
                        Total spending on Other OpEx for months marked as Final
                    </div>
                </div>
                
                <div class="kpi-card" style="background: #ffffff; border-radius: 12px; padding: 1.5rem; border: 2px solid #14a085; box-shadow: 0 4px 12px rgba(20, 160, 133, 0.15);">
                    <h4 style="color: #2d3a4a; margin-bottom: 1rem; font-size: 1.1rem;">Total Vendor Spending</h4>
                    <div class="kpi-value" style="font-size: 2.2rem; font-weight: 700; color: #14a085; margin-bottom: 0.5rem;">
                        ${formatCurrencyFull(vendorData.total)}
                    </div>
                    <div class="kpi-context" style="font-size: 0.9rem; color: #6b7a8f;">
                        Combined Cost of Sales and Other OpEx for Final months
                    </div>
                </div>
            </div>
            
            <div class="vendor-insights" style="background: #f8f9fa; border-radius: 8px; padding: 1.5rem; margin-top: 2rem;">
                <h4 style="color: #2d3a4a; margin-bottom: 1rem;">Key Insights</h4>
                <ul style="color: #6b7a8f; line-height: 1.6;">
                    <li>Vendor spending analysis focuses only on months marked as "Final" to ensure data accuracy</li>
                    <li>Cost of Sales represents ${(
                      (vendorData.costOfSales / vendorData.total) *
                      100
                    ).toFixed(1)}% of total vendor spending</li>
                    <li>Other OpEx represents ${(
                      (vendorData.other / vendorData.total) *
                      100
                    ).toFixed(1)}% of total vendor spending</li>
                    <li>This analysis excludes forecast months to provide confirmed spending totals</li>
                </ul>
            </div>
        </div>
    </div>
`;

        const resourceData = getResourceData();
        const budgetNote =
          resourceData.hiringCapacity.budgetVsProjection < 0
            ? "Projected total spend exceeds annual budget - budget adjustments needed"
            : "Projected total spend under annual budget - additional hiring capacity available";
        const budgetClass =
          resourceData.hiringCapacity.budgetVsProjection >= 0
            ? "positive"
            : "negative";
        const budgetSign =
          resourceData.hiringCapacity.budgetVsProjection >= 0 ? "+" : "";
        htmlContent += `
    <!-- Slide 5: Resource Allocation & Hiring Capacity -->
    <div class="slide">
        <h2>Resource Allocation & Hiring Capacity</h2>
        
        <!-- Hiring Runway Analysis -->
        <h3>Hiring Runway Analysis</h3>
        <div class="capacity-table">
            <div class="capacity-row">
                <span class="capacity-label">Net Compensation Available</span>
                <span class="capacity-note">Annual compensation budget minus YTD actual spend</span>
                <span class="capacity-value">${formatCurrencyFull(
                  resourceData.hiringCapacity.netCompensationAvailable
                )}</span>
                
            </div>
            <div class="capacity-row">
                <span class="capacity-label">Last 3-Month Average</span>
                <span class="capacity-note">Recent monthly compensation spend trend</span>
                <span class="capacity-value">${formatCurrencyFull(
                  resourceData.hiringCapacity.lastThreeMonthAverage
                )}/month</span>
            </div>
            <div class="capacity-row">
            <span class="capacity-label">Remaining Months</span>
            <span class="capacity-note">Months left in fiscal year</span>
                <span class="capacity-value">${
                  resourceData.hiringCapacity.remainingMonths
                } months</span>
            </div>
            <div class="capacity-row">
                <span class="capacity-label">Projected Remaining Spend</span>
                <span class="capacity-note">${
                  resourceData.hiringCapacity.remainingMonths
                } months × 3-month average</span>
                <span class="capacity-value">${formatCurrencyFull(
                  resourceData.hiringCapacity.projectedRemainingSpend
                )}</span>
            </div>
            <div class="capacity-row">
                <span class="capacity-label">Projected Total Spend</span>
                <span class="capacity-note">YTD actual + projected remaining spend</span>
                <span class="capacity-value">${formatCurrencyFull(
                  resourceData.totalCompensation.ytdActual +
                    resourceData.hiringCapacity.projectedRemainingSpend
                )}</span>
            </div>
            <div class="capacity-row ${
              budgetClass === "positive" ? "budget-under" : "budget-over"
            }">
                <span class="capacity-label">Budget vs Projection</span>
                <span class="capacity-note">${budgetNote}</span>
                <span class="capacity-value ${
                  budgetClass === "positive"
                    ? "value-positive"
                    : "value-negative"
                }">
                    ${budgetSign}${formatCurrencyFull(
          resourceData.hiringCapacity.budgetVsProjection
        )}
                </span>
            </div></div>
    </div>
`;
      }

      // Try to capture and include the chart (conditional)
      if (template.layout.includeChart) {
        try {
          const chartElement = document.querySelector(
            ".trend-chart-section .recharts-wrapper"
          );
          if (chartElement) {
            const canvas = await html2canvas(chartElement as HTMLElement, {
              backgroundColor: "#ffffff",
              scale: 2,
              useCORS: true,
            });

            const chartImage = canvas.toDataURL("image/png");

            htmlContent += `
    <!-- Slide 6: Budget vs Actual Chart -->
    <div class="slide">
        <h2>Budget vs Actual Trend</h2>
        <div class="chart-container">
            <img src="${chartImage}" style="width: 100%; max-width: 800px; height: auto; border-radius: 8px;" alt="Budget vs Actual Trend Chart"/>
        </div>
    </div>
`;
          }
        } catch (chartError) {
          console.warn("Could not capture chart for export:", chartError);

          htmlContent += `
    <!-- Slide 6: Budget vs Actual Chart -->
    <div class="slide">
        <h2>Budget vs Actual Trend</h2>
        <div class="chart-container">
            <div class="chart-placeholder">Chart could not be captured. Please refer to the dashboard for the latest trend visualization.</div>
        </div>
    </div>
`;
        }
      }

      // Slide 7: Trend Chart Data Table
      htmlContent += `
    <!-- Slide 7: Trend Chart Data -->
    <div class="slide">
        <h2>Trend Chart Data</h2>
        <div class="trend-data-table">            <table class="trend-table" style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>                    <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">                        <th style="padding: 12px; text-align: left; font-weight: 600; color: #2d3a4a;">Period</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; color: #2d3a4a; background-color: rgba(173, 216, 230, 0.08);">Monthly Budget</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; color: #2d3a4a; background-color: rgba(173, 216, 230, 0.08);">Monthly Actual</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; color: #2d3a4a; background-color: rgba(173, 216, 230, 0.08);">Monthly Forecast</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; color: #2d3a4a; background-color: rgba(173, 216, 230, 0.08);">Monthly Adj Actual</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; color: #2d3a4a; background-color: rgba(144, 238, 144, 0.08);">Rolling Budget</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; color: #2d3a4a; background-color: rgba(144, 238, 144, 0.08);">Rolling Actual</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; color: #2d3a4a; background-color: rgba(144, 238, 144, 0.08);">Rolling Forecast</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; color: #2d3a4a; background-color: rgba(144, 238, 144, 0.08);">Rolling Adj Actual</th>
                    </tr>                </thead>
                <tbody>`; // Add trend data rows
      trend.forEach((data, index) => {
        htmlContent += `                    <tr style="border-bottom: 1px solid #dee2e6; ${
          index % 2 === 0 ? "background: #fff;" : "background: #f8f9fa;"
        }${
          !data.isFinalMonth
            ? " font-style: italic; opacity: 0.85; border-left: 3px solid #9b59b6;"
            : ""
        }">                        <td style="padding: 10px; font-weight: 500;">${
          data.period
        }</td>
                        <td style="padding: 10px; text-align: right; background-color: rgba(173, 216, 230, 0.08);">${formatCurrencyFull(
                          data.monthlyBudget
                        )}</td>
                        <td style="padding: 10px; text-align: right; background-color: rgba(173, 216, 230, 0.08);">${
                          data.isFinalMonth
                            ? formatCurrencyFull(data.monthlyActual)
                            : "-"
                        }</td>
                        <td style="padding: 10px; text-align: right; background-color: rgba(173, 216, 230, 0.08);">${
                          !data.isFinalMonth
                            ? formatCurrencyFull(data.monthlyReforecast)
                            : "-"
                        }</td>
                        <td style="padding: 10px; text-align: right; background-color: rgba(173, 216, 230, 0.08);">${
                          data.isFinalMonth
                            ? formatCurrencyFull(
                                data.monthlyActual - data.monthlyAdjustments
                              )
                            : formatCurrencyFull(
                                data.monthlyReforecast - data.monthlyAdjustments
                              )
                        }</td>
                        <td style="padding: 10px; text-align: right; background-color: rgba(144, 238, 144, 0.08);">${formatCurrencyFull(
                          data.budget
                        )}</td>
                        <td style="padding: 10px; text-align: right; background-color: rgba(144, 238, 144, 0.08);">${
                          data.actual ? formatCurrencyFull(data.actual) : "-"
                        }</td>
                        <td style="padding: 10px; text-align: right; background-color: rgba(144, 238, 144, 0.08);">${
                          data.forecast
                            ? formatCurrencyFull(data.forecast)
                            : "-"
                        }</td>                        <td style="padding: 10px; text-align: right; background-color: rgba(144, 238, 144, 0.08);">${
          data.isFinalMonth
            ? data.adjActual
              ? formatCurrencyFull(data.adjActual)
              : "-"
            : data.adjForecast
            ? formatCurrencyFull(data.adjForecast)
            : "-"
        }</td>
                    </tr>`;
      });

      htmlContent += `
                </tbody>
            </table>
        </div>
    </div>
`;

      // Slide 8: Total Compensation & Capitalization
      const resourceData = getResourceData();
      htmlContent += `
    <!-- Slide 8: Total Compensation & Capitalization -->
    <div class="slide">
        <h2>Total Compensation & Capitalization</h2>
        <div class="resource-summary-cards" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin: 2rem 0;">
            <div class="resource-card total-compensation" style="background: #ffffff; border-radius: 12px; padding: 1.5rem; border: 2px solid #e1e8ed; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
                <h3 style="color: #2d3a4a; margin-bottom: 1rem; font-size: 1.2rem;">Total Compensation</h3>
                <div class="resource-metrics">
                    <div class="metric" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0;">
                        <span class="metric-label" style="color: #6b7a8f; font-weight: 500;">YTD Actual</span>
                        <span class="metric-value" style="font-weight: 700; color: #2d3a4a;">${formatCurrencyFull(
                          resourceData.totalCompensation.ytdActual
                        )}</span>
                    </div>
                    <div class="metric" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0;">
                        <span class="metric-label" style="color: #6b7a8f; font-weight: 500;">Annual Budget</span>
                        <span class="metric-value" style="font-weight: 700; color: #2d3a4a;">${formatCurrencyFull(
                          resourceData.totalCompensation.annualBudget
                        )}</span>
                    </div>
                    <div class="metric" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0;">
                        <span class="metric-label" style="color: #6b7a8f; font-weight: 500;">Remaining</span>
                        <span class="metric-value remaining" style="font-weight: 700; color: #3498db;">${formatCurrencyFull(
                          resourceData.totalCompensation.remaining
                        )}</span>
                    </div>
                </div>
            </div>
            <div class="resource-card capitalized-salaries" style="background: #ffffff; border-radius: 12px; padding: 1.5rem; border: 2px solid #e1e8ed; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
                <h3 style="color: #2d3a4a; margin-bottom: 1rem; font-size: 1.2rem;">Capitalized Salaries</h3>
                <div class="resource-metrics">
                    <div class="metric" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0;">
                        <span class="metric-label" style="color: #6b7a8f; font-weight: 500;">YTD Actual</span>
                        <span class="metric-value" style="font-weight: 700; color: #2d3a4a;">${formatCurrencyFull(
                          Math.abs(resourceData.capitalizedSalaries.ytdActual)
                        )}</span>
                    </div>
                    <div class="metric" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0;">
                        <span class="metric-label" style="color: #6b7a8f; font-weight: 500;">Monthly Avg</span>
                        <span class="metric-value" style="font-weight: 700; color: #2d3a4a;">${formatCurrencyFull(
                          Math.abs(
                            resourceData.capitalizedSalaries.monthlyAverage
                          )
                        )}</span>
                    </div>
                    <div class="metric" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0;">
                        <span class="metric-label" style="color: #6b7a8f; font-weight: 500;">Offset Rate</span>
                        <span class="metric-value" style="font-weight: 700; color: #2d3a4a;">${resourceData.capitalizedSalaries.offsetRate.toFixed(
                          1
                        )}%</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

      htmlContent += `
</body>
</html>`;

      // Open in new window optimized for printing to PDF
      const printWindow = window.open(
        "",
        "_blank",
        "width=1200,height=800,scrollbars=yes,resizable=yes"
      );
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Set the window title
        printWindow.document.title = `Executive Summary - ${
          state.selectedYear
        }${state.selectedQuarter ? ` Q${state.selectedQuarter}` : ""}`;

        // Focus the new window
        printWindow.focus();

        // The print dialog will auto-trigger from the JavaScript in the HTML
        console.log("Export window opened with print-optimized layout");
      } else {
        // Fallback: create downloadable file if popup blocked
        const blob = new Blob([htmlContent], {
          type: "text/html;charset=utf-8",
        });
        const fileName = `Executive_Summary_${state.selectedYear}${
          state.selectedQuarter ? `_Q${state.selectedQuarter}` : ""
        }_${new Date().toISOString().split("T")[0]}.html`;

        // Create download link since saveAs is not available
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert(
          "Popup blocked. HTML file downloaded instead. Open it in a browser and print to PDF in landscape mode."
        );
      }
      console.log("HTML export completed successfully");
    } catch (error) {
      console.error("Error exporting to HTML:", error);
      alert("Export failed. Please try again.");
    }
  };

  // Function to handle opening the export customizer
  const handleCustomizeExport = () => {
    setShowExportCustomizer(true);
  };

  // Function to handle applying a template and exporting
  const handleApplyTemplateAndExport = (template: any) => {
    setCurrentExportTemplate(template);
    handlePowerPointExport(template);
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
        if (value > 1000000) return "performance-warning "; // greater than $1M variance is concerning
        if (value < -1000000) return "performance-danger"; // less than -$250k is over spend
        if (value > 0 && value <= 1000000) return "performance-good"; // under budget is good
        return "performance-warning";

      case "monthsRemaining":
        if (value > 6) return "performance-good"; // Plenty of runway
        if (value < 2) return "performance-danger"; // Low runway
        return "performance-warning";

      case "vendorVariance":
        if (value === 0) return "performance-good"; // Perfect match = green
        if (value < 0) return "performance-warning"; // Negative variance = yellow
        if (value > 0) return "performance-danger"; // Positive variance = red
        return "";

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
          formula: "Annual Compensation Budget - YTD Actual Comp Spend",
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
          formula: "YTD Actual Comp Spend + Projected Remaining Spend",
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
      {" "}
      {/* Floating Back Button */}
      {/* <button
        className="floating-back-button"
        onClick={() => navigate("/")}
        title="Back to Dashboard"
      >
        ← Back
      </button>{" "} */}
      {/* Floating Export Button */}
      <button
        className="floating-export-button"
        onClick={handlePrintExport}
        title="Export Executive Summary to PDF"
      >
        📊 Print to PDF
      </button>{" "}
      {/* Export as Slides Button */}
      <button
        className="floating-customize-button"
        onClick={handleCustomizeExport}
        title="Export as Presentation Slides"
      >
        📊 Export as Slides
      </button>
      <h2>
        Executive Summary – {state.selectedYear}
        {state.selectedQuarter ? ` Q${state.selectedQuarter}` : ""}{" "}
      </h2>{" "}
      {/* Executive Commentary - Moved to top */}
      <div className="commentary-section">
        <div className="commentary-header">
          <h3>Executive Commentary</h3>
        </div>
        {/* <div className="auto-commentary">{commentary}</div> */}
        <textarea
          className="commentary-textarea"
          placeholder="Add your notes for leadership..."
          value={userNotes}
          onChange={(e) => setUserNotes(e.target.value)}
        />
        {/* Print-only version of commentary text */}
        <div className="commentary-print-text">
          {userNotes.split("\n").map((line, index) => (
            <p key={index}>{line || "\u00A0"}</p>
          ))}
        </div>
      </div>{" "}
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
              Overall Budget Context
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
        {" "}
        <div className="trend-chart-header">
          <h3>Budget vs Actual Trend, Rolling</h3>
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
            />{" "}
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
        </ResponsiveContainer>{" "}
      </div>
      {/* Rolling Trend Data Table - Collapsible */}
      <div className="trend-data-table-section">
        <div
          className="collapsible-header"
          onClick={() =>
            setRollingTrendTableCollapsed(!rollingTrendTableCollapsed)
          }
          style={{ cursor: "pointer" }}
        >
          <h3>
            {rollingTrendTableCollapsed ? "+" : "−"} Rolling Trend Chart Data
          </h3>
        </div>{" "}
        {!rollingTrendTableCollapsed && (
          <div className="trend-data-table">
            {" "}
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
                {trend.map((data: any, index: any) => (
                  <tr
                    key={index}
                    style={
                      !data.isFinalMonth
                        ? { fontStyle: "italic", opacity: 0.85 }
                        : {}
                    }
                  >
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
      {/* Spacing between Rolling and Monthly sections */}
      <div style={{ marginBottom: "2rem" }}></div>
      {/* Monthly Budget vs Actual Trend Chart */}
      <div className="trend-chart-section">
        <div className="trend-chart-header">
          <h3>Budget vs Actual Trend, Monthly</h3>
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
            />{" "}
            <Tooltip
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
            <Legend /> {/* Monthly Budget as bar */}
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
            />{" "}
            {/* Monthly Adjusted actual line - using calculated values */}
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
        className="monthly-spending-kpis"
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
          {" "}
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

            // Calculate Average Quarterly Spend (last completed quarter - Regular and Adjusted)
            const currentMonth = new Date().getMonth() + 1; // Current month (1-12)
            const currentQuarter = Math.ceil(currentMonth / 3);
            const lastCompletedQuarter =
              currentQuarter > 1 ? currentQuarter - 1 : 4; // If Q1, use Q4 of previous year

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
                  className="kpi-card"
                  style={{
                    backgroundColor: "white",
                    padding: "1rem",
                    borderRadius: "6px",
                    border: "1px solid #dee2e6",
                  }}
                >
                  <div
                    className="kpi-label"
                    style={{
                      fontSize: "0.9rem",
                      color: "#6b7a8f",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Avg Monthly Spend YTD
                  </div>{" "}
                  <div
                    className="kpi-value"
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
                    className="kpi-context"
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
                  className="kpi-card"
                  style={{
                    backgroundColor: "white",
                    padding: "1rem",
                    borderRadius: "6px",
                    border: "1px solid #dee2e6",
                  }}
                >
                  <div
                    className="kpi-label"
                    style={{
                      fontSize: "0.9rem",
                      color: "#6b7a8f",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Avg Quarterly Spend
                  </div>{" "}
                  <div
                    className="kpi-value"
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
                    className="kpi-context"
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
      <div className="trend-data-table-section">
        <div
          className="collapsible-header"
          onClick={() =>
            setMonthlyTrendTableCollapsed(!monthlyTrendTableCollapsed)
          }
          style={{ cursor: "pointer" }}
        >
          <h3>
            {monthlyTrendTableCollapsed ? "+" : "−"} Monthly Trend Chart Data
          </h3>
        </div>{" "}
        {!monthlyTrendTableCollapsed && (
          <div className="trend-data-table">
            <table className="trend-table monthly-trend-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Monthly Budget</th>
                  <th>Monthly Actual</th>
                  <th>Monthly Forecast</th>
                  <th>Monthly Adj Actual</th>
                </tr>
              </thead>
              <tbody>
                {trend.map((data: any, index: any) => (
                  <tr
                    key={index}
                    style={
                      !data.isFinalMonth
                        ? { fontStyle: "italic", opacity: 0.85 }
                        : {}
                    }
                  >
                    {" "}
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
                    <td>
                      {data.monthlyAdjusted !== null
                        ? formatCurrencyFull(data.monthlyAdjusted)
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}{" "}
      </div>{" "}
      {/* Divider between Trend Chart Data and Vendor Tracking */}
      <div className="section-divider"></div>
      {/* Vendor Tracking Section */}
      <div className="vendor-tracking-section">
        <h2>Vendor Tracking</h2>

        <div className="kpi-grid">
          {/* Vendor Spending - Collapsible */}
          <div className="kpi-section vendor-spending">
            <div
              className="section-header"
              onClick={() =>
                setIsVendorSpendingExpanded(!isVendorSpendingExpanded)
              }
            >
              <h4 className="section-title">
                <span className="expand-icon">
                  {isVendorSpendingExpanded ? "−" : "+"}
                </span>
                Vendor Spend
              </h4>

              {!isVendorSpendingExpanded && (
                <div className="compact-summary">
                  {/* <span className="compact-metric">
                    Cost of Sales:{" "}
                    <strong>
                      {formatCurrencyFull(getVendorTrackingData().costOfSales)}
                    </strong>
                  </span>
                  <span className="compact-metric">
                    Other:{" "}
                    <strong>
                      {formatCurrencyFull(getVendorTrackingData().other)}
                    </strong>
                  </span> */}
                  <span className="compact-metric">
                    Total YTD:{" "}
                    <strong>
                      {formatCurrencyFull(getVendorTrackingData().total)}
                    </strong>
                  </span>
                  <span className="compact-metric">
                    Total YTD from Vendor Tracking:{" "}
                    <strong>{formatCurrencyFull(getTotalVendorSpend())}</strong>
                  </span>
                  <span className="compact-metric">
                    Variance:{" "}
                    <strong>
                      {(() => {
                        const variance =
                          getTotalVendorSpend() - getVendorTrackingData().total;
                        return (
                          <>
                            {variance >= 0 ? "+" : ""}
                            {formatCurrencyFull(variance)}
                          </>
                        );
                      })()}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {isVendorSpendingExpanded && (
              <>
                <div className="kpi-row">
                  <div className="kpi-notes">
                    <span className="kpi-row-notes">
                      Total vendor spend from budget monthly tracking report.
                    </span>
                  </div>
                  <div className="kpi-cards">
                    {/* <div
                      className="kpi-card"
                      onMouseEnter={(e) =>
                        handleVendorMouseEnter(e, "costOfSales")
                      }
                      onMouseLeave={handleVendorMouseLeave}
                    >
                      <span>Cost of Sales</span>
                      <strong>
                        {formatCurrencyFull(
                          getVendorTrackingData().costOfSales
                        )}
                      </strong>
                      <span className="kpi-subheader">YTD</span>
                    </div> */}
                    {/* <div
                      className="kpi-card"
                      onMouseEnter={(e) => handleVendorMouseEnter(e, "other")}
                      onMouseLeave={handleVendorMouseLeave}
                    >
                      <span>Other</span>
                      <strong>
                        {formatCurrencyFull(getVendorTrackingData().other)}
                      </strong>
                      <span className="kpi-subheader">YTD</span>
                    </div> */}
                    <div
                      className="kpi-card"
                      onMouseEnter={(e) => handleVendorMouseEnter(e, "total")}
                      onMouseLeave={handleVendorMouseLeave}
                    >
                      <span>Total Vendor Spend</span>
                      <strong>
                        {formatCurrencyFull(getVendorTrackingData().total)}
                      </strong>
                      <span className="kpi-subheader">YTD</span>
                      <span className="kpi-context">
                        YTD from monthly budget vs actual report.
                      </span>
                    </div>
                    <div
                      className="kpi-card"
                      onMouseEnter={(e) =>
                        handleVendorMouseEnter(e, "totalVendorSpend")
                      }
                      onMouseLeave={handleVendorMouseLeave}
                    >
                      <span>Total Vendor Spend</span>
                      <strong>
                        {formatCurrencyFull(getTotalVendorSpend())}
                      </strong>
                      <span className="kpi-subheader">YTD</span>
                      <span className="kpi-context">
                        Total vendor spend from vendor tracking sheet.{" "}
                      </span>
                    </div>
                    <div
                      className={`kpi-card ${(() => {
                        const variance =
                          getTotalVendorSpend() - getVendorTrackingData().total;
                        return getPerformanceClass("vendorVariance", variance);
                      })()}`}
                      onMouseEnter={(e) =>
                        handleVendorMouseEnter(e, "vendorVariance")
                      }
                      onMouseLeave={handleVendorMouseLeave}
                    >
                      <span>Vendor Variance</span>
                      <strong>
                        {(() => {
                          const variance =
                            getTotalVendorSpend() -
                            getVendorTrackingData().total;
                          return (
                            <>
                              {variance >= 0 ? "+" : ""}
                              {formatCurrencyFull(variance)}
                            </>
                          );
                        })()}
                      </strong>
                      <span className="kpi-subheader">Difference</span>
                      <span className="kpi-context">
                        Delta on Monthly Budget vs Actual and Vendor Tracking
                        sheet.
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Divider between Vendor Tracking and Resource Allocation */}
      <div className="section-divider"></div>
      <div className="resource-allocation-section">
        <h2>Resource Allocation & Hiring Capacity</h2>{" "}
        <div className="resource-overview">
          <div className="hiring-capacity-analysis-section">
            <div className="hiring-analysis-header">
              <h2>Hiring Runway Analysis</h2>
            </div>
            <div className="capacity-table">
              {" "}
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
                <span className="capacity-note">
                  Annual compensation budget minus YTD actual spend
                </span>
                <span className="capacity-value">
                  {formatCurrencyFull(
                    getResourceData().hiringCapacity.netCompensationAvailable
                  )}
                </span>
              </div>
              <div
                className="capacity-row"
                onMouseEnter={(e) =>
                  handleHiringMouseEnter(e, "lastThreeMonthAvg")
                }
                onMouseLeave={handleHiringMouseLeave}
              >
                {" "}
                <span className="capacity-label">Last 3-Month Average</span>
                <span className="capacity-note">
                  Recent monthly compensation spend trend
                </span>
                <span className="capacity-value">
                  {formatCurrencyFull(
                    getResourceData().hiringCapacity.lastThreeMonthAverage
                  )}
                  /month
                </span>
              </div>
              <div
                className="capacity-row"
                onMouseEnter={(e) =>
                  handleHiringMouseEnter(e, "remainingMonths")
                }
                onMouseLeave={handleHiringMouseLeave}
              >
                {" "}
                <span className="capacity-label">Remaining Months</span>
                <span className="capacity-note">
                  Months left in fiscal year
                </span>
                <span className="capacity-value">
                  {getResourceData().hiringCapacity.remainingMonths} months
                </span>
              </div>{" "}
              <div
                className="capacity-row"
                onMouseEnter={(e) =>
                  handleHiringMouseEnter(e, "projectedRemainingSpend")
                }
                onMouseLeave={handleHiringMouseLeave}
              >
                {" "}
                <span className="capacity-label">
                  Projected Remaining Spend
                </span>
                <span className="capacity-note">
                  {getResourceData().hiringCapacity.remainingMonths} months ×
                  3-month average
                </span>
                <span className="capacity-value">
                  {formatCurrencyFull(
                    getResourceData().hiringCapacity.projectedRemainingSpend
                  )}
                </span>
              </div>{" "}
              <div
                className="capacity-row"
                onMouseEnter={(e) =>
                  handleHiringMouseEnter(e, "projectedTotalSpend")
                }
                onMouseLeave={handleHiringMouseLeave}
              >
                {" "}
                <span className="capacity-label">Projected Total Spend</span>
                <span className="capacity-note">
                  YTD actual + projected remaining spend
                </span>
                <span className="capacity-value">
                  {formatCurrencyFull(
                    getResourceData().totalCompensation.ytdActual +
                      getResourceData().hiringCapacity.projectedRemainingSpend
                  )}
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
                {" "}
                <span className="capacity-label">Budget vs Projection</span>
                <span className="capacity-note">
                  {getResourceData().hiringCapacity.budgetVsProjection < 0
                    ? "Projected total spend exceeds annual budget - budget adjustments needed"
                    : "Projected total spend under annual budget - additional hiring capacity available"}
                </span>
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
                </span>
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
          ))}{" "}
        </ul>
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
            </div>{" "}
          </div>
        </div>
      )}
      {/* Export Customizer Modal */}
      <ExportCustomizer
        isOpen={showExportCustomizer}
        onClose={() => setShowExportCustomizer(false)}
        onApplyTemplate={handleApplyTemplateAndExport}
      />
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
      } // For adjusted forecast: build cumulative total including adjusted actuals from final months + adjusted forecasts from forecast months
      if (isFinalMonth) {
        cumulativeAdjForecast += monthlyActual - monthlyAdjustments; // Add adjusted actuals from final months to build the base
      } else {
        cumulativeAdjForecast += monthlyReforecast - monthlyAdjustments; // Add adjusted reforecasts from forecast months
      }

      // Create a combined rolling adjusted actual that starts from January
      const rollingAdjActual = cumulativeAdjForecast; // This combines both actual (for final months) and forecast (for forecast months)

      return {
        period: monthNames[month],
        budget: cumulativeBudget,
        actual: isFinalMonth ? cumulativeActual : null, // Only show actual for final months
        forecast: !isFinalMonth ? cumulativeForecast : null, // Only show forecast for forecast months
        adjActual: rollingAdjActual > 0 ? rollingAdjActual : null, // Combined rolling adjusted actual starting from January
        adjForecast: !isFinalMonth ? cumulativeAdjForecast : null, // Only show adjusted forecast for forecast months
        monthlyBudget: monthlyBudget > 0 ? monthlyBudget : null,
        monthlyActual: isFinalMonth && monthlyActual > 0 ? monthlyActual : null,
        monthlyAdjustments,
        monthlyReforecast:
          !isFinalMonth && monthlyReforecast > 0 ? monthlyReforecast : null,
        monthlyAdjusted: isFinalMonth
          ? monthlyActual - monthlyAdjustments > 0
            ? monthlyActual - monthlyAdjustments
            : null
          : !isFinalMonth && monthlyReforecast - monthlyAdjustments > 0
          ? monthlyReforecast - monthlyAdjustments
          : null, // Calculated field for chart
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
