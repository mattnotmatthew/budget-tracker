import {
  calculateYTDData,
  calculateMonthlyData,
} from "../../../../../utils/budgetCalculations";

export interface ResourceData {
  totalCompensation: {
    ytdActual: number;
    annualBudget: number;
    remaining: number;
  };
  basePay: {
    ytdActual: number;
    monthlyAverage: number;
    utilization: number;
  };
  capitalizedSalaries: {
    ytdActual: number;
    monthlyAverage: number;
    offsetRate: number;
  };
  hiringCapacity: {
    netCompensationAvailable: number;
    estimatedHiringBudget: number;
    potentialNewHires: number;
    monthsOfRunway: number;
    lastThreeMonthAverage: number;
    projectedRemainingSpend: number;
    budgetVsProjection: number;
    isProjectedOverBudget: boolean;
    remainingMonths: number;
  };
}

export const getResourceData = (state: any): ResourceData => {
  const ytdData = calculateYTDData(
    state.entries,
    state.categories,
    state.selectedYear
  ).data;

  // Find base pay and capitalized salaries categories
  const basePayCategory = state.categories.find(
    (cat: any) => cat.id === "opex-base-pay"
  );
  const capSalariesCategory = state.categories.find(
    (cat: any) => cat.id === "opex-capitalized-salaries"
  );

  // Get YTD data for base pay and capitalized salaries
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
    ) || { actual: 0, budget: 0 };

  // Get all compensation categories from Comp and Benefits subgroup
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
      const categoryEntries = state.entries.filter(
        (entry: any) =>
          entry.categoryId === categoryId && entry.year === state.selectedYear
      );
      const annualBudget = categoryEntries.reduce(
        (sum: number, entry: any) => sum + entry.budgetAmount,
        0
      );
      return total + annualBudget;
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
      : 0;

  // Hiring capacity calculations
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
    const currentMonth = new Date().getMonth() + 1;
    const startMonth = Math.max(1, currentMonth - 2);
    let totalSpend = 0;
    let monthCount = 0;

    for (let month = startMonth; month <= currentMonth; month++) {
      const monthEntries = state.entries.filter(
        (entry: any) =>
          compAndBenefitsCategories.includes(entry.categoryId) &&
          entry.year === state.selectedYear &&
          entry.month === month
      );

      const monthSpend = monthEntries.reduce(
        (sum: number, entry: any) => sum + (entry.actualAmount || 0),
        0
      );

      if (monthSpend > 0) {
        totalSpend += monthSpend;
        monthCount++;
      }
    }

    return monthCount > 0 ? totalSpend / monthCount : currentCompBurnRate;
  };

  const lastThreeMonthAvg = getLastThreeMonthsAverage();
  const remainingMonths = 12 - monthsElapsed;
  const projectedRemainingSpend = lastThreeMonthAvg * remainingMonths;
  const projectedTotalSpend = totalCompYTD + projectedRemainingSpend;
  const budgetVsProjection = (projectedTotalSpend - totalCompAnnualBudget) * -1;
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
