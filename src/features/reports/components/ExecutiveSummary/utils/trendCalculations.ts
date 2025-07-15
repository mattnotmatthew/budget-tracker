import {
  calculateMonthlyData,
  calculateBudgetTracking,
} from "../../../../../utils/budgetCalculations";

export interface TrendDataPoint {
  period: string;
  budget: number;
  actual: number | null;
  forecast: number | null;
  adjActual: number | null;
  adjForecast: number | null;
  // Monthly data
  monthlyBudget: number | null;
  monthlyActual: number | null;
  monthlyReforecast: number | null;
  monthlyAdjustments: number;
  monthlyAdjusted: number | null;
  // State flags
  isFinalMonth: boolean;
}

export const getTrendData = (state: any): TrendDataPoint[] => {
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
