import React, { useMemo, useState } from "react";
import { useBudget } from "../../context/BudgetContext";
import "./ExecutiveSummary.css";

// Utility functions (stubs, since imports fail)
const formatCurrencyFull = (amount: number) => {
  return amount?.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
};

const generateAlerts = (entries: any[], categories: any[], year: number) => {
  // Simple stub: return empty array
  return [];
};

const exportExecutiveSummary = ({
  kpis,
  topVariance,
  trend,
  alerts,
  commentary,
  userNotes,
}: any) => {
  // Simple stub: alert instead of download
  alert("Exported Executive Summary!");
};

const ExecutiveSummary = () => {
  const { state } = useBudget();
  const [userNotes, setUserNotes] = useState("");

  // Memoized calculations
  const kpis = useMemo(() => getKPIData(state), [state]);
  const topVariance = useMemo(
    () => getTopVarianceCategories(state, 3),
    [state]
  );
  const trend = useMemo(() => getTrendData(state), [state]);
  const alerts = useMemo(() => getAlerts(state), [state]);
  const commentary = useMemo(() => getAutoCommentary(state), [state]);

  const handleExport = () => {
    exportExecutiveSummary({
      kpis,
      topVariance,
      trend,
      alerts,
      commentary,
      userNotes,
    });
  };

  return (
    <div className="executive-summary">
      <h2>
        Executive Summary – {state.selectedYear}
        {state.selectedQuarter ? ` Q${state.selectedQuarter}` : ""}
      </h2>
      <div className="kpi-cards">
        <div className="kpi-card">
          <span>YTD Actual</span>
          <strong>{formatCurrencyFull(kpis.ytdActual)}</strong>
        </div>
        <div className="kpi-card">
          <span>YTD Budget</span>
          <strong>{formatCurrencyFull(kpis.ytdBudget)}</strong>
        </div>
        <div className="kpi-card">
          <span>Variance</span>
          <strong>
            {formatCurrencyFull(kpis.variance)} ({kpis.variancePct.toFixed(1)}%)
          </strong>
        </div>
        <div className="kpi-card">
          <span>Full-Year Forecast</span>
          <strong>{formatCurrencyFull(kpis.fullYearForecast)}</strong>
        </div>
        <div className="kpi-card">
          <span>Remaining Budget</span>
          <strong>{formatCurrencyFull(kpis.remainingBudget)}</strong>
        </div>
      </div>
      <div className="variance-table-section">
        <h3>Top 3 Over/Under Categories</h3>
        <table className="variance-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Actual</th>
              <th>Budget</th>
              <th>Variance</th>
            </tr>
          </thead>
          <tbody>
            {topVariance.map((cat: any) => (
              <tr
                key={cat.name}
                className={cat.variance > 0 ? "over" : "under"}
              >
                <td>{cat.name}</td>
                <td>{formatCurrencyFull(cat.actual)}</td>
                <td>{formatCurrencyFull(cat.budget)}</td>
                <td>{formatCurrencyFull(cat.variance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="trend-chart-section">
        <h3>Budget vs Actual Trend</h3>
        {/* Placeholder for chart, e.g., Chart.js or Recharts */}
        <div className="trend-chart-placeholder">[Trend Chart Here]</div>
      </div>
      <div className="alerts-section">
        <h3>Alerts</h3>
        <ul>
          {alerts.map((alert: any, idx: number) => (
            <li key={idx} className={alert.type}>
              {alert.message}
            </li>
          ))}
        </ul>
      </div>
      <div className="commentary-section">
        <h3>Executive Commentary</h3>
        <div className="auto-commentary">{commentary}</div>
        <textarea
          placeholder="Add your notes for leadership..."
          value={userNotes}
          onChange={(e) => setUserNotes(e.target.value)}
        />
      </div>
      <div className="summary-actions">
        <button onClick={() => window.location.reload()}>Refresh</button>
        <button onClick={handleExport}>Export</button>
      </div>
    </div>
  );
};

interface KPIData {
  ytdActual: number;
  ytdBudget: number;
  variance: number;
  variancePct: number;
  fullYearForecast: number;
  remainingBudget: number;
}

interface VarianceCategory {
  name: string;
  actual: number;
  budget: number;
  variance: number;
}

const getKPIData = (state: any): KPIData => {
  // Placeholder: Replace with real YTD/forecast logic
  const ytdActual = state.entries.reduce(
    (sum: number, e: any) => sum + (e.actualAmount || 0),
    0
  );
  const ytdBudget = state.entries.reduce(
    (sum: number, e: any) => sum + e.budgetAmount,
    0
  );
  const variance = ytdActual - ytdBudget;
  const variancePct = ytdBudget ? (variance / ytdBudget) * 100 : 0;
  const fullYearForecast =
    ytdActual +
    state.entries.reduce(
      (sum: number, e: any) => sum + (e.reforecastAmount || 0),
      0
    );
  const remainingBudget = ytdBudget - ytdActual;
  return {
    ytdActual,
    ytdBudget,
    variance,
    variancePct,
    fullYearForecast,
    remainingBudget,
  };
};

const getTopVarianceCategories = (
  state: any,
  count: number
): VarianceCategory[] => {
  // Placeholder: Replace with real logic
  const catMap: { [key: string]: VarianceCategory } = {};
  state.entries.forEach((e: any) => {
    if (!catMap[e.categoryId]) {
      const cat = state.categories.find((c: any) => c.id === e.categoryId);
      catMap[e.categoryId] = {
        name: cat ? cat.name : e.categoryId,
        actual: 0,
        budget: 0,
        variance: 0,
      };
    }
    catMap[e.categoryId].actual += e.actualAmount || 0;
    catMap[e.categoryId].budget += e.budgetAmount;
    catMap[e.categoryId].variance =
      catMap[e.categoryId].actual - catMap[e.categoryId].budget;
  });
  const arr = Object.values(catMap);
  arr.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
  return arr.slice(0, count);
};

const getTrendData = (state: any) => {
  // Placeholder: Return monthly actual/budget arrays
  return [];
};

const getAlerts = (state: any) =>
  generateAlerts(state.entries, state.categories, state.selectedYear);

const getAutoCommentary = (state: any) => {
  // Placeholder: Generate a simple summary
  const kpi = getKPIData(state);
  if (kpi.variance > 0) {
    return `Spending is over budget by ${formatCurrencyFull(
      kpi.variance
    )} (${kpi.variancePct.toFixed(1)}%).`;
  } else if (kpi.variance < 0) {
    return `Spending is under budget by ${formatCurrencyFull(
      -kpi.variance
    )} (${(-kpi.variancePct).toFixed(1)}%).`;
  } else {
    return "Spending is exactly on budget.";
  }
};

export default ExecutiveSummary;
