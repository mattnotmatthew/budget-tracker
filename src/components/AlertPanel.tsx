import React, { useState } from "react";
import { useBudget } from "../context/BudgetContext";
import { BudgetAlert } from "../types";
import { generateAlerts } from "../utils/budgetCalculations";
import { formatNumberThousands } from "../utils/currencyFormatter";

const AlertPanel: React.FC = () => {
  const { state } = useBudget();
  const [isCollapsed, setIsCollapsed] = useState(true); // Collapsed by default

  const alerts: BudgetAlert[] = generateAlerts(
    state.entries,
    state.categories,
    state.selectedYear
  );

  const getAlertIcon = (type: string): string => {
    switch (type) {
      case "danger":
        return "⚠️";
      case "warning":
        return "⚡";
      case "info":
        return "ℹ️";
      default:
        return "📊";
    }
  };

  const getAlertClass = (type: string): string => {
    return `alert alert-${type}`;
  };
  if (alerts.length === 0) {
    return (
      <div className="alert-panel">
        <div
          className="alert-panel-header"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <h3>
            <span className="collapse-indicator">
              {isCollapsed ? "▶" : "▼"}
            </span>
            Budget Alerts & Insights
          </h3>
        </div>
        {!isCollapsed && (
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            <span className="alert-message">
              All categories are within expected ranges
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="alert-panel">
      <div
        className="alert-panel-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3>
          <span className="collapse-indicator">{isCollapsed ? "▶" : "▼"}</span>
          Budget Alerts & Insights
        </h3>
      </div>
      {!isCollapsed && (
        <div className="alerts-list">
          {alerts.map((alert) => (
            <div key={alert.id} className={getAlertClass(alert.type)}>
              <span className="alert-icon">{getAlertIcon(alert.type)}</span>
              <div className="alert-content">
                <span className="alert-category">{alert.category}</span>{" "}
                <span className="alert-message">{alert.message}</span>{" "}
                <span className="alert-variance">
                  ${formatNumberThousands(alert.variance)}K
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertPanel;
