import React, { useState, useMemo } from "react";
import { useBudget } from "../../../../context/BudgetContext";
import ExecutiveCommentaryTab from "./tabs/ExecutiveCommentaryTab";
import OverallBudgetTab from "./tabs/OverallBudgetTab";
import BudgetVisualsTab from "./tabs/BudgetVisualsTab";
import VendorInfoTab from "./tabs/VendorInfoTab";
import ExportModal from "./components/ExportModal";
import { generateIntelligentSummary } from "./utils/summaryGenerator";
import { useExecutiveSummaryData } from "./hooks/useExecutiveSummaryData";
import "../../../../styles/App-new.css";

const ExecutiveSummaryRefactored: React.FC = () => {
  const { state } = useBudget();
  
  // Tab state
  const [activeTab, setActiveTab] = useState("executive-commentary");
  const [showExportModal, setShowExportModal] = useState(false);

  // Section expansion states
  const [sectionStates, setSectionStates] = useState({
    isStrategicContextExpanded: true,
    isYTDPerformanceExpanded: false,
    isForwardLookingExpanded: false,
    isRiskVelocityExpanded: false,
    isQuarterlyView: false,
    isTrendTableExpanded: false,
    isVendorSpendingExpanded: true,
    isVendorPortfolioExpanded: false,
  });

  // Use custom hook to get all calculated data
  const {
    strategicContextData,
    ytdPerformanceData,
    forwardLookingData,
    riskVelocityData,
    monthlyTrendData,
    topVendors,
    vendorBreakdownData,
    totalVendorSpend,
    activeVendorCount,
    avgSpendPerVendor,
    vendorConcentration,
  } = useExecutiveSummaryData(state);

  // Generate intelligent summary
  const intelligentSummary = useMemo(() => {
    // For now, pass empty KPI data until we have the correct structure
    const kpiData = {
      annualBudgetTarget: 0,
      ytdActual: 0,
      annualVariance: 0,
      annualVariancePct: 0,
      budgetUtilization: 0,
      targetAchievement: 0,
      ytdBudget: 0,
      ytdVariance: 0,
      ytdVariancePct: 0,
      remainingBudget: 0,
      projectedOverUnder: 0,
      projectedOverUnderPct: 0,
      monthlyAvgActual: 0,
      monthlyAvgBudget: 0,
      fullYearForecast: 0,
      avgMonthlyBurnRate: 0,
      requiredMonthlyRate: 0,
      fullYearRunRate: 0,
      rateVsTarget: 0,
      projectedSurplus: 0,
      riskBuffer: 0,
      // Add remaining required properties with default values
    } as any; // Type assertion to bypass strict checking for now
    return generateIntelligentSummary(state, kpiData);
  }, [state]);

  // Toggle section expansion
  const toggleSection = (sectionName: string) => {
    setSectionStates(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName as keyof typeof sectionStates]
    }));
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "executive-commentary":
        return (
          <ExecutiveCommentaryTab
            intelligentSummary={intelligentSummary}
            year={state.selectedYear}
          />
        );

      case "overall-budget":
        return (
          <OverallBudgetTab
            strategicContextData={{
              title: "Strategic Context",
              isExpanded: sectionStates.isStrategicContextExpanded,
              kpiCards: strategicContextData,
            }}
            ytdPerformanceData={{
              title: "YTD Performance Metrics",
              isExpanded: sectionStates.isYTDPerformanceExpanded,
              kpiCards: ytdPerformanceData,
            }}
            forwardLookingData={{
              title: "Forward Looking Indicators",
              isExpanded: sectionStates.isForwardLookingExpanded,
              kpiCards: forwardLookingData,
            }}
            riskVelocityData={{
              title: "Risk & Velocity Metrics",
              isExpanded: sectionStates.isRiskVelocityExpanded,
              kpiCards: riskVelocityData,
            }}
            onToggleSection={toggleSection}
          />
        );

      case "budget-visuals":
        return (
          <BudgetVisualsTab
            monthlyTrendData={monthlyTrendData}
            isQuarterlyView={sectionStates.isQuarterlyView}
            onToggleView={() => toggleSection("isQuarterlyView")}
            onToggleTrendTable={() => toggleSection("isTrendTableExpanded")}
            isTrendTableExpanded={sectionStates.isTrendTableExpanded}
          />
        );

      case "vendor-info":
        return (
          <VendorInfoTab
            topVendors={topVendors}
            vendorBreakdownData={vendorBreakdownData}
            isVendorSpendingExpanded={sectionStates.isVendorSpendingExpanded}
            isVendorPortfolioExpanded={sectionStates.isVendorPortfolioExpanded}
            onToggleVendorSpending={() => toggleSection("isVendorSpendingExpanded")}
            onToggleVendorPortfolio={() => toggleSection("isVendorPortfolioExpanded")}
            totalVendorSpend={totalVendorSpend}
            activeVendorCount={activeVendorCount}
            avgSpendPerVendor={avgSpendPerVendor}
            vendorConcentration={vendorConcentration}
            state={state}
          />
        );

      // Add other tabs as needed
      default:
        return <div>Tab content not implemented yet</div>;
    }
  };

  return (
    <div className="executive-summary-modular">
      <div className="summary-header">
        <h2>Executive Summary - {state.selectedYear}</h2>
        <button onClick={handleExport} className="export-button">
          Export Summary
        </button>
      </div>

      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === "executive-commentary" ? "active" : ""}`}
          onClick={() => setActiveTab("executive-commentary")}
        >
          Executive Commentary
        </button>
        <button
          className={`tab-button ${activeTab === "overall-budget" ? "active" : ""}`}
          onClick={() => setActiveTab("overall-budget")}
        >
          Overall Budget
        </button>
        <button
          className={`tab-button ${activeTab === "budget-visuals" ? "active" : ""}`}
          onClick={() => setActiveTab("budget-visuals")}
        >
          Budget Visuals
        </button>
        <button
          className={`tab-button ${activeTab === "vendor-info" ? "active" : ""}`}
          onClick={() => setActiveTab("vendor-info")}
        >
          Vendor Info
        </button>
        <button
          className={`tab-button ${activeTab === "resource-allocation" ? "active" : ""}`}
          onClick={() => setActiveTab("resource-allocation")}
        >
          Resource Spend
        </button>
        <button
          className={`tab-button ${activeTab === "resources" ? "active" : ""}`}
          onClick={() => setActiveTab("resources")}
        >
          Resources
        </button>
      </div>

      <div className="tab-content">
        <div
          className="tab-panel"
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          style={{ display: "block" }}
        >
          {renderTabContent()}
        </div>
      </div>

      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={async (format: string, layout: string) => {
            // Placeholder export handler
            return { success: true, filename: 'export.pptx' };
          }}
        />
      )}
    </div>
  );
};

export default React.memo(ExecutiveSummaryRefactored);