import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrencyExcelStyle } from "../../../../../utils/currencyFormatter";

interface TrendData {
  name: string;
  month: string;
  budget: number;
  adjusted: number;
  actual: number;
  variance: number;
  isFinalMonth: boolean;
}

interface BudgetVisualsTabProps {
  monthlyTrendData: TrendData[];
  isQuarterlyView: boolean;
  onToggleView: () => void;
  onToggleTrendTable: () => void;
  isTrendTableExpanded: boolean;
}

const BudgetVisualsTab: React.FC<BudgetVisualsTabProps> = ({
  monthlyTrendData,
  isQuarterlyView,
  onToggleView,
  onToggleTrendTable,
  isTrendTableExpanded,
}) => {
  const formatTooltipValue = (value: number) => formatCurrencyExcelStyle(value);

  const formatYAxisTick = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  const getQuarterlyData = () => {
    const quarterlyData = [];
    for (let i = 0; i < monthlyTrendData.length; i += 3) {
      const quarterMonths = monthlyTrendData.slice(i, i + 3);
      if (quarterMonths.length > 0) {
        const quarterNum = Math.ceil((i + 1) / 3);
        const quarterData = {
          name: `Q${quarterNum}`,
          budget: quarterMonths.reduce((sum, m) => sum + m.budget, 0),
          adjusted: quarterMonths.reduce((sum, m) => sum + m.adjusted, 0),
          actual: quarterMonths.reduce((sum, m) => sum + m.actual, 0),
          variance: 0,
        };
        quarterData.variance = quarterData.actual - quarterData.budget;
        quarterlyData.push(quarterData);
      }
    }
    return quarterlyData;
  };

  const chartData = isQuarterlyView ? getQuarterlyData() : monthlyTrendData;

  return (
    <>
      <div className="trend-chart-section">
        <div className="chart-controls">
          <button onClick={onToggleView} className="toggle-view-btn">
            {isQuarterlyView ? "Show Monthly View" : "Show Quarterly View"}
          </button>
        </div>
        
        <div className="spending-chart-container">
          <h4>Budget vs Actual Trend</h4>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={formatYAxisTick} />
              <Tooltip formatter={formatTooltipValue} />
              <Legend />
              <Line
                type="monotone"
                dataKey="budget"
                stroke="#8884d8"
                name="Budget"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#82ca9d"
                name="Actual"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="adjusted"
                stroke="#ffc658"
                name="Adjusted"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="variance-chart-container">
          <h4>Monthly Variance</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={formatYAxisTick} />
              <Tooltip formatter={formatTooltipValue} />
              <Legend />
              <Bar dataKey="variance" fill="#ff7300" name="Variance" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="trend-data-table-section">
        <h4
          className="collapsible-header"
          onClick={onToggleTrendTable}
        >
          <span className="expand-icon">
            {isTrendTableExpanded ? "−" : "+"}
          </span>
          Detailed Trend Data
        </h4>
        
        {isTrendTableExpanded && (
          <table className="trend-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Budget</th>
                <th>Actual</th>
                <th>Adjusted</th>
                <th>Variance</th>
                <th>Variance %</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row, index) => (
                <tr key={index}>
                  <td>{row.name}</td>
                  <td>{formatCurrencyExcelStyle(row.budget)}</td>
                  <td>{formatCurrencyExcelStyle(row.actual)}</td>
                  <td>{formatCurrencyExcelStyle(row.adjusted)}</td>
                  <td className={row.variance >= 0 ? "positive" : "negative"}>
                    {formatCurrencyExcelStyle(row.variance)}
                  </td>
                  <td className={row.variance >= 0 ? "positive" : "negative"}>
                    {row.budget !== 0 
                      ? `${((row.variance / row.budget) * 100).toFixed(1)}%`
                      : "N/A"
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default React.memo(BudgetVisualsTab);