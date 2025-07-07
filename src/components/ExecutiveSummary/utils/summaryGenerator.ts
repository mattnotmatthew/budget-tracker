import { KPIData } from "./kpiCalculations";
import { summaryRegistry, SummaryToggles } from "./summaryRegistry";
import {
  generateStrategicContext,
  generateYTDPerformanceAnalysis,
  generateForecastAnalysis,
  generateCapitalizedSalariesAnalysis,
  generateResourceSpend,
  generateResourceAllocation,
} from "./sectionGenerators";

// Initialize the registry with default sections
function initializeRegistry() {
  summaryRegistry.registerSection({
    id: "strategicContext",
    name: "Strategic Context",
    description: "Annual budget overview and current spending status",
    generator: generateStrategicContext,
    defaultEnabled: true,
    order: 1,
  });

  summaryRegistry.registerSection({
    id: "ytdPerformance",
    name: "YTD Performance Analysis",
    description: "Year-to-date budget variance and performance metrics",
    generator: generateYTDPerformanceAnalysis,
    defaultEnabled: true,
    order: 2,
  });

  summaryRegistry.registerSection({
    id: "forecastAnalysis",
    name: "Forecast Analysis",
    description: "Full-year projections and variance analysis",
    generator: generateForecastAnalysis,
    defaultEnabled: true,
    order: 3,
  });

  summaryRegistry.registerSection({
    id: "capitalizedSalaries",
    name: "Capitalized Salaries",
    description: "Salary capitalization and offset analysis",
    generator: generateCapitalizedSalariesAnalysis,
    defaultEnabled: true,
    order: 4,
  });

  summaryRegistry.registerSection({
    id: "resourceSpend",
    name: "Resource Spend",
    description: "Hiring capacity and compensation budget analysis",
    generator: generateResourceSpend,
    defaultEnabled: true,
    order: 5,
  });

  summaryRegistry.registerSection({
    id: "resourceAllocation",
    name: "Resource Allocation",
    description: "Team composition and cost center efficiency analysis",
    generator: generateResourceAllocation,
    defaultEnabled: true,
    order: 6,
  });
}

// Initialize registry on module load
initializeRegistry();

// New modular generation function
export const generateModularSummary = (
  state: any,
  kpiData: KPIData,
  toggles: SummaryToggles
): string => {
  return summaryRegistry.generateSummary(state, kpiData, toggles);
};

// Backward compatibility function - generates with all sections enabled
export const generateIntelligentSummary = (
  state: any,
  kpiData: KPIData
): string => {
  const defaultToggles = summaryRegistry.getDefaultToggles();
  return generateModularSummary(state, kpiData, defaultToggles);
};

// Export registry for use in components
export { summaryRegistry } from "./summaryRegistry";
export type { SummaryToggles } from "./summaryRegistry";
