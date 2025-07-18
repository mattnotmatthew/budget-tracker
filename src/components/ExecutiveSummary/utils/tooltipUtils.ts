import {
  formatCurrencyFull,
  getLastFinalMonthName,
  KPIData,
} from "./kpiCalculations";
import { ResourceData } from "./resourceCalculations";
import { VendorData } from "./vendorCalculations";
import {
  VendorSpendVelocity,
  calculateVendorSpendVelocity,
} from "./vendorPortfolioCalculations";

export interface TooltipContent {
  definition: string;
  interpretation: string;
  formula: string;
  calculation: string;
}

export const getKPITooltipContent = (
  kpiType: string,
  kpis: KPIData,
  state: any
): TooltipContent => {
  const currentMonth = new Date().getMonth() + 1;
  const monthsElapsed = Math.min(currentMonth, 12);
  const yearProgress = monthsElapsed / 12;

  switch (kpiType) {
    case "annualBudgetTarget":
      return {
        definition: "The total budget allocated for the entire fiscal year",
        interpretation: `Your organization has set aside ${formatCurrencyFull(
          kpis.annualBudgetTarget
        )} as the target budget for ${state.selectedYear}`,
        formula: "Annual Budget Target",
        calculation: `${formatCurrencyFull(
          kpis.annualBudgetTarget
        )} (set target)`,
      };

    case "ytdActual":
      return {
        definition:
          "Total amount actually spent from the beginning of the fiscal year to date (including adjustments)",
        interpretation: `You have spent ${formatCurrencyFull(
          kpis.ytdActual
        )} so far this year, which is ${(
          (kpis.ytdActual / kpis.annualBudgetTarget) *
          100
        ).toFixed(1)}% of your annual budget`,
        formula:
          "Sum of all actual expenses YTD (Net Total line from MonthlyView)",
        calculation: `${formatCurrencyFull(
          kpis.ytdActual
        )} (gross actual spend through ${getLastFinalMonthName(state)})`,
      };

    case "remainingBudget":
      return {
        definition: "Amount of annual budget still available to spend",
        interpretation: `You have ${formatCurrencyFull(
          kpis.remainingBudget
        )} remaining to spend, which should last ${kpis.monthsRemaining.toFixed(
          1
        )} months at current spending rate`,
        formula: "Annual Budget Target - YTD Actual",
        calculation: `${formatCurrencyFull(
          kpis.annualBudgetTarget
        )} - ${formatCurrencyFull(kpis.ytdActual)} = ${formatCurrencyFull(
          kpis.remainingBudget
        )}`,
      };

    case "annualVariance":
      const isUnder = kpis.annualVariancePct > 0;
      return {
        definition:
          "Difference between YTD actual spending and annual budget target",
        interpretation: `You are currently ${
          isUnder ? "under" : "over"
        } your annual budget by ${formatCurrencyFull(
          Math.abs(kpis.annualVariance)
        )} (${Math.abs(kpis.annualVariancePct).toFixed(1)}%)`,
        formula: "(YTD Actual - Annual Budget Target) × -1",
        calculation: `(${formatCurrencyFull(
          kpis.ytdActual
        )} - ${formatCurrencyFull(
          kpis.annualBudgetTarget
        )}) × -1 = ${formatCurrencyFull(kpis.annualVariance)}`,
      };

    case "budgetUtilization":
      return {
        definition: "Percentage of annual budget consumed year-to-date",
        interpretation: `You have used ${kpis.budgetUtilization.toFixed(
          1
        )}% of your annual budget in ${monthsElapsed} months`,
        formula: "(YTD Actual ÷ Annual Budget Target) × 100",
        calculation: `(${formatCurrencyFull(
          kpis.ytdActual
        )} ÷ ${formatCurrencyFull(
          kpis.annualBudgetTarget
        )}) × 100 = ${kpis.budgetUtilization.toFixed(1)}%`,
      };

    case "targetAchievement":
      const expectedSpend = kpis.annualBudgetTarget * yearProgress;
      return {
        definition:
          "How well you're pacing toward your annual budget target based on time elapsed",
        interpretation: `You're spending at ${kpis.targetAchievement.toFixed(
          1
        )}% of the pace needed to reach your annual target`,
        formula: "(YTD Actual ÷ Expected YTD Target) × 100",
        calculation: `(${formatCurrencyFull(
          kpis.ytdActual
        )} ÷ ${formatCurrencyFull(
          expectedSpend
        )}) × 100 = ${kpis.targetAchievement.toFixed(1)}%`,
      };

    case "ytdBudget":
      return {
        definition:
          "Total amount planned to be spent from beginning of fiscal year to date",
        interpretation: `You planned to spend ${formatCurrencyFull(
          kpis.ytdBudget
        )} by this point in the year`,
        formula: "Sum of all budgeted amounts YTD",
        calculation: `${formatCurrencyFull(
          kpis.ytdBudget
        )} (planned spend through ${getLastFinalMonthName(state)})`,
      };

    case "ytdVariance":
      const ytdIsUnder = kpis.variancePct > 0;
      return {
        definition:
          "Difference between YTD actual spending and YTD planned budget",
        interpretation: `You are ${
          ytdIsUnder ? "under" : "over"
        } your YTD budget by ${formatCurrencyFull(
          Math.abs(kpis.variance)
        )} (${Math.abs(kpis.variancePct).toFixed(1)}%)`,
        formula: "(YTD Actual - YTD Budget) × -1",
        calculation: `(${formatCurrencyFull(
          kpis.ytdActual
        )} - ${formatCurrencyFull(kpis.ytdBudget)}) × -1 = ${formatCurrencyFull(
          kpis.variance
        )}`,
      };

    case "fullYearForecast":
      return {
        definition:
          "Projected total spending for the entire fiscal year based on current data (Net Total line from MonthlyView)",
        interpretation: `Based on current trends, you're projected to spend ${formatCurrencyFull(
          kpis.fullYearForecast
        )} by year-end`,
        formula:
          "Sum of actual (final months) + forecast (non-final months) from Net Total line",
        calculation: `${formatCurrencyFull(
          kpis.fullYearForecast
        )} (calculated using gross spend including adjustments)`,
      };

    case "forecastVsTarget":
      const forecastIsUnder = kpis.forecastVsTargetVariance > 0;
      return {
        definition:
          "Difference between full-year forecast and annual budget target",
        interpretation: `You're projected to finish ${
          forecastIsUnder ? "under" : "over"
        } target by ${formatCurrencyFull(
          Math.abs(kpis.forecastVsTargetVariance)
        )}`,
        formula: "(Full-Year Forecast - Annual Budget Target) × -1",
        calculation: `(${formatCurrencyFull(
          kpis.fullYearForecast
        )} - ${formatCurrencyFull(
          kpis.annualBudgetTarget
        )}) × -1 = ${formatCurrencyFull(kpis.forecastVsTargetVariance)}`,
      };

    case "burnRate":
      return {
        definition: "Average amount spent per month year-to-date",
        interpretation: `You're spending an average of ${formatCurrencyFull(
          kpis.burnRate
        )} per month`,
        formula: "YTD Actual ÷ Months Elapsed",
        calculation: `${formatCurrencyFull(
          kpis.ytdActual
        )} ÷ ${monthsElapsed} months = ${formatCurrencyFull(kpis.burnRate)}`,
      };

    case "monthsRemaining":
      return {
        definition:
          "How many months the remaining budget will last at current spending rate",
        interpretation: `At your current burn rate, you have ${kpis.monthsRemaining.toFixed(
          1
        )} months of budget remaining`,
        formula: "Remaining Budget ÷ Monthly Burn Rate",
        calculation: `${formatCurrencyFull(
          kpis.remainingBudget
        )} ÷ ${formatCurrencyFull(
          kpis.burnRate
        )} = ${kpis.monthsRemaining.toFixed(1)} months`,
      };

    case "varianceTrend":
      return {
        definition:
          "Direction of budget variance performance over recent months",
        interpretation: `Your budget performance trend is "${kpis.varianceTrend}" based on recent variance patterns`,
        formula: "Historical variance analysis over last 2-3 months",
        calculation: `${kpis.varianceTrend} (calculated from monthly variance trends)`,
      };

    default:
      return {
        definition: "Key performance indicator",
        interpretation: "This metric helps track budget performance",
        formula: "N/A",
        calculation: "N/A",
      };
  }
};

