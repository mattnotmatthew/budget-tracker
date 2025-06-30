import {
  formatCurrencyFull,
  getLastFinalMonthName,
  KPIData,
} from "./kpiCalculations";
import { getResourceData } from "./resourceCalculations";

export const generateIntelligentSummary = (
  state: any,
  kpiData: KPIData
): string => {
  // Get comprehensive KPI data and other needed data
  const resourceData = getResourceData(state);

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

  // Get last month with data for context
  const lastMonthName = getLastFinalMonthName(state);

  // Generate comprehensive summary
  let summary = `Executive Summary for ${state.selectedYear}:\n\n`;

  // Strategic Context
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
    summary += `We are currently under our YTD budget by ${formatCurrencyFull(
      kpiData.variance
    )} (${kpiData.variancePct.toFixed(
      1
    )}%), indicating efficient spending control. `;
  } else if (kpiData.variance < 0) {
    summary += `We are currently over our YTD budget by ${formatCurrencyFull(
      Math.abs(kpiData.variance)
    )} (${Math.abs(kpiData.variancePct).toFixed(
      1
    )}%), requiring attention to spending patterns. `;
  } else {
    summary += `We are tracking exactly to our YTD budget. `;
  }

  // Forecast vs Target Analysis - continues in paragraph 1
  const forecastVariance = kpiData.forecastVsTargetVariance;
  summary += `Based on our current forecast, we project a remaining spending total of ${formatCurrencyFull(
    kpiData.fullYearForecast
  )}. `;

  if (forecastVariance > 1000000) {
    summary += `This represents a projected under-spend of ${formatCurrencyFull(
      forecastVariance
    )}, suggesting potential for strategic investment or accelerated initiatives.`;
  } else if (forecastVariance < -1000000) {
    summary += `This represents a projected over-spend of ${formatCurrencyFull(
      Math.abs(forecastVariance)
    )}, requiring immediate budget rebalancing or scope adjustment.`;
  } else if (forecastVariance > 0) {
    summary += `This indicates a slight projected under-spend of ${formatCurrencyFull(
      forecastVariance
    )}, providing modest budget flexibility.`;
  } else {
    summary += `This closely aligns with our annual target.`;
  }

  const capitalizedSalariesYTD = resourceData.capitalizedSalaries.ytdActual;
  const totalCompensationYTD = resourceData.totalCompensation.ytdActual;
  if (Math.abs(capitalizedSalariesYTD) > 1000) {
    summary += ` Our capitalized salaries offset is ${formatCurrencyFull(
      Math.abs(capitalizedSalariesYTD)
    )}, representing ${resourceData.capitalizedSalaries.offsetRate.toFixed(
      1
    )}% of base pay.`;
  }

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
    summary += `We are projected to finish under our compensation budget by ${formatCurrencyFull(
      hiringData.budgetVsProjection
    )}, providing capacity for strategic hiring or bonus allocations.`;
  } else {
    summary += `We are projected to exceed our compensation budget by ${formatCurrencyFull(
      Math.abs(hiringData.budgetVsProjection)
    )}, requiring careful monitoring of new hires and discretionary compensation.`;
  }

  summary += "";

  return summary;
};
