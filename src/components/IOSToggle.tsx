import React from "react";

interface IOSToggleProps {
  isOn: boolean;
  onToggle: () => void;
  onLabel?: string;
  offLabel?: string;
  className?: string;
}

const IOSToggle: React.FC<IOSToggleProps> = ({
  isOn,
  onToggle,
  onLabel = "Final",
  offLabel = "Forecast",
  className = "",
}) => {
  return (
    <div className={`ios-toggle-container ${className}`}>
      <span className={`ios-toggle-label ${!isOn ? "active" : ""}`}>
        {offLabel}
      </span>
      <div
        className={`ios-toggle ${isOn ? "on" : "off"}`}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <div className="ios-toggle-thumb" />
      </div>
      <span className={`ios-toggle-label ${isOn ? "active" : ""}`}>
        {onLabel}
      </span>
    </div>
  );
};

export default IOSToggle;
