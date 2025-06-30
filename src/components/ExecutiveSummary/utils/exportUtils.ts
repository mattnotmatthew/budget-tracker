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
}: any) => {
  // Simple stub: alert instead of download
  alert("Exported Executive Summary!");
};

export const handleBasicExport = (data: any) => {
  exportExecutiveSummary(data);
};

export const handlePrintExport = (
  expandAllSections: () => void,
  restoreStates: () => void
) => {
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
      // Restore original states after printing
      setTimeout(restoreStates, 500);
    }
  }, 200);
};
