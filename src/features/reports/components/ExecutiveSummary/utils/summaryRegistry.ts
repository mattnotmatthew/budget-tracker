import { KPIData } from "./kpiCalculations";

export interface SummarySection {
  id: string;
  name: string;
  description: string;
  generator: (state: any, kpiData: KPIData) => string;
  defaultEnabled: boolean;
  order: number;
}

export interface SummaryToggles {
  strategicContext: boolean;
  ytdPerformance: boolean;
  forecastAnalysis: boolean;
  resourceSpend: boolean;
  resourceAllocation: boolean;
  capitalizedSalaries: boolean;
}

export class SummaryRegistry {
  private sections: Map<string, SummarySection> = new Map();

  registerSection(section: SummarySection): void {
    this.sections.set(section.id, section);
  }

  getSection(id: string): SummarySection | undefined {
    return this.sections.get(id);
  }

  getAllSections(): SummarySection[] {
    return Array.from(this.sections.values()).sort((a, b) => a.order - b.order);
  }

  getEnabledSections(toggles: SummaryToggles): SummarySection[] {
    return this.getAllSections().filter(section => toggles[section.id as keyof SummaryToggles]);
  }

  generateSummary(state: any, kpiData: KPIData, toggles: SummaryToggles): string {
    const enabledSections = this.getEnabledSections(toggles);
    
    if (enabledSections.length === 0) {
      return "";
    }

    const sectionTexts = enabledSections.map(section => 
      section.generator(state, kpiData)
    );

    return sectionTexts.join("\n\n");
  }

  getDefaultToggles(): SummaryToggles {
    const defaults: SummaryToggles = {
      strategicContext: true,
      ytdPerformance: true,
      forecastAnalysis: true,
      resourceSpend: true,
      resourceAllocation: true,
      capitalizedSalaries: true,
    };

    return defaults;
  }
}

export const summaryRegistry = new SummaryRegistry();