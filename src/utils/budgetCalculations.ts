import {
  BudgetEntry,
  BudgetCategory,
  CategorySummary,
  SubCategoryGroup,
  MonthlyData,
  BudgetAlert,
} from "../types";

// Define QuarterlyData interface locally since quarterly functions still need it
interface QuarterlyData {
  quarter: number;
  costOfSales: any;
  opex: any;
  netTotal: {
    budget: number;
    actual: number;
    reforecast: number;
    adjustments: number;
    variance: number;
  };
}

// Define compensation category IDs
const COMP_AND_BENEFITS_CATEGORIES = [
  "opex-base-pay",
  "opex-capitalized-salaries",
  "opex-commissions",
  "opex-reclass-cogs",
  "opex-bonus",
  "opex-benefits",
  "opex-payroll-taxes",
  "opex-other-compensation",
];

// Define "Other" category IDs
const OTHER_CATEGORIES = [
  "opex-travel-entertainment",
  "opex-employee-related",
  "opex-facilities",
  "opex-information-technology",
  "opex-professional-services",
  "opex-corporate",
  "opex-marketing",
];

export const calculateCategorySummary = (
  entries: BudgetEntry[],
  category: BudgetCategory,
  quarter?: number,
  month?: number,
  year?: number
): CategorySummary => {
  const filteredEntries = entries.filter((entry) => {
    if (entry.categoryId !== category.id) return false;
    if (year && entry.year !== year) return false;
    if (quarter && entry.quarter !== quarter) return false;
    if (month && entry.month !== month) return false;
    return true;
  });

  const budget = filteredEntries.reduce(
    (sum, entry) => sum + entry.budgetAmount,
    0
  );
  const actual = filteredEntries.reduce(
    (sum, entry) => sum + (entry.actualAmount || 0),
    0
  );
  const reforecast = filteredEntries.reduce(
    (sum, entry) => sum + (entry.reforecastAmount || 0),
    0
  );
  const adjustments = filteredEntries.reduce(
    (sum, entry) => sum + (entry.adjustmentAmount || 0),
    0
  );

  // Updated variance calculation logic:
  // If Actual != 0 then (Actual - Budget) * -1
  // Else if Actual == 0 then (Forecast - Budget) * -1
  const variance =
    actual !== 0 ? (actual - budget) * -1 : (reforecast - budget) * -1;
  const variancePercent =
    budget !== 0 ? (variance / Math.abs(budget)) * 100 : 0;

  return {
    categoryId: category.id,
    categoryName: category.name,
    budget: budget,
    actual: actual,
    reforecast: reforecast,
    adjustments: adjustments,
    variance,
    variancePercent,
    isNegative: category.isNegative,
  };
};

// Quarterly-specific category summary calculation
// Uses actual values where available, forecast for future months
export const calculateQuarterlyCategorySummary = (
  entries: BudgetEntry[],
  category: BudgetCategory,
  quarter: number,
  year: number
): CategorySummary => {
  // Get all months in the quarter
  const quarterMonths = getQuarterMonths(quarter);

  let totalBudget = 0;
  let totalActual = 0;
  let totalReforecast = 0;
  let totalAdjustments = 0;
  let totalVarianceBase = 0; // For variance calculation (actual + forecast mix)

  quarterMonths.forEach((month) => {
    const monthEntries = entries.filter((entry) => {
      return (
        entry.categoryId === category.id &&
        entry.year === year &&
        entry.month === month
      );
    });

    const monthBudget = monthEntries.reduce(
      (sum, entry) => sum + entry.budgetAmount,
      0
    );
    const monthActual = monthEntries.reduce(
      (sum, entry) => sum + (entry.actualAmount || 0),
      0
    );
    const monthReforecast = monthEntries.reduce(
      (sum, entry) => sum + (entry.reforecastAmount || 0),
      0
    );
    const monthAdjustments = monthEntries.reduce(
      (sum, entry) => sum + (entry.adjustmentAmount || 0),
      0
    );

    totalBudget += monthBudget;
    totalActual += monthActual;
    totalReforecast += monthReforecast;
    totalAdjustments += monthAdjustments;

    // For variance: use actual if available, otherwise use forecast
    totalVarianceBase += monthActual !== 0 ? monthActual : monthReforecast;
  });

  // Quarterly variance calculation: ([Actual]+[Forecast where Actual==0]) - [Budget]) * -1
  const variance = (totalVarianceBase - totalBudget) * -1;
  const variancePercent =
    totalBudget !== 0 ? (variance / Math.abs(totalBudget)) * 100 : 0;

  return {
    categoryId: category.id,
    categoryName: category.name,
    budget: totalBudget,
    actual: totalActual,
    reforecast: totalReforecast,
    adjustments: totalAdjustments,
    variance,
    variancePercent,
    isNegative: category.isNegative,
  };
};

// Non-forecast quarterly category summary calculation
// Only uses actual values for variance, ignoring forecast (for display purposes)
export const calculateQuarterlyNonForecastCategorySummary = (
  entries: BudgetEntry[],
  category: BudgetCategory,
  quarter: number,
  year: number
): CategorySummary => {
  // Get all months in the quarter
  const quarterMonths = getQuarterMonths(quarter);

  let totalBudget = 0;
  let totalActual = 0;
  let totalReforecast = 0;
  let totalAdjustments = 0;

  quarterMonths.forEach((month) => {
    const monthEntries = entries.filter((entry) => {
      return (
        entry.categoryId === category.id &&
        entry.year === year &&
        entry.month === month
      );
    });

    const monthBudget = monthEntries.reduce(
      (sum, entry) => sum + entry.budgetAmount,
      0
    );
    const monthActual = monthEntries.reduce(
      (sum, entry) => sum + (entry.actualAmount || 0),
      0
    );
    const monthReforecast = monthEntries.reduce(
      (sum, entry) => sum + (entry.reforecastAmount || 0),
      0
    );
    const monthAdjustments = monthEntries.reduce(
      (sum, entry) => sum + (entry.adjustmentAmount || 0),
      0
    );

    totalBudget += monthBudget;
    totalActual += monthActual;
    totalReforecast += monthReforecast;
    totalAdjustments += monthAdjustments;
  });

  // Non-forecast variance calculation: only use actual values (Actual - Budget) * -1
  const variance = (totalActual - totalBudget) * -1;
  const variancePercent =
    totalBudget !== 0 ? (variance / Math.abs(totalBudget)) * 100 : 0;

  return {
    categoryId: category.id,
    categoryName: category.name,
    budget: totalBudget,
    actual: totalActual,
    reforecast: totalReforecast,
    adjustments: totalAdjustments, // Keep actual reforecast values but don't use in variance
    variance,
    variancePercent,
    isNegative: category.isNegative,
  };
};

