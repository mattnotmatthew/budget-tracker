// Quick verification that all our modular utilities can be imported
import { getKPIData, formatCurrencyFull } from "./utils/kpiCalculations";
import { getResourceData } from "./utils/resourceCalculations";
import { getVendorTrackingData } from "./utils/vendorCalculations";
import { getTrendData } from "./utils/trendCalculations";
import { getKPITooltipContent } from "./utils/tooltipUtils";
import { generateIntelligentSummary } from "./utils/summaryGenerator";
import { generateAlerts } from "./utils/exportUtils";
import Tooltip from "../../../../components/shared/Tooltip";
import KPICard from "./components/KPICard";

// Test basic functionality
console.log("All modular utilities imported successfully!");
console.log("Sample currency formatting:", formatCurrencyFull(1234.56));

export {};
