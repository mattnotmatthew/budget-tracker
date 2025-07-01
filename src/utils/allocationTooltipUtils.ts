import { CategorySummary } from "../types";
import { formatCurrencyExcelStyle } from "./currencyFormatter";

export interface TooltipContent {
  definition: string;
  interpretation: string;
  formula: string;
  calculation: string;
}

const getMonthName = (month: number): string => {
  return new Date(2025, month - 1, 1).toLocaleString("default", {
    month: "long",
  });
};

export const getBudgetAllocationTooltipContent = (
  category: CategorySummary,
  month: number,
  parentGroupName: string,
  parentGroupTotal: {
    budget: number;
    actual: number;
    reforecast: number;
    adjustments: number;
  },
  allAllocations?: any[] // Optional: Pass all allocations to show allocation breakdown
): TooltipContent => {
  const monthName = getMonthName(month);
  
  // Calculate totals including adjustments
  const categoryBudgetTotal = category.budget + category.adjustments;
  const categoryActualTotal = category.actual + category.adjustments;
  const categoryReforecastTotal = category.reforecast + category.adjustments;
  
  const parentBudgetTotal = parentGroupTotal.budget + parentGroupTotal.adjustments;
  const parentActualTotal = parentGroupTotal.actual + parentGroupTotal.adjustments;
  const parentReforecastTotal = parentGroupTotal.reforecast + parentGroupTotal.adjustments;

  // Calculate percentages
  const budgetPercent = parentBudgetTotal !== 0 ? (categoryBudgetTotal / parentBudgetTotal) * 100 : 0;
  const actualPercent = parentActualTotal !== 0 ? (categoryActualTotal / parentActualTotal) * 100 : 0;
  const reforecastPercent = parentReforecastTotal !== 0 ? (categoryReforecastTotal / parentReforecastTotal) * 100 : 0;

  // Determine primary allocation percentage (use budget if available, otherwise actual, then reforecast)
  let primaryPercent = budgetPercent;
  let primaryAmount = categoryBudgetTotal;
  let primaryType = "Budget";
  
  if (categoryActualTotal > 0) {
    primaryPercent = actualPercent;
    primaryAmount = categoryActualTotal;
    primaryType = "Actual";
  } else if (categoryReforecastTotal > 0 && categoryBudgetTotal === 0) {
    primaryPercent = reforecastPercent;
    primaryAmount = categoryReforecastTotal;
    primaryType = "Forecast";
  }

  // Enhanced calculation section
  let calculationText = `Budget: ${formatCurrencyExcelStyle(categoryBudgetTotal)} (${budgetPercent.toFixed(1)}%)
${categoryActualTotal > 0 ? `Actual: ${formatCurrencyExcelStyle(categoryActualTotal)} (${actualPercent.toFixed(1)}%)` : ''}
${categoryReforecastTotal > 0 ? `Forecast: ${formatCurrencyExcelStyle(categoryReforecastTotal)} (${reforecastPercent.toFixed(1)}%)` : ''}
${category.adjustments !== 0 ? `Adjustments: ${formatCurrencyExcelStyle(category.adjustments)}` : ''}`;

  // Add allocation breakdown if allocations exist for this category
  if (allAllocations && primaryAmount > 0) {
    const allocation = allAllocations.find(a => a.categoryId === category.categoryId && a.month === month);
    
    if (allocation && (allocation.supportAmount > 0 || allocation.rdAmount > 0)) {
      const totalAllocation = allocation.supportAmount + allocation.rdAmount;
      const unallocated = primaryAmount - totalAllocation;
      
      calculationText += `

--- Support/R&D Allocation ---
Support: ${formatCurrencyExcelStyle(allocation.supportAmount)}
R&D: ${formatCurrencyExcelStyle(allocation.rdAmount)}
Total Allocated: ${formatCurrencyExcelStyle(totalAllocation)}
Unallocated: ${formatCurrencyExcelStyle(unallocated)}`;
    }
  }

  return {
    definition: `${category.categoryName} allocation for ${monthName}`,
    interpretation: `This category represents ${primaryPercent.toFixed(1)}% of total ${parentGroupName} ${primaryType.toLowerCase()} for ${monthName}, with ${formatCurrencyExcelStyle(primaryAmount)} allocated`,
    formula: `Category ${primaryType} / ${parentGroupName} Total ${primaryType} × 100`,
    calculation: calculationText
  };
};