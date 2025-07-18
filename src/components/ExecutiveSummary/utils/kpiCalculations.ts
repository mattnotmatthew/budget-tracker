import {
  calculateYTDData,
  calculateBudgetTracking,
  calculateMonthlyData,
} from "../../../utils/budgetCalculations";
import { formatCurrencyFull } from "../../../utils/currencyFormatter";
import {
  getLastFinalMonthNumber,
  getLastFinalMonthName,
} from "../../../utils/monthUtils";

// Re-export for backward compatibility
export { formatCurrencyFull, getLastFinalMonthName };

export interface SectionMetadata {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  order: number;
}

export interface KPIData {
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

  // Section metadata for summary generation
  sectionMetadata?: SectionMetadata[];
}

export interface VarianceCategory {
  name: string;
  actual: number;
  budget: number;
  variance: number;
}

export const getKPIData = (state: any): KPIData => {
  // Use proper YTD calculation that matches the rest of the application
  const ytdResult = calculateYTDData(
    state.entries,
    state.categories,
    state.selectedYear
  );
  const ytdData = ytdResult.data;

  // Use net total actual directly (no adjustment subtraction) to match MonthlyView Net Total line
  const ytdActual = ytdData.netTotal.actual; // Use net total directly, including adjustments
  const ytdBudget = ytdData.netTotal.budget;

  // Variance calculation: (Actual - Budget) * -1
  // This makes under budget = positive variance (good performance)
  // and over budget = negative variance (poor performance)
  const variance = (ytdActual - ytdBudget) * -1;
  const variancePct = ytdBudget ? (variance / ytdBudget) * 100 : 0;

  // Calculate full year forecast by summing monthly "Net Total" from Monthly View
  const calculateFullYearForecast = (): number => {
    let totalForecast = 0;

    // Generate monthly data for all 12 months
    const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);

    allMonths.forEach((month) => {
      const monthData = calculateMonthlyData(
        state.entries,
        state.categories,
        month,
        state.selectedYear
      );

      // Check if this month is marked as final (true) or forecast (false)
      const isMonthFinal =
        state.monthlyForecastModes?.[state.selectedYear]?.[month] ?? false;

      if (isMonthFinal) {
        // Month is final - use actual Net Total value (includes adjustments)
        totalForecast += monthData.netTotal.actual || 0;
      } else {
        // Month is forecast - use reforecast Net Total value
        totalForecast += monthData.netTotal.reforecast || 0;
      }
    });

    return totalForecast;
  };

  // Helper function to get the forecast mode for a specific month
  const getMonthForecastMode = (month: number): boolean => {
    return state.monthlyForecastModes[state.selectedYear]?.[month] ?? false;
  };

  const fullYearForecast = calculateFullYearForecast();
  const annualBudgetTarget = state.yearlyBudgetTargets[state.selectedYear] || 0;
  const remainingBudget = annualBudgetTarget - ytdActual;

  // Calculate new metrics
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

        const monthVariance =
          cumulativeBudget > 0
            ? ((cumulativeActual - cumulativeBudget) / cumulativeBudget) *
              100 *
              -1
            : 0;

        monthlyVariances.push(monthVariance);
      }

      // Analyze trend
      if (monthlyVariances.length >= 2) {
        const firstVariance = monthlyVariances[0];
        const lastVariance = monthlyVariances[monthlyVariances.length - 1];
        const difference = lastVariance - firstVariance;

        if (Math.abs(difference) < 2) {
          return "Stable";
        } else if (difference > 2) {
          return "Improving";
        } else {
          return "Declining";
        }
      }

      return "Stable";
    } catch (error) {
      console.error("Error calculating variance trend:", error);
      return "Unknown";
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

export const getTopVarianceCategories = (
  state: any,
  count: number
): VarianceCategory[] => {
  const catMap: { [key: string]: VarianceCategory } = {};

  state.entries.forEach((e: any) => {
    if (!catMap[e.categoryId]) {
      const category = state.categories.find(
        (cat: any) => cat.id === e.categoryId
      );
      catMap[e.categoryId] = {
        name: category?.name || e.categoryId,
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

export const getTargetAchievementSubtitle = (
  targetAchievement: number
): string => {
  if (targetAchievement >= 110) {
    return "Spending faster than planned";
  } else if (targetAchievement >= 105) {
    return "Slightly ahead of pace";
  } else if (targetAchievement >= 95) {
    return "On track with spending plan";
  } else if (targetAchievement >= 85) {
    return "Slightly behind pace";
  } else {
    return "Spending slower than planned";
  }
};