// Helper function to get months for a quarter
const getQuarterMonths = (quarter: number): number[] => {
  const quarterToMonths: { [key: number]: number[] } = {
    1: [1, 2, 3], // Q1: Jan, Feb, Mar
    2: [4, 5, 6], // Q2: Apr, May, Jun
    3: [7, 8, 9], // Q3: Jul, Aug, Sep
    4: [10, 11, 12], // Q4: Oct, Nov, Dec
  };
  return quarterToMonths[quarter] || [];
};

export const calculateQuarterlyData = (
  entries: BudgetEntry[],
  categories: BudgetCategory[],
  quarter: number,
  year: number
): QuarterlyData => {
  const costOfSalesCategories = categories.filter(
    (cat) => cat.parentCategory === "cost-of-sales"
  );
  const opexCategories = categories.filter(
    (cat) => cat.parentCategory === "opex"
  );

  // Use quarterly-specific calculation for cost of sales
  const costOfSalesSummaries = costOfSalesCategories.map((cat) =>
    calculateQuarterlyCategorySummary(entries, cat, quarter, year)
  );

  // Create Comp and Benefits subgroup with quarterly logic
  const compAndBenefitsSubGroup = createQuarterlyCompAndBenefitsSubGroup(
    entries,
    categories,
    quarter,
    year
  );

  // Create Other subgroup with quarterly logic
  const otherSubGroup = createQuarterlyOtherSubGroup(
    entries,
    categories,
    quarter,
    year
  );

  // Get non-compensation and non-other OpEx categories (remaining categories)
  const remainingOpexCategories = opexCategories.filter(
    (cat) =>
      !COMP_AND_BENEFITS_CATEGORIES.includes(cat.id) &&
      !OTHER_CATEGORIES.includes(cat.id)
  );

  // Use quarterly-specific calculation for remaining OpEx
  const remainingOpexSummaries = remainingOpexCategories.map((cat) =>
    calculateQuarterlyCategorySummary(entries, cat, quarter, year)
  );

  const costOfSalesTotal = {
    budget: costOfSalesSummaries.reduce((sum, cat) => sum + cat.budget, 0),
    actual: costOfSalesSummaries.reduce((sum, cat) => sum + cat.actual, 0),
    reforecast: costOfSalesSummaries.reduce(
      (sum, cat) => sum + cat.reforecast,
      0
    ),
    adjustments: costOfSalesSummaries.reduce(
      (sum, cat) => sum + cat.adjustments,
      0
    ),
    variance: costOfSalesSummaries.reduce((sum, cat) => sum + cat.variance, 0),
  };

  const opexTotal = {
    budget:
      compAndBenefitsSubGroup.total.budget +
      otherSubGroup.total.budget +
      remainingOpexSummaries.reduce((sum, cat) => sum + cat.budget, 0),
    actual:
      compAndBenefitsSubGroup.total.actual +
      otherSubGroup.total.actual +
      remainingOpexSummaries.reduce((sum, cat) => sum + cat.actual, 0),
    reforecast:
      compAndBenefitsSubGroup.total.reforecast +
      otherSubGroup.total.reforecast +
      remainingOpexSummaries.reduce((sum, cat) => sum + cat.reforecast, 0),
    adjustments:
      compAndBenefitsSubGroup.total.adjustments +
      otherSubGroup.total.adjustments +
      remainingOpexSummaries.reduce((sum, cat) => sum + cat.adjustments, 0),
    variance:
      compAndBenefitsSubGroup.total.variance +
      otherSubGroup.total.variance +
      remainingOpexSummaries.reduce((sum, cat) => sum + cat.variance, 0),
  };

  const netTotal = {
    budget: costOfSalesTotal.budget + opexTotal.budget,
    actual: costOfSalesTotal.actual + opexTotal.actual,
    reforecast: costOfSalesTotal.reforecast + opexTotal.reforecast,
    adjustments: costOfSalesTotal.adjustments + opexTotal.adjustments,
    variance: costOfSalesTotal.variance + opexTotal.variance,
  };

  return {
    quarter,
    costOfSales: {
      id: "cost-of-sales",
      name: "Cost of Sales",
      categories: costOfSalesSummaries,
      total: costOfSalesTotal,
    },
    opex: {
      id: "opex",
      name: "OpEx",
      categories: remainingOpexSummaries,
      subGroups: [compAndBenefitsSubGroup, otherSubGroup],
      total: opexTotal,
    },
    netTotal,
  };
};

