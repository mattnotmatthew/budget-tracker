import {
  formatCurrencyFull,
  getLastFinalMonthName,
  KPIData,
} from "./kpiCalculations";
import { getResourceData } from "./resourceCalculations";

export const generateStrategicContext = (state: any, kpiData: KPIData): string => {
  const lastMonthName = getLastFinalMonthName(state);
  
  let summary = `Executive Summary for ${state.selectedYear}:\n\n`;
  
  summary += `Our annual budget target is ${formatCurrencyFull(
    kpiData.annualBudgetTarget
  )} for ${state.selectedYear}. `;
  summary += `Year-to-date through ${lastMonthName}, we have spent ${formatCurrencyFull(
    kpiData.ytdActual
  )}, `;
  summary += `leaving ${formatCurrencyFull(
    kpiData.remainingBudget
  )} remaining in our budget allocation. `;

  return summary;
};

export const generateYTDPerformanceAnalysis = (state: any, kpiData: KPIData): string => {
  let summary = "";

  if (kpiData.variance > 0) {
    summary += `We are currently under our YTD budget by ${formatCurrencyFull(
      kpiData.variance
    )} (${kpiData.variancePct.toFixed(
      1
    )}%), indicating efficient spending control.`;
  } else if (kpiData.variance < 0) {
    summary += `We are currently over our YTD budget by ${formatCurrencyFull(
      Math.abs(kpiData.variance)
    )} (${Math.abs(kpiData.variancePct).toFixed(
      1
    )}%), requiring attention to spending patterns.`;
  } else {
    summary += `We are tracking exactly to our YTD budget.`;
  }

  return summary;
};

export const generateForecastAnalysis = (state: any, kpiData: KPIData): string => {
  const forecastVariance = kpiData.forecastVsTargetVariance;
  
  let summary = `Based on our current forecast, we project a remaining spending total of ${formatCurrencyFull(
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

  return summary;
};

export const generateCapitalizedSalariesAnalysis = (state: any, kpiData: KPIData): string => {
  const resourceData = getResourceData(state);
  const capitalizedSalariesYTD = resourceData.capitalizedSalaries.ytdActual;
  
  if (Math.abs(capitalizedSalariesYTD) > 1000) {
    return ` Our capitalized salaries offset is ${formatCurrencyFull(
      Math.abs(capitalizedSalariesYTD)
    )}, representing ${resourceData.capitalizedSalaries.offsetRate.toFixed(
      1
    )}% of base pay.`;
  }
  
  return "";
};

export const generateResourceAnalysis = (state: any, kpiData: KPIData): string => {
  const lastMonthName = getLastFinalMonthName(state);
  const resourceData = getResourceData(state);
  const hiringData = resourceData.hiringCapacity;
  const projectedTotalSpend =
    resourceData.totalCompensation.ytdActual +
    hiringData.projectedRemainingSpend;

  let summary = `As of ${lastMonthName} finalized, we have ${formatCurrencyFull(
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

  return summary;
};