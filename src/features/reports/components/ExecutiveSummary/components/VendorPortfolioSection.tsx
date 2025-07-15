import React, { useMemo, useState } from "react";
import { formatCurrencyFull } from "../utils/kpiCalculations";
import { formatCurrencyExcelStyle } from "../../../../../utils/currencyFormatter";
import { getVendorPortfolioTooltipContent } from "../utils/tooltipUtils";
import {
  calculateBillingAnalysis,
  calculateVendorSpendVelocity,
  BillingAnalysisData,
  VendorSpendVelocity
} from "../utils/vendorPortfolioCalculations";
import { BudgetState } from "../../../../../types";

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
    billingAnalysis: false,
    spendVelocity: false
  });

  // Calculate vendor analytics
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

  const toggleSubSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };


  return (
    <div className="vendor-portfolio-section">
      {/* Main Section Header */}
      <div className="section-header" onClick={onToggleExpanded}>
        <h4 className="section-title">
          <span className="expand-icon">{isExpanded ? "−" : "+"}</span>
          Vendor Analysis
        </h4>
        {!isExpanded && (
          <div className="compact-summary">
            <span className="compact-metric">
              Utilization: <strong>{spendVelocity.utilizationRate.toFixed(1)}%</strong>
            </span>
            <span className="compact-metric">
              Monthly Burn: <strong>{formatCurrencyFull(spendVelocity.burnRate)}</strong>
            </span>
            <span className="compact-metric">
              Off-Budget: <strong>{billingAnalysis.budgetStatusAnalysis.offBudgetPercentage.toFixed(1)}%</strong>
            </span>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="vendor-portfolio-content">



          {/* Billing & Contract Analysis */}
          <div className="vendor-subsection">
            <div className="subsection-header" onClick={() => toggleSubSection('billingAnalysis')}>
              <h5>
                <span className="expand-icon">{expandedSections.billingAnalysis ? "−" : "+"}</span>
                Billing Analysis
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

        </div>
      )}
    </div>
  );
};

export default VendorPortfolioSection;