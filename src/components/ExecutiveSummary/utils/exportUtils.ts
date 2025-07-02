export const generateAlerts = (
  entries: any[],
  categories: any[],
  year: number
) => {
  // Simple stub: return empty array
  return [];
};

export const exportExecutiveSummary = ({
  kpis,
  topVariance,
  trend,
  alerts,
  commentary,
  userNotes,
  expandAllSections,
  restoreStates,
  format = 'powerpoint',
  tabMode = 'current',
  showAllTabsForExport,
  restoreTabVisibility
}: {
  kpis: any;
  topVariance: any;
  trend: any;
  alerts: any;
  commentary: any;
  userNotes: any;
  expandAllSections: () => void;
  restoreStates: () => void;
  format?: 'powerpoint' | 'paper';
  tabMode?: 'current' | 'all';
  showAllTabsForExport?: () => void;
  restoreTabVisibility?: () => void;
}) => {
  // Apply format-specific styling to the executive summary container
  const executiveSummaryElement = document.querySelector('.executive-summary');
  const formatClass = format === 'powerpoint' ? 'powerpoint-export' : 'paper-export';
  const tabClass = tabMode === 'all' ? 'export-all-tabs' : 'export-current-tab';
  
  // Add CSS classes for print formatting
  if (executiveSummaryElement) {
    executiveSummaryElement.classList.add(formatClass, tabClass);
  }
  
  // For "export all" mode, temporarily show all tabs
  if (tabMode === 'all' && showAllTabsForExport) {
    showAllTabsForExport();
    
    // Add data-tab-title attributes for slide titles after a short delay to ensure DOM update
    setTimeout(() => {
      const allTabPanels = document.querySelectorAll('.tab-panel');
      const tabLabels = ['Executive Commentary', 'Overall Budget', 'Budget Visuals', 'Resource Allocation and Spend', 'Vendor Info'];
      allTabPanels.forEach((panel, index) => {
        if (index < tabLabels.length) {
          panel.setAttribute('data-tab-title', tabLabels[index]);
        }
      });
    }, 50);
  }
  
  // Expand all sections for complete content export
  expandAllSections();

  // Small delay to allow state updates and CSS application to render
  setTimeout(() => {
    try {
      // Trigger browser print dialog
      window.print();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export function not available in this environment");
    } finally {
      // Clean up CSS classes and restore original states after printing
      setTimeout(() => {
        if (executiveSummaryElement) {
          executiveSummaryElement.classList.remove(formatClass, tabClass);
        }
        
        // Remove data-tab-title attributes
        const allTabPanels = document.querySelectorAll('.tab-panel');
        allTabPanels.forEach(panel => {
          panel.removeAttribute('data-tab-title');
        });
        
        // Restore tab visibility and other states
        if (tabMode === 'all' && restoreTabVisibility) {
          restoreTabVisibility();
        }
        restoreStates();
      }, 500);
    }
  }, 200);
};

export const handleBasicExport = (
  data: any,
  expandAllSections: () => void,
  restoreStates: () => void,
  format: 'powerpoint' | 'paper' = 'powerpoint',
  tabMode: 'current' | 'all' = 'current',
  showAllTabsForExport?: () => void,
  restoreTabVisibility?: () => void
) => {
  exportExecutiveSummary({
    ...data,
    expandAllSections,
    restoreStates,
    format,
    tabMode,
    showAllTabsForExport,
    restoreTabVisibility
  });
};

export const handlePrintExport = (
  expandAllSections: () => void,
  restoreStates: () => void,
  format: 'powerpoint' | 'paper' = 'paper'
) => {
  // Apply format-specific styling to the executive summary container
  const executiveSummaryElement = document.querySelector('.executive-summary');
  const formatClass = format === 'powerpoint' ? 'powerpoint-export' : 'paper-export';
  
  // Add CSS class for print formatting
  if (executiveSummaryElement) {
    executiveSummaryElement.classList.add(formatClass);
  }
  
  // Expand all sections for printing
  expandAllSections();

  // Small delay to allow state updates to render
  setTimeout(() => {
    try {
      window.print();
    } catch (error) {
      console.error("Print failed:", error);
      alert("Print function not available in this environment");
    } finally {
      // Clean up CSS class and restore original states after printing
      setTimeout(() => {
        if (executiveSummaryElement) {
          executiveSummaryElement.classList.remove(formatClass);
        }
        restoreStates();
      }, 500);
    }
  }, 200);
};

/**
 * Handle PowerPoint-specific export with tab mode support
 */
export const handlePowerPointExport = (
  data: any,
  expandAllSections: () => void,
  restoreStates: () => void,
  tabMode: 'current' | 'all' = 'current'
) => {
  exportExecutiveSummary({
    ...data,
    expandAllSections,
    restoreStates,
    format: 'powerpoint',
    tabMode
  });
};