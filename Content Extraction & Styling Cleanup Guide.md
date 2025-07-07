# Content Extraction & Styling Cleanup Guide

## Common Issues From Previous PowerPoint Export Attempts

Based on research and common problems, here are likely issues in your current content extraction that need cleanup:

---

## Issue 1: html2canvas Styling Problems

### **Problem**: CSS styles that don't capture properly
- **Transform/rotate properties** - html2canvas has poor support
- **Negative margins** - Can cause positioning issues  
- **CSS Grid/Flexbox** - Inconsistent rendering
- **Custom fonts** - May not load in time for capture
- **SVG icons** - Often missing in captures
- **Cross-origin images** - CORS issues

### **Solution**: Clean up exportUtils.ts

**File:** `src/utils/exportUtils.ts`

**Find the `prepareElementForCapture` function and update:**

```typescript
// Enhanced preparation for better html2canvas compatibility
export const prepareElementForCapture = async (element: HTMLElement): Promise<void> => {
  // Force layout recalculation
  element.offsetHeight;
  
  // Wait for all images to load
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
  
  // Wait for fonts to load
  if ('fonts' in document) {
    await document.fonts.ready;
  }
  
  // Fix common html2canvas issues
  fixElementForCapture(element);
  
  // Small delay for any CSS transitions/animations to complete
  await new Promise(resolve => setTimeout(resolve, 200));
};

// Fix elements before capture
function fixElementForCapture(element: HTMLElement): void {
  // Remove problematic transforms that html2canvas can't handle
  const elementsWithTransforms = element.querySelectorAll('[style*="transform"]');
  elementsWithTransforms.forEach(el => {
    const htmlEl = el as HTMLElement;
    const transform = htmlEl.style.transform;
    
    // Store original transform for restoration
    htmlEl.setAttribute('data-original-transform', transform);
    
    // Remove problematic transforms
    if (transform.includes('rotate') || transform.includes('skew')) {
      htmlEl.style.transform = transform
        .replace(/rotate\([^)]*\)/g, '')
        .replace(/skew\([^)]*\)/g, '')
        .trim();
    }
  });
  
  // Fix negative margins that cause issues
  const elementsWithNegativeMargins = element.querySelectorAll('*');
  elementsWithNegativeMargins.forEach(el => {
    const htmlEl = el as HTMLElement;
    const computedStyle = window.getComputedStyle(htmlEl);
    
    ['marginTop', 'marginLeft', 'marginRight', 'marginBottom'].forEach(prop => {
      const value = computedStyle[prop as any];
      if (value && value.startsWith('-')) {
        htmlEl.setAttribute(`data-original-${prop}`, value);
        htmlEl.style[prop as any] = '0px';
      }
    });
  });
  
  // Force visibility for hidden elements that should be captured
  const hiddenElements = element.querySelectorAll('[style*="display: none"], [style*="visibility: hidden"]');
  hiddenElements.forEach(el => {
    const htmlEl = el as HTMLElement;
    const computedStyle = window.getComputedStyle(htmlEl);
    
    if (computedStyle.display === 'none') {
      htmlEl.setAttribute('data-original-display', 'none');
      htmlEl.style.display = 'block';
    }
    if (computedStyle.visibility === 'hidden') {
      htmlEl.setAttribute('data-original-visibility', 'hidden');
      htmlEl.style.visibility = 'visible';
    }
  });
  
  // Convert SVG icons to data URLs for better capture
  const svgElements = element.querySelectorAll('svg');
  svgElements.forEach(svg => {
    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      // Replace with img element temporarily
      const img = document.createElement('img');
      img.src = svgUrl;
      img.width = svg.clientWidth || 24;
      img.height = svg.clientHeight || 24;
      img.setAttribute('data-original-svg', 'true');
      
      svg.setAttribute('data-replaced-with-img', 'true');
      svg.style.display = 'none';
      svg.parentNode?.insertBefore(img, svg);
    } catch (error) {
      console.warn('Failed to convert SVG:', error);
    }
  });
}

// Restore elements after capture
export const restoreElementAfterCapture = (element: HTMLElement): void => {
  // Restore transforms
  const elementsWithOriginalTransforms = element.querySelectorAll('[data-original-transform]');
  elementsWithOriginalTransforms.forEach(el => {
    const htmlEl = el as HTMLElement;
    const originalTransform = htmlEl.getAttribute('data-original-transform');
    if (originalTransform) {
      htmlEl.style.transform = originalTransform;
      htmlEl.removeAttribute('data-original-transform');
    }
  });
  
  // Restore negative margins
  ['marginTop', 'marginLeft', 'marginRight', 'marginBottom'].forEach(prop => {
    const elementsWithOriginalMargin = element.querySelectorAll(`[data-original-${prop}]`);
    elementsWithOriginalMargin.forEach(el => {
      const htmlEl = el as HTMLElement;
      const originalValue = htmlEl.getAttribute(`data-original-${prop}`);
      if (originalValue) {
        htmlEl.style[prop as any] = originalValue;
        htmlEl.removeAttribute(`data-original-${prop}`);
      }
    });
  });
  
  // Restore display/visibility
  const elementsWithOriginalDisplay = element.querySelectorAll('[data-original-display]');
  elementsWithOriginalDisplay.forEach(el => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.display = htmlEl.getAttribute('data-original-display') || '';
    htmlEl.removeAttribute('data-original-display');
  });
  
  const elementsWithOriginalVisibility = element.querySelectorAll('[data-original-visibility]');
  elementsWithOriginalVisibility.forEach(el => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.visibility = htmlEl.getAttribute('data-original-visibility') || '';
    htmlEl.removeAttribute('data-original-visibility');
  });
  
  // Restore SVGs
  const replacedSvgs = element.querySelectorAll('[data-replaced-with-img]');
  replacedSvgs.forEach(svg => {
    const htmlSvg = svg as HTMLElement;
    htmlSvg.style.display = '';
    htmlSvg.removeAttribute('data-replaced-with-img');
    
    // Remove the temporary img element
    const tempImg = htmlSvg.parentNode?.querySelector('[data-original-svg]');
    if (tempImg) {
      tempImg.remove();
    }
  });
};
```

