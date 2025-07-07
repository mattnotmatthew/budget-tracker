import {
  formatCurrencyFull,
  getLastFinalMonthName,
  KPIData,
} from "./kpiCalculations";
import { getResourceData } from "./resourceCalculations";
import { getTeamMetrics } from "./teamCalculations";

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

export const generateResourceSpend = (state: any, kpiData: KPIData): string => {
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

export const generateResourceAllocation = (state: any, kpiData: KPIData): string => {
  const teams = state.teams || [];
  
  // Handle empty state
  if (teams.length === 0) {
    return "No team data is currently available for resource allocation analysis.";
  }

  const teamMetrics = getTeamMetrics(teams);
  let summary = "";

  // Team overview
  summary += `Our organization currently comprises ${teamMetrics.totalTeams} teams with ${teamMetrics.totalHeadcount} total headcount, representing ${formatCurrencyFull(teamMetrics.totalCost)} in total costs. `;
  
  // Average cost per head
  summary += `The average cost per head across the organization is ${formatCurrencyFull(teamMetrics.averageCostPerHead)}. `;

  // Top 3 teams by cost
  const topTeams = [...teams].sort((a, b) => b.cost - a.cost).slice(0, 3);
  if (topTeams.length > 0) {
    summary += `\n\nThe highest cost teams are: `;
    topTeams.forEach((team, index) => {
      summary += `${team.teamName} (${formatCurrencyFull(team.cost)})`;
      if (index < topTeams.length - 2) {
        summary += ", ";
      } else if (index === topTeams.length - 2) {
        summary += ", and ";
      }
    });
    summary += `. `;
  }

  // Cost center efficiency comparison
  const costCentersWithTeams = teamMetrics.costCenterGroups.filter(g => g.teams.length > 0);
  if (costCentersWithTeams.length > 1) {
    const sorted = [...costCentersWithTeams].sort((a, b) => a.averageCostPerHead - b.averageCostPerHead);
    const mostEfficient = sorted[0];
    const leastEfficient = sorted[sorted.length - 1];
    
    const efficiencyGap = leastEfficient.averageCostPerHead - mostEfficient.averageCostPerHead;
    const efficiencyGapPct = ((efficiencyGap / mostEfficient.averageCostPerHead) * 100).toFixed(0);
    
    summary += `\n\nAcross cost centers, ${mostEfficient.costCenter} demonstrates the highest efficiency with an average cost per head of ${formatCurrencyFull(mostEfficient.averageCostPerHead)}, `;
    summary += `while ${leastEfficient.costCenter} has an average cost per head of ${formatCurrencyFull(leastEfficient.averageCostPerHead)}, `;
    summary += `representing a ${efficiencyGapPct}% variance in resource efficiency between cost centers.`;
  }

  // Distribution insights
  if (costCentersWithTeams.length > 0) {
    const largestCostCenter = [...costCentersWithTeams].sort((a, b) => b.totalCost - a.totalCost)[0];
    const costCenterPct = ((largestCostCenter.totalCost / teamMetrics.totalCost) * 100).toFixed(0);
    summary += ` ${largestCostCenter.costCenter} represents the largest resource investment at ${costCenterPct}% of total team costs.`;
  }

  return summary;
};