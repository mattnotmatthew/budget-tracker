import { VendorData, VendorTracking, BudgetState } from "../../../../../types";


export interface BillingAnalysisData {
  billingTypeDistribution: Array<{
    billingType: string;
    count: number;
    totalBudget: number;
    percentage: number;
  }>;
  cashFlowImpact: {
    monthlyCommitments: number;
    quarterlyCommitments: number;
    annualCommitments: number;
    oneTimeCommitments: number;
  };
  budgetStatusAnalysis: {
    inBudgetCount: number;
    offBudgetCount: number;
    inBudgetSpend: number;
    offBudgetSpend: number;
    offBudgetPercentage: number;
  };
}

export interface VendorSpendVelocity {
  totalBudgetAllocated: number;
  totalActualSpend: number;
  utilizationRate: number;
  burnRate: number; // per month
  projectedRunway: number; // months remaining
  categoryVelocity: Array<{
    category: string;
    budgetAllocated: number;
    actualSpend: number;
    utilizationRate: number;
    variance: number;
  }>;
}



/**
 * Analyze billing types and contract structure
 */
export const calculateBillingAnalysis = (
  vendorData: VendorData[],
  selectedYear: number
): BillingAnalysisData => {
  const yearVendors = vendorData.filter(v => v.year === selectedYear);

  // Billing type distribution
  const billingTypes = new Map<string, { count: number; totalBudget: number }>();
  let totalBudget = 0;

  yearVendors.forEach(vendor => {
    const billingType = vendor.billingType || 'Unknown';
    const budget = vendor.budget || 0;
    totalBudget += budget;

    if (!billingTypes.has(billingType)) {
      billingTypes.set(billingType, { count: 0, totalBudget: 0 });
    }
    
    const existing = billingTypes.get(billingType)!;
    existing.count += 1;
    existing.totalBudget += budget;
  });

  const billingTypeDistribution = Array.from(billingTypes.entries()).map(([billingType, data]) => ({
    billingType,
    count: data.count,
    totalBudget: data.totalBudget,
    percentage: totalBudget > 0 ? (data.totalBudget / totalBudget) * 100 : 0
  }));

  // Cash flow impact
  const monthlyCommitments = billingTypes.get('monthly')?.totalBudget || 0;
  const quarterlyCommitments = billingTypes.get('quarterly')?.totalBudget || 0;
  const annualCommitments = billingTypes.get('annual')?.totalBudget || 0;
  const oneTimeCommitments = billingTypes.get('one-time')?.totalBudget || 0;

  // Budget status analysis
  const inBudgetVendors = yearVendors.filter(v => v.inBudget);
  const offBudgetVendors = yearVendors.filter(v => !v.inBudget);
  const inBudgetSpend = inBudgetVendors.reduce((sum, v) => sum + (v.budget || 0), 0);
  const offBudgetSpend = offBudgetVendors.reduce((sum, v) => sum + (v.budget || 0), 0);

  return {
    billingTypeDistribution: billingTypeDistribution.sort((a, b) => b.totalBudget - a.totalBudget),
    cashFlowImpact: {
      monthlyCommitments,
      quarterlyCommitments,
      annualCommitments,
      oneTimeCommitments
    },
    budgetStatusAnalysis: {
      inBudgetCount: inBudgetVendors.length,
      offBudgetCount: offBudgetVendors.length,
      inBudgetSpend,
      offBudgetSpend,
      offBudgetPercentage: totalBudget > 0 ? (offBudgetSpend / totalBudget) * 100 : 0
    }
  };
};

/**
 * Calculate vendor spend velocity and utilization rates
 */
export const calculateVendorSpendVelocity = (
  vendorData: VendorData[],
  vendorTrackingData: VendorTracking[],
  selectedYear: number
): VendorSpendVelocity => {
  const yearVendors = vendorData.filter(v => v.year === selectedYear);
  const yearTracking = vendorTrackingData.filter(v => v.year === selectedYear);

  // Calculate total budgets by category
  const categoryBudgets = new Map<string, number>();
  const categoryActuals = new Map<string, number>();

  yearVendors.forEach(vendor => {
    const category = vendor.financeMappedCategory || 'Unknown';
    categoryBudgets.set(category, (categoryBudgets.get(category) || 0) + (vendor.budget || 0));
  });

  // Calculate actual spend by category from tracking data
  yearTracking.forEach(tracking => {
    const category = tracking.financeMappedCategory || 'Unknown';
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const totalSpend = months.reduce((sum, month) => {
      return sum + (parseFloat(tracking[month as keyof VendorTracking] as string) || 0);
    }, 0);
    categoryActuals.set(category, (categoryActuals.get(category) || 0) + totalSpend);
  });

  const totalBudgetAllocated = yearVendors.reduce((sum, v) => sum + (v.budget || 0), 0);
  const totalActualSpend = Array.from(categoryActuals.values()).reduce((sum, spend) => sum + spend, 0);
  const utilizationRate = totalBudgetAllocated > 0 ? (totalActualSpend / totalBudgetAllocated) * 100 : 0;

  // Calculate burn rate (assuming current month is representative)
  const currentMonth = new Date().getMonth() + 1;
  const monthsElapsed = Math.min(currentMonth, 12);
  const burnRate = monthsElapsed > 0 ? totalActualSpend / monthsElapsed : 0;
  const remainingBudget = totalBudgetAllocated - totalActualSpend;
  const projectedRunway = burnRate > 0 ? remainingBudget / burnRate : Infinity;

  // Category velocity analysis
  const categoryVelocity = Array.from(categoryBudgets.keys()).map(category => {
    const budgetAllocated = categoryBudgets.get(category) || 0;
    const actualSpend = categoryActuals.get(category) || 0;
    const categoryUtilization = budgetAllocated > 0 ? (actualSpend / budgetAllocated) * 100 : 0;
    const variance = actualSpend - budgetAllocated;

    return {
      category,
      budgetAllocated,
      actualSpend,
      utilizationRate: categoryUtilization,
      variance
    };
  }).sort((a, b) => b.actualSpend - a.actualSpend);

  return {
    totalBudgetAllocated,
    totalActualSpend,
    utilizationRate,
    burnRate,
    projectedRunway: Math.min(projectedRunway, 999), // Cap at 999 months for display
    categoryVelocity
  };
};