---

## Issue 2: Improved html2canvas Configuration

### **Problem**: Default html2canvas settings miss content

**Update your chart and image capture functions:**

```typescript
// Enhanced html2canvas configuration
export const convertChartToImage = async (
  chartElement: HTMLElement,
  scale: number = 2
): Promise<string | null> => {
  try {
    // Prepare element first
    await prepareElementForCapture(chartElement);
    
    // Enhanced html2canvas configuration
    const canvas = await html2canvas(chartElement, {
      scale: scale,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: chartElement.offsetWidth,
      height: chartElement.offsetHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      // Enhanced options for better capture
      foreignObjectRendering: true,
      removeContainer: true,
      imageTimeout: 15000,
      onclone: (clonedDoc, originalElement) => {
        // Ensure all styles are preserved in clone
        const clonedElement = clonedDoc.body.querySelector(`[data-chart-id="${originalElement.dataset.chartId || ''}"]`);
        
        if (clonedElement) {
          // Copy computed styles
          const computedStyle = window.getComputedStyle(originalElement);
          (clonedElement as HTMLElement).style.cssText = computedStyle.cssText;
          
          // Ensure visibility
          (clonedElement as HTMLElement).style.visibility = 'visible';
          (clonedElement as HTMLElement).style.opacity = '1';
          (clonedElement as HTMLElement).style.display = 'block';
        }
      }
    });

    // Restore element
    restoreElementAfterCapture(chartElement);

    const imageData = canvas.toDataURL('image/png', 0.9);
    
    if (imageData && imageData.length > 1000) {
      return imageData;
    } else {
      console.warn('Generated chart image appears to be empty or too small');
      return null;
    }
    
  } catch (error) {
    console.error('Error converting chart to image:', error);
    restoreElementAfterCapture(chartElement);
    return null;
  }
};
```

---

## Issue 3: Better KPI Card Capture

### **Problem**: KPI cards lose styling during capture

