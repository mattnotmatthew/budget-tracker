# Adding New Summary Sections

This guide explains how to add new sections to the Executive Summary's modular summary generator system.

## Overview

The summary generator uses a registry pattern that makes adding new sections straightforward. Each section is independent and can be toggled on/off by users, with preferences saved to localStorage.

## Quick Start: Adding a New Section

### Step 1: Create the Generator Function

Add your new section generator to `src/components/ExecutiveSummary/utils/sectionGenerators.ts`:

```typescript
export const generateVendorCommentary = (state: any, kpiData: KPIData): string => {
  // Your logic here - analyze vendor data, create narrative text
  const vendorData = getVendorTrackingData(state);
  const totalVendorSpend = getTotalVendorSpend(state);
  
  let summary = `Our vendor portfolio analysis shows total spend of ${formatCurrencyFull(totalVendorSpend)}. `;
  
  // Add more analysis logic here...
  
  return summary;
};
```

### Step 2: Register the Section

In `src/components/ExecutiveSummary/utils/summaryGenerator.ts`, add it to the registry initialization function:

```typescript
function initializeRegistry() {
  // ... existing sections ...
  
  summaryRegistry.registerSection({
    id: "vendorCommentary",           // Unique ID (camelCase)
    name: "Vendor Analysis",          // Display name in UI
    description: "Vendor spending and portfolio analysis",
    generator: generateVendorCommentary,  // Your function from Step 1
    defaultEnabled: true,             // Should it be on by default?
    order: 6,                        // Where it appears in the summary
  });
}
```

### Step 3: Add to Toggle Interface

In `src/components/ExecutiveSummary/utils/summaryRegistry.ts`, add the new field to the SummaryToggles interface:

```typescript
export interface SummaryToggles {
  strategicContext: boolean;
  ytdPerformance: boolean;
  forecastAnalysis: boolean;
  resourceAnalysis: boolean;
  capitalizedSalaries: boolean;
  vendorCommentary: boolean;        // Add this line
}
```

### Step 4: Update Default Toggles

In the same file, update the `getDefaultToggles()` function:

```typescript
getDefaultToggles(): SummaryToggles {
  const defaults: SummaryToggles = {
    strategicContext: true,
    ytdPerformance: true,
    forecastAnalysis: true,
    resourceAnalysis: true,
    capitalizedSalaries: true,
    vendorCommentary: true,         // Add this line
  };
  return defaults;
}
```

## That's It!

The new section will automatically:

- ✅ Appear as a checkbox in the UI
- ✅ Generate content when enabled
- ✅ Save user preferences to localStorage
- ✅ Follow the same styling and behavior
- ✅ Be included in exports and print views

## Architecture Notes

### Current Sections

The system currently includes these sections:

1. **Strategic Context** (`strategicContext`) - Annual budget overview and current spending status
2. **YTD Performance Analysis** (`ytdPerformance`) - Year-to-date budget variance and performance metrics  
3. **Forecast Analysis** (`forecastAnalysis`) - Full-year projections and variance analysis
4. **Capitalized Salaries** (`capitalizedSalaries`) - Salary capitalization and offset analysis
5. **Resource Analysis** (`resourceAnalysis`) - Hiring capacity and compensation budget analysis

### Generator Function Guidelines

Your generator function should:

- **Accept parameters**: `(state: any, kpiData: KPIData): string`
- **Return**: A narrative text string (can include line breaks with `\n`)
- **Be self-contained**: Include all necessary calculations and data processing
- **Use existing utilities**: Leverage formatCurrencyFull, existing calculation functions, etc.
- **Handle edge cases**: Check for missing data and provide fallback text

### Example Generator Function

```typescript
export const generateRiskAnalysis = (state: any, kpiData: KPIData): string => {
  const burnRate = kpiData.burnRate;
  const monthsRemaining = kpiData.monthsRemaining;
  const varianceTrend = kpiData.varianceTrend;
  
  let summary = `Our current burn rate analysis indicates `;
  
  if (monthsRemaining > 12) {
    summary += `strong budget runway with ${monthsRemaining.toFixed(1)} months of capacity remaining. `;
  } else if (monthsRemaining > 6) {
    summary += `adequate budget runway with ${monthsRemaining.toFixed(1)} months remaining. `;
  } else {
    summary += `tight budget constraints with only ${monthsRemaining.toFixed(1)} months of runway remaining. `;
  }
  
  summary += `The variance trend is currently ${varianceTrend.toLowerCase()}, `;
  
  if (varianceTrend === "Improving") {
    summary += `suggesting better budget control in recent months.`;
  } else if (varianceTrend === "Declining") {
    summary += `indicating the need for immediate budget monitoring and corrective action.`;
  } else {
    summary += `showing consistent budget performance patterns.`;
  }
  
  return summary;
};
```

### Best Practices

1. **Keep sections focused**: Each section should cover a specific aspect of budget analysis
2. **Use consistent tone**: Match the narrative style of existing sections
3. **Include actionable insights**: Don't just report numbers, provide business context
4. **Handle missing data gracefully**: Always check for undefined/null values
5. **Test thoroughly**: Verify your section works with different data scenarios

### File Structure

```
src/components/ExecutiveSummary/utils/
├── sectionGenerators.ts     # Individual generator functions
├── summaryGenerator.ts      # Registry initialization and main functions
├── summaryRegistry.ts       # Registry class and interfaces
└── [other utility files]    # KPI calculations, formatting, etc.
```

## Testing Your New Section

1. **Build the application**: `npm run build`
2. **Check for TypeScript errors**: The build will fail if there are type issues
3. **Test in the UI**: Navigate to Executive Summary and verify your section appears in the toggles
4. **Test persistence**: Toggle your section off/on and refresh the page to verify localStorage works
5. **Test content**: Verify your section generates appropriate narrative text

## Future Enhancements

The registry system is designed to support future enhancements like:

- Section dependencies (e.g., Section B only shows if Section A is enabled)
- Dynamic section ordering
- User-customizable section templates
- Export-specific section configurations
- Role-based section visibility

## Total Development Effort

Adding a new section typically requires:
- **10-20 lines of code** across 2-3 files
- **15-30 minutes** of development time
- **No UI changes** beyond the automatic toggle generation

The registry pattern handles all the complex integration automatically!