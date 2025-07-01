import { VendorData, VendorTracking } from "../../../types";

export interface VendorRiskScore {
  vendorName: string;
  category: string;
  overallRiskScore: number; // 0-100 scale
  riskFactors: {
    concentrationRisk: number; // High percentage of total spend
    budgetVarianceRisk: number; // Significant over/under spend
    contractRisk: number; // Single source dependency
    paymentVolatilityRisk: number; // Inconsistent monthly payments
    categoryDiversificationRisk: number; // Vendor spans multiple critical categories
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export interface DependencyAnalysis {
  criticalVendors: VendorRiskScore[];
  singleSourceDependencies: Array<{
    category: string;
    vendorName: string;
    spendAmount: number;
    riskMitigation: string[];
  }>;
  categoryRiskProfile: Array<{
    category: string;
    vendorCount: number;
    concentrationIndex: number;
    riskLevel: 'low' | 'medium' | 'high';
    topVendorDependency: number; // Percentage of category spend in top vendor
  }>;
  contractRenewalRisks: Array<{
    vendorName: string;
    category: string;
    estimatedRenewalPeriod: string;
    spendAmount: number;
    riskImpact: 'low' | 'medium' | 'high';
  }>;
}

export interface ComplianceMetrics {
  dataCompleteness: {
    vendorDataCompleteness: number; // Percentage of required fields filled
    trackingDataCompleteness: number; // Percentage of months with data
    missingDataPoints: Array<{
      type: 'vendor_info' | 'tracking_data' | 'budget_allocation';
      description: string;
      impact: 'low' | 'medium' | 'high';
    }>;
  };
  processAdherence: {
    budgetComplianceRate: number; // Percentage of vendors within budget guidelines
    approvalWorkflowCompliance: number; // Estimated based on budget status
    contractManagementScore: number; // Based on billing type standardization
  };
  auditReadiness: {
    score: number; // 0-100
    findings: Array<{
      severity: 'low' | 'medium' | 'high';
      category: string;
      description: string;
      remediation: string;
    }>;
  };
}

/**
 * Calculate comprehensive risk scores for all vendors
 */
export const calculateVendorRiskScores = (
  vendorData: VendorData[],
  vendorTrackingData: VendorTracking[],
  selectedYear: number
): VendorRiskScore[] => {
  const yearVendors = vendorData.filter(v => v.year === selectedYear);
  const yearTracking = vendorTrackingData.filter(v => v.year === selectedYear);

  // Calculate total spend for concentration analysis
  const vendorSpendMap = new Map<string, number>();
  const vendorMonthlySpend = new Map<string, number[]>();

  yearTracking.forEach(tracking => {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthlyAmounts: number[] = [];
    let totalSpend = 0;

    months.forEach(month => {
      const amount = parseFloat(tracking[month as keyof VendorTracking] as string) || 0;
      monthlyAmounts.push(amount);
      totalSpend += amount;
    });

    vendorSpendMap.set(tracking.vendorName, (vendorSpendMap.get(tracking.vendorName) || 0) + totalSpend);
    vendorMonthlySpend.set(tracking.vendorName, monthlyAmounts);
  });

  const totalSpend = Array.from(vendorSpendMap.values()).reduce((sum, spend) => sum + spend, 0);

  // Calculate risk scores for each vendor
  const riskScores: VendorRiskScore[] = [];

  const processedVendors = new Set<string>();
  
  [...yearVendors, ...yearTracking].forEach(vendor => {
    const vendorName = vendor.vendorName;
    if (processedVendors.has(vendorName)) return;
    processedVendors.add(vendorName);

    const vendorInfo = yearVendors.find(v => v.vendorName === vendorName);
    const vendorTracking = yearTracking.filter(t => t.vendorName === vendorName);
    const vendorSpend = vendorSpendMap.get(vendorName) || 0;
    const monthlySpend = vendorMonthlySpend.get(vendorName) || [];

    // 1. Concentration Risk (0-30 points)
    const spendPercentage = totalSpend > 0 ? (vendorSpend / totalSpend) * 100 : 0;
    const concentrationRisk = Math.min(spendPercentage * 3, 30); // Scale to 30 max

    // 2. Budget Variance Risk (0-25 points)
    const budgetAmount = vendorInfo?.budget || 0;
    const variance = Math.abs(vendorSpend - budgetAmount);
    const variancePercentage = budgetAmount > 0 ? (variance / budgetAmount) * 100 : 0;
    const budgetVarianceRisk = Math.min(variancePercentage / 4, 25); // Scale to 25 max

    // 3. Contract Risk (0-20 points) - Single source dependency
    const category = vendorInfo?.financeMappedCategory || vendorTracking[0]?.financeMappedCategory || 'Unknown';
    const categoryVendors = yearVendors.filter(v => v.financeMappedCategory === category);
    const contractRisk = categoryVendors.length === 1 ? 20 : Math.max(0, 20 - (categoryVendors.length * 3));

    // 4. Payment Volatility Risk (0-15 points)
    const monthlyVariance = calculateMonthlyVariance(monthlySpend);
    const avgMonthlySpend = monthlySpend.length > 0 ? vendorSpend / 12 : 0;
    const volatilityCoeff = avgMonthlySpend > 0 ? monthlyVariance / avgMonthlySpend : 0;
    const paymentVolatilityRisk = Math.min(volatilityCoeff * 50, 15); // Scale to 15 max

    // 5. Category Diversification Risk (0-10 points)
    const vendorCategories = new Set(yearTracking.filter(t => t.vendorName === vendorName).map(t => t.financeMappedCategory));
    const categoryDiversificationRisk = Math.min((vendorCategories.size - 1) * 5, 10);

    const overallRiskScore = concentrationRisk + budgetVarianceRisk + contractRisk + paymentVolatilityRisk + categoryDiversificationRisk;

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (overallRiskScore >= 80) riskLevel = 'critical';
    else if (overallRiskScore >= 60) riskLevel = 'high';
    else if (overallRiskScore >= 40) riskLevel = 'medium';
    else riskLevel = 'low';

    // Generate recommendations
    const recommendations: string[] = [];
    if (concentrationRisk > 15) recommendations.push('Consider diversifying vendor portfolio to reduce concentration risk');
    if (budgetVarianceRisk > 15) recommendations.push('Review budget allocation and spend controls');
    if (contractRisk > 15) recommendations.push('Identify alternative vendors for this category');
    if (paymentVolatilityRisk > 10) recommendations.push('Stabilize payment patterns or review contract terms');
    if (categoryDiversificationRisk > 5) recommendations.push('Consider vendor consolidation or clearer category assignments');

    riskScores.push({
      vendorName,
      category,
      overallRiskScore,
      riskFactors: {
        concentrationRisk,
        budgetVarianceRisk,
        contractRisk,
        paymentVolatilityRisk,
        categoryDiversificationRisk
      },
      riskLevel,
      recommendations
    });
  });

  return riskScores.sort((a, b) => b.overallRiskScore - a.overallRiskScore);
};

/**
 * Analyze vendor dependencies and single points of failure
 */
export const analyzeDependencies = (
  vendorData: VendorData[],
  vendorTrackingData: VendorTracking[],
  selectedYear: number
): DependencyAnalysis => {
  const yearVendors = vendorData.filter(v => v.year === selectedYear);
  const riskScores = calculateVendorRiskScores(vendorData, vendorTrackingData, selectedYear);

  // Critical vendors (high risk score or high spend concentration)
  const criticalVendors = riskScores.filter(vendor => 
    vendor.riskLevel === 'critical' || vendor.riskLevel === 'high'
  ).slice(0, 10);

  // Single source dependencies
  const categoryVendorMap = new Map<string, Array<{ vendorName: string; spendAmount: number }>>();
  
  riskScores.forEach(vendor => {
    if (!categoryVendorMap.has(vendor.category)) {
      categoryVendorMap.set(vendor.category, []);
    }
    
    // Get spend amount from tracking data
    const vendorTracking = vendorTrackingData.filter(t => 
      t.vendorName === vendor.vendorName && t.year === selectedYear
    );
    const spendAmount = vendorTracking.reduce((sum, tracking) => {
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      return sum + months.reduce((monthSum, month) => {
        return monthSum + (parseFloat(tracking[month as keyof VendorTracking] as string) || 0);
      }, 0);
    }, 0);

    categoryVendorMap.get(vendor.category)!.push({
      vendorName: vendor.vendorName,
      spendAmount
    });
  });

  const singleSourceDependencies = Array.from(categoryVendorMap.entries())
    .filter(([_, vendors]) => vendors.length === 1)
    .map(([category, vendors]) => ({
      category,
      vendorName: vendors[0].vendorName,
      spendAmount: vendors[0].spendAmount,
      riskMitigation: [
        'Identify backup vendor options',
        'Negotiate contract terms for service continuity',
        'Develop internal capabilities as alternative',
        'Create vendor performance monitoring'
      ]
    }));

  // Category risk profile
  const categoryRiskProfile = Array.from(categoryVendorMap.entries()).map(([category, vendors]) => {
    const totalCategorySpend = vendors.reduce((sum, v) => sum + v.spendAmount, 0);
    const topVendorSpend = Math.max(...vendors.map(v => v.spendAmount));
    const topVendorDependency = totalCategorySpend > 0 ? (topVendorSpend / totalCategorySpend) * 100 : 0;
    
    // Calculate Herfindahl index for concentration
    const concentrationIndex = vendors.reduce((sum, vendor) => {
      const marketShare = totalCategorySpend > 0 ? vendor.spendAmount / totalCategorySpend : 0;
      return sum + (marketShare * marketShare);
    }, 0);

    let riskLevel: 'low' | 'medium' | 'high';
    if (vendors.length === 1 || topVendorDependency > 80) riskLevel = 'high';
    else if (vendors.length <= 2 || topVendorDependency > 60) riskLevel = 'medium';
    else riskLevel = 'low';

    return {
      category,
      vendorCount: vendors.length,
      concentrationIndex: concentrationIndex * 10000, // Standard HHI scale
      riskLevel,
      topVendorDependency
    };
  });

  // Contract renewal risks (simplified estimation)
  const contractRenewalRisks = criticalVendors.map(vendor => {
    const vendorInfo = yearVendors.find(v => v.vendorName === vendor.vendorName);
    const billingType = vendorInfo?.billingType || 'unknown';
    
    let estimatedRenewalPeriod: string;
    let riskImpact: 'low' | 'medium' | 'high';

    switch (billingType) {
      case 'annual':
        estimatedRenewalPeriod = 'Within 12 months';
        riskImpact = vendor.riskLevel === 'critical' ? 'high' : 'medium';
        break;
      case 'quarterly':
        estimatedRenewalPeriod = 'Within 3 months';
        riskImpact = 'medium';
        break;
      case 'monthly':
        estimatedRenewalPeriod = 'Monthly';
        riskImpact = 'low';
        break;
      default:
        estimatedRenewalPeriod = 'Unknown';
        riskImpact = 'medium';
    }

    return {
      vendorName: vendor.vendorName,
      category: vendor.category,
      estimatedRenewalPeriod,
      spendAmount: vendor.riskFactors.concentrationRisk * 1000, // Rough estimate
      riskImpact
    };
  }).slice(0, 5);

  return {
    criticalVendors,
    singleSourceDependencies,
    categoryRiskProfile: categoryRiskProfile.sort((a, b) => b.concentrationIndex - a.concentrationIndex),
    contractRenewalRisks
  };
};

/**
 * Calculate compliance and operational health metrics
 */
export const calculateComplianceMetrics = (
  vendorData: VendorData[],
  vendorTrackingData: VendorTracking[],
  selectedYear: number
): ComplianceMetrics => {
  const yearVendors = vendorData.filter(v => v.year === selectedYear);
  const yearTracking = vendorTrackingData.filter(v => v.year === selectedYear);

  // Data completeness analysis
  const requiredVendorFields = ['vendorName', 'financeMappedCategory', 'billingType', 'budget'];
  let completeVendorRecords = 0;
  const missingDataPoints: Array<{
    type: 'vendor_info' | 'tracking_data' | 'budget_allocation';
    description: string;
    impact: 'low' | 'medium' | 'high';
  }> = [];

  yearVendors.forEach(vendor => {
    const missingFields = requiredVendorFields.filter(field => 
      !vendor[field as keyof VendorData] || vendor[field as keyof VendorData] === ''
    );
    
    if (missingFields.length === 0) {
      completeVendorRecords++;
    } else {
      missingDataPoints.push({
        type: 'vendor_info',
        description: `${vendor.vendorName}: Missing ${missingFields.join(', ')}`,
        impact: missingFields.includes('budget') ? 'high' : 'medium'
      });
    }
  });

  const vendorDataCompleteness = yearVendors.length > 0 ? (completeVendorRecords / yearVendors.length) * 100 : 0;

  // Tracking data completeness
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  let totalTrackingPoints = 0;
  let completeTrackingPoints = 0;

  yearTracking.forEach(tracking => {
    months.forEach(month => {
      totalTrackingPoints++;
      const value = tracking[month as keyof VendorTracking] as string;
      if (value && value !== '' && value !== '0') {
        completeTrackingPoints++;
      }
    });
  });

  const trackingDataCompleteness = totalTrackingPoints > 0 ? (completeTrackingPoints / totalTrackingPoints) * 100 : 0;

  // Budget compliance analysis
  const inBudgetVendors = yearVendors.filter(v => v.inBudget).length;
  const budgetComplianceRate = yearVendors.length > 0 ? (inBudgetVendors / yearVendors.length) * 100 : 0;

  // Approval workflow compliance (estimated based on budget status and data quality)
  const approvalWorkflowCompliance = (budgetComplianceRate + vendorDataCompleteness) / 2;

  // Contract management score (based on billing type standardization)
  const billingTypes = new Set(yearVendors.map(v => v.billingType).filter(Boolean));
  const standardBillingTypes = ['monthly', 'quarterly', 'annual', 'one-time'];
  const standardizedBillingCount = yearVendors.filter(v => 
    standardBillingTypes.includes(v.billingType)
  ).length;
  const contractManagementScore = yearVendors.length > 0 ? (standardizedBillingCount / yearVendors.length) * 100 : 0;

  // Audit readiness scoring
  const auditFindings: Array<{
    severity: 'low' | 'medium' | 'high';
    category: string;
    description: string;
    remediation: string;
  }> = [];

  if (vendorDataCompleteness < 80) {
    auditFindings.push({
      severity: 'high',
      category: 'Data Quality',
      description: 'Incomplete vendor master data records',
      remediation: 'Complete missing vendor information fields'
    });
  }

  if (trackingDataCompleteness < 70) {
    auditFindings.push({
      severity: 'medium',
      category: 'Tracking Accuracy',
      description: 'Gaps in monthly vendor tracking data',
      remediation: 'Implement systematic monthly tracking processes'
    });
  }

  if (budgetComplianceRate < 85) {
    auditFindings.push({
      severity: 'medium',
      category: 'Budget Controls',
      description: 'High percentage of off-budget vendor spending',
      remediation: 'Strengthen budget approval and monitoring processes'
    });
  }

  const auditScore = Math.max(0, 100 - (auditFindings.length * 15) - 
    (auditFindings.filter(f => f.severity === 'high').length * 10));

  return {
    dataCompleteness: {
      vendorDataCompleteness,
      trackingDataCompleteness,
      missingDataPoints: missingDataPoints.slice(0, 10) // Limit to top 10
    },
    processAdherence: {
      budgetComplianceRate,
      approvalWorkflowCompliance,
      contractManagementScore
    },
    auditReadiness: {
      score: auditScore,
      findings: auditFindings
    }
  };
};

/**
 * Helper function to calculate monthly variance
 */
function calculateMonthlyVariance(monthlyAmounts: number[]): number {
  if (monthlyAmounts.length === 0) return 0;
  
  const mean = monthlyAmounts.reduce((sum, amount) => sum + amount, 0) / monthlyAmounts.length;
  const variance = monthlyAmounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / monthlyAmounts.length;
  
  return Math.sqrt(variance); // Standard deviation
}

/**
 * Get actionable insights based on risk analysis
 */
export const getVendorRiskInsights = (
  dependencyAnalysis: DependencyAnalysis,
  complianceMetrics: ComplianceMetrics
): Array<{
  type: 'risk' | 'opportunity' | 'compliance';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionItems: string[];
}> => {
  const insights: Array<{
    type: 'risk' | 'opportunity' | 'compliance';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actionItems: string[];
  }> = [];

  // High-risk vendor insights
  if (dependencyAnalysis.criticalVendors.length > 0) {
    insights.push({
      type: 'risk',
      priority: 'high',
      title: 'Critical Vendor Dependencies Identified',
      description: `${dependencyAnalysis.criticalVendors.length} vendors pose significant risk to operations`,
      actionItems: [
        'Develop contingency plans for critical vendors',
        'Negotiate improved contract terms',
        'Identify backup vendor options',
        'Implement enhanced monitoring'
      ]
    });
  }

  // Single source dependency risks
  if (dependencyAnalysis.singleSourceDependencies.length > 0) {
    insights.push({
      type: 'risk',
      priority: 'high',
      title: 'Single Source Dependencies',
      description: `${dependencyAnalysis.singleSourceDependencies.length} categories rely on single vendors`,
      actionItems: [
        'Diversify vendor portfolio in critical categories',
        'Develop alternative sourcing strategies',
        'Create vendor performance benchmarks'
      ]
    });
  }

  // Data quality opportunities
  if (complianceMetrics.dataCompleteness.vendorDataCompleteness < 85) {
    insights.push({
      type: 'compliance',
      priority: 'medium',
      title: 'Data Quality Improvement Needed',
      description: `Vendor data completeness at ${complianceMetrics.dataCompleteness.vendorDataCompleteness.toFixed(1)}%`,
      actionItems: [
        'Complete missing vendor information',
        'Implement data validation rules',
        'Establish regular data quality reviews'
      ]
    });
  }

  // Budget compliance opportunities
  if (complianceMetrics.processAdherence.budgetComplianceRate < 80) {
    insights.push({
      type: 'compliance',
      priority: 'medium',
      title: 'Budget Process Strengthening Required',
      description: `Budget compliance rate at ${complianceMetrics.processAdherence.budgetComplianceRate.toFixed(1)}%`,
      actionItems: [
        'Strengthen budget approval workflows',
        'Implement spend monitoring alerts',
        'Review off-budget spending patterns'
      ]
    });
  }

  return insights.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};