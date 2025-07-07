# PowerPoint Export Fixes Implementation Plan

## Summary of Issues and Solutions

### 1. Missing Section Headers in Overall Budget
**Issue**: Section headers like "Strategic Context", "YTD Performance", etc. are not preserved when KPI cards are captured as images.

**Solution**: 
- Modify `extractTextContent` to preserve section headers
- Include headers as separate text elements before KPI card images

### 2. Budget Visuals Slide Not Including Both Charts and Tables
**Issue**: Charts or tables may be missing from the Budget Visuals slide due to timing or selection issues.

**Solution**:
- Add explicit waits for chart rendering
- Improve chart detection logic
- Ensure both charts and tables are captured

### 3. Duplicate Vendor KPI Cards
**Issue**: Vendor KPI cards are captured both as images (via `.vendor-kpi-grid`) and as text content.

**Solution**:
- Enhance the `skipKPIText` logic in `extractTextContentSelectively`
- Add explicit checks for vendor KPI elements
- Prevent text extraction when vendor KPI images are captured

### 4. Resource Allocation Slide Cut Off
**Issue**: Fixed slide dimensions with `overflow: hidden` cause content truncation.

**Solution**:
- Implement content measurement before rendering
- Split long content across multiple slides
- Add pagination logic for tables with many rows

## Implementation Steps

### Step 1: Fix Section Headers
In `exportUtils.ts`, modify the `extractTextContent` function to capture section headers:

```typescript
// Add before line 217 in extractTextContent
if (tabId === 'overall-budget') {
  // Capture section headers
  const sectionHeaders = element.querySelectorAll('.section-title');
  sectionHeaders.forEach(header => {
    const title = header.textContent?.trim();
    if (title && !content.includes(title)) {
      // Remove expand/collapse icons
      const cleanTitle = title.replace(/[−+]\s*/, '').trim();
      content.push(`**${cleanTitle}**`); // Mark as header
    }
  });
  
  // Then capture KPI values...
  const kpiCards = element.querySelectorAll('.kpi-card');
  // ... existing KPI extraction code
}
```

### Step 2: Fix Vendor Duplication
In `extractTextContentSelectively`, enhance the skip logic:

```typescript
// Around line 138 in extractTextContentSelectively
if (skipKPIText) {
  // Enhanced selectors to skip vendor KPI text
  const skipSelectors = [
    '.kpi-card',
    '.kpi-cards',
    '.kpi-section',
    '.vendor-kpi-grid',
    '.vendor-kpi-card',
    '.vendor-kpi-title',
    '.vendor-kpi-value',
    '.vendor-kpi-label',
    '.vendor-kpi-description'
  ];
  
  // Check if element or any parent matches skip selectors
  const shouldSkip = skipSelectors.some(selector => 
    el.matches(selector) || el.closest(selector)
  );
  
  if (shouldSkip) return;
}
```

### Step 3: Fix Budget Visuals
Enhance chart detection and waiting:

```typescript
// In detectAndConvertCharts function
export const detectAndConvertCharts = async (element: HTMLElement): Promise<string[]> => {
  const chartImages: string[] = [];
  
  // Wait for recharts to render
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Force a resize event to trigger chart rerender
  window.dispatchEvent(new Event('resize'));
  
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Enhanced chart selectors
  const chartSelectors = [
    'svg.recharts-surface',
    '.recharts-wrapper',
    '.recharts-responsive-container',
    '[class*="trend-chart-section"]',
    '.chart-container canvas' // For Chart.js
  ];
  
  // ... rest of implementation
};
```

### Step 4: Fix Resource Allocation Cutoff
In `pptxGenerator.ts`, implement content pagination:

```typescript
// Add helper function to split content
const splitSlideContent = (slide: SlideData, maxContentItems: number = 10): SlideData[] => {
  if (!slide.tables || slide.tables.length === 0) {
    return [slide];
  }
  
  const slides: SlideData[] = [];
  let currentSlide: SlideData = {
    ...slide,
    tables: [],
    content: slide.content.slice(0, 5) // Keep first few content items
  };
  
  slide.tables.forEach((table, index) => {
    // Check if table has many rows
    if (table.rows.length > 8) {
      // Split table into chunks
      const chunks = [];
      for (let i = 0; i < table.rows.length; i += 8) {
        chunks.push({
          ...table,
          rows: table.rows.slice(i, i + 8),
          caption: `${table.caption} (Part ${Math.floor(i/8) + 1})`
        });
      }
      
      chunks.forEach(chunk => {
        if (currentSlide.tables!.length >= 2) {
          slides.push(currentSlide);
          currentSlide = {
            ...slide,
            id: `${slide.id}-${slides.length + 1}`,
            title: `${slide.title} (Continued)`,
            content: [],
            tables: [chunk]
          };
        } else {
          currentSlide.tables!.push(chunk);
        }
      });
    } else {
      // Add table normally
      if (currentSlide.tables!.length >= 2) {
        slides.push(currentSlide);
        currentSlide = {
          ...slide,
          id: `${slide.id}-${slides.length + 1}`,
          title: `${slide.title} (Continued)`,
          content: [],
          tables: [table]
        };
      } else {
        currentSlide.tables!.push(table);
      }
    }
  });
  
  slides.push(currentSlide);
  return slides;
};

// In generatePPTX, apply pagination
const paginatedSlides = slides.flatMap(slide => 
  slide.id === 'resources' ? splitSlideContent(slide) : [slide]
);
```

## Testing Recommendations

1. **Section Headers**: Export and verify all section headers appear in the Overall Budget slide
2. **Vendor Duplication**: Check that vendor KPI cards appear only once as images
3. **Budget Visuals**: Ensure both charts and tables are captured
4. **Resource Allocation**: Verify long tables are split across multiple slides

## Quick Implementation Priority

1. **High Priority**: Fix vendor duplication (most visible issue)
2. **Medium Priority**: Fix section headers and resource allocation cutoff
3. **Low Priority**: Budget visuals (may require more debugging)