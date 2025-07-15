# DataExportService Migration Guide

This guide helps migrate existing export functionality to use the unified DataExportService.

## Quick Migration Examples

### 1. VendorManagement CSV Export

**Before:**
```typescript
const exportBudgetToCSV = () => {
  const headers = ['Vendor Name', 'Category', 'Team', ...];
  const rows = vendorData.map(vendor => [...]);
  // ... CSV generation logic
  downloadCSV(csvContent, filename);
};
```

**After:**
```typescript
import { dataExportService } from '@/services/DataExportService';

const exportBudgetToCSV = async () => {
  const tableData = {
    headers: ['Vendor Name', 'Category', 'Team', ...],
    rows: vendorData.map(vendor => [...])
  };

  await dataExportService.export({
    title: 'Vendor Budget Report',
    tables: [tableData]
  }, {
    format: 'csv',
    filename: 'vendor-budget',
    includeTimestamp: true
  });
};
```

### 2. FunctionalAllocation CSV Export

**Before:**
```typescript
const handleExportCSV = () => {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  // ... download logic
};
```

**After:**
```typescript
const handleExportCSV = async () => {
  await dataExportService.export({
    title: 'Functional Allocation Report',
    tables: [{
      headers: ['Function', 'Q1', 'Q2', 'Q3', 'Q4', 'Total'],
      rows: allocationData.map(item => [...])
    }]
  }, {
    format: 'csv',
    filename: 'functional-allocation'
  });
};
```

### 3. ExecutiveSummary Multi-format Export

**Before:**
```typescript
// In ExportModal.tsx
if (exportFormat === 'pdf') {
  await generatePDF(slides, ...);
} else if (exportFormat === 'pptx') {
  await generatePPTX(slides, ...);
}
```

**After:**
```typescript
const handleExport = async () => {
  const exportData = slides.map(slide => ({
    title: slide.title,
    content: slide.content,
    tables: slide.tables,
    charts: slide.charts?.map(chart => ({ image: chart })),
    kpiCards: slide.kpiCards
  }));

  await dataExportService.export(exportData, {
    format: exportFormat as 'pdf' | 'pptx',
    filename: 'executive-summary',
    includeTimestamp: true
  });
};
```

### 4. Adding Excel Export (New Feature)

```typescript
// Now you can easily add Excel export
const exportToExcel = async () => {
  await dataExportService.export({
    title: 'Budget Report',
    tables: [
      {
        headers: ['Category', 'Budget', 'Actual', 'Variance'],
        rows: budgetData.map(item => [
          item.category,
          item.budget,
          item.actual,
          item.variance
        ])
      }
    ]
  }, {
    format: 'excel',
    filename: 'budget-report'
  });
};
```

## Component-Specific Migration Steps

### VendorManagement.tsx

1. Remove these functions:
   - `escapeCSVField()`
   - `downloadCSV()`
   - `exportBudgetToCSV()`
   - `exportMonthlyToCSV()`

2. Replace with:
```typescript
import { dataExportService } from '@/services/DataExportService';

// In your export button onClick:
onClick={async () => {
  const tableElement = document.querySelector('.vendor-table');
  const tableData = dataExportService.extractTableFromElement(tableElement);
  
  await dataExportService.export({
    title: 'Vendor Report',
    tables: [tableData]
  }, {
    format: 'csv',
    filename: 'vendors',
    includeTimestamp: true
  });
}}
```

### ExecutiveSummary Export

1. Remove from `exportUtils.ts`:
   - Direct CSV/PDF generation code
   - Keep only content extraction functions

2. Update `ExportModal.tsx`:
```typescript
import { dataExportService } from '@/services/DataExportService';

// Simplify export handling
const handleExport = async () => {
  // Keep existing content extraction
  const slides = await extractAllTabsContentWithCharts();
  
  // Use unified export
  await dataExportService.export(
    slides.map(slide => ({
      title: slide.title,
      content: slide.content,
      tables: slide.tables,
      charts: slide.charts?.map(img => ({ image: img })),
      kpiCards: slide.kpiCards
    })),
    {
      format: exportFormat as any,
      filename: 'executive-summary',
      includeTimestamp: true
    }
  );
};
```

## Benefits of Migration

1. **Consistency**: Same API for all export formats
2. **Less Code**: Remove duplicate CSV generation logic
3. **New Features**: Easy to add Excel export
4. **Maintainability**: Single place to update export logic
5. **Testing**: Easier to test unified service
6. **Error Handling**: Centralized error handling
7. **Future Formats**: Easy to add new export formats

## Gradual Migration Strategy

1. **Phase 1**: Migrate CSV exports (lowest risk)
   - VendorManagement CSV
   - FunctionalAllocation CSV

2. **Phase 2**: Add Excel export feature
   - Test with existing data structures
   - Add Excel export buttons

3. **Phase 3**: Migrate complex exports
   - ExecutiveSummary PDF/PPTX
   - Consolidate chart capture logic

4. **Phase 4**: Remove old code
   - Delete duplicate export functions
   - Remove backup PPTX generators

## Testing Checklist

- [ ] CSV export maintains current format
- [ ] CSV escaping works correctly
- [ ] PDF export preserves layout
- [ ] PPTX export includes all elements
- [ ] Excel export creates valid files
- [ ] Timestamps work when enabled
- [ ] Custom filenames are applied
- [ ] Large datasets export correctly
- [ ] Charts/images export properly
- [ ] Error handling works