export const getHiringTooltipContent = (
  metricType: string,
  resourceData: ResourceData,
  monthsElapsed: number
): TooltipContent => {
  switch (metricType) {
    case "netCompAvailable":
      return {
        definition: "Net compensation budget remaining for the fiscal year",
        interpretation: `You have ${formatCurrencyFull(
          resourceData.hiringCapacity.netCompensationAvailable
        )} available in your compensation budget for new hiring and other compensation expenses`,
        formula: "Annual Compensation Budget - YTD Compensation Actual",
        calculation: `${formatCurrencyFull(
          resourceData.totalCompensation.annualBudget
        )} - ${formatCurrencyFull(
          resourceData.totalCompensation.ytdActual
        )} = ${formatCurrencyFull(
          resourceData.hiringCapacity.netCompensationAvailable
        )}`,
      };

    case "lastThreeMonthAvg":
      return {
        definition: "Average monthly compensation spend over the last 3 months",
        interpretation: `Your recent compensation burn rate is ${formatCurrencyFull(
          resourceData.hiringCapacity.lastThreeMonthAverage
        )} per month, which helps project future spending`,
        formula: "Sum of last 3 months compensation spend ÷ 3",
        calculation: `Recent 3-month average: ${formatCurrencyFull(
          resourceData.hiringCapacity.lastThreeMonthAverage
        )}/month`,
      };

    case "remainingMonths":
      return {
        definition: "Number of months remaining in the fiscal year",
        interpretation: `There are ${resourceData.hiringCapacity.remainingMonths} months left in the fiscal year for budget planning`,
        formula: "12 - Months Elapsed",
        calculation: `12 - ${monthsElapsed} = ${resourceData.hiringCapacity.remainingMonths} months`,
      };

    case "projectedRemainingSpend":
      return {
        definition:
          "Projected compensation spend for the remainder of the year",
        interpretation: `Based on recent trends, you're projected to spend ${formatCurrencyFull(
          resourceData.hiringCapacity.projectedRemainingSpend
        )} on compensation for the rest of the year`,
        formula: "Last 3-Month Average × Remaining Months",
        calculation: `${formatCurrencyFull(
          resourceData.hiringCapacity.lastThreeMonthAverage
        )} × ${
          resourceData.hiringCapacity.remainingMonths
        } months = ${formatCurrencyFull(
          resourceData.hiringCapacity.projectedRemainingSpend
        )}`,
      };

    case "projectedTotalSpend":
      const projectedTotal =
        resourceData.totalCompensation.ytdActual +
        resourceData.hiringCapacity.projectedRemainingSpend;
      return {
        definition:
          "Projected total compensation spend for the entire fiscal year",
        interpretation: `You're projected to spend ${formatCurrencyFull(
          projectedTotal
        )} total on compensation this year`,
        formula: "YTD Actual + Projected Remaining Spend",
        calculation: `${formatCurrencyFull(
          resourceData.totalCompensation.ytdActual
        )} + ${formatCurrencyFull(
          resourceData.hiringCapacity.projectedRemainingSpend
        )} = ${formatCurrencyFull(projectedTotal)}`,
      };

    default:
      return {
        definition: "Hiring capacity metric",
        interpretation: "This metric helps track hiring runway and capacity",
        formula: "N/A",
        calculation: "N/A",
      };
  }
};

