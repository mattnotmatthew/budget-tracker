import { BudgetEntry, BudgetCategory, CategorySummary } from "../types";
import { formatCurrencyExcelStyle } from "./currencyFormatter";

export const exportToCSV = (
  entries: BudgetEntry[],
  categories: BudgetCategory[]
): string => {
  const headers = [
    "Category",
    "Year",
    "Quarter",
    "Month",
    "Budget Amount",
    "Actual Amount",
    "Forecast Amount",
    "Variance",
    "Notes",
  ];

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "Unknown";
  };

  const rows = entries.map((entry) => [
    getCategoryName(entry.categoryId),
    entry.year.toString(),
    entry.quarter.toString(),
    entry.month.toString(),
    entry.budgetAmount.toString(),
    (entry.actualAmount || 0).toString(),
    (entry.reforecastAmount || 0).toString(),
    (((entry.actualAmount || 0) - entry.budgetAmount) * -1).toString(),
    entry.notes || "",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((field) => `"${field}"`).join(","))
    .join("\n");

  return csvContent;
};

export const downloadCSV = (
  csvContent: string,
  filename: string = "budget-data.csv"
): void => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const generateSummaryReport = (
  entries: BudgetEntry[],
  categories: BudgetCategory[],
  year: number
): string => {
  const totalBudget = entries.reduce(
    (sum, entry) => sum + entry.budgetAmount,
    0
  );
  const totalActual = entries.reduce(
    (sum, entry) => sum + (entry.actualAmount || 0),
    0
  );
  const totalVariance = (totalActual - totalBudget) * -1;

  const costOfSalesEntries = entries.filter(
    (entry) =>
      categories.find((cat) => cat.id === entry.categoryId)?.parentCategory ===
      "cost-of-sales"
  );
  const opexEntries = entries.filter(
    (entry) =>
      categories.find((cat) => cat.id === entry.categoryId)?.parentCategory ===
      "opex"
  );

  const cosBudget = costOfSalesEntries.reduce(
    (sum, entry) => sum + entry.budgetAmount,
    0
  );
  const cosActual = costOfSalesEntries.reduce(
    (sum, entry) => sum + (entry.actualAmount || 0),
    0
  );
  const opexBudget = opexEntries.reduce(
    (sum, entry) => sum + entry.budgetAmount,
    0
  );
  const opexActual = opexEntries.reduce(
    (sum, entry) => sum + (entry.actualAmount || 0),
    0
  );
  return `
Budget vs Actual Report - ${year}
=================================

SUMMARY:
Total Budget: ${formatCurrencyExcelStyle(totalBudget)}
Total Actual: ${formatCurrencyExcelStyle(totalActual)}
Total Variance: ${formatCurrencyExcelStyle(totalVariance)} (${
    totalBudget ? ((totalVariance / totalBudget) * 100).toFixed(1) : 0
  }%)

COST OF SALES:
Budget: ${formatCurrencyExcelStyle(cosBudget)}
Actual: ${formatCurrencyExcelStyle(cosActual)}
Variance: ${formatCurrencyExcelStyle((cosActual - cosBudget) * -1)}

OPEX:
Budget: ${formatCurrencyExcelStyle(opexBudget)}
Actual: ${formatCurrencyExcelStyle(opexActual)}
Variance: ${formatCurrencyExcelStyle((opexActual - opexBudget) * -1)}

Generated on: ${new Date().toLocaleDateString()}
Total Entries: ${entries.length}
`;
};
