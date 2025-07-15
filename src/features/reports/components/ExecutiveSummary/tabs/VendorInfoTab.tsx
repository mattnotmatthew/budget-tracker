import React from "react";
import { formatCurrencyExcelStyle } from "../../../../../utils/currencyFormatter";
import VendorPortfolioSection from "../components/VendorPortfolioSection";
import { BudgetState } from "../../../../../types";

interface VendorData {
  vendorName: string;
  ytdSpend: number;
  category?: string;
  annualBudget: number;
  budgetUtilization: number;
}

interface VendorInfoTabProps {
  topVendors: VendorData[];
  vendorBreakdownData: VendorData[];
  isVendorSpendingExpanded: boolean;
  isVendorPortfolioExpanded: boolean;
  onToggleVendorSpending: () => void;
  onToggleVendorPortfolio: () => void;
  totalVendorSpend: number;
  activeVendorCount: number;
  avgSpendPerVendor: number;
  vendorConcentration: number;
  state: BudgetState;
}

const VendorInfoTab: React.FC<VendorInfoTabProps> = ({
  topVendors,
  vendorBreakdownData,
  isVendorSpendingExpanded,
  isVendorPortfolioExpanded,
  onToggleVendorSpending,
  onToggleVendorPortfolio,
  totalVendorSpend,
  activeVendorCount,
  avgSpendPerVendor,
  vendorConcentration,
  state,
}) => {
  return (
    <div className="section-container">
      <h3>Vendor Information</h3>
      
      {/* Vendor Spending Analysis */}
      <div className="kpi-section vendor-spending-analysis">
        <div
          className="section-header clickable"
          onClick={onToggleVendorSpending}
        >
          <h4 className="section-title">
            <span className="expand-icon">
              {isVendorSpendingExpanded ? "−" : "+"}
            </span>
            Vendor Spending Analysis
          </h4>
        </div>
        
        {isVendorSpendingExpanded && (
          <>
            <div className="vendor-kpi-grid">
              <div className="vendor-kpi-card">
                <div className="vendor-kpi-title">Total Vendor Spend</div>
                <div className="vendor-kpi-value">
                  {formatCurrencyExcelStyle(totalVendorSpend)}
                </div>
                <div className="vendor-kpi-label">YTD Actual</div>
              </div>
              
              <div className="vendor-kpi-card">
                <div className="vendor-kpi-title">Active Vendors</div>
                <div className="vendor-kpi-value">{activeVendorCount}</div>
                <div className="vendor-kpi-label">With YTD Spend</div>
              </div>
              
              <div className="vendor-kpi-card">
                <div className="vendor-kpi-title">Avg Spend/Vendor</div>
                <div className="vendor-kpi-value">
                  {formatCurrencyExcelStyle(avgSpendPerVendor)}
                </div>
                <div className="vendor-kpi-label">YTD Average</div>
              </div>
              
              <div className="vendor-kpi-card">
                <div className="vendor-kpi-title">Top 10 Concentration</div>
                <div className="vendor-kpi-value">
                  {vendorConcentration.toFixed(1)}%
                </div>
                <div className="vendor-kpi-label">Of Total Spend</div>
              </div>
            </div>
            
            <div className="top-vendors-table">
              <h5>Top 10 Vendors by YTD Spend</h5>
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>Vendor Name</th>
                    <th>Category</th>
                    <th>YTD Spend</th>
                    <th>Annual Budget</th>
                    <th>Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {topVendors.map((vendor, index) => (
                    <tr key={index}>
                      <td>{vendor.vendorName}</td>
                      <td>{vendor.category || "Uncategorized"}</td>
                      <td>{formatCurrencyExcelStyle(vendor.ytdSpend)}</td>
                      <td>{formatCurrencyExcelStyle(vendor.annualBudget)}</td>
                      <td className={vendor.budgetUtilization > 100 ? "danger" : ""}>
                        {vendor.budgetUtilization.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Vendor Portfolio Insights */}
      <div className="kpi-section vendor-portfolio-insights">
        <div
          className="section-header clickable"
          onClick={onToggleVendorPortfolio}
        >
          <h4 className="section-title">
            <span className="expand-icon">
              {isVendorPortfolioExpanded ? "−" : "+"}
            </span>
            Vendor Portfolio Insights
          </h4>
        </div>
        
        {isVendorPortfolioExpanded && (
          <VendorPortfolioSection 
            state={state}
            isExpanded={isVendorPortfolioExpanded}
            onToggleExpanded={onToggleVendorPortfolio}
          />
        )}
      </div>
    </div>
  );
};

export default React.memo(VendorInfoTab);