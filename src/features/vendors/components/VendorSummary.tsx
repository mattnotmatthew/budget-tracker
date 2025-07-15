import React from "react";
import { formatCurrencyExcelStyle } from "../../../utils/currencyFormatter";

interface VendorSummaryProps {
  totalBudget: number;
  inBudgetTotal: number;
  notInBudgetTotal: number;
  type?: "header" | "footer";
}

const VendorSummary: React.FC<VendorSummaryProps> = ({
  totalBudget,
  inBudgetTotal,
  notInBudgetTotal,
  type = "header",
}) => {
  return (
    <div className="budget-totals-container">
      <div className="budget-total-display">
        <span className="budget-total-label">Annual Total:</span>
        <span className="budget-total-amount">
          {formatCurrencyExcelStyle(totalBudget * 1000)}
        </span>
      </div>
      {type === "header" && (
        <div className="budget-total-display not-in-budget">
          <span className="budget-total-label">Not In Budget:</span>
          <span className="budget-total-amount">
            {formatCurrencyExcelStyle(notInBudgetTotal * 1000)}
          </span>
        </div>
      )}
    </div>
  );
};

export default React.memo(VendorSummary);