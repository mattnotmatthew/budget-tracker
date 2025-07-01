import { VendorData, VendorTracking, BudgetState } from "../../../types";

export interface VendorConcentrationData {
  totalVendors: number;
  activeVendors: number;
  topVendorsBySpend: Array<{
    vendorName: string;
    totalSpend: number;
    percentage: number;
    category: string;
  }>;
  concentrationRatio: {
    top5Percentage: number;
    top10Percentage: number;
    herfindahlIndex: number;
  };
  newVsRecurring: {
    newVendors: number;
    recurringVendors: number;
    totalNewSpend: number;
    totalRecurringSpend: number;
  };
}

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

export interface SeasonalPatterns {
  monthlySpendPattern: Array<{
    month: string;
    totalSpend: number;
    vendorCount: number;
    averageSpendPerVendor: number;
  }>;
  quarterlyTrends: Array<{
    quarter: number;
    totalSpend: number;
    vendorCount: number;
    trend: "increasing" | "decreasing" | "stable";
  }>;
  peakSpendingPeriods: Array<{
    period: string;
    spendAmount: number;
    primaryCategories: string[];
  }>;
}

/**
 * Calculate vendor concentration metrics and top vendor analysis
 */
export const calculateVendorConcentration = (
  vendorData: VendorData[],
  vendorTrackingData: VendorTracking[],
  selectedYear: number
): VendorConcentrationData => {
  // Filter data for selected year
  const yearVendors = vendorData.filter(v => v.year === selectedYear);
  const yearTracking = vendorTrackingData.filter(v => v.year === selectedYear);

  // Calculate actual spend per vendor from tracking data
  const vendorSpendMap = new Map<string, number>();
  yearTracking.forEach(tracking => {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const totalSpend = months.reduce((sum, month) => {
      return sum + (parseFloat(tracking[month as keyof VendorTracking] as string) || 0);
    }, 0);
    vendorSpendMap.set(tracking.vendorName, (vendorSpendMap.get(tracking.vendorName) || 0) + totalSpend);
  });

  // Get top vendors by actual spend
  const vendorSpendArray = Array.from(vendorSpendMap.entries()).map(([vendorName, totalSpend]) => {
    const vendorInfo = yearVendors.find(v => v.vendorName === vendorName);
    return {
      vendorName,
      totalSpend,
      percentage: 0, // Will calculate after sorting
      category: vendorInfo?.financeMappedCategory || 'Unknown'
    };
  });

  // Sort by spend and calculate percentages
  vendorSpendArray.sort((a, b) => b.totalSpend - a.totalSpend);
  const totalSpend = vendorSpendArray.reduce((sum, v) => sum + v.totalSpend, 0);
  
  vendorSpendArray.forEach(vendor => {
    vendor.percentage = totalSpend > 0 ? (vendor.totalSpend / totalSpend) * 100 : 0;
  });

  // Calculate concentration ratios
  const top5Spend = vendorSpendArray.slice(0, 5).reduce((sum, v) => sum + v.totalSpend, 0);
  const top10Spend = vendorSpendArray.slice(0, 10).reduce((sum, v) => sum + v.totalSpend, 0);
  
  // Herfindahl Index (sum of squared market shares)
  const herfindahlIndex = vendorSpendArray.reduce((sum, vendor) => {
    const marketShare = vendor.percentage / 100;
    return sum + (marketShare * marketShare);
  }, 0);

  // Determine new vs recurring vendors (simplified - could be enhanced with historical data)
  const currentYearVendorNames = new Set(yearVendors.map(v => v.vendorName));
  const newVendors = yearVendors.filter(v => {
    // Simple heuristic: if vendor has minimal historical budget data, consider new
    return v.budget > 0; // This could be enhanced with actual historical comparison
  });

  const newVendorNames = new Set(newVendors.map(v => v.vendorName));
  const totalNewSpend = Array.from(newVendorNames).reduce((sum, name) => {
    return sum + (vendorSpendMap.get(name) || 0);
  }, 0);

  return {
    totalVendors: yearVendors.length,
    activeVendors: vendorSpendArray.length,
    topVendorsBySpend: vendorSpendArray.slice(0, 10),
    concentrationRatio: {
      top5Percentage: totalSpend > 0 ? (top5Spend / totalSpend) * 100 : 0,
      top10Percentage: totalSpend > 0 ? (top10Spend / totalSpend) * 100 : 0,
      herfindahlIndex: herfindahlIndex * 10000 // Convert to standard HHI scale
    },
    newVsRecurring: {
      newVendors: newVendorNames.size,
      recurringVendors: currentYearVendorNames.size - newVendorNames.size,
      totalNewSpend,
      totalRecurringSpend: totalSpend - totalNewSpend
    }
  };
};

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

/**
 * Analyze seasonal spending patterns
 */