// Non-forecast quarterly data calculation
export const calculateQuarterlyNonForecastData = (
  entries: BudgetEntry[],
  categories: BudgetCategory[],
  quarter: number,
  year: number
): QuarterlyData => {
  const costOfSalesCategories = categories.filter(
    (cat) => cat.parentCategory === "cost-of-sales"
  );
  const opexCategories = categories.filter(
    (cat) => cat.parentCategory === "opex"
  );

  // Use non-forecast calculation for cost of sales
  const costOfSalesSummaries = costOfSalesCategories.map((cat) =>
    calculateQuarterlyNonForecastCategorySummary(entries, cat, quarter, year)
  );

  // Create non-forecast subgroups
  const compAndBenefitsSubGroup =
    createQuarterlyNonForecastCompAndBenefitsSubGroup(
      entries,
      categories,
      quarter,
      year
    );

  const otherSubGroup = createQuarterlyNonForecastOtherSubGroup(
    entries,
    categories,
    quarter,
    year
  );

  // Get remaining OpEx categories
  const remainingOpexCategories = opexCategories.filter(
    (cat) =>
      !COMP_AND_BENEFITS_CATEGORIES.includes(cat.id) &&
      !OTHER_CATEGORIES.includes(cat.id)
  );

  // Use non-forecast calculation for remaining OpEx
  const remainingOpexSummaries = remainingOpexCategories.map((cat) =>
    calculateQuarterlyNonForecastCategorySummary(entries, cat, quarter, year)
  );

  const costOfSalesTotal = {
    budget: costOfSalesSummaries.reduce((sum, cat) => sum + cat.budget, 0),
    actual: costOfSalesSummaries.reduce((sum, cat) => sum + cat.actual, 0),
    reforecast: costOfSalesSummaries.reduce(
      (sum, cat) => sum + cat.reforecast,
      0
    ),
    adjustments: costOfSalesSummaries.reduce(
      (sum, cat) => sum + cat.adjustments,
      0
    ),
    variance: costOfSalesSummaries.reduce((sum, cat) => sum + cat.variance, 0),
  };

  const opexTotal = {
    budget:
      compAndBenefitsSubGroup.total.budget +
      otherSubGroup.total.budget +
      remainingOpexSummaries.reduce((sum, cat) => sum + cat.budget, 0),
    actual:
      compAndBenefitsSubGroup.total.actual +
      otherSubGroup.total.actual +
      remainingOpexSummaries.reduce((sum, cat) => sum + cat.actual, 0),
    reforecast:
      compAndBenefitsSubGroup.total.reforecast +
      otherSubGroup.total.reforecast +
      remainingOpexSummaries.reduce((sum, cat) => sum + cat.reforecast, 0),
    adjustments:
      compAndBenefitsSubGroup.total.adjustments +
      otherSubGroup.total.adjustments +
      remainingOpexSummaries.reduce((sum, cat) => sum + cat.adjustments, 0),
    variance:
      compAndBenefitsSubGroup.total.variance +
      otherSubGroup.total.variance +
      remainingOpexSummaries.reduce((sum, cat) => sum + cat.variance, 0),
  };

  const netTotal = {
    budget: costOfSalesTotal.budget + opexTotal.budget,
    actual: costOfSalesTotal.actual + opexTotal.actual,
    reforecast: costOfSalesTotal.reforecast + opexTotal.reforecast,
    adjustments: costOfSalesTotal.adjustments + opexTotal.adjustments,
    variance: costOfSalesTotal.variance + opexTotal.variance,
  };

  return {
    quarter,
    costOfSales: {
      id: "cost-of-sales",
      name: "Cost of Sales",
      categories: costOfSalesSummaries,
      total: costOfSalesTotal,
    },
    opex: {
      id: "opex",
      name: "OpEx",
      categories: remainingOpexSummaries,
      subGroups: [compAndBenefitsSubGroup, otherSubGroup],
      total: opexTotal,
    },
    netTotal,
  };
};

export const calculateMonthlyData = (
  entries: BudgetEntry[],
  categories: BudgetCategory[],
  month: number,
  year: number
): MonthlyData => {
  const costOfSalesCategories = categories.filter(
    (cat) => cat.parentCategory === "cost-of-sales"
  );
  const opexCategories = categories.filter(
    (cat) => cat.parentCategory === "opex"
  );

  const costOfSalesSummaries = costOfSalesCategories.map((cat) =>
    calculateCategorySummary(entries, cat, undefined, month, year)
  );

  // Create Comp and Benefits subgroup
  const compAndBenefitsSubGroup = createCompAndBenefitsSubGroup(
    entries,
    categories,
    undefined,
    month,
    year
  );

  // Create Other subgroup
  const otherSubGroup = createOtherSubGroup(
    entries,
    categories,
    undefined,
    month,
    year
  );

  // Get non-compensation and non-other OpEx categories (remaining categories)
  const remainingOpexCategories = opexCategories.filter(
    (cat) =>
      !COMP_AND_BENEFITS_CATEGORIES.includes(cat.id) &&
      !OTHER_CATEGORIES.includes(cat.id)
  );

  const remainingOpexSummaries = remainingOpexCategories.map((cat) =>
    calculateCategorySummary(entries, cat, undefined, month, year)
  );

  const costOfSalesTotal = {
    budget: costOfSalesSummaries.reduce((sum, cat) => sum + cat.budget, 0),
    actual: costOfSalesSummaries.reduce((sum, cat) => sum + cat.actual, 0),
    reforecast: costOfSalesSummaries.reduce(
      (sum, cat) => sum + cat.reforecast,
      0
    ),
    adjustments: costOfSalesSummaries.reduce(
      (sum, cat) => sum + cat.adjustments,
      0
    ),
    variance: costOfSalesSummaries.reduce((sum, cat) => sum + cat.variance, 0),
  };

  const opexTotal = {
    budget:
      compAndBenefitsSubGroup.total.budget +
      otherSubGroup.total.budget +
      remainingOpexSummaries.reduce((sum, cat) => sum + cat.budget, 0),
    actual:
      compAndBenefitsSubGroup.total.actual +
      otherSubGroup.total.actual +
      remainingOpexSummaries.reduce((sum, cat) => sum + cat.actual, 0),
    reforecast:
      compAndBenefitsSubGroup.total.reforecast +
      otherSubGroup.total.reforecast +
      remainingOpexSummaries.reduce((sum, cat) => sum + cat.reforecast, 0),
    adjustments:
      compAndBenefitsSubGroup.total.adjustments +
      otherSubGroup.total.adjustments +
      remainingOpexSummaries.reduce((sum, cat) => sum + cat.adjustments, 0),
    variance:
      compAndBenefitsSubGroup.total.variance +
      otherSubGroup.total.variance +
      remainingOpexSummaries.reduce((sum, cat) => sum + cat.variance, 0),
  };

  const netTotal = {
    budget: costOfSalesTotal.budget + opexTotal.budget,
    actual: costOfSalesTotal.actual + opexTotal.actual,
    reforecast: costOfSalesTotal.reforecast + opexTotal.reforecast,
    adjustments: costOfSalesTotal.adjustments + opexTotal.adjustments,
    variance: costOfSalesTotal.variance + opexTotal.variance,
  };

  return {
    month,
    costOfSales: {
      id: "cost-of-sales",
      name: "Cost of Sales",
      categories: costOfSalesSummaries,
      total: costOfSalesTotal,
    },
    opex: {
      id: "opex",
      name: "OpEx",
      categories: remainingOpexSummaries,
      subGroups: [compAndBenefitsSubGroup, otherSubGroup],
      total: opexTotal,
    },
    netTotal,
  };
};

