import React from "react";

interface TooltipProps {
  visible: boolean;
  content: {
    definition: string;
    interpretation: string;
    formula: string;
    calculation: string;
  } | null;
  x: number;
  y: number;
  showBelow?: boolean;
}

// Utility function to calculate safe tooltip position
const getSafeTooltipPosition = (x: number, y: number, showBelow: boolean) => {
  const tooltipWidth = 400;
  const tooltipHeight = 320;
  const padding = 20;

  // Calculate safe X position
  let safeX = x - tooltipWidth / 2;
  if (safeX < padding) {
    safeX = padding;
  } else if (safeX + tooltipWidth > window.innerWidth - padding) {
    safeX = window.innerWidth - tooltipWidth - padding;
  }

  // Calculate safe Y position
  let safeY = showBelow ? y + 10 : y - 10;
  if (!showBelow && safeY - tooltipHeight < padding) {
    safeY = y + 10; // Switch to below if not enough space above
    showBelow = true;
  } else if (
    showBelow &&
    safeY + tooltipHeight > window.innerHeight - padding
  ) {
    safeY = y - 10; // Switch to above if not enough space below
    showBelow = false;
  }

  return { x: safeX, y: safeY, adjustedShowBelow: showBelow };
};

const Tooltip: React.FC<TooltipProps> = ({
  visible,
  content,
  x,
  y,
  showBelow = false,
}) => {
  // Don't render if not visible, no content, or coordinates are invalid
  if (!visible || !content || x < 0 || y < 0) return null;

  const {
    x: safeX,
    y: safeY,
    adjustedShowBelow,
  } = getSafeTooltipPosition(x, y, showBelow);

  const tooltipStyle: React.CSSProperties = {
    position: "fixed",
    left: safeX,
    top: adjustedShowBelow ? safeY : safeY,
    transform: adjustedShowBelow ? "none" : "translateY(-100%)",
    zIndex: 1000,
    pointerEvents: "none",
    opacity: 1, // Ensure it's fully visible when shown
  };

  return (
    <div
      style={tooltipStyle}
      className={`kpi-tooltip ${adjustedShowBelow ? "show-below" : ""}`}
    >
      <div className="tooltip-content">
        <h4>{content.definition}</h4>
        <div className="interpretation">{content.interpretation}</div>

        <div className="formula-section">
          <strong>Formula</strong>
          {content.formula}
        </div>

        <div className="calculation-section">
          <strong>Calculation</strong>
          {content.calculation}
        </div>
      </div>
    </div>
  );
};

export default Tooltip;
