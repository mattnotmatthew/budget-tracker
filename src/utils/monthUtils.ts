// Utility functions for month/date operations
export const getLastFinalMonthNumber = (state: any): number => {
  // Find the last month that is marked as "Final" (true) in monthlyForecastModes
  let lastFinalMonth = 0;
  const currentYear = state.selectedYear;

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

  // Return the last final month, or current month if none found
  return lastFinalMonth > 0 ? lastFinalMonth : new Date().getMonth() + 1;
};

export const getLastFinalMonthName = (state: any): string => {
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

  const lastFinalMonth = getLastFinalMonthNumber(state);
  return lastFinalMonth > 0 ? monthNames[lastFinalMonth] : "Current";
};