export const generateAlerts = (
  entries: BudgetEntry[],
  categories: BudgetCategory[],
  year: number
): BudgetAlert[] => {
  const alerts: BudgetAlert[] = [];

  categories.forEach((category) => {
    const summary = calculateCategorySummary(
      entries,
      category,
      undefined,
      undefined,
      year
    );

    // Alert for significant variance (>15% or >$50k)
    if (
      Math.abs(summary.variancePercent) > 15 &&
      Math.abs(summary.variance) > 50000
    ) {
      alerts.push({
        id: `variance-${category.id}`,
        type: Math.abs(summary.variancePercent) > 25 ? "danger" : "warning",
        category: category.name,
        message: `${Math.abs(summary.variancePercent).toFixed(
          1
        )}% variance from budget`,
        variance: summary.variance,
      });
    }

    // Alert for categories with no actual data but have budget
    if (summary.budget !== 0 && summary.actual === 0) {
      alerts.push({
        id: `no-actuals-${category.id}`,
        type: "info",
        category: category.name,
        message: "No actual expenses recorded yet",
        variance: summary.budget,
      });
    }
  });

  return alerts.sort((a, b) => {
    const typeOrder = { danger: 3, warning: 2, info: 1 };
    return typeOrder[b.type] - typeOrder[a.type];
  });
};

// Helper function to find the last month with actual data
export const findLastMonthWithActuals = (
  entries: BudgetEntry[],
  year: number
): number => {
  let lastMonth = 0;
  for (let month = 1; month <= 12; month++) {
    const hasActuals = entries.some(
      (entry) =>
        entry.year === year &&
        entry.month === month &&
        entry.actualAmount &&
        entry.actualAmount > 0
    );
    if (hasActuals) {
      lastMonth = month;
    }
  }
  return lastMonth;
};

// YTD category summary calculation (only actual data, no forecasts)
export const calculateYTDCategorySummary = (
  entries: BudgetEntry[],
  category: BudgetCategory,
  year: number,
  lastMonthWithActuals: number
): CategorySummary => {
  let totalBudget = 0;
  let totalActual = 0;
  let totalReforecast = 0;
  let totalAdjustments = 0;

  // Sum from January through last month with actuals
  for (let month = 1; month <= lastMonthWithActuals; month++) {
    const monthEntries = entries.filter((entry) => {
      return (
        entry.categoryId === category.id &&
        entry.year === year &&
        entry.month === month
      );
    });

    totalBudget += monthEntries.reduce(
      (sum, entry) => sum + entry.budgetAmount,
      0
    );
    totalActual += monthEntries.reduce(
      (sum, entry) => sum + (entry.actualAmount || 0),
      0
    );
    totalReforecast += monthEntries.reduce(
      (sum, entry) => sum + (entry.reforecastAmount || 0),
      0
    );
    totalAdjustments += monthEntries.reduce(
      (sum, entry) => sum + (entry.adjustmentAmount || 0),
      0
    );
  }

  // YTD variance: (Actual - Budget) * -1 (only use actuals, no forecasts)
  const variance = (totalActual - totalBudget) * -1;
  const variancePercent =
    totalBudget !== 0 ? (variance / Math.abs(totalBudget)) * 100 : 0;

  return {
    categoryId: category.id,
    categoryName: category.name,
    budget: totalBudget,
    actual: totalActual,
    reforecast: totalReforecast,
    adjustments: totalAdjustments,
    variance,
    variancePercent,
    isNegative: category.isNegative,
  };
};

// Create YTD Comp and Benefits subgroup
export const createYTDCompAndBenefitsSubGroup = (
  entries: BudgetEntry[],
  categories: BudgetCategory[],
  year: number,
  lastMonthWithActuals: number
): SubCategoryGroup => {
  const compAndBenefitsCategories = categories.filter((cat) =>
    COMP_AND_BENEFITS_CATEGORIES.includes(cat.id)
  );

  const summaries = compAndBenefitsCategories.map((cat) =>
    calculateYTDCategorySummary(entries, cat, year, lastMonthWithActuals)
  );

  const total = {
    budget: summaries.reduce((sum, cat) => sum + cat.budget, 0),
    actual: summaries.reduce((sum, cat) => sum + cat.actual, 0),
    reforecast: summaries.reduce((sum, cat) => sum + cat.reforecast, 0),
    adjustments: summaries.reduce((sum, cat) => sum + cat.adjustments, 0),
    variance: summaries.reduce((sum, cat) => sum + cat.variance, 0),
  };

  return {
    id: "ytd-comp-and-benefits",
    name: "Comp and Benefits",
    categories: summaries,
    total,
  };
};

