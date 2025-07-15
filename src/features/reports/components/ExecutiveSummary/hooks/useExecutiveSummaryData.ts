import { useMemo } from "react";
import { BudgetState } from "../../../../../types";
import { calculateMonthlyData } from "../../../../../utils/budgetCalculations";
// Team metrics import removed - module doesn't exist yet

export const useExecutiveSummaryData = (state: BudgetState) => {
  // Get last final month number
  const getLastFinalMonthNumber = useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;

    const finalMonths = [];
    for (let i = 1; i <= 12; i++) {
      const isFinal = state.monthlyForecastModes[state.selectedYear]?.[i] ?? false;
      if (isFinal) {
        finalMonths.push(i);
      }
    }

    if (finalMonths.length === 0) return currentMonth - 1 || 1;
    return Math.max(...finalMonths);
  }, [state.monthlyForecastModes, state.selectedYear]);

  // Calculate monthly trend data
  const monthlyTrendData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    return months.map((month, index) => {
      const monthNum = index + 1;
      const monthData = calculateMonthlyData(
        state.entries,
        state.categories,
        monthNum,
        state.selectedYear
      );
      
      const isFinalMonth = state.monthlyForecastModes[state.selectedYear]?.[monthNum] ?? false;
      
      return {
        name: month,
        month: month, // Use month name string instead of number
        budget: monthData.netTotal.budget,
        adjusted: monthData.netTotal.budget + monthData.netTotal.adjustments,
        actual: monthData.netTotal.actual,
        variance: monthData.netTotal.variance,
        isFinalMonth,
      };
    });
  }, [state.entries, state.categories, state.selectedYear, state.monthlyForecastModes]);

  // Strategic Context KPIs
  const strategicContextData = useMemo(() => {
    const ytdBudget = monthlyTrendData.reduce((sum, m) => sum + m.budget, 0);
    const ytdActual = monthlyTrendData
      .filter(m => m.isFinalMonth)
      .reduce((sum, m) => sum + m.actual, 0);
    
    return [
      {
        title: "Annual Budget",
        value: ytdBudget,
        label: "Total Approved",
        isPercentage: false,
      },
      {
        title: "YTD Actual",
        value: ytdActual,
        label: "Spent to Date",
        isPercentage: false,
      },
      {
        title: "Budget Utilization",
        value: ytdBudget > 0 ? (ytdActual / ytdBudget) * 100 : 0,
        label: "% of Budget Used",
        isPercentage: true,
      },
    ];
  }, [monthlyTrendData]);

  // YTD Performance KPIs
  const ytdPerformanceData = useMemo(() => {
    const finalMonths = monthlyTrendData.filter(m => m.isFinalMonth);
    const ytdVariance = finalMonths.reduce((sum, m) => sum + m.variance, 0);
    const ytdBudget = finalMonths.reduce((sum, m) => sum + m.budget, 0);
    
    return [
      {
        title: "YTD Variance",
        value: ytdVariance,
        label: ytdVariance >= 0 ? "Under Budget" : "Over Budget",
        variance: ytdBudget > 0 ? (ytdVariance / ytdBudget) * 100 : 0,
        isPercentage: false,
      },
      {
        title: "Monthly Average",
        value: finalMonths.length > 0 ? ytdVariance / finalMonths.length : 0,
        label: "Avg Monthly Variance",
        isPercentage: false,
      },
    ];
  }, [monthlyTrendData]);

  // Forward Looking KPIs
  const forwardLookingData = useMemo(() => {
    const remainingMonths = monthlyTrendData.filter(m => !m.isFinalMonth);
    const remainingBudget = remainingMonths.reduce((sum, m) => sum + m.budget, 0);
    const projectedSpend = remainingMonths.reduce((sum, m) => sum + m.adjusted, 0);
    
    return [
      {
        title: "Remaining Budget",
        value: remainingBudget,
        label: "Rest of Year",
        isPercentage: false,
      },
      {
        title: "Projected Spend",
        value: projectedSpend,
        label: "Forecasted",
        isPercentage: false,
      },
      {
        title: "Projected Variance",
        value: projectedSpend - remainingBudget,
        label: "Expected Variance",
        isPercentage: false,
      },
    ];
  }, [monthlyTrendData]);

  // Risk & Velocity KPIs
  const riskVelocityData = useMemo(() => {
    const recentMonths = monthlyTrendData.slice(-3).filter(m => m.isFinalMonth);
    const burnRate = recentMonths.length > 0
      ? recentMonths.reduce((sum, m) => sum + m.actual, 0) / recentMonths.length
      : 0;
    
    return [
      {
        title: "Current Burn Rate",
        value: burnRate,
        label: "Monthly Average",
        isPercentage: false,
      },
      {
        title: "Variance Trend",
        value: recentMonths.length > 1 
          ? ((recentMonths[recentMonths.length - 1].variance - recentMonths[0].variance) / Math.abs(recentMonths[0].variance || 1)) * 100
          : 0,
        label: "3-Month Trend",
        isPercentage: true,
      },
    ];
  }, [monthlyTrendData]);

  // Vendor metrics
  const vendorMetrics = useMemo(() => {
    const currentYearTrackingData = state.vendorTrackingData?.filter(
      tracking => tracking.year === state.selectedYear
    ) || [];

    const vendorBreakdownData = currentYearTrackingData
      .map(vendor => {
        const monthlyAmounts = [
          vendor.jan, vendor.feb, vendor.mar, vendor.apr,
          vendor.may, vendor.jun, vendor.jul, vendor.aug,
          vendor.sep, vendor.oct, vendor.nov, vendor.dec
        ].map(amount => typeof amount === 'string' ? parseFloat(amount) || 0 : amount || 0);

        const lastFinalMonthIndex = getLastFinalMonthNumber - 1;
        const ytdAmounts = monthlyAmounts.slice(0, lastFinalMonthIndex + 1);
        const ytdTotal = ytdAmounts.reduce((sum, amount) => sum + (typeof amount === 'string' ? parseFloat(amount) || 0 : amount), 0);

        const annualBudget = state.vendorData?.find(
          v => v.vendorName === vendor.vendorName && v.year === state.selectedYear
        )?.budget || 0;

        return {
          vendorName: vendor.vendorName,
          ytdSpend: ytdTotal,
          category: vendor.financeMappedCategory,
          annualBudget: annualBudget * 1000,
          budgetUtilization: annualBudget > 0 ? (ytdTotal / (annualBudget * 1000)) * 100 : 0,
        };
      })
      .filter(vendor => vendor.ytdSpend > 0)
      .sort((a, b) => b.ytdSpend - a.ytdSpend);

    const topVendors = vendorBreakdownData.slice(0, 10);
    const totalVendorSpend = vendorBreakdownData.reduce((sum, v) => sum + v.ytdSpend, 0);
    const activeVendorCount = vendorBreakdownData.length;
    const avgSpendPerVendor = activeVendorCount > 0 ? totalVendorSpend / activeVendorCount : 0;
    const top10Spend = topVendors.reduce((sum, v) => sum + v.ytdSpend, 0);
    const vendorConcentration = totalVendorSpend > 0 ? (top10Spend / totalVendorSpend) * 100 : 0;

    return {
      vendorBreakdownData,
      topVendors,
      totalVendorSpend,
      activeVendorCount,
      avgSpendPerVendor,
      vendorConcentration,
    };
  }, [state.vendorTrackingData, state.vendorData, state.selectedYear, getLastFinalMonthNumber]);

  return {
    strategicContextData,
    ytdPerformanceData,
    forwardLookingData,
    riskVelocityData,
    monthlyTrendData,
    ...vendorMetrics,
  };
};