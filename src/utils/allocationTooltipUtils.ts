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

// Simplified tooltip for individual categories - only shows Support/R&D allocation
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
  const categoryActualTotal = category.actual + category.adjustments;
  
  let calculationText = "";

  // Show allocation breakdown if allocations exist for this category
  if (allAllocations && categoryActualTotal > 0) {
    const allocation = allAllocations.find(a => a.categoryId === category.categoryId && a.month === month);
    
    if (allocation && (allocation.supportAmount > 0 || allocation.rdAmount > 0)) {
      const totalAllocation = allocation.supportAmount + allocation.rdAmount;
      const unallocated = categoryActualTotal - totalAllocation;
      
      calculationText = `Support: ${formatCurrencyExcelStyle(allocation.supportAmount)}
R&D: ${formatCurrencyExcelStyle(allocation.rdAmount)}
Total Allocated: ${formatCurrencyExcelStyle(totalAllocation)}
Unallocated: ${formatCurrencyExcelStyle(unallocated)}`;
    } else {
      calculationText = `No Support/R&D allocation for this category`;
    }
  } else {
    calculationText = `No actual amount or allocations to display`;
  }

  return {
    definition: `${category.categoryName} Support/R&D allocation for ${monthName}`,
    interpretation: `Support and R&D allocation breakdown for ${category.categoryName}`,
    formula: "", // Remove formula section as requested
    calculation: calculationText
  };
};

// New function for parent category tooltips - shows sum of child allocations
export const getParentCategoryAllocationTooltip = (
  parentGroupName: string,
  month: number,
  childCategories: CategorySummary[],
  allAllocations?: any[]
): TooltipContent => {
  const monthName = getMonthName(month);
  
  let totalSupport = 0;
  let totalRD = 0;
  let categoriesWithAllocations = 0;

  if (allAllocations && childCategories) {
    childCategories.forEach(category => {
      const allocation = allAllocations.find(a => a.categoryId === category.categoryId && a.month === month);
      if (allocation && (allocation.supportAmount > 0 || allocation.rdAmount > 0)) {
        totalSupport += allocation.supportAmount;
        totalRD += allocation.rdAmount;
        categoriesWithAllocations++;
      }
    });
  }

  const totalAllocation = totalSupport + totalRD;
  
  let calculationText;
  if (totalAllocation > 0) {
    calculationText = `Support: ${formatCurrencyExcelStyle(totalSupport)}
R&D: ${formatCurrencyExcelStyle(totalRD)}
Total Allocated: ${formatCurrencyExcelStyle(totalAllocation)}
Categories with allocations: ${categoriesWithAllocations}`;
  } else {
    calculationText = `No Support/R&D allocations in ${parentGroupName} subcategories`;
  }

  return {
    definition: `${parentGroupName} Support/R&D allocation summary for ${monthName}`,
    interpretation: `Total Support and R&D allocations across all ${parentGroupName} subcategories`,
    formula: "", // Remove formula section as requested
    calculation: calculationText
  };
};