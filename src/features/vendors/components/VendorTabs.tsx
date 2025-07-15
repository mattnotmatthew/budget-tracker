import React from "react";

interface VendorTabsProps {
  activeTab: "budget" | "monthly" | "tracking";
  onTabChange: (tab: "budget" | "monthly" | "tracking") => void;
}

const VendorTabs: React.FC<VendorTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="vendor-tabs">
      <button
        className={`vendor-tab ${activeTab === "budget" ? "active" : ""}`}
        onClick={() => onTabChange("budget")}
      >
        Budget Management
      </button>
      <button
        className={`vendor-tab ${activeTab === "monthly" ? "active" : ""}`}
        onClick={() => onTabChange("monthly")}
      >
        Monthly Breakdown
      </button>
      <button
        className={`vendor-tab ${activeTab === "tracking" ? "active" : ""}`}
        onClick={() => onTabChange("tracking")}
      >
        Monthly Tracking
      </button>
    </div>
  );
};

export default React.memo(VendorTabs);