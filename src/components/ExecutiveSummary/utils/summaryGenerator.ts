import { KPIData } from "./kpiCalculations";
import { summaryRegistry, SummaryToggles } from "./summaryRegistry";
import {
  generateStrategicContext,
  generateYTDPerformanceAnalysis,
  generateForecastAnalysis,
  generateCapitalizedSalariesAnalysis,
  generateResourceAnalysis,
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
    id: "resourceAnalysis",
    name: "Resource Analysis",
    description: "Hiring capacity and compensation budget analysis",
    generator: generateResourceAnalysis,
    defaultEnabled: true,
    order: 5,
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
