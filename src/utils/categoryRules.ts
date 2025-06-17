import { BudgetEntry } from "../types";

interface CategoryData {
  budgetTotal: number;
  actualTotal: number;
  entries: BudgetEntry[];
}

interface Categories {
  [key: string]: CategoryData;
}

interface InsightData {
  budgetTotal: number;
  actualTotal: number;
  difference: number;
  percentageDifference: number;
  status: string;
}

interface Insights {
  [key: string]: InsightData;
}

export const categorizeBudget = (budgetEntries: BudgetEntry[]): Categories => {
  const categories: Categories = {};

  budgetEntries.forEach((entry) => {
    const { categoryId, budgetAmount, actualAmount } = entry;

    if (!categories[categoryId]) {
      categories[categoryId] = {
        budgetTotal: 0,
        actualTotal: 0,
        entries: [],
      };
    }

    categories[categoryId].budgetTotal += budgetAmount;
    categories[categoryId].actualTotal += actualAmount || 0;
    categories[categoryId].entries.push(entry);
  });

  return categories;
};

export const inferBudgetStatus = (categories: Categories): Insights => {
  const insights: Insights = {};

  for (const [category, data] of Object.entries(categories)) {
    const { budgetTotal, actualTotal } = data;
    const difference = budgetTotal - actualTotal;

    const percentageDifference =
      budgetTotal !== 0 ? (difference / budgetTotal) * 100 : 0;

    insights[category] = {
      budgetTotal,
      actualTotal,
      difference,
      percentageDifference,
      status: difference >= 0 ? "On Track" : "Over Budget",
    };
  }

  return insights;
};