// Create YTD Other subgroup
export const createYTDOtherSubGroup = (
  entries: BudgetEntry[],
  categories: BudgetCategory[],
  year: number,
  lastMonthWithActuals: number
): SubCategoryGroup => {
  const otherCategories = categories.filter((cat) =>
    OTHER_CATEGORIES.includes(cat.id)
  );

  const summaries = otherCategories.map((cat) =>
    calculateYTDCategorySummary(entries, cat, year, lastMonthWithActuals)
  );

  const total = {
    budget: summaries.reduce((sum, cat) => sum + cat.budget, 0),
    actual: summaries.reduce((sum, cat) => sum + cat.actual, 0),
    reforecast: summaries.reduce((sum, cat) => sum + cat.reforecast, 0),
    adjustments: summaries.reduce((sum, cat) => sum + cat.adjustments, 0),
    variance: summaries.reduce((sum, cat) => sum + cat.variance, 0),
  };

  return {
    id: "ytd-other",
    name: "Other",
    categories: summaries,
    total,
  };
};

// YTD (Year-to-Date) calculation - sums from January through the last month with actual data
export const calculateYTDData = (
  entries: BudgetEntry[],
  categories: BudgetCategory[],
  year: number
): { data: QuarterlyData; lastMonthWithActuals: number } => {
  // Find the last month with actual data
  const lastMonthWithActuals = findLastMonthWithActuals(entries, year);

  const costOfSalesCategories = categories.filter(
    (cat) => cat.parentCategory === "cost-of-sales"
  );
  const opexCategories = categories.filter(
    (cat) => cat.parentCategory === "opex"
  );

  // Calculate YTD summaries (January through last month with actuals)
  const costOfSalesSummaries = costOfSalesCategories.map((cat) =>
    calculateYTDCategorySummary(entries, cat, year, lastMonthWithActuals)
  );

  // Create YTD subgroups
  const compAndBenefitsSubGroup = createYTDCompAndBenefitsSubGroup(
    entries,
    categories,
    year,
    lastMonthWithActuals
  );

  const otherSubGroup = createYTDOtherSubGroup(
    entries,
    categories,
    year,
    lastMonthWithActuals
  );

  // Get remaining OpEx categories
  const remainingOpexCategories = opexCategories.filter(
    (cat) =>
      !COMP_AND_BENEFITS_CATEGORIES.includes(cat.id) &&
      !OTHER_CATEGORIES.includes(cat.id)
  );

  const remainingOpexSummaries = remainingOpexCategories.map((cat) =>
    calculateYTDCategorySummary(entries, cat, year, lastMonthWithActuals)
  );

  const costOfSalesTotal = {
    budget: costOfSalesSummaries.reduce((sum, cat) => sum + cat.budget, 0),
    actual: costOfSalesSummaries.reduce((sum, cat) => sum + cat.actual, 0),
    reforecast: costOfSalesSummaries.reduce(
      (sum, cat) => sum + cat.reforecast,
      0
    ),
    adjustments: costOfSalesSummaries.reduce(
      (sum, cat) => sum + cat.adjustments,
      0
    ),
    variance: costOfSalesSummaries.reduce((sum, cat) => sum + cat.variance, 0),
  };

  const opexTotal = {
    budget:
      compAndBenefitsSubGroup.total.budget +
      otherSubGroup.total.budget +
      remainingOpexSummaries.reduce((sum, cat) => sum + cat.budget, 0),
    actual:
      compAndBenefitsSubGroup.total.actual +
      otherSubGroup.total.actual +
      remainingOpexSummaries.reduce((sum, cat) => sum + cat.actual, 0),
    reforecast:
      compAndBenefitsSubGroup.total.reforecast +
      otherSubGroup.total.reforecast +
      remainingOpexSummaries.reduce((sum, cat) => sum + cat.reforecast, 0),
    adjustments:
      compAndBenefitsSubGroup.total.adjustments +
      otherSubGroup.total.adjustments +
      remainingOpexSummaries.reduce((sum, cat) => sum + cat.adjustments, 0),
    variance:
      compAndBenefitsSubGroup.total.variance +
      otherSubGroup.total.variance +
      remainingOpexSummaries.reduce((sum, cat) => sum + cat.variance, 0),
  };

  const netTotal = {
    budget: costOfSalesTotal.budget + opexTotal.budget,
    actual: costOfSalesTotal.actual + opexTotal.actual,
    reforecast: costOfSalesTotal.reforecast + opexTotal.reforecast,
    adjustments: costOfSalesTotal.adjustments + opexTotal.adjustments,
    variance: costOfSalesTotal.variance + opexTotal.variance,
  };

  const ytdData: QuarterlyData = {
    quarter: 0, // Use 0 to indicate YTD instead of a specific quarter
    costOfSales: {
      id: "cost-of-sales",
      name: "Cost of Sales",
      categories: costOfSalesSummaries,
      total: costOfSalesTotal,
    },
    opex: {
      id: "opex",
      name: "OpEx",
      categories: remainingOpexSummaries,
      subGroups: [compAndBenefitsSubGroup, otherSubGroup],
      total: opexTotal,
    },
    netTotal,
  };

  return { data: ytdData, lastMonthWithActuals };
};