export const calculateSeasonalPatterns = (
  vendorTrackingData: VendorTracking[],
  selectedYear: number
): SeasonalPatterns => {
  const yearTracking = vendorTrackingData.filter(v => v.year === selectedYear);
  
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Monthly spending pattern
  const monthlySpendPattern = months.map((month, index) => {
    let totalSpend = 0;
    const vendorsWithSpend = new Set<string>();

    yearTracking.forEach(tracking => {
      const monthSpend = parseFloat(tracking[month as keyof VendorTracking] as string) || 0;
      if (monthSpend > 0) {
        totalSpend += monthSpend;
        vendorsWithSpend.add(tracking.vendorName);
      }
    });

    return {
      month: monthNames[index],
      totalSpend,
      vendorCount: vendorsWithSpend.size,
      averageSpendPerVendor: vendorsWithSpend.size > 0 ? totalSpend / vendorsWithSpend.size : 0
    };
  });

  // Quarterly trends
  const quarterlyTrends = [1, 2, 3, 4].map(quarter => {
    const quarterMonths = months.slice((quarter - 1) * 3, quarter * 3);
    let totalSpend = 0;
    const vendorsWithSpend = new Set<string>();

    quarterMonths.forEach(month => {
      yearTracking.forEach(tracking => {
        const monthSpend = parseFloat(tracking[month as keyof VendorTracking] as string) || 0;
        if (monthSpend > 0) {
          totalSpend += monthSpend;
          vendorsWithSpend.add(tracking.vendorName);
        }
      });
    });

    // Simple trend calculation (could be enhanced with historical data)
    const trend: "increasing" | "decreasing" | "stable" = "stable"; // Placeholder

    return {
      quarter,
      totalSpend,
      vendorCount: vendorsWithSpend.size,
      trend
    };
  });

  // Peak spending periods (top 3 months)
  const sortedMonths = [...monthlySpendPattern].sort((a, b) => b.totalSpend - a.totalSpend);
  const peakSpendingPeriods = sortedMonths.slice(0, 3).map(period => {
    // Find primary categories for this period
    const monthIndex = monthNames.indexOf(period.month);
    const month = months[monthIndex];
    const categorySpend = new Map<string, number>();

    yearTracking.forEach(tracking => {
      const monthSpend = parseFloat(tracking[month as keyof VendorTracking] as string) || 0;
      if (monthSpend > 0) {
        const category = tracking.financeMappedCategory || 'Unknown';
        categorySpend.set(category, (categorySpend.get(category) || 0) + monthSpend);
      }
    });

    const sortedCategories = Array.from(categorySpend.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);

    return {
      period: period.month,
      spendAmount: period.totalSpend,
      primaryCategories: sortedCategories
    };
  });

  return {
    monthlySpendPattern,
    quarterlyTrends,
    peakSpendingPeriods
  };
};

/**
 * Get vendor optimization opportunities
 */
export const getVendorOptimizationOpportunities = (
  vendorData: VendorData[],
  vendorTrackingData: VendorTracking[],
  selectedYear: number
): Array<{
  type: 'consolidation' | 'underutilized' | 'overbudget' | 'seasonal_optimization';
  category: string;
  description: string;
  potentialSavings: number;
  priority: 'high' | 'medium' | 'low';
}> => {
  const opportunities: Array<{
    type: 'consolidation' | 'underutilized' | 'overbudget' | 'seasonal_optimization';
    category: string;
    description: string;
    potentialSavings: number;
    priority: 'high' | 'medium' | 'low';
  }> = [];

  const yearVendors = vendorData.filter(v => v.year === selectedYear);
  const velocity = calculateVendorSpendVelocity(vendorData, vendorTrackingData, selectedYear);

  // Find consolidation opportunities (categories with multiple vendors)
  const categoryVendorCount = new Map<string, string[]>();
  yearVendors.forEach(vendor => {
    const category = vendor.financeMappedCategory || 'Unknown';
    if (!categoryVendorCount.has(category)) {
      categoryVendorCount.set(category, []);
    }
    categoryVendorCount.get(category)!.push(vendor.vendorName);
  });

  categoryVendorCount.forEach((vendors, category) => {
    if (vendors.length > 2) {
      const categoryData = velocity.categoryVelocity.find(c => c.category === category);
      opportunities.push({
        type: 'consolidation',
        category,
        description: `${vendors.length} vendors in ${category} category could potentially be consolidated`,
        potentialSavings: categoryData ? categoryData.actualSpend * 0.1 : 0, // Assume 10% savings
        priority: vendors.length > 4 ? 'high' : 'medium'
      });
    }
  });

  // Find underutilized vendors (low utilization rate)
  velocity.categoryVelocity.forEach(category => {
    if (category.utilizationRate < 50 && category.budgetAllocated > 10000) {
      opportunities.push({
        type: 'underutilized',
        category: category.category,
        description: `Low utilization (${category.utilizationRate.toFixed(1)}%) suggests potential budget reallocation`,
        potentialSavings: category.budgetAllocated - category.actualSpend,
        priority: category.budgetAllocated > 50000 ? 'high' : 'medium'
      });
    }
  });

  // Find overbudget categories
  velocity.categoryVelocity.forEach(category => {
    if (category.variance > 0 && category.variance > category.budgetAllocated * 0.1) {
      opportunities.push({
        type: 'overbudget',
        category: category.category,
        description: `Spending exceeds budget by ${((category.variance / category.budgetAllocated) * 100).toFixed(1)}%`,
        potentialSavings: -category.variance, // Negative because it's additional cost
        priority: category.variance > category.budgetAllocated * 0.2 ? 'high' : 'medium'
      });
    }
  });

  return opportunities.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};