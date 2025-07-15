import React from "react";
import { formatCurrencyExcelStyle } from "../../../../../utils/currencyFormatter";

interface KPICardData {
  title: string;
  value: number;
  label: string;
  description?: string;
  variance?: number;
  isPercentage?: boolean;
}

interface SectionData {
  title: string;
  isExpanded: boolean;
  kpiCards: KPICardData[];
}

interface OverallBudgetTabProps {
  strategicContextData: SectionData;
  ytdPerformanceData: SectionData;
  forwardLookingData: SectionData;
  riskVelocityData: SectionData;
  onToggleSection: (sectionName: string) => void;
}

const OverallBudgetTab: React.FC<OverallBudgetTabProps> = ({
  strategicContextData,
  ytdPerformanceData,
  forwardLookingData,
  riskVelocityData,
  onToggleSection,
}) => {
  const renderKPICard = (card: KPICardData) => (
    <div className="kpi-card" key={card.title}>
      <h5 className="kpi-title">{card.title}</h5>
      <div className="kpi-value">
        {card.isPercentage 
          ? `${card.value.toFixed(1)}%`
          : formatCurrencyExcelStyle(card.value)
        }
      </div>
      <div className="kpi-label">{card.label}</div>
      {card.description && (
        <div className="kpi-description">{card.description}</div>
      )}
      {card.variance !== undefined && (
        <div className={`kpi-variance ${card.variance >= 0 ? 'positive' : 'negative'}`}>
          {card.variance >= 0 ? '↑' : '↓'} {Math.abs(card.variance).toFixed(1)}%
        </div>
      )}
    </div>
  );

  const renderSection = (section: SectionData, sectionKey: string, className: string) => (
    <div className={`kpi-section ${className}`}>
      <div
        className="section-header clickable"
        onClick={() => onToggleSection(sectionKey)}
      >
        <h4 className="section-title">
          <span className="expand-icon">
            {section.isExpanded ? "−" : "+"}
          </span>
          {section.title}
        </h4>
      </div>
      {section.isExpanded && (
        <div className="kpi-cards">
          {section.kpiCards.map(renderKPICard)}
        </div>
      )}
    </div>
  );

  return (
    <div className="section-container">
      <h3>Overall Budget Summary</h3>
      {renderSection(strategicContextData, "isStrategicContextExpanded", "strategic-context")}
      {renderSection(ytdPerformanceData, "isYTDPerformanceExpanded", "ytd-performance")}
      {renderSection(forwardLookingData, "isForwardLookingExpanded", "forward-looking")}
      {renderSection(riskVelocityData, "isRiskVelocityExpanded", "risk-velocity")}
    </div>
  );
};

export default React.memo(OverallBudgetTab);