// Quarterly category summary calculation with budget limited to months with actuals
// Only sums budget amounts through the last month with actuals in the quarter
export const calculateQuarterlyThroughActualsCategorySummary = (
  entries: BudgetEntry[],
  category: BudgetCategory,
  quarter: number,
  year: number,
  lastMonthWithActualsInQuarter: number
): CategorySummary => {
  // Get all months in the quarter
  const quarterMonths = getQuarterMonths(quarter);

  let totalBudget = 0;
  let totalActual = 0;
  let totalReforecast = 0;
  let totalAdjustments = 0;

  quarterMonths.forEach((month) => {
    const monthEntries = entries.filter((entry) => {
      return (
        entry.categoryId === category.id &&
        entry.year === year &&
        entry.month === month
      );
    });

    const monthBudget = monthEntries.reduce(
      (sum, entry) => sum + entry.budgetAmount,
      0
    );
    const monthActual = monthEntries.reduce(
      (sum, entry) => sum + (entry.actualAmount || 0),
      0
    );
    const monthReforecast = monthEntries.reduce(
      (sum, entry) => sum + (entry.reforecastAmount || 0),
      0
    );
    const monthAdjustments = monthEntries.reduce(
      (sum, entry) => sum + (entry.adjustmentAmount || 0),
      0
    );

    // Only include budget amounts through the last month with actuals
    if (month <= lastMonthWithActualsInQuarter) {
      totalBudget += monthBudget;
    }
    totalActual += monthActual;
    totalReforecast += monthReforecast;
  });

  // Variance calculation: (Actual - Budget) * -1
  // Uses only actual amounts vs budget through last month with actuals
  const variance = (totalActual - totalBudget) * -1;
  const variancePercent =
    totalBudget !== 0 ? (variance / Math.abs(totalBudget)) * 100 : 0;

  return {
    categoryId: category.id,
    categoryName: category.name,
    budget: totalBudget,
    actual: totalActual,
    reforecast: totalReforecast,
    adjustments: totalAdjustments,
    variance,
    variancePercent,
    isNegative: category.isNegative,
  };
};

// Create quarterly Comp and Benefits subgroup with budget limited to months with actuals
export const createQuarterlyThroughActualsCompAndBenefitsSubGroup = (
  entries: BudgetEntry[],
  categories: BudgetCategory[],
  quarter: number,
  year: number,
  lastMonthWithActualsInQuarter: number
): SubCategoryGroup => {
  const compAndBenefitsCategories = categories.filter((cat) =>
    COMP_AND_BENEFITS_CATEGORIES.includes(cat.id)
  );

  const summaries = compAndBenefitsCategories.map((cat) =>
    calculateQuarterlyThroughActualsCategorySummary(
      entries,
      cat,
      quarter,
      year,
      lastMonthWithActualsInQuarter
    )
  );

  const total = {
    budget: summaries.reduce((sum, cat) => sum + cat.budget, 0),
    actual: summaries.reduce((sum, cat) => sum + cat.actual, 0),
    reforecast: summaries.reduce((sum, cat) => sum + cat.reforecast, 0),
    adjustments: summaries.reduce((sum, cat) => sum + cat.adjustments, 0),
    variance: summaries.reduce((sum, cat) => sum + cat.variance, 0),
  };

  return {
    id: "comp-and-benefits",
    name: "Comp and Benefits",
    categories: summaries,
    total,
  };
};

// Create quarterly Other subgroup with budget limited to months with actuals
export const createQuarterlyThroughActualsOtherSubGroup = (
  entries: BudgetEntry[],
  categories: BudgetCategory[],
  quarter: number,
  year: number,
  lastMonthWithActualsInQuarter: number
): SubCategoryGroup => {
  const otherCategories = categories.filter((cat) =>
    OTHER_CATEGORIES.includes(cat.id)
  );

  const summaries = otherCategories.map((cat) =>
    calculateQuarterlyThroughActualsCategorySummary(
      entries,
      cat,
      quarter,
      year,
      lastMonthWithActualsInQuarter
    )
  );

  const total = {
    budget: summaries.reduce((sum, cat) => sum + cat.budget, 0),
    actual: summaries.reduce((sum, cat) => sum + cat.actual, 0),
    reforecast: summaries.reduce((sum, cat) => sum + cat.reforecast, 0),
    adjustments: summaries.reduce((sum, cat) => sum + cat.adjustments, 0),
    variance: summaries.reduce((sum, cat) => sum + cat.variance, 0),
  };

  return {
    id: "other",
    name: "Other",
    categories: summaries,
    total,
  };
};

