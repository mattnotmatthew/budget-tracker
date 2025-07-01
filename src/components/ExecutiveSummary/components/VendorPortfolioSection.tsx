import React, { useMemo, useState } from "react";
import { formatCurrencyFull } from "../utils/kpiCalculations";
import { formatCurrencyExcelStyle } from "../../../utils/currencyFormatter";
import { getVendorPortfolioTooltipContent } from "../utils/tooltipUtils";
import {
  calculateVendorConcentration,
  calculateBillingAnalysis,
  calculateVendorSpendVelocity,
  calculateSeasonalPatterns,
  getVendorOptimizationOpportunities,
  VendorConcentrationData,
  BillingAnalysisData,
  VendorSpendVelocity,
  SeasonalPatterns
} from "../utils/vendorPortfolioCalculations";
import {
  calculateVendorRiskScores,
  analyzeDependencies,
  calculateComplianceMetrics,
  getVendorRiskInsights,
  VendorRiskScore,
  DependencyAnalysis,
  ComplianceMetrics
} from "../utils/vendorRiskAnalysis";
import { BudgetState } from "../../../types";

interface VendorPortfolioSectionProps {
  state: BudgetState;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onMouseEnter?: (event: React.MouseEvent, metricType: string) => void;
  onMouseMove?: (event: React.MouseEvent, metricType: string) => void;
  onMouseLeave?: () => void;
}

