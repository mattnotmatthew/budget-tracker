# Export Troubleshooting Guide

This guide covers common issues and solutions for all export formats (CSV, PDF, PowerPoint, Excel).

## Common Issues

### 1. Collapsed Sections Not Exporting

**Problem**: Content in collapsed sections is not included in exports.

**Solution**: Ensure all sections are expanded before export:

```typescript
// For React state-based sections
const expandAllSectionsForExport = () => {
  setIsStrategicContextExpanded(true);
  setIsYTDPerformanceExpanded(true);
  setIsForwardLookingExpanded(true);
  // ... expand all other sections
};

// For DOM-based sections
const expandAllSections = () => {
  const sectionHeaders = document.querySelectorAll('.section-header');
  sectionHeaders.forEach(header => {
    const expandIcon = header.querySelector('.expand-icon');
    if (expandIcon && expandIcon.textContent === '+') {
      header.click();
    }
  });
};
```

### 2. Hidden Tab Content Not Exporting

**Problem**: Only the active tab content is exported.

**Solution**: Make all tabs visible during export:

```typescript
const allTabPanels = document.querySelectorAll('.tab-panel[role="tabpanel"]');
allTabPanels.forEach(panel => {
  panel.style.display = 'block';
  panel.style.visibility = 'visible';
  panel.setAttribute('data-export-visible', 'true');
});
```

### 3. Chart Images Not Capturing

**Problem**: Charts appear blank or corrupted in exports.

**Solution**: Use html-to-image instead of html2canvas:

```typescript
import * as htmlToImage from 'html-to-image';

const captureChart = async (element: HTMLElement) => {
  return await htmlToImage.toPng(element, {
    quality: 0.95,
    pixelRatio: 2,
    backgroundColor: '#ffffff'
  });
};
```

### 4. KPI Card Formatting Lost

**Problem**: KPI cards lose their styling in exports.

**Solution**: Capture KPI cards as images to preserve formatting:

```typescript
const kpiCards = element.querySelectorAll('.kpi-card');
for (const card of kpiCards) {
  const imageData = await htmlToImage.toPng(card);
  // Use imageData in export
}
```

### 5. Large Data Sets Causing Timeouts

**Problem**: Export fails or times out with large datasets.

**Solution**: Implement chunking and progress indicators:

```typescript
const exportLargeDataset = async (data: any[], chunkSize = 1000) => {
  const chunks = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  
  for (const [index, chunk] of chunks.entries()) {
    await processChunk(chunk);
    updateProgress((index + 1) / chunks.length * 100);
  }
};
```

## Format-Specific Issues

### PDF Export

**Issue**: Text overlapping or cut off
```typescript
// Add proper margins and page breaks
doc.autoTable({
  margin: { top: 60, left: 40, right: 40 },
  pageBreak: 'auto',
  styles: { overflow: 'linebreak' }
});
```

### PowerPoint Export

**Issue**: Slides not loading or library errors
```typescript
// Ensure PptxGenJS is loaded from CDN
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
document.head.appendChild(script);
```

### Excel Export

**Issue**: Formulas not calculating
```typescript
// Use XLSX formula notation
worksheet['C1'] = { f: 'SUM(A1:B1)' };
```

## Debug Utilities

### Check Section States
```typescript
const debugSectionStates = () => {
  const sections = document.querySelectorAll('.section-header');
  sections.forEach(section => {
    const title = section.querySelector('.section-title')?.textContent;
    const isExpanded = section.querySelector('.expand-icon')?.textContent === '−';
    console.log(`${title}: ${isExpanded ? 'EXPANDED' : 'COLLAPSED'}`);
  });
};
```

### Verify Export Mode
```typescript
const verifyExportMode = () => {
  const exportMode = document.body.classList.contains('export-mode');
  const allTabsVisible = document.querySelectorAll('.tab-panel[data-export-visible="true"]').length;
  console.log(`Export Mode: ${exportMode}, Visible Tabs: ${allTabsVisible}`);
};
```

## Best Practices

1. **Always test exports** with both expanded and collapsed content
2. **Use async/await** for all capture operations
3. **Add error boundaries** around export functionality
4. **Implement retry logic** for failed captures
5. **Provide user feedback** during long export operations

## Related Documentation

- [Export Implementation Guide](./export-implementation.md)
- [CSV Export Guide](./csv-export-guide.md)
- [PowerPoint Export Guide](./powerpoint-export-guide.md)