// Quarterly data calculation with budget limited to months with actuals
export const calculateQuarterlyThroughActualsData = (
  entries: BudgetEntry[],
  categories: BudgetCategory[],
  quarter: number,
  year: number,
  lastMonthWithActualsInQuarter: number
): QuarterlyData => {
  const costOfSalesCategories = categories.filter(
    (cat) => cat.parentCategory === "cost-of-sales"
  );
  const opexCategories = categories.filter(
    (cat) => cat.parentCategory === "opex"
  );

  // Use through-actuals calculation for cost of sales
  const costOfSalesSummaries = costOfSalesCategories.map((cat) =>
    calculateQuarterlyThroughActualsCategorySummary(
      entries,
      cat,
      quarter,
      year,
      lastMonthWithActualsInQuarter
    )
  );

  // Create through-actuals subgroups
  const compAndBenefitsSubGroup =
    createQuarterlyThroughActualsCompAndBenefitsSubGroup(
      entries,
      categories,
      quarter,
      year,
      lastMonthWithActualsInQuarter
    );

  const otherSubGroup = createQuarterlyThroughActualsOtherSubGroup(
    entries,
    categories,
    quarter,
    year,
    lastMonthWithActualsInQuarter
  );

  // Get remaining OpEx categories
  const remainingOpexCategories = opexCategories.filter(
    (cat) =>
      !COMP_AND_BENEFITS_CATEGORIES.includes(cat.id) &&
      !OTHER_CATEGORIES.includes(cat.id)
  );

  // Use through-actuals calculation for remaining OpEx
  const remainingOpexSummaries = remainingOpexCategories.map((cat) =>
    calculateQuarterlyThroughActualsCategorySummary(
      entries,
      cat,
      quarter,
      year,
      lastMonthWithActualsInQuarter
    )
  );

  const costOfSalesTotal = {
    budget: costOfSalesSummaries.reduce((sum, cat) => sum + cat.budget, 0),
    actual: costOfSalesSummaries.reduce((sum, cat) => sum + cat.actual, 0),
    reforecast: costOfSalesSummaries.reduce(
      (sum, cat) => sum + cat.reforecast,
      0
    ),
    adjustments: costOfSalesSummaries.reduce(
      (sum, cat) => sum + cat.adjustments,
      0
    ),
    variance: costOfSalesSummaries.reduce((sum, cat) => sum + cat.variance, 0),
  };

  const opexTotal = {
    budget:
      compAndBenefitsSubGroup.total.budget +
      otherSubGroup.total.budget +
      remainingOpexSummaries.reduce((sum, cat) => sum + cat.budget, 0),
    actual:
      compAndBenefitsSubGroup.total.actual +
      otherSubGroup.total.actual +
      remainingOpexSummaries.reduce((sum, cat) => sum + cat.actual, 0),
    reforecast:
      compAndBenefitsSubGroup.total.reforecast +
      otherSubGroup.total.reforecast +
      remainingOpexSummaries.reduce((sum, cat) => sum + cat.reforecast, 0),
    adjustments:
      compAndBenefitsSubGroup.total.adjustments +
      otherSubGroup.total.adjustments +
      remainingOpexSummaries.reduce((sum, cat) => sum + cat.adjustments, 0),
    variance:
      compAndBenefitsSubGroup.total.variance +
      otherSubGroup.total.variance +
      remainingOpexSummaries.reduce((sum, cat) => sum + cat.variance, 0),
  };

  const netTotal = {
    budget: costOfSalesTotal.budget + opexTotal.budget,
    actual: costOfSalesTotal.actual + opexTotal.actual,
    reforecast: costOfSalesTotal.reforecast + opexTotal.reforecast,
    adjustments: costOfSalesTotal.adjustments + opexTotal.adjustments,
    variance: costOfSalesTotal.variance + opexTotal.variance,
  };

  return {
    quarter,
    costOfSales: {
      id: "cost-of-sales",
      name: "Cost of Sales",
      categories: costOfSalesSummaries,
      total: costOfSalesTotal,
    },
    opex: {
      id: "opex",
      name: "OpEx",
      categories: remainingOpexSummaries,
      subGroups: [compAndBenefitsSubGroup, otherSubGroup],
      total: opexTotal,
    },
    netTotal,
  };
};

// Create quarterly Comp and Benefits subgroup with quarterly logic
export const createQuarterlyCompAndBenefitsSubGroup = (
  entries: BudgetEntry[],
  categories: BudgetCategory[],
  quarter: number,
  year: number
): SubCategoryGroup => {
  const compAndBenefitsCategories = categories.filter((cat) =>
    COMP_AND_BENEFITS_CATEGORIES.includes(cat.id)
  );

  const summaries = compAndBenefitsCategories.map((cat) =>
    calculateQuarterlyCategorySummary(entries, cat, quarter, year)
  );

  const total = {
    budget: summaries.reduce((sum, cat) => sum + cat.budget, 0),
    actual: summaries.reduce((sum, cat) => sum + cat.actual, 0),
    reforecast: summaries.reduce((sum, cat) => sum + cat.reforecast, 0),
    adjustments: summaries.reduce((sum, cat) => sum + cat.adjustments, 0),
    variance: summaries.reduce((sum, cat) => sum + cat.variance, 0),
  };

  return {
    id: "comp-and-benefits",
    name: "Comp and Benefits",
    categories: summaries,
    total,
  };
};

// Create quarterly Other subgroup with quarterly logic
export const createQuarterlyOtherSubGroup = (
  entries: BudgetEntry[],
  categories: BudgetCategory[],
  quarter: number,
  year: number
): SubCategoryGroup => {
  const otherCategories = categories.filter((cat) =>
    OTHER_CATEGORIES.includes(cat.id)
  );

  const summaries = otherCategories.map((cat) =>
    calculateQuarterlyCategorySummary(entries, cat, quarter, year)
  );

  const total = {
    budget: summaries.reduce((sum, cat) => sum + cat.budget, 0),
    actual: summaries.reduce((sum, cat) => sum + cat.actual, 0),
    reforecast: summaries.reduce((sum, cat) => sum + cat.reforecast, 0),
    adjustments: summaries.reduce((sum, cat) => sum + cat.adjustments, 0),
    variance: summaries.reduce((sum, cat) => sum + cat.variance, 0),
  };

  return {
    id: "other",
    name: "Other",
    categories: summaries,
    total,
  };
};

// Create quarterly non-forecast Comp and Benefits subgroup
export const createQuarterlyNonForecastCompAndBenefitsSubGroup = (
  entries: BudgetEntry[],
  categories: BudgetCategory[],
  quarter: number,
  year: number
): SubCategoryGroup => {
  const compAndBenefitsCategories = categories.filter((cat) =>
    COMP_AND_BENEFITS_CATEGORIES.includes(cat.id)
  );

  const summaries = compAndBenefitsCategories.map((cat) =>
    calculateQuarterlyNonForecastCategorySummary(entries, cat, quarter, year)
  );

  const total = {
    budget: summaries.reduce((sum, cat) => sum + cat.budget, 0),
    actual: summaries.reduce((sum, cat) => sum + cat.actual, 0),
    reforecast: summaries.reduce((sum, cat) => sum + cat.reforecast, 0),
    adjustments: summaries.reduce((sum, cat) => sum + cat.adjustments, 0),
    variance: summaries.reduce((sum, cat) => sum + cat.variance, 0),
  };

  return {
    id: "comp-and-benefits",
    name: "Comp and Benefits",
    categories: summaries,
    total,
  };
};

