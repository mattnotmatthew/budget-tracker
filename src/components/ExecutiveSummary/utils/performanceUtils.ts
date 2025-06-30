export const getPerformanceClass = (
  kpiType: string,
  value: number,
  percentage?: number
): string => {
  switch (kpiType) {
    case "annualVariance":
      if (percentage && percentage > 10) return "performance-good"; // Under budget
      if (percentage && percentage < -10) return "performance-bad"; // Over budget
      return "performance-warning";

    case "budgetUtilization":
      if (value > 80) return "performance-warning"; // High utilization
      if (value < 30) return "performance-good"; // Low utilization
      return "";

    case "targetAchievement":
      if (value >= 85 && value <= 115) return "performance-good"; // More forgiving range
      if (value > 130 || value < 50) return "performance-bad"; // Much more forgiving thresholds
      return "performance-warning";

    case "ytdVariance":
      // Positive variance = under budget (good), negative = over budget (bad)
      if (percentage && percentage > 5) return "performance-good"; // Under budget is good
      if (percentage && percentage < -15) return "performance-bad"; // Only show red for significant overspend
      return ""; // Neutral for small variances

    case "forecastVariance":
      if (value > 1000000) return "performance-good"; // greater than $1M variance is concerning
      if (value < -1000000) return "performance-bad"; // less than -$250k is over spend
      if (value > 0 && value <= 1000000) return "performance-good"; // under budget is good
      return "performance-warning";

    case "monthsRemaining":
      if (value > 6) return "performance-good"; // Plenty of runway
      if (value < 2) return "performance-bad"; // Low runway
      return "performance-warning";

    case "vendorVariance":
      if (value === 0) return "performance-good"; // Perfect match = green
      if (value < 0) return "performance-warning"; // Negative variance = yellow
      if (value > 0) return "performance-bad"; // Positive variance = red
      return "";

    default:
      return "";
  }
};
