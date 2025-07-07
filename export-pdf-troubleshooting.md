Looking at your code, I can see the issue. The problem is that when you're extracting content for the slides, the tab panels are likely hidden (display: none) or not properly rendered, which causes html2canvas to capture blank content. Additionally, React charts need special handling to be captured properly.

Here are the main issues and solutions:

## 1. **Tab Visibility During Export**

In `exportUtils.ts`, you have functions to expand sections and make tabs visible, but the tab panels might still be hidden. Add this to your `expandAllSections` function:

```typescript
export const expandAllSections = (): void => {
  // ... existing code ...

  // Force all tab panels to be visible
  const allTabPanels = document.querySelectorAll('[role="tabpanel"]');
  allTabPanels.forEach(panel => {
    const panelElement = panel as HTMLElement;
    // Remove any display:none or visibility:hidden
    panelElement.style.display = 'block';
    panelElement.style.visibility = 'visible';
    panelElement.style.opacity = '1';
    
    // Remove hidden class if it exists
    panelElement.classList.remove('hidden');
    
    // Force a specific height if needed
    if (panelElement.offsetHeight === 0) {
      panelElement.style.minHeight = '500px';
    }
  });

  // ... rest of existing code ...
};
```

## 2. **React Charts Not Capturing**

React charts (Recharts) render as SVG elements that need special handling. Update your `detectAndConvertCharts` function:

```typescript
export const detectAndConvertCharts = async (element: HTMLElement): Promise<string[]> => {
  const chartImages: string[] = [];
  
  // Wait for any React re-renders
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Find Recharts containers specifically
  const chartSelectors = [
    '.recharts-wrapper',
    '.recharts-responsive-container',
    '[class*="trend-chart-section"]' // Your specific chart sections
  ];
  
  for (const selector of chartSelectors) {
    const charts = element.querySelectorAll(selector);
    
    for (const chart of charts) {
      const chartElement = chart as HTMLElement;
      
      // Ensure chart is visible
      if (chartElement.offsetWidth === 0 || chartElement.offsetHeight === 0) {
        console.warn('Chart has no dimensions:', selector);
        continue;
      }
      
      try {
        // Find the SVG element within the chart container
        const svg = chartElement.querySelector('svg.recharts-surface');
        if (svg) {
          // Clone the SVG to ensure we capture it properly
          const svgClone = svg.cloneNode(true) as SVGElement;
          
          // Create a temporary container
          const tempContainer = document.createElement('div');
          tempContainer.style.position = 'absolute';
          tempContainer.style.left = '-9999px';
          tempContainer.style.width = `${svg.clientWidth}px`;
          tempContainer.style.height = `${svg.clientHeight}px`;
          tempContainer.appendChild(svgClone);
          document.body.appendChild(tempContainer);
          
          // Capture the cloned SVG
          const canvas = await html2canvas(tempContainer, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false
          });
          
          // Clean up
          document.body.removeChild(tempContainer);
          
          const imageData = canvas.toDataURL('image/png');
          if (imageData && imageData.length > 1000) {
            chartImages.push(imageData);
          }
        } else {
          // Fallback to capturing the container
          const imageData = await convertChartToImage(chartElement);
          if (imageData) {
            chartImages.push(imageData);
          }
        }
      } catch (error) {
        console.error('Failed to convert chart:', error);
      }
    }
  }
  
  return chartImages;
};
```

## 3. **Content Extraction Issues**

Update your `extractTextContent` function to better handle the Executive Summary structure:

