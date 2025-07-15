/**
 * Export Adapters
 * Helper functions to ease migration from old export code to DataExportService
 * These adapters maintain backward compatibility while using the new unified service
 */

import { dataExportService, ExportData, TableData } from './DataExportService';

/**
 * Legacy CSV export adapter for VendorManagement
 * Maintains the same function signature as the original
 */
export const exportVendorBudgetCSV = async (
  vendorData: any[],
  filters: Record<string, any>,
  sortField: string,
  sortDirection: string
): Promise<void> => {
  // Build headers based on original logic
  const headers = [
    'Vendor Name',
    'Category',
    'Team',
    'Budget',
    'Status',
    'Contract Start',
    'Contract End',
    'Payment Terms'
  ];

  // Transform vendor data to rows
  const rows = vendorData
    .filter(vendor => {
      // Apply filters as in original
      if (filters.category && vendor.vendorCategory !== filters.category) return false;
      if (filters.team && vendor.vendorTeam !== filters.team) return false;
      if (filters.status && vendor.status !== filters.status) return false;
      return true;
    })
    .sort((a, b) => {
      // Apply sorting as in original
      const aValue = a[sortField];
      const bValue = b[sortField];
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      return aValue > bValue ? multiplier : -multiplier;
    })
    .map(vendor => [
      vendor.vendorName,
      vendor.vendorCategory,
      vendor.vendorTeam,
      vendor.budget,
      vendor.status,
      vendor.contractStart,
      vendor.contractEnd,
      vendor.paymentTerms
    ]);

  // Use new service
  await dataExportService.export({
    title: 'Vendor Budget Report',
    tables: [{ headers, rows }]
  }, {
    format: 'csv',
    filename: 'vendor-budget',
    includeTimestamp: true
  });
};

/**
 * Legacy CSV export adapter for VendorManagement monthly data
 */
export const exportVendorMonthlyCSV = async (
  monthlyData: any[],
  year: number
): Promise<void> => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const headers = ['Vendor Name', ...months, 'Total'];

  const rows = monthlyData.map(vendor => {
    const monthlyValues = months.map(month => 
      vendor.months?.[month] || vendor[month.toLowerCase()] || 0
    );
    const total = monthlyValues.reduce((sum, val) => sum + val, 0);
    
    return [
      vendor.vendorName,
      ...monthlyValues,
      total
    ];
  });

  await dataExportService.export({
    title: `Vendor Monthly Breakdown - ${year}`,
    tables: [{ headers, rows }]
  }, {
    format: 'csv',
    filename: `vendor-monthly-${year}`,
    includeTimestamp: true
  });
};

/**
 * Legacy CSV export adapter for FunctionalAllocation
 */
export const exportFunctionalAllocationCSV = async (
  allocationData: any[],
  year: number
): Promise<void> => {
  const headers = ['Function', 'Q1', 'Q2', 'Q3', 'Q4', 'Total Budget', 'Actual Spend', 'Variance'];

  const rows = allocationData.map(func => [
    func.name,
    func.q1 || 0,
    func.q2 || 0,
    func.q3 || 0,
    func.q4 || 0,
    func.totalBudget || 0,
    func.actualSpend || 0,
    func.variance || 0
  ]);

  await dataExportService.export({
    title: `Functional Allocation - ${year}`,
    tables: [{ headers, rows }]
  }, {
    format: 'csv',
    filename: `functional-allocation-${year}`,
    includeTimestamp: true
  });
};

/**
 * Executive Summary export adapter
 * Converts slide data to unified export format
 */
export const exportExecutiveSummary = async (
  slides: any[],
  format: 'pdf' | 'pptx',
  options?: { layout?: string; includeNotes?: boolean }
): Promise<void> => {
  const exportData: ExportData[] = slides.map(slide => ({
    title: slide.title,
    content: slide.content || [],
    tables: slide.tables || [],
    charts: slide.charts?.map((imageData: string) => ({
      image: imageData,
      title: slide.title
    })) || [],
    kpiCards: slide.kpiCards || [],
    metadata: slide.metadata || {}
  }));

  await dataExportService.export(exportData, {
    format,
    filename: 'executive-summary',
    includeTimestamp: true,
    customStyles: options
  });
};

/**
 * Quick chart capture adapter
 * Wraps the unified capture method with original signature
 */
export const captureChartImage = async (
  chartElement: HTMLElement,
  scale?: number
): Promise<string> => {
  return dataExportService.captureElementAsImage(chartElement, {
    quality: 0.95
  });
};

/**
 * Table extraction adapter
 * Helper to quickly extract table data from DOM
 */
export const extractTableData = (
  tableSelector: string
): TableData | null => {
  const tableElement = document.querySelector(tableSelector) as HTMLTableElement;
  if (!tableElement) return null;

  return dataExportService.extractTableFromElement(tableElement);
};

/**
 * Generic CSV download adapter
 * For components that build their own CSV content
 */
export const downloadCSV = async (
  content: string,
  filename: string
): Promise<void> => {
  // Parse CSV content back to table data (basic implementation)
  const lines = content.trim().split('\n');
  const headers = lines[0]?.split(',').map(h => h.replace(/^"|"$/g, '')) || [];
  const rows = lines.slice(1).map(line => 
    line.split(',').map(cell => cell.replace(/^"|"$/g, ''))
  );

  await dataExportService.export({
    tables: [{ headers, rows }]
  }, {
    format: 'csv',
    filename: filename.replace('.csv', ''),
    includeTimestamp: false
  });
};

/**
 * Add Excel export capability (new feature)
 * Easy to add to existing components
 */
export const exportToExcel = async (
  data: { title?: string; tables: Array<{ headers: string[]; rows: any[][] }> },
  filename: string
): Promise<void> => {
  await dataExportService.export(data, {
    format: 'excel',
    filename,
    includeTimestamp: true
  });
};

/**
 * Batch export adapter
 * Export multiple datasets at once
 */
export const batchExport = async (
  datasets: Array<{ name: string; data: any }>,
  format: 'csv' | 'excel' | 'pdf'
): Promise<void> => {
  const exportData = datasets.map(dataset => ({
    title: dataset.name,
    ...dataset.data
  }));

  await dataExportService.export(exportData, {
    format,
    filename: 'batch-export',
    includeTimestamp: true
  });
};