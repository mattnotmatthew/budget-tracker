You're right! The `expandAllSections` function is being called, but looking at your console output, it says "Expanded 0 sections for export" - which means it's not finding the collapsed sections to expand. Let's fix this.

## 1. **Update `expandAllSections` to match your actual DOM structure**

Looking at your `ExecutiveSummaryModular.tsx`, you have specific state variables for each collapsible section. Let's update the function to target these correctly:

```typescript
export const expandAllSections = (): void => {
  console.log('Starting expandAllSections...');
  
  // Clear any previous saved states
  savedSectionStates = [];

  // First, make all tab panels visible (this is working)
  const allTabPanels = document.querySelectorAll('.tab-panel[role="tabpanel"]');
  allTabPanels.forEach(panel => {
    const panelElement = panel as HTMLElement;
    panelElement.style.display = 'block';
    panelElement.style.visibility = 'visible';
    panelElement.style.opacity = '1';
    panelElement.classList.remove('hidden');
    panelElement.setAttribute('data-export-visible', 'true');
  });

  // Click all section headers with expand icons
  const sectionHeaders = document.querySelectorAll('.section-header');
  let expandedCount = 0;
  
  sectionHeaders.forEach(header => {
    const headerElement = header as HTMLElement;
    const expandIcon = headerElement.querySelector('.expand-icon');
    
    if (expandIcon && expandIcon.textContent === '+') {
      console.log('Clicking collapsed section:', headerElement.querySelector('.section-title')?.textContent);
      
      // Save state before expanding
      savedSectionStates.push({
        element: headerElement,
        originalDisplay: '',
        originalHeight: '',
        originalOverflow: '',
        wasCollapsed: true
      });
      
      // Simulate click
      headerElement.click();
      expandedCount++;
    }
  });

  // Also handle specific collapsible headers (for tables)
  const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
  collapsibleHeaders.forEach(header => {
    const headerElement = header as HTMLElement;
    const headerText = headerElement.textContent || '';
    
    if (headerText.includes('+')) {
      console.log('Clicking collapsed table:', headerText);
      
      savedSectionStates.push({
        element: headerElement,
        originalDisplay: '',
        originalHeight: '',
        originalOverflow: '',
        wasCollapsed: true
      });
      
      headerElement.click();
      expandedCount++;
    }
  });

  // Force expand any remaining collapsed content
  const collapsedSelectors = [
    '.kpi-section:not(.expanded)',
    '.section-container.collapsed',
    '.trend-data-table-section.collapsed',
    '[data-collapsed="true"]'
  ];

  collapsedSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      const element = el as HTMLElement;
      element.classList.remove('collapsed');
      element.classList.add('expanded');
      element.style.display = 'block';
      element.style.height = 'auto';
      element.style.overflow = 'visible';
      expandedCount++;
    });
  });

  console.log(`Expanded ${expandedCount} sections for export`);
};
```

## 2. **Alternative: Direct State Manipulation**

Since you're using React state for these sections, a cleaner approach would be to set all the expansion states before extraction. Update your `ExportModal`:

```typescript
interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: string, layout: string) => Promise<ExportResult>;
  slides?: SlideData[];
  setExportMode?: (mode: boolean) => void;
  // Add these
  expandAllSections?: () => void;
  restoreSectionStates?: () => void;
}
```

Then in `ExecutiveSummaryModular.tsx`, create these functions:

