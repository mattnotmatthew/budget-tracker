import React from "react";

interface QuarterSelectorProps {
  selectedQuarters: number[];
  onQuarterToggle: (quarter: number) => void;
}

const QuarterSelector: React.FC<QuarterSelectorProps> = ({
  selectedQuarters,
  onQuarterToggle,
}) => {
  const quarters = [
    { number: 1, label: "Q1", months: "Jan-Mar" },
    { number: 2, label: "Q2", months: "Apr-Jun" },
    { number: 3, label: "Q3", months: "Jul-Sep" },
    { number: 4, label: "Q4", months: "Oct-Dec" },
  ];

  return (
    <div className="quarter-selector">
      <span className="quarter-selector-label">Quarters:</span>
      <div className="quarter-toggles">
        {quarters.map((quarter) => (
          <label key={quarter.number} className="quarter-toggle">
            <input
              type="checkbox"
              className="quarter-checkbox"
              checked={selectedQuarters.includes(quarter.number)}
              onChange={() => onQuarterToggle(quarter.number)}
            />
            <div className="quarter-toggle-button">
              <span className="quarter-label">{quarter.label}</span>
              <span className="quarter-months">{quarter.months}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default QuarterSelector;