**Update the `captureKPICards` function:**

```typescript
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
      // Enhanced preparation
      await prepareElementForCapture(sectionElement);
      
      // Force all child elements to be visible and properly styled
      const kpiCards = sectionElement.querySelectorAll('.kpi-card');
      kpiCards.forEach(card => {
        const cardEl = card as HTMLElement;
        cardEl.style.position = 'relative';
        cardEl.style.display = 'block';
        cardEl.style.visibility = 'visible';
        cardEl.style.opacity = '1';
      });
      
      // Wait a moment for styles to apply
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(sectionElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true,
        removeContainer: true,
        onclone: (clonedDoc) => {
          // Ensure all styles are preserved in the clone
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((clonedEl, index) => {
            const originalEl = sectionElement.querySelectorAll('*')[index];
            if (originalEl) {
              const computedStyle = window.getComputedStyle(originalEl);
              (clonedEl as HTMLElement).style.cssText = computedStyle.cssText;
            }
          });
        }
      });
      
      // Restore element
      restoreElementAfterCapture(sectionElement);
      
      const imageData = canvas.toDataURL('image/png', 0.95);
      
      const cards = sectionElement.querySelectorAll('.kpi-card');
      const layout = cards.length <= 2 ? 'half' : cards.length <= 3 ? 'third' : 'quarter';
      
      kpiSections.push({
        type: 'kpi-cards',
        images: [imageData],
        layout: layout
      });
      
    } catch (error) {
      console.error('Failed to capture KPI section:', error);
      restoreElementAfterCapture(sectionElement);
    }
  }
  
  return kpiSections;
};
```

---

## Issue 4: Section Expansion Problems

### **Problem**: Sections don't expand properly or stay expanded

**Update the expansion functions:**

```typescript
export const expandAllSections = (): void => {
  console.log('Starting enhanced section expansion...');
  
  savedSectionStates = [];
  
  // 1. Make all tab panels visible
  const allTabPanels = document.querySelectorAll('.tab-panel[role="tabpanel"]');
  allTabPanels.forEach(panel => {
    const panelElement = panel as HTMLElement;
    
    // Save original state
    savedSectionStates.push({
      element: panelElement,
      originalDisplay: panelElement.style.display,
      originalHeight: panelElement.style.height,
      originalOverflow: panelElement.style.overflow,
      wasCollapsed: panelElement.style.display === 'none'
    });
    
    // Force visibility
    panelElement.style.display = 'block';
    panelElement.style.visibility = 'visible';
    panelElement.style.opacity = '1';
    panelElement.classList.remove('hidden');
    
    if (panelElement.offsetHeight === 0) {
      panelElement.style.minHeight = '500px';
    }
  });

  // 2. Click expand buttons more reliably
  const expandableElements = [
    '.section-header', 
    '.collapsible-header',
    '.toggle-button',
    '[data-toggle]',
    '.expand-button'
  ];
  
  expandableElements.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      const el = element as HTMLElement;
      
      // Check if it's in collapsed state
      const expandIcon = el.querySelector('.expand-icon');
      const isCollapsed = expandIcon?.textContent === '+' || 
                         el.textContent?.includes('+') ||
                         el.classList.contains('collapsed');
      
      if (isCollapsed) {
        // Save state
        savedSectionStates.push({
          element: el,
          originalDisplay: '',
          originalHeight: '',
          originalOverflow: '',
          wasCollapsed: true
        });
        
        // Trigger expansion
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        el.dispatchEvent(clickEvent);
      }
    });
  });

  // 3. Force expand any remaining collapsed elements
  const stillCollapsed = document.querySelectorAll('.collapsed, [data-collapsed="true"]');
  stillCollapsed.forEach(element => {
    const el = element as HTMLElement;
    
    savedSectionStates.push({
      element: el,
      originalDisplay: el.style.display,
      originalHeight: el.style.height,
      originalOverflow: el.style.overflow,
      wasCollapsed: true
    });
    
    el.classList.remove('collapsed');
    el.removeAttribute('data-collapsed');
    el.style.display = 'block';
    el.style.height = 'auto';
    el.style.overflow = 'visible';
    el.setAttribute('data-export-expanded', 'true');
  });

  console.log(`Enhanced expansion: processed ${savedSectionStates.length} elements`);
};

export const restoreSectionStates = (): void => {
  console.log('Restoring section states...');
  
  savedSectionStates.forEach(state => {
    if (state.wasCollapsed) {
      // Restore original state
      if (state.originalDisplay) {
        state.element.style.display = state.originalDisplay;
      } else {
        state.element.classList.add('collapsed');
      }
      
      state.element.style.height = state.originalHeight;
      state.element.style.overflow = state.originalOverflow;
      state.element.removeAttribute('data-export-expanded');
      
      if (state.element.hasAttribute('data-export-expanded')) {
        state.element.setAttribute('data-collapsed', 'true');
      }
    }
  });

  savedSectionStates = [];
  console.log('Section states restored');
};
```