```typescript
const extractTextContent = (element: HTMLElement, tabId?: string): string[] => {
  const content: string[] = [];
  
  // Debug log
  console.log(`Extracting content for ${tabId}, element:`, element);
  console.log(`Element visible:`, element.offsetHeight > 0);
  
  // Special handling for Executive Commentary
  if (tabId === 'executive-commentary') {
    // Look for the textarea or the print-text div
    const textarea = element.querySelector('.commentary-textarea') as HTMLTextAreaElement;
    const printText = element.querySelector('.commentary-print-text');
    
    if (textarea && textarea.value) {
      const paragraphs = textarea.value.split(/\n\n+/).filter(p => p.trim());
      return paragraphs.length > 0 ? paragraphs : ['No executive commentary provided'];
    } else if (printText) {
      const paragraphs = Array.from(printText.querySelectorAll('p'))
        .map(p => p.textContent?.trim())
        .filter(text => text && text.length > 0);
      return paragraphs.length > 0 ? paragraphs : ['No executive commentary provided'];
    }
  }
  
  // For KPI sections, extract the actual values
  if (tabId === 'overall-budget') {
    const kpiCards = element.querySelectorAll('.kpi-card');
    kpiCards.forEach(card => {
      const title = card.querySelector('.kpi-title')?.textContent?.trim();
      const value = card.querySelector('.kpi-value')?.textContent?.trim();
      if (title && value) {
        content.push(`${title}: ${value}`);
      }
    });
  }
  
  // Continue with existing extraction logic...
  // ... rest of your existing code ...
  
  return content.length > 0 ? content : ['No content found for ' + tabId];
};
```

## 4. **Fix Tab Panel Detection**

Update your `extractTabContent` function to better find tab panels:

```typescript
export const extractTabContent = (tabId: string, tabLabel: string): SlideData | null => {
  console.log(`Looking for tab panel: ${tabId}`);
  
  // Try multiple selectors
  let tabPanel = document.querySelector(`[aria-labelledby="tab-${tabId}"]`) ||
                 document.querySelector(`#tab-panel-${tabId}`) ||
                 document.querySelector(`.tab-panel[data-tab="${tabId}"]`);
  
  // If not found, look for visible tab panels with matching content
  if (!tabPanel) {
    const allPanels = document.querySelectorAll('.tab-panel');
    for (const panel of allPanels) {
      // Check if this panel contains content related to this tab
      const hasMatchingHeading = panel.textContent?.includes(tabLabel);
      const hasMatchingClass = panel.className.includes(tabId);
      
      if (hasMatchingHeading || hasMatchingClass) {
        tabPanel = panel;
        break;
      }
    }
  }
  
  if (!tabPanel) {
    console.warn(`Tab panel not found for: ${tabId}`);
    return null;
  }
  
  // Ensure the panel is visible
  const panelElement = tabPanel as HTMLElement;
  if (panelElement.offsetHeight === 0) {
    console.warn(`Tab panel ${tabId} has no height - may be hidden`);
    panelElement.style.display = 'block';
    panelElement.style.visibility = 'visible';
  }
  
  // Extract content...
  const content = extractTextContent(panelElement, tabId);
  const tables = extractTables(panelElement);
  
  return {
    id: tabId,
    title: tabLabel,
    content: content,
    tables: tables,
    metadata: {
      tabId: tabId,
      tabLabel: tabLabel,
      extractedAt: new Date().toISOString()
    }
  };
};
```

## 5. **In ExportModal, ensure proper timing**

In your `loadSlideContent` function in `ExportModal.tsx`, increase the wait time:

```typescript
const loadSlideContent = async () => {
  setIsLoadingPreview(true);
  try {
    // Expand all sections
    expandAllSections();
    
    // Wait longer for React to re-render
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Force a re-render by triggering a resize event
    window.dispatchEvent(new Event('resize'));
    
    // Wait a bit more
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Extract content from all tabs
    const extractedSlides = await extractAllTabsContentWithCharts();
    
    // ... rest of code
  } catch (error) {
    console.error('Failed to load slide content:', error);
  } finally {
    setIsLoadingPreview(false);
  }
};
```

## 6. **Debug Helper**

Add this debug function to see what's happening:

```typescript
export const debugTabVisibility = () => {
  const allPanels = document.querySelectorAll('.tab-panel');
  console.log('Total tab panels found:', allPanels.length);
  
  allPanels.forEach((panel, index) => {
    const el = panel as HTMLElement;
    console.log(`Panel ${index}:`, {
      id: el.id,
      class: el.className,
      display: window.getComputedStyle(el).display,
      visibility: window.getComputedStyle(el).visibility,
      height: el.offsetHeight,
      hasContent: el.textContent?.length || 0
    });
  });
};
```

Call this in your `loadSlideContent` before and after expanding sections to see what's happening.

The main issues are:
1. Tab panels are hidden when not active
2. Charts need special handling for capture
3. Content extraction needs to match your actual DOM structure
4. Timing issues with React re-renders

Try these fixes and let me know if you're still getting blank slides!