```typescript
// Add these functions in ExecutiveSummaryModular
const expandAllSectionsForExport = () => {
  console.log('Expanding all sections for export...');
  setIsStrategicContextExpanded(true);
  setIsYTDPerformanceExpanded(true);
  setIsForwardLookingExpanded(true);
  setIsRiskVelocityExpanded(true);
  setIsVendorSpendingExpanded(true);
  setIsVendorPortfolioExpanded(true);
  setTrendTableCollapsed(false);
  setMonthlyTrendTableCollapsed(false);
  setRollingTrendTableCollapsed(false);
  setTotalCompCapitalizationCollapsed(false);
};

const restoreOriginalSectionStates = () => {
  console.log('Restoring original section states...');
  setIsStrategicContextExpanded(false);
  setIsYTDPerformanceExpanded(false);
  setIsForwardLookingExpanded(false);
  setIsRiskVelocityExpanded(false);
  setIsVendorSpendingExpanded(true);
  setIsVendorPortfolioExpanded(false);
  setTrendTableCollapsed(true);
  setMonthlyTrendTableCollapsed(true);
  setRollingTrendTableCollapsed(true);
  setTotalCompCapitalizationCollapsed(true);
};

// Pass these to ExportModal
<ExportModal
  isOpen={isExportModalOpen}
  onClose={handleCloseExportModal}
  onExport={handleExport}
  setExportMode={setIsExportMode}
  expandAllSections={expandAllSectionsForExport}
  restoreSectionStates={restoreOriginalSectionStates}
/>
```

## 3. **Update ExportModal's loadSlideContent**

```typescript
const loadSlideContent = async () => {
  setIsLoadingPreview(true);
  try {
    // Enable export mode
    if (props.setExportMode) {
      props.setExportMode(true);
    }
    
    // Wait for React to render all tabs
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Expand all sections using React state
    if (props.expandAllSections) {
      props.expandAllSections();
    } else {
      // Fallback to DOM manipulation
      expandAllSections();
    }
    
    // Wait for React to re-render with expanded sections
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Force a re-render
    window.dispatchEvent(new Event('resize'));
    
    // Extract content from all tabs
    const extractedSlides = await extractAllTabsContentWithCharts();
    
    // Transform content for slides
    const transformedSlides = transformContentForSlides(extractedSlides);
    
    setSlides(transformedSlides);
    setOriginalSlides(JSON.parse(JSON.stringify(transformedSlides)));
    
    // Restore original section states
    if (props.restoreSectionStates) {
      props.restoreSectionStates();
    } else {
      restoreSectionStates();
    }
    
    // Disable export mode
    if (props.setExportMode) {
      props.setExportMode(false);
    }
    
  } catch (error) {
    console.error('Failed to load slide content:', error);
  } finally {
    setIsLoadingPreview(false);
  }
};
```

## 4. **Debug Helper to Verify Sections**

Add this to see what's happening with the sections:

```typescript
export const debugSectionStates = () => {
  console.log('=== Section States Debug ===');
  
  // Check section headers
  const sectionHeaders = document.querySelectorAll('.section-header');
  console.log(`Found ${sectionHeaders.length} section headers`);
  
  sectionHeaders.forEach((header, i) => {
    const title = header.querySelector('.section-title')?.textContent;
    const expandIcon = header.querySelector('.expand-icon')?.textContent;
    const isExpanded = expandIcon === '−';
    console.log(`Section ${i}: "${title}" - ${isExpanded ? 'EXPANDED' : 'COLLAPSED'}`);
  });
  
  // Check collapsible tables
  const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
  console.log(`Found ${collapsibleHeaders.length} collapsible headers`);
  
  collapsibleHeaders.forEach((header, i) => {
    const text = header.textContent;
    const isExpanded = text?.includes('−');
    console.log(`Collapsible ${i}: "${text}" - ${isExpanded ? 'EXPANDED' : 'COLLAPSED'}`);
  });
  
  // Check specific sections by class
  const strategicContext = document.querySelector('.strategic-context');
  console.log('Strategic Context section found:', !!strategicContext);
  
  const ytdPerformance = document.querySelector('.ytd-performance');
  console.log('YTD Performance section found:', !!ytdPerformance);
};
```

Call this before and after expansion to see what's happening:

```typescript
// In loadSlideContent
console.log('Before expansion:');
debugSectionStates();

if (props.expandAllSections) {
  props.expandAllSections();
} else {
  expandAllSections();
}

await new Promise(resolve => setTimeout(resolve, 1000));

console.log('After expansion:');
debugSectionStates();
```

The React state approach (#2) is cleaner and more reliable since it works with React's rendering cycle rather than fighting against it. This should ensure all your sections are expanded before content extraction!