// Create quarterly non-forecast Other subgroup
export const createQuarterlyNonForecastOtherSubGroup = (
  entries: BudgetEntry[],
  categories: BudgetCategory[],
  quarter: number,
  year: number
): SubCategoryGroup => {
  const otherCategories = categories.filter((cat) =>
    OTHER_CATEGORIES.includes(cat.id)
  );

  const summaries = otherCategories.map((cat) =>
    calculateQuarterlyNonForecastCategorySummary(entries, cat, quarter, year)
  );

  const total = {
    budget: summaries.reduce((sum, cat) => sum + cat.budget, 0),
    actual: summaries.reduce((sum, cat) => sum + cat.actual, 0),
    reforecast: summaries.reduce((sum, cat) => sum + cat.reforecast, 0),
    adjustments: summaries.reduce((sum, cat) => sum + cat.adjustments, 0),
    variance: summaries.reduce((sum, cat) => sum + cat.variance, 0),
  };

  return {
    id: "other",
    name: "Other",
    categories: summaries,
    total,
  };
};

// Create monthly Comp and Benefits subgroup
export const createCompAndBenefitsSubGroup = (
  entries: BudgetEntry[],
  categories: BudgetCategory[],
  quarter?: number,
  month?: number,
  year?: number
): SubCategoryGroup => {
  const compAndBenefitsCategories = categories.filter((cat) =>
    COMP_AND_BENEFITS_CATEGORIES.includes(cat.id)
  );

  const summaries = compAndBenefitsCategories.map((cat) =>
    calculateCategorySummary(entries, cat, quarter, month, year)
  );

  const total = {
    budget: summaries.reduce((sum, cat) => sum + cat.budget, 0),
    actual: summaries.reduce((sum, cat) => sum + cat.actual, 0),
    reforecast: summaries.reduce((sum, cat) => sum + cat.reforecast, 0),
    adjustments: summaries.reduce((sum, cat) => sum + cat.adjustments, 0),
    variance: summaries.reduce((sum, cat) => sum + cat.variance, 0),
  };

  return {
    id: "comp-and-benefits",
    name: "Comp and Benefits",
    categories: summaries,
    total,
  };
};

// Create monthly Other subgroup
export const createOtherSubGroup = (
  entries: BudgetEntry[],
  categories: BudgetCategory[],
  quarter?: number,
  month?: number,
  year?: number
): SubCategoryGroup => {
  const otherCategories = categories.filter((cat) =>
    OTHER_CATEGORIES.includes(cat.id)
  );

  const summaries = otherCategories.map((cat) =>
    calculateCategorySummary(entries, cat, quarter, month, year)
  );

  const total = {
    budget: summaries.reduce((sum, cat) => sum + cat.budget, 0),
    actual: summaries.reduce((sum, cat) => sum + cat.actual, 0),
    reforecast: summaries.reduce((sum, cat) => sum + cat.reforecast, 0),
    adjustments: summaries.reduce((sum, cat) => sum + cat.adjustments, 0),
    variance: summaries.reduce((sum, cat) => sum + cat.variance, 0),
  };

  return {
    id: "other",
    name: "Other",
    categories: summaries,
    total,
  };
};

// Helper function to calculate Budget Tracking (Net Total minus Adjustments)
// Updated to align with adjustments display logic:
// - Budget: No adjustment subtraction (budget column shows no adjustments)
// - Actual: Subtract adjustments (actual column always shows adjustments)
// - Reforecast: Subtract adjustments only when actual === 0 (conditional display logic)
// - Variance: Uses actual or forecast based on isForecastMode flag
export const calculateBudgetTracking = (
  netTotal: {
    budget: number;
    actual: number;
    reforecast: number;
    adjustments: number;
    variance: number;
  },
  isForecastMode: boolean = false
) => {
  // Budget tracking calculations aligned with adjustments display logic
  const budgetTrackingBudget = netTotal.budget; // No adjustment (budget column is empty)
  const budgetTrackingActual = netTotal.actual - netTotal.adjustments; // Always subtract adjustments
  const budgetTrackingReforecast =
    netTotal.actual === 0
      ? netTotal.reforecast - netTotal.adjustments // Subtract when actual = 0 (adjustments shown in forecast)
      : netTotal.reforecast; // Don't subtract when actual exists (adjustments = 0 in forecast)

  // Calculate variance based on mode
  let varianceBase;
  if (isForecastMode) {
    // Forecast mode: use forecast for variance calculation
    varianceBase = budgetTrackingReforecast;
  } else {
    // Final mode: use actual for variance calculation
    varianceBase = budgetTrackingActual;
  }

  return {
    budget: budgetTrackingBudget,
    actual: budgetTrackingActual,
    reforecast: budgetTrackingReforecast,
    // Budget tracking variance: (variance base - budget) * -1
    variance: (varianceBase - budgetTrackingBudget) * -1,
  };
};

// Calculate category percentages for tooltip display
export const calculateCategoryPercentages = (
  categories: CategorySummary[],
  parentGroupTotal: {
    budget: number;
    actual: number;
    reforecast: number;
    adjustments: number;
  }
): CategorySummary[] => {
  return categories.map(category => {
    // Calculate total amounts including adjustments
    const categoryBudgetTotal = category.budget + category.adjustments;
    const categoryActualTotal = category.actual + category.adjustments;
    const categoryReforecastTotal = category.reforecast + category.adjustments;
    
    const parentBudgetTotal = parentGroupTotal.budget + parentGroupTotal.adjustments;
    const parentActualTotal = parentGroupTotal.actual + parentGroupTotal.adjustments;
    const parentReforecastTotal = parentGroupTotal.reforecast + parentGroupTotal.adjustments;

    return {
      ...category,
      budgetPercent: parentBudgetTotal !== 0 ? (categoryBudgetTotal / parentBudgetTotal) * 100 : 0,
      actualPercent: parentActualTotal !== 0 ? (categoryActualTotal / parentActualTotal) * 100 : 0,
      reforecastPercent: parentReforecastTotal !== 0 ? (categoryReforecastTotal / parentReforecastTotal) * 100 : 0,
    };
  });
};