---

## Issue 5: Update extractTabContentWithCharts

### **Problem**: Content extraction doesn't wait for proper styling

**Update the main extraction function:**

```typescript
export const extractTabContentWithCharts = async (tabId: string, tabLabel: string): Promise<SlideData | null> => {
  const tabPanel = document.querySelector(`[aria-labelledby="tab-${tabId}"]`) ||
                   document.querySelector(`[role="tabpanel"][id*="${tabId}"]`) ||
                   findTabPanelByContent(tabId);

  if (!tabPanel) {
    console.warn(`Tab panel not found for: ${tabId}`);
    return null;
  }

  const tabElement = tabPanel as HTMLElement;
  
  try {
    // Enhanced preparation with proper sequencing
    console.log(`Preparing ${tabId} for content extraction...`);
    
    // 1. Prepare element for capture
    await prepareElementForCapture(tabElement);
    
    // 2. Prepare charts for capture
    prepareChartsForCapture(tabElement);
    
    // 3. Wait for everything to settle
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 4. Extract content based on tab type
    let kpiCardImages: string[] = [];
    let kpiLayout: 'full' | 'half' | 'third' | 'quarter' = 'third';
    let content: string[] = [];
    let styledSections: { type: string, image: string }[] = [];
    
    if (tabId === 'overall-budget') {
      // Special handling for overall budget
      ({ content, styledSections } = await extractOverallBudgetContent(tabElement));
      kpiCardImages = [];
      kpiLayout = 'full';
    } else {
      // Regular flow for other tabs
      const kpiSections = await captureKPICards(tabElement);
      kpiCardImages = kpiSections.flatMap(section => section.images);
      kpiLayout = (kpiSections[0]?.layout || 'third') as 'full' | 'half' | 'third' | 'quarter';
      
      styledSections = await captureStyledSections(tabElement);
      
      const skipKPIText = kpiCardImages.length > 0;
      content = extractTextContentSelectively(tabElement, tabId, skipKPIText);
    }
    
    // 5. Extract tables and charts
    const tables = extractTables(tabElement);
    const chartImages = await detectAndConvertCharts(tabElement);
    
    // 6. Restore element
    restoreElementAfterCapture(tabElement);
    
    return {
      id: tabId,
      title: tabLabel,
      content: content,
      charts: chartImages,
      kpiCards: kpiCardImages,
      kpiLayout: kpiLayout,
      styledSections: styledSections,
      tables: tables,
      metadata: {
        tabId: tabId,
        tabLabel: tabLabel,
        extractedAt: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error(`Failed to extract content for ${tabId}:`, error);
    restoreElementAfterCapture(tabElement);
    return null;
  }
};
```

---

## Testing the Cleanup

After implementing these fixes, test each problematic area:

1. **KPI Cards**: Should capture with proper styling
2. **Charts**: Should render without missing elements  
3. **Tables**: Should expand and capture completely
4. **Section Expansion**: Should work reliably
5. **SVG Icons**: Should appear in captures
6. **Negative Margins**: Should not cause positioning issues

This cleanup should resolve the "weird behaviors" from previous PowerPoint export attempts while maintaining compatibility with the new PptxGenJS approach.