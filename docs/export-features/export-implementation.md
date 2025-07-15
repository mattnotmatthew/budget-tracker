# Export Implementation Guide

This guide covers the technical implementation of export functionality using the unified DataExportService.

## Architecture Overview

The export system uses a unified service pattern with adapters for backward compatibility:

```
DataExportService (Core)
    ├── CSV Export
    ├── Excel Export
    ├── PDF Export
    └── PowerPoint Export

exportAdapters (Compatibility Layer)
    ├── Legacy function signatures
    └── Maps to DataExportService
```

## DataExportService API

### Basic Usage

```typescript
import { dataExportService } from '@/services/DataExportService';

// Export single dataset
await dataExportService.export({
  title: 'Budget Report',
  tables: [{ headers: ['Month', 'Budget'], rows: data }]
}, {
  format: 'csv',
  filename: 'budget-report',
  includeTimestamp: true
});
```

### Export Data Structure

```typescript
interface ExportData {
  title?: string;
  content?: string[];
  tables?: TableData[];
  charts?: ChartData[];
  kpiCards?: string[];
  metadata?: Record<string, any>;
}

interface TableData {
  headers: string[];
  rows: (string | number)[][];
  caption?: string;
}

interface ChartData {
  image: string;  // Base64 image data
  title?: string;
  width?: number;
  height?: number;
}
```

## Chart Capture Implementation

### Using html-to-image

```typescript
import * as htmlToImage from 'html-to-image';

async captureElementAsImage(element: HTMLElement): Promise<string> {
  return await htmlToImage.toPng(element, {
    quality: 0.95,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
    width: element.scrollWidth,
    height: element.scrollHeight
  });
}
```

### Capturing Multiple Charts

```typescript
async captureAllCharts(container: HTMLElement): Promise<ChartData[]> {
  const charts = container.querySelectorAll('.chart-container');
  const chartData: ChartData[] = [];
  
  for (const chart of charts) {
    const image = await this.captureElementAsImage(chart as HTMLElement);
    chartData.push({
      image,
      title: chart.getAttribute('data-chart-title') || 'Chart',
      width: chart.clientWidth,
      height: chart.clientHeight
    });
  }
  
  return chartData;
}
```

## Style Preservation

### KPI Card Styling

```typescript
// Capture KPI cards with inline styles
const captureKPICard = async (card: HTMLElement) => {
  // Clone element to preserve styles
  const clone = card.cloneNode(true) as HTMLElement;
  
  // Apply computed styles as inline styles
  const computedStyle = window.getComputedStyle(card);
  clone.style.cssText = computedStyle.cssText;
  
  // Capture the styled clone
  return await htmlToImage.toPng(clone);
};
```

### CSS Variables in Export

```typescript
// Ensure CSS variables are resolved before export
const resolveCSSSVariables = (element: HTMLElement) => {
  const styles = getComputedStyle(element);
  const cssVars = ['--primary-color', '--font-size-base'];
  
  cssVars.forEach(varName => {
    const value = styles.getPropertyValue(varName);
    element.style.setProperty(varName.replace('--', ''), value);
  });
};
```

## Format-Specific Implementations

### CSV Export

```typescript
private async exportCSV(data: ExportData[], filename: string) {
  const csvContent: string[] = [];
  
  data.forEach(dataset => {
    // Add title
    if (dataset.title) {
      csvContent.push(this.escapeCSVField(dataset.title));
    }
    
    // Add tables
    dataset.tables?.forEach(table => {
      csvContent.push(table.headers.map(h => this.escapeCSVField(h)).join(','));
      table.rows.forEach(row => {
        csvContent.push(row.map(cell => this.escapeCSVField(String(cell))).join(','));
      });
    });
  });
  
  this.downloadFile(csvContent.join('\n'), `${filename}.csv`, 'text/csv');
}
```

### Excel Export with Styling

```typescript
private async exportExcel(data: ExportData[], filename: string) {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  
  data.forEach((dataset, index) => {
    const worksheet = XLSX.utils.aoa_to_sheet([]);
    
    // Add styling
    const headerStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "2980B9" } },
      alignment: { horizontal: "center" }
    };
    
    // Apply styles to header row
    if (dataset.tables?.[0]?.headers) {
      const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cell = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[cell]) worksheet[cell] = {};
        worksheet[cell].s = headerStyle;
      }
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, dataset.title || `Sheet${index + 1}`);
  });
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  this.downloadBlob(new Blob([excelBuffer]), `${filename}.xlsx`);
}
```

### PDF with Images

```typescript
private async exportPDF(data: ExportData[], filename: string) {
  const jsPDF = (await import('jspdf')).default;
  const doc = new jsPDF({ orientation: 'landscape' });
  
  for (const dataset of data) {
    // Add charts as images
    if (dataset.charts) {
      for (const chart of dataset.charts) {
        doc.addImage(
          chart.image,
          'PNG',
          40,
          60,
          chart.width || 400,
          chart.height || 300
        );
      }
    }
    
    // Add KPI cards
    if (dataset.kpiCards) {
      let yPos = 60;
      for (const kpiImage of dataset.kpiCards) {
        doc.addImage(kpiImage, 'PNG', 40, yPos, 700, 150);
        yPos += 170;
      }
    }
  }
  
  doc.save(`${filename}.pdf`);
}
```

## Migration from Legacy Code

### Using Export Adapters

```typescript
// Old code
exportVendorBudgetCSV(vendors, filters, sortField, sortDirection);

// New code with adapter
import { exportVendorBudgetCSV } from '@/services/exportAdapters';
await exportVendorBudgetCSV(vendors, filters, sortField, sortDirection);
```

### Direct Service Usage

```typescript
// Replace legacy export with direct service call
await dataExportService.export({
  title: 'Vendor Budget Report',
  tables: [{
    headers: ['Vendor', 'Category', 'Budget'],
    rows: vendors.map(v => [v.name, v.category, v.budget])
  }]
}, {
  format: 'csv',
  filename: 'vendor-budget'
});
```

## Performance Optimization

### Chunked Processing

```typescript
async exportLargeDataset(data: any[], options: ExportOptions) {
  const CHUNK_SIZE = 1000;
  const chunks = [];
  
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    chunks.push(data.slice(i, i + CHUNK_SIZE));
  }
  
  const processedData: ExportData[] = [];
  for (const chunk of chunks) {
    processedData.push(await this.processChunk(chunk));
  }
  
  return this.export(processedData, options);
}
```

### Memory Management

```typescript
// Clean up after large exports
const cleanup = () => {
  // Revoke object URLs
  document.querySelectorAll('a[download]').forEach(link => {
    const href = link.getAttribute('href');
    if (href?.startsWith('blob:')) {
      URL.revokeObjectURL(href);
    }
  });
  
  // Clear temporary canvases
  document.querySelectorAll('canvas.export-temp').forEach(canvas => {
    canvas.remove();
  });
};
```

## Error Handling

```typescript
try {
  await dataExportService.export(data, options);
} catch (error) {
  if (error.message.includes('memory')) {
    // Try with reduced quality
    options.quality = 0.7;
    await dataExportService.export(data, options);
  } else {
    console.error('Export failed:', error);
    throw new Error(`Export failed: ${error.message}`);
  }
}
```

## Related Documentation

- [Export Troubleshooting](./export-troubleshooting.md)
- [DataExportService Migration](../refactoring/DataExportService.migration.md)