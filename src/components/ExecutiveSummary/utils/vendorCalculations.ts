import { calculateMonthlyData } from "../../../utils/budgetCalculations";

export interface VendorData {
  costOfSales: number;
  other: number;
  total: number;
}

export const getVendorTrackingData = (state: any): VendorData => {
  const monthsData = Array.from({ length: 12 }, (_, i) => i + 1).map((month) =>
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
    // Only include final months (where monthlyForecastModes is true)
    const monthNumber = monthsData.indexOf(month) + 1;
    const isFinalMonth =
      state.monthlyForecastModes[state.selectedYear]?.[monthNumber] ?? false;

    if (isFinalMonth) {
      // Add cost of sales
      if (month.costOfSales?.total?.actual) {
        costOfSalesTotal += month.costOfSales.total.actual;
      }

      // Add other expenses (from opex.other)
      if (month.opex?.subGroups) {
        const otherGroup = month.opex.subGroups.find(
          (sg: any) => sg.id === "other"
        );
        if (otherGroup?.total?.actual) {
          otherTotal += otherGroup.total.actual;
        }
      }
    }
  });

  return {
    costOfSales: costOfSalesTotal,
    other: otherTotal,
    total: costOfSalesTotal + otherTotal,
  };
};

export const getTotalVendorSpend = (state: any): number => {
  const currentYearTrackingData =
    state.vendorTrackingData?.filter(
      (tracking: any) => tracking.year === state.selectedYear
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

  currentYearTrackingData.forEach((item: any) => {
    months.forEach((month) => {
      // Use the same logic as VendorTrackingTable: parseFloat() || 0
      const monthValue = parseFloat(item[month]) || 0;
      totalVendorSpend += monthValue;
    });
  });

  return totalVendorSpend;
};
