import React from "react";
import { formatCurrencyFull } from "../utils/kpiCalculations";
import { getPerformanceClass } from "../utils/performanceUtils";

interface KPICardProps {
  title: string;
  value: number | string;
  isPercentage?: boolean;
  isCurrency?: boolean;
  kpiType?: string;
  percentage?: number;
  subtitle?: string;
  onMouseEnter?: (event: React.MouseEvent) => void;
  onMouseMove?: (event: React.MouseEvent) => void;
  onMouseLeave?: () => void;
  className?: string;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  isPercentage = false,
  isCurrency = false,
  kpiType = "",
  percentage,
  subtitle,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  className = "",
}) => {
  const performanceClass = getPerformanceClass(
    kpiType,
    Number(value),
    percentage
  );

  const formatValue = () => {
    if (typeof value === "string") return value;

    if (isCurrency) {
      return formatCurrencyFull(value);
    }

    if (isPercentage) {
      return `${value.toFixed(1)}%`;
    }

    return value.toString();
  };

  return (
    <div
      className={`kpi-card ${performanceClass} ${className}`}
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <span>{title}</span>
      <strong>{formatValue()}</strong>
      {percentage !== undefined && (
        <div
          style={{
            fontSize: "0.875rem",
            color: "#6b7a8f",
            marginTop: "0.25rem",
          }}
        >
          ({percentage >= 0 ? "+" : ""}
          {percentage.toFixed(1)}%)
        </div>
      )}
      {subtitle && (
        <div className="kpi-subtitle">
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default KPICard;