export const getVendorTooltipContent = (
  metricType: string,
  vendorData: VendorData,
  state: any
): TooltipContent => {
  const finalMonths = Array.from({ length: 12 }, (_, i) => i + 1).filter(
    (month) => state.monthlyForecastModes[state.selectedYear]?.[month] ?? false
  );
  const finalMonthNames = finalMonths
    .map((month) =>
      new Date(2025, month - 1, 1).toLocaleString("default", {
        month: "short",
      })
    )
    .join(", ");

  switch (metricType) {
    case "costOfSales":
      return {
        definition:
          "Total vendor spending in Cost of Sales categories for finalized months",
        interpretation: `You have spent ${formatCurrencyFull(
          vendorData.costOfSales
        )} on Cost of Sales vendor expenses in final months (${finalMonthNames})`,
        formula: "Sum of Cost of Sales actual amounts for final months only",
        calculation: `${formatCurrencyFull(
          vendorData.costOfSales
        )} (final months: ${finalMonthNames})`,
      };

    case "other":
      return {
        definition:
          "Total vendor spending in Other OPEX categories for finalized months",
        interpretation: `You have spent ${formatCurrencyFull(
          vendorData.other
        )} on Other OPEX vendor expenses in final months (${finalMonthNames})`,
        formula: "Sum of Other OPEX actual amounts for final months only",
        calculation: `${formatCurrencyFull(
          vendorData.other
        )} (final months: ${finalMonthNames})`,
      };

    case "total":
      return {
        definition:
          "Combined vendor spending from budget categories for finalized months",
        interpretation: `Total vendor spending from budget categories is ${formatCurrencyFull(
          vendorData.total
        )} for final months (${finalMonthNames})`,
        formula: "Cost of Sales + Other OPEX (final months only)",
        calculation: `${formatCurrencyFull(
          vendorData.costOfSales
        )} + ${formatCurrencyFull(vendorData.other)} = ${formatCurrencyFull(
          vendorData.total
        )}`,
      };

    default:
      return {
        definition: "Vendor tracking metric",
        interpretation: "This metric helps track vendor spending",
        formula: "N/A",
        calculation: "N/A",
      };
  }
};