const VendorPortfolioSection: React.FC<VendorPortfolioSectionProps> = ({
  state,
  isExpanded,
  onToggleExpanded,
  onMouseEnter,
  onMouseMove,
  onMouseLeave
}) => {
  // Sub-section expansion states
  const [expandedSections, setExpandedSections] = useState({
    concentration: false,
    riskAnalysis: false,
    billingAnalysis: false,
    spendVelocity: false,
    seasonalPatterns: false,
    optimization: false,
    compliance: false
  });

  // Calculate all vendor analytics
  const vendorConcentration = useMemo((): VendorConcentrationData => 
    calculateVendorConcentration(
      state.vendorData || [],
      state.vendorTrackingData || [],
      state.selectedYear
    ), [state.vendorData, state.vendorTrackingData, state.selectedYear]
  );

  const vendorRiskScores = useMemo((): VendorRiskScore[] => 
    calculateVendorRiskScores(
      state.vendorData || [],
      state.vendorTrackingData || [],
      state.selectedYear
    ), [state.vendorData, state.vendorTrackingData, state.selectedYear]
  );

  const dependencyAnalysis = useMemo((): DependencyAnalysis => 
    analyzeDependencies(
      state.vendorData || [],
      state.vendorTrackingData || [],
      state.selectedYear
    ), [state.vendorData, state.vendorTrackingData, state.selectedYear]
  );

  const billingAnalysis = useMemo((): BillingAnalysisData => 
    calculateBillingAnalysis(
      state.vendorData || [],
      state.selectedYear
    ), [state.vendorData, state.selectedYear]
  );

  const spendVelocity = useMemo((): VendorSpendVelocity => 
    calculateVendorSpendVelocity(
      state.vendorData || [],
      state.vendorTrackingData || [],
      state.selectedYear
    ), [state.vendorData, state.vendorTrackingData, state.selectedYear]
  );

  const seasonalPatterns = useMemo((): SeasonalPatterns => 
    calculateSeasonalPatterns(
      state.vendorTrackingData || [],
      state.selectedYear
    ), [state.vendorTrackingData, state.selectedYear]
  );

  const complianceMetrics = useMemo((): ComplianceMetrics => 
    calculateComplianceMetrics(
      state.vendorData || [],
      state.vendorTrackingData || [],
      state.selectedYear
    ), [state.vendorData, state.vendorTrackingData, state.selectedYear]
  );

  const optimizationOpportunities = useMemo(() => 
    getVendorOptimizationOpportunities(
      state.vendorData || [],
      state.vendorTrackingData || [],
      state.selectedYear
    ), [state.vendorData, state.vendorTrackingData, state.selectedYear]
  );

  const riskInsights = useMemo(() => 
    getVendorRiskInsights(dependencyAnalysis, complianceMetrics),
    [dependencyAnalysis, complianceMetrics]
  );

  const toggleSubSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getRiskLevelColor = (level: string): string => {
    switch (level) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getComplianceColor = (score: number): string => {
    if (score >= 85) return '#28a745';
    if (score >= 70) return '#ffc107';
    return '#dc3545';
  };

  return (
    <div className="vendor-portfolio-section">
      {/* Main Section Header */}
      <div className="section-header" onClick={onToggleExpanded}>
        <h4 className="section-title">
          <span className="expand-icon">{isExpanded ? "−" : "+"}</span>
          Vendor Portfolio Management
        </h4>
        {!isExpanded && (
          <div className="compact-summary">
            <span className="compact-metric">
              Vendors: <strong>{vendorConcentration.totalVendors}</strong>
            </span>
            <span className="compact-metric">
              Active: <strong>{vendorConcentration.activeVendors}</strong>
            </span>
            <span className="compact-metric">
              Risk Level: <strong style={{ color: getRiskLevelColor(vendorRiskScores[0]?.riskLevel || 'low') }}>
                {vendorRiskScores.filter(v => v.riskLevel === 'high' || v.riskLevel === 'critical').length} High Risk
              </strong>
            </span>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="vendor-portfolio-content">
          {/* Key Insights Summary */}
          <div className="vendor-insights-summary">
            <div className="insight-cards">
              <div className="insight-card">
                <div className="insight-value">{vendorConcentration.totalVendors}</div>
                <div className="insight-label">Total Vendors</div>
              </div>
              <div 
                className="insight-card"
                onMouseEnter={(e) => onMouseEnter && onMouseEnter(e, "vendorConcentration")}
                onMouseMove={(e) => onMouseMove && onMouseMove(e, "vendorConcentration")}
                onMouseLeave={onMouseLeave}
                style={{ cursor: 'pointer' }}
              >
                <div className="insight-value">{vendorConcentration.concentrationRatio.top5Percentage.toFixed(1)}%</div>
                <div className="insight-label">Top 5 Concentration</div>
              </div>
              <div 
                className="insight-card"
                onMouseEnter={(e) => onMouseEnter && onMouseEnter(e, "vendorRisk")}
                onMouseMove={(e) => onMouseMove && onMouseMove(e, "vendorRisk")}
                onMouseLeave={onMouseLeave}
                style={{ cursor: 'pointer' }}
              >
                <div className="insight-value" style={{ color: getRiskLevelColor('high') }}>
                  {dependencyAnalysis.singleSourceDependencies.length}
                </div>
                <div className="insight-label">Single Source Deps</div>
              </div>
              <div 
                className="insight-card"
                onMouseEnter={(e) => onMouseEnter && onMouseEnter(e, "compliance")}
                onMouseMove={(e) => onMouseMove && onMouseMove(e, "compliance")}
                onMouseLeave={onMouseLeave}
                style={{ cursor: 'pointer' }}
              >
                <div className="insight-value" style={{ color: getComplianceColor(complianceMetrics.auditReadiness.score) }}>
                  {complianceMetrics.auditReadiness.score.toFixed(0)}%
                </div>
                <div className="insight-label">Audit Readiness</div>
              </div>
            </div>
          </div>

          {/* Risk Insights */}
          {riskInsights.length > 0 && (
            <div className="vendor-risk-insights">
              <h5>Key Risk Insights</h5>
              <div className="risk-insights-grid">
                {riskInsights.slice(0, 3).map((insight, index) => (
                  <div key={index} className={`risk-insight-card ${insight.type} ${insight.priority}`}>
                    <div className="insight-header">
                      <span className="insight-type">{insight.type.toUpperCase()}</span>
                      <span className={`insight-priority priority-${insight.priority}`}>
                        {insight.priority.toUpperCase()}
                      </span>
                    </div>
                    <div className="insight-title">{insight.title}</div>
                    <div className="insight-description">{insight.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vendor Concentration Analysis */}
          <div className="vendor-subsection">
            <div className="subsection-header" onClick={() => toggleSubSection('concentration')}>
              <h5>
                <span className="expand-icon">{expandedSections.concentration ? "−" : "+"}</span>
                Vendor Concentration Analysis
              </h5>
              <div className="subsection-summary">
                <span>HHI: {vendorConcentration.concentrationRatio.herfindahlIndex.toFixed(0)}</span>
                <span>Top 10: {vendorConcentration.concentrationRatio.top10Percentage.toFixed(1)}%</span>
              </div>
            </div>
            
            {expandedSections.concentration && (
              <div className="subsection-content">
                <div className="concentration-metrics">
                  <div className="metric-card">
                    <div className="metric-title">Concentration Ratios</div>
                    <div className="metric-details">
                      <div>Top 5 Vendors: {vendorConcentration.concentrationRatio.top5Percentage.toFixed(1)}%</div>
                      <div>Top 10 Vendors: {vendorConcentration.concentrationRatio.top10Percentage.toFixed(1)}%</div>
                      <div>Herfindahl Index: {vendorConcentration.concentrationRatio.herfindahlIndex.toFixed(0)}</div>
                    </div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-title">Vendor Portfolio</div>
                    <div className="metric-details">
                      <div>New Vendors: {vendorConcentration.newVsRecurring.newVendors}</div>
                      <div>Recurring Vendors: {vendorConcentration.newVsRecurring.recurringVendors}</div>
                      <div>New Vendor Spend: {formatCurrencyFull(vendorConcentration.newVsRecurring.totalNewSpend)}</div>
                    </div>
                  </div>
                </div>

                <div className="top-vendors-table">
                  <h6>Top Vendors by Spend</h6>
                  <table>
                    <thead>
                      <tr>
                        <th>Vendor</th>
                        <th>Category</th>
                        <th>Total Spend</th>
                        <th>% of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorConcentration.topVendorsBySpend.slice(0, 10).map((vendor, index) => (
                        <tr key={index}>
                          <td>{vendor.vendorName}</td>
                          <td>{vendor.category}</td>
                          <td>{formatCurrencyFull(vendor.totalSpend)}</td>
                          <td>{vendor.percentage.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Risk Analysis */}
          <div className="vendor-subsection">
            <div className="subsection-header" onClick={() => toggleSubSection('riskAnalysis')}>
              <h5>
                <span className="expand-icon">{expandedSections.riskAnalysis ? "−" : "+"}</span>
                Risk Analysis & Dependencies
              </h5>
              <div className="subsection-summary">
                <span>Critical: {vendorRiskScores.filter(v => v.riskLevel === 'critical').length}</span>
                <span>High Risk: {vendorRiskScores.filter(v => v.riskLevel === 'high').length}</span>
              </div>
            </div>
            
            {expandedSections.riskAnalysis && (
              <div className="subsection-content">
                <div className="risk-overview">
                  <div className="risk-distribution">
                    <h6>Risk Distribution</h6>
                    <div className="risk-levels">
                      {['critical', 'high', 'medium', 'low'].map(level => {
                        const count = vendorRiskScores.filter(v => v.riskLevel === level).length;
                        return (
                          <div key={level} className="risk-level-item">
                            <span className="risk-indicator" style={{ backgroundColor: getRiskLevelColor(level) }}></span>
                            <span className="risk-label">{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                            <span className="risk-count">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="single-source-deps">
                    <h6>Single Source Dependencies</h6>
                    <div className="deps-list">
                      {dependencyAnalysis.singleSourceDependencies.map((dep, index) => (
                        <div key={index} className="dep-item">
                          <div className="dep-category">{dep.category}</div>
                          <div className="dep-vendor">{dep.vendorName}</div>
                          <div className="dep-amount">{formatCurrencyFull(dep.spendAmount)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="high-risk-vendors">
                  <h6>High Risk Vendors</h6>
                  <table>
                    <thead>
                      <tr>
                        <th>Vendor</th>
                        <th>Risk Score</th>
                        <th>Risk Level</th>
                        <th>Primary Risk Factors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorRiskScores.filter(v => v.riskLevel === 'critical' || v.riskLevel === 'high').slice(0, 5).map((vendor, index) => (
                        <tr key={index}>
                          <td>{vendor.vendorName}</td>
                          <td>{vendor.overallRiskScore.toFixed(0)}</td>
                          <td>
                            <span className="risk-badge" style={{ backgroundColor: getRiskLevelColor(vendor.riskLevel) }}>
                              {vendor.riskLevel}
                            </span>
                          </td>
                          <td>
                            {Object.entries(vendor.riskFactors)
                              .sort(([,a], [,b]) => b - a)
                              .slice(0, 2)
                              .map(([factor]) => factor.replace(/([A-Z])/g, ' $1').toLowerCase())
                              .join(', ')
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Billing & Contract Analysis */}
          <div className="vendor-subsection">
            <div className="subsection-header" onClick={() => toggleSubSection('billingAnalysis')}>
              <h5>
                <span className="expand-icon">{expandedSections.billingAnalysis ? "−" : "+"}</span>
                Billing & Contract Analysis
              </h5>
              <div className="subsection-summary">
                <span>Monthly: {formatCurrencyFull(billingAnalysis.cashFlowImpact.monthlyCommitments)}</span>
                <span>Off-Budget: {billingAnalysis.budgetStatusAnalysis.offBudgetPercentage.toFixed(1)}%</span>
              </div>
            </div>
            
            {expandedSections.billingAnalysis && (
              <div className="subsection-content">
                <div className="billing-overview">
                  <div className="billing-distribution">
                    <h6>Billing Type Distribution</h6>
                    <table>
                      <thead>
                        <tr>
                          <th>Billing Type</th>
                          <th>Count</th>
                          <th>Total Budget</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billingAnalysis.billingTypeDistribution.map((billing, index) => (
                          <tr key={index}>
                            <td>{billing.billingType}</td>
                            <td>{billing.count}</td>
                            <td>{formatCurrencyFull(billing.totalBudget)}</td>
                            <td>{billing.percentage.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="cash-flow-impact">
                    <h6>Cash Flow Commitments</h6>
                    <div className="commitment-cards">
                      <div className="commitment-card">
                        <div className="commitment-value">{formatCurrencyFull(billingAnalysis.cashFlowImpact.monthlyCommitments)}</div>
                        <div className="commitment-label">Monthly</div>
                      </div>
                      <div className="commitment-card">
                        <div className="commitment-value">{formatCurrencyFull(billingAnalysis.cashFlowImpact.quarterlyCommitments)}</div>
                        <div className="commitment-label">Quarterly</div>
                      </div>
                      <div className="commitment-card">
                        <div className="commitment-value">{formatCurrencyFull(billingAnalysis.cashFlowImpact.annualCommitments)}</div>
                        <div className="commitment-label">Annual</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="budget-status">
                  <h6>Budget Status Analysis</h6>
                  <div className="budget-metrics">
                    <div className="budget-metric">
                      <span>In-Budget Vendors:</span>
                      <span>{billingAnalysis.budgetStatusAnalysis.inBudgetCount} ({((billingAnalysis.budgetStatusAnalysis.inBudgetCount / (billingAnalysis.budgetStatusAnalysis.inBudgetCount + billingAnalysis.budgetStatusAnalysis.offBudgetCount)) * 100).toFixed(1)}%)</span>
                    </div>
                    <div className="budget-metric">
                      <span>Off-Budget Spend:</span>
                      <span>{formatCurrencyFull(billingAnalysis.budgetStatusAnalysis.offBudgetSpend)} ({billingAnalysis.budgetStatusAnalysis.offBudgetPercentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Spend Velocity */}
          <div className="vendor-subsection">
            <div className="subsection-header" onClick={() => toggleSubSection('spendVelocity')}>
              <h5>
                <span className="expand-icon">{expandedSections.spendVelocity ? "−" : "+"}</span>
                Spend Velocity & Utilization
              </h5>
              <div className="subsection-summary">
                <span>Utilization: {spendVelocity.utilizationRate.toFixed(1)}%</span>
                <span>Runway: {spendVelocity.projectedRunway < 999 ? `${spendVelocity.projectedRunway.toFixed(1)} months` : '∞'}</span>
              </div>
            </div>
            
            {expandedSections.spendVelocity && (
              <div className="subsection-content">
                <div className="velocity-overview">
                  <div className="velocity-metrics">
                    <div 
                      className="velocity-card"
                      onMouseEnter={(e) => onMouseEnter && onMouseEnter(e, "velocityTotalBudget")}
                      onMouseMove={(e) => onMouseMove && onMouseMove(e, "velocityTotalBudget")}
                      onMouseLeave={onMouseLeave}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="velocity-value">{formatCurrencyFull(spendVelocity.totalBudgetAllocated)}</div>
                      <div className="velocity-label">Total Budget</div>
                    </div>
                    <div 
                      className="velocity-card"
                      onMouseEnter={(e) => onMouseEnter && onMouseEnter(e, "velocityActualSpend")}
                      onMouseMove={(e) => onMouseMove && onMouseMove(e, "velocityActualSpend")}
                      onMouseLeave={onMouseLeave}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="velocity-value">{formatCurrencyFull(spendVelocity.totalActualSpend)}</div>
                      <div className="velocity-label">Actual Spend</div>
                    </div>
                    <div 
                      className="velocity-card"
                      onMouseEnter={(e) => onMouseEnter && onMouseEnter(e, "velocityUtilizationRate")}
                      onMouseMove={(e) => onMouseMove && onMouseMove(e, "velocityUtilizationRate")}
                      onMouseLeave={onMouseLeave}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="velocity-value">{spendVelocity.utilizationRate.toFixed(1)}%</div>
                      <div className="velocity-label">Utilization Rate</div>
                    </div>
                    <div 
                      className="velocity-card"
                      onMouseEnter={(e) => onMouseEnter && onMouseEnter(e, "velocityBurnRate")}
                      onMouseMove={(e) => onMouseMove && onMouseMove(e, "velocityBurnRate")}
                      onMouseLeave={onMouseLeave}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="velocity-value">{formatCurrencyFull(spendVelocity.burnRate)}</div>
                      <div className="velocity-label">Monthly Burn</div>
                    </div>
                  </div>
                </div>

                <div className="category-velocity">
                  <h6>Category Velocity Analysis</h6>
                  <table>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Budget</th>
                        <th>Actual</th>
                        <th>Utilization</th>
                        <th>Variance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {spendVelocity.categoryVelocity.slice(0, 8).map((category, index) => (
                        <tr key={index}>
                          <td>{category.category}</td>
                          <td>{formatCurrencyFull(category.budgetAllocated)}</td>
                          <td>{formatCurrencyFull(category.actualSpend)}</td>
                          <td>
                            <span className={`utilization-rate ${category.utilizationRate > 100 ? 'over' : category.utilizationRate < 50 ? 'under' : 'normal'}`}>
                              {category.utilizationRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className={category.variance > 0 ? 'positive' : 'negative'}>
                            {category.variance >= 0 ? '+' : ''}{formatCurrencyFull(category.variance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Optimization Opportunities */}
          <div className="vendor-subsection">
            <div className="subsection-header" onClick={() => toggleSubSection('optimization')}>
              <h5>
                <span className="expand-icon">{expandedSections.optimization ? "−" : "+"}</span>
                Optimization Opportunities
              </h5>
              <div className="subsection-summary">
                <span>{optimizationOpportunities.length} Opportunities</span>
                <span>Potential Savings: {formatCurrencyFull(optimizationOpportunities.reduce((sum, opp) => sum + Math.max(0, opp.potentialSavings), 0))}</span>
              </div>
            </div>
            
            {expandedSections.optimization && (
              <div className="subsection-content">
                <div className="optimization-list">
                  {optimizationOpportunities.map((opportunity, index) => (
                    <div key={index} className={`optimization-card ${opportunity.type} priority-${opportunity.priority}`}>
                      <div className="opp-header">
                        <span className="opp-type">{opportunity.type.replace('_', ' ').toUpperCase()}</span>
                        <span className={`opp-priority priority-${opportunity.priority}`}>{opportunity.priority.toUpperCase()}</span>
                      </div>
                      <div className="opp-category">{opportunity.category}</div>
                      <div className="opp-description">{opportunity.description}</div>
                      <div className="opp-savings">
                        Potential Impact: {opportunity.potentialSavings >= 0 ? '+' : ''}{formatCurrencyFull(opportunity.potentialSavings)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Compliance & Data Quality */}
          <div className="vendor-subsection">
            <div className="subsection-header" onClick={() => toggleSubSection('compliance')}>
              <h5>
                <span className="expand-icon">{expandedSections.compliance ? "−" : "+"}</span>
                Compliance & Data Quality
              </h5>
              <div className="subsection-summary">
                <span>Audit Score: {complianceMetrics.auditReadiness.score.toFixed(0)}%</span>
                <span>Data Quality: {complianceMetrics.dataCompleteness.vendorDataCompleteness.toFixed(0)}%</span>
              </div>
            </div>
            
            {expandedSections.compliance && (
              <div className="subsection-content">
                <div className="compliance-overview">
                  <div className="compliance-scores">
                    <div className="score-card">
                      <div className="score-value" style={{ color: getComplianceColor(complianceMetrics.dataCompleteness.vendorDataCompleteness) }}>
                        {complianceMetrics.dataCompleteness.vendorDataCompleteness.toFixed(0)}%
                      </div>
                      <div className="score-label">Vendor Data Completeness</div>
                    </div>
                    <div className="score-card">
                      <div className="score-value" style={{ color: getComplianceColor(complianceMetrics.dataCompleteness.trackingDataCompleteness) }}>
                        {complianceMetrics.dataCompleteness.trackingDataCompleteness.toFixed(0)}%
                      </div>
                      <div className="score-label">Tracking Data Completeness</div>
                    </div>
                    <div className="score-card">
                      <div className="score-value" style={{ color: getComplianceColor(complianceMetrics.processAdherence.budgetComplianceRate) }}>
                        {complianceMetrics.processAdherence.budgetComplianceRate.toFixed(0)}%
                      </div>
                      <div className="score-label">Budget Compliance</div>
                    </div>
                    <div className="score-card">
                      <div className="score-value" style={{ color: getComplianceColor(complianceMetrics.auditReadiness.score) }}>
                        {complianceMetrics.auditReadiness.score.toFixed(0)}%
                      </div>
                      <div className="score-label">Audit Readiness</div>
                    </div>
                  </div>
                </div>

                {complianceMetrics.auditReadiness.findings.length > 0 && (
                  <div className="audit-findings">
                    <h6>Audit Findings</h6>
                    <div className="findings-list">
                      {complianceMetrics.auditReadiness.findings.map((finding, index) => (
                        <div key={index} className={`finding-item severity-${finding.severity}`}>
                          <div className="finding-header">
                            <span className="finding-category">{finding.category}</span>
                            <span className={`finding-severity severity-${finding.severity}`}>{finding.severity.toUpperCase()}</span>
                          </div>
                          <div className="finding-description">{finding.description}</div>
                          <div className="finding-remediation">Remediation: {finding.remediation}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorPortfolioSection;