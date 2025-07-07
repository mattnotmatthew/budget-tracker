# Simple Chart Capture Fix - No More Cutoff Issues

## The Real Problem

Your chart cutoff and malformed images are caused by **html2canvas viewport issues**, not complex styling problems. The solution is much simpler than we've been making it.

## Root Causes of Chart Issues

1. **Viewport scaling** - html2canvas captures based on current browser window size
2. **Device pixel ratio** - High-DPI screens cause scaling issues  
3. **Container sizing** - Charts rendered in containers with set heights get cut off
4. **Window dimensions** - html2canvas doesn't handle window size variations well

## Simple Solution: Replace html2canvas with html-to-image

Based on the research, `html-to-image` is faster, more reliable, and doesn't have the scaling issues that html2canvas has.

---

## Step 1: Install html-to-image

```bash
npm install html-to-image
```

## Step 2: Replace Chart Capture Functions

**File:** `src/utils/exportUtils.ts`

**Replace the chart capture functions with these simplified versions:**

```typescript
// Replace html2canvas import with html-to-image
import * as htmlToImage from 'html-to-image';

// Simple, reliable chart capture - no more cutoff issues
export const convertChartToImage = async (
  chartElement: HTMLElement,
  scale: number = 2
): Promise<string | null> => {
  try {
    console.log('Capturing chart with simple method...');
    
    // Ensure element is visible and has dimensions
    if (!chartElement || chartElement.offsetWidth === 0 || chartElement.offsetHeight === 0) {
      console.warn('Chart element is not visible or has no dimensions');
      return null;
    }

    // Simple capture with html-to-image (no complex configuration needed)
    const dataUrl = await htmlToImage.toPng(chartElement, {
      quality: 0.95,
      pixelRatio: scale,
      backgroundColor: '#ffffff',
      // Simple dimensions - use actual element size
      width: chartElement.offsetWidth,
      height: chartElement.offsetHeight
    });

    return dataUrl;
    
  } catch (error) {
    console.error('Error converting chart to image:', error);
    return null;
  }
};

// Simple KPI card capture
export const captureKPICards = async (element: HTMLElement): Promise<{ type: 'kpi-cards', images: string[], layout: string }[]> => {
  const kpiSections: { type: 'kpi-cards', images: string[], layout: string }[] = [];
  const processedElements = new Set<HTMLElement>();
  
  const kpiSectionElements = element.querySelectorAll('.kpi-cards:not(.vendor-kpi-grid)');
  
  for (let i = 0; i < kpiSectionElements.length; i++) {
    const section = kpiSectionElements[i];
    const sectionElement = section as HTMLElement;
    
    if (sectionElement.offsetHeight === 0) continue;
    if (processedElements.has(sectionElement)) continue;
    
    processedElements.add(sectionElement);
    
    try {
      console.log('Capturing KPI section with simple method...');
      
      // Simple capture - no complex preparation needed
      const imageData = await htmlToImage.toPng(sectionElement, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      
      const cards = sectionElement.querySelectorAll('.kpi-card');
      const layout = cards.length <= 2 ? 'half' : cards.length <= 3 ? 'third' : 'quarter';
      
      kpiSections.push({
        type: 'kpi-cards',
        images: [imageData],
        layout: layout
      });
      
    } catch (error) {
      console.error('Failed to capture KPI section:', error);
    }
  }
  
  return kpiSections;
};

// Simple styled sections capture
export const captureStyledSections = async (element: HTMLElement): Promise<{ type: string, image: string }[]> => {
  const styledSections: { type: string, image: string }[] = [];
  const processedElements = new Set<HTMLElement>();
  
  const styledSelectors = [
    { selector: '.vendor-kpi-grid:not(.kpi-cards)', type: 'vendor-grid' },
    { selector: '.hiring-analysis-container', type: 'hiring-analysis' },
    { selector: '.monthly-spending-grid', type: 'monthly-spending' },
    { selector: '.vendor-info-section .vendor-kpi-grid', type: 'vendor-tracking' }
  ];
  
  for (const { selector, type } of styledSelectors) {
    const sections = element.querySelectorAll(selector);
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionElement = section as HTMLElement;
      
      if (sectionElement.offsetHeight === 0) continue;
      if (processedElements.has(sectionElement)) continue;
      processedElements.add(sectionElement);
      
      try {
        console.log(`Capturing ${type} with simple method...`);
        
        const imageData = await htmlToImage.toPng(sectionElement, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: '#ffffff'
        });
        
        styledSections.push({ type, image: imageData });
        
      } catch (error) {
        console.error(`Failed to capture ${type} section:`, error);
      }
    }
  }
  
  return styledSections;
};

// Simple chart detection and conversion
export const detectAndConvertCharts = async (element: HTMLElement): Promise<string[]> => {
  const chartImages: string[] = [];
  
  // Simple wait for charts to render
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const chartSelectors = [
    'svg.recharts-surface',
    '.recharts-wrapper',
    '.recharts-responsive-container',
    '[class*="trend-chart"]',
    '.chart-container canvas',
    '.spending-trend-chart',
    '.monthly-trend-chart',
    '.spending-chart-container',
    '.variance-chart'
  ];
  
  for (const selector of chartSelectors) {
    const charts = element.querySelectorAll(selector);
    
    for (let i = 0; i < charts.length; i++) {
      const chart = charts[i];
      const chartElement = chart as HTMLElement;
      
      if (chartElement.offsetWidth === 0 || chartElement.offsetHeight === 0) {
        console.warn('Chart has no dimensions:', selector);
        continue;
      }
      
      try {
        console.log(`Capturing chart: ${selector}`);
        
        // Simple capture - let html-to-image handle the complexity
        const imageData = await htmlToImage.toPng(chartElement, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: '#ffffff'
        });
        
        if (imageData && imageData.length > 1000) {
          chartImages.push(imageData);
        }
      } catch (error) {
        console.error('Failed to convert chart:', error);
      }
    }
  }
  
  return chartImages;
};

// Simplified element preparation (minimal changes needed)
export const prepareElementForCapture = async (element: HTMLElement): Promise<void> => {
  // Force layout recalculation
  element.offsetHeight;
  
  // Wait for images to load
  const images = element.querySelectorAll('img');
  const imagePromises = Array.from(images).map(img => {
    const imgElement = img as HTMLImageElement;
    if (imgElement.complete) return Promise.resolve();
    return new Promise(resolve => {
      imgElement.addEventListener('load', resolve);
      imgElement.addEventListener('error', resolve);
    });
  });
  
  await Promise.all(imagePromises);
  
  // Wait for fonts
  if ('fonts' in document) {
    await document.fonts.ready;
  }
  
  // Small delay for stability
  await new Promise(resolve => setTimeout(resolve, 100));
};

// Keep the existing chart preparation (but simpler)
export const prepareChartsForCapture = (container: HTMLElement): void => {
  const charts = container.querySelectorAll('.recharts-wrapper, .recharts-responsive-container');
  
  charts.forEach((chart, index) => {
    const chartElement = chart as HTMLElement;
    chartElement.dataset.chartId = `chart-${index}`;
    chartElement.style.visibility = 'visible';
    chartElement.style.opacity = '1';
    chartElement.offsetHeight; // Trigger reflow
  });
};
```

## Step 3: Update Package Dependencies

**Add to package.json:**
```bash
npm install html-to-image
```

**Optional - Remove html2canvas if not used elsewhere:**
```bash
npm uninstall html2canvas
```

---

## Why This Fixes Your Chart Issues

### **html2canvas Problems (What You Were Experiencing):**
- ❌ **Viewport scaling issues** - Charts appear different sizes on different screens
- ❌ **Device pixel ratio problems** - High-DPI screens cause malformed images
- ❌ **Window size dependencies** - Charts get cut off based on browser window
- ❌ **Complex configuration needed** - Tons of options that still don't work reliably

### **html-to-image Advantages (What You'll Get):**
- ✅ **Consistent sizing** - Charts always capture at their actual size
- ✅ **No viewport dependencies** - Works regardless of browser window size  
- ✅ **Simpler API** - Fewer configuration options, more reliable results
- ✅ **Better performance** - Faster and uses less memory
- ✅ **No cutting off** - Captures complete elements reliably

---

## Expected Results

### **Before (html2canvas):**
- Charts cut off at weird places
- Images look malformed or stretched
- Different results on different screen sizes
- Inconsistent proportions

### **After (html-to-image):**
- Charts capture completely and cleanly
- Consistent image quality and proportions
- Same results regardless of screen size
- Much simpler and more reliable

---

## Testing the Fix

1. **Replace the functions** in `exportUtils.ts`
2. **Install html-to-image** package
3. **Test chart capture** - should be clean and complete
4. **Test on different screen sizes** - should be consistent
5. **Export to PowerPoint** - charts should appear properly sized

## The Bottom Line

You're absolutely right - transposing content to slides shouldn't be complicated. The issue was that html2canvas is overcomplicated and has fundamental viewport/scaling problems. 

**html-to-image** is the simpler, more reliable solution that just works without all the configuration headaches.

This should fix your chart cutoff and malformed image issues immediately.