/**
 * Get tooltip content for vendor portfolio metrics
 */
export const getVendorPortfolioTooltipContent = (
  metricType: string,
  state: any
): TooltipContent => {
  const vendorData = state.vendorData || [];
  const vendorTrackingData = state.vendorTrackingData || [];
  const selectedYear = state.selectedYear;

  switch (metricType) {
    case "spendVelocity":
      const velocity = calculateVendorSpendVelocity(
        vendorData,
        vendorTrackingData,
        selectedYear
      );
      return {
        definition:
          "Rate at which vendor budgets are being consumed throughout the year",
        interpretation: `Current utilization rate is ${velocity.utilizationRate.toFixed(
          1
        )}%. ${
          velocity.utilizationRate > 90
            ? "High burn rate - budget may be exhausted early"
            : velocity.utilizationRate < 50
            ? "Low utilization - budget may be underallocated"
            : "Healthy spend velocity"
        }`,
        formula: "Utilization Rate = Actual Spend / Budget Allocated × 100",
        calculation: `${formatCurrencyFull(
          velocity.totalActualSpend
        )} / ${formatCurrencyFull(
          velocity.totalBudgetAllocated
        )} = ${velocity.utilizationRate.toFixed(1)}%`,
      };

    case "velocityTotalBudget":
      const velocityBudget = calculateVendorSpendVelocity(
        vendorData,
        vendorTrackingData,
        selectedYear
      );
      return {
        definition:
          "Total budget allocated across all vendors for the fiscal year",
        interpretation: `You have allocated ${formatCurrencyFull(
          velocityBudget.totalBudgetAllocated
        )} for vendor spending this year. ${
          velocityBudget.totalBudgetAllocated > 0
            ? "This represents your full vendor commitment for the year"
            : "No vendor budgets have been allocated yet"
        }`,
        formula: "Sum of all individual vendor budgets",
        calculation: `Total: ${formatCurrencyFull(
          velocityBudget.totalBudgetAllocated
        )} across ${
          vendorData.filter((v: any) => v.year === selectedYear).length
        } vendors`,
      };

    case "velocityActualSpend":
      const velocitySpend = calculateVendorSpendVelocity(
        vendorData,
        vendorTrackingData,
        selectedYear
      );
      const currentMonth = new Date().getMonth() + 1;
      const monthsElapsed = Math.min(currentMonth, 12);
      return {
        definition: "Total amount actually spent with vendors year-to-date",
        interpretation: `You have spent ${formatCurrencyFull(
          velocitySpend.totalActualSpend
        )} with vendors so far this year (${monthsElapsed} months). ${
          velocitySpend.totalActualSpend > velocitySpend.totalBudgetAllocated
            ? "You are over budget - review vendor spending immediately"
            : `You have ${formatCurrencyFull(
                velocitySpend.totalBudgetAllocated -
                  velocitySpend.totalActualSpend
              )} remaining`
        }`,
        formula: "Sum of all vendor tracking data for the year",
        calculation: `${formatCurrencyFull(
          velocitySpend.totalActualSpend
        )} spent through month ${monthsElapsed}`,
      };

    case "velocityUtilizationRate":
      const velocityUtil = calculateVendorSpendVelocity(
        vendorData,
        vendorTrackingData,
        selectedYear
      );
      const currentMonthUtil = new Date().getMonth() + 1;
      const expectedUtilization = (currentMonthUtil / 12) * 100;
      return {
        definition: "Percentage of vendor budget consumed year-to-date",
        interpretation: `You have used ${velocityUtil.utilizationRate.toFixed(
          1
        )}% of your vendor budget. ${
          velocityUtil.utilizationRate > expectedUtilization + 10
            ? "Spending pace is ahead of schedule - may exhaust budget early"
            : velocityUtil.utilizationRate < expectedUtilization - 10
            ? "Spending pace is behind schedule - budget may be underutilized"
            : "Spending is on track with time elapsed"
        }`,
        formula: "(Actual Spend ÷ Total Budget) × 100",
        calculation: `(${formatCurrencyFull(
          velocityUtil.totalActualSpend
        )} ÷ ${formatCurrencyFull(
          velocityUtil.totalBudgetAllocated
        )}) × 100 = ${velocityUtil.utilizationRate.toFixed(1)}%`,
      };

    case "velocityBurnRate":
      const velocityBurn = calculateVendorSpendVelocity(
        vendorData,
        vendorTrackingData,
        selectedYear
      );
      const currentMonthBurn = new Date().getMonth() + 1;
      const monthsElapsedBurn = Math.min(currentMonthBurn, 12);
      const remainingMonths = 12 - monthsElapsedBurn;
      const remainingBudget =
        velocityBurn.totalBudgetAllocated - velocityBurn.totalActualSpend;
      return {
        definition:
          "Average monthly vendor spending rate based on year-to-date actuals",
        interpretation: `You are spending an average of ${formatCurrencyFull(
          velocityBurn.burnRate
        )} per month on vendors. ${
          velocityBurn.burnRate * remainingMonths > remainingBudget
            ? "At this rate, you will exceed your budget before year-end"
            : `At this rate, your remaining budget will last ${velocityBurn.projectedRunway.toFixed(
                1
              )} months`
        }`,
        formula: "Total Actual Spend ÷ Months Elapsed",
        calculation: `${formatCurrencyFull(
          velocityBurn.totalActualSpend
        )} ÷ ${monthsElapsedBurn} months = ${formatCurrencyFull(
          velocityBurn.burnRate
        )}/month`,
      };

    default:
      return {
        definition: "Vendor portfolio metric",
        interpretation:
          "This metric helps analyze vendor portfolio performance and risk",
        formula: "N/A",
        calculation: "N/A",
      };
  }
};
