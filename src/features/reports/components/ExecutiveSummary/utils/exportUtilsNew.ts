import { SlideData, TableData } from '../components/ExportModal';
import * as htmlToImage from 'html-to-image';

/**
 * Simplified tab content extraction with reliable selectors
 */
export const extractTabContentSimple = async (tabId: string, tabLabel: string): Promise<SlideData | null> => {
  console.log(`Extracting content for tab: ${tabId}`);
  
  // Find tab panel using reliable selector
  const tabPanel = document.querySelector(`[role="tabpanel"][aria-labelledby="tab-${tabId}"]`);
  
  if (!tabPanel) {
    console.warn(`Tab panel not found for: ${tabId}`);
    return null;
  }

  const tabElement = tabPanel as HTMLElement;
  
  try {
    // Initialize slide data
    const slideData: SlideData = {
      id: tabId,
      title: tabLabel,
      content: [],
      charts: [],
      kpiCards: [],
      styledSections: [],
      tables: [],
      metadata: {
        tabId: tabId,
        tabLabel: tabLabel,
        extractedAt: new Date().toISOString()
      }
    };

    // Capture visual elements first
    if (tabId === 'overall-budget' || tabId === 'vendor-info') {
      slideData.kpiCards = await captureKPICards(tabElement);
    }
    
    if (tabId === 'budget-visuals' || tabId === 'resource-allocation') {
      slideData.charts = await captureChartContainers(tabElement);
    }
    
    // Capture styled sections for vendor info
    if (tabId === 'vendor-info') {
      slideData.styledSections = await captureStyledSections(tabElement);
    }
    
    // Extract text content
    slideData.content = extractTextContent(tabElement, tabId);
    
    // Extract tables
    slideData.tables = extractTables(tabElement);
    
    return slideData;
    
  } catch (error) {
    console.error(`Failed to extract content for ${tabId}:`, error);
    return null;
  }
};

/**
 * Capture KPI cards preserving original grid layouts
 */
export const captureKPICards = async (element: HTMLElement): Promise<string[]> => {
  const kpiImages: string[] = [];
  
  try {
    // Find all KPI card containers
    const kpiContainers = element.querySelectorAll('.kpi-cards, .vendor-kpi-grid');
    
    for (let i = 0; i < kpiContainers.length; i++) {
      const container = kpiContainers[i];
      const containerEl = container as HTMLElement;
      
      // Skip if container is hidden or empty
      if (containerEl.offsetHeight === 0) continue;
      
      // Set explicit dimensions before capture
      const originalWidth = containerEl.style.width;
      const originalHeight = containerEl.style.height;
      containerEl.style.width = '1000px'; // Wide enough for all cards
      containerEl.style.height = 'auto';
      containerEl.offsetHeight; // Force reflow
      
      console.log(`Capturing KPI container: width=${containerEl.scrollWidth}px, height=${containerEl.scrollHeight}px`);
      
      try {
        // Capture with proper dimensions
        const imageData = await htmlToImage.toPng(containerEl, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          width: containerEl.scrollWidth,
          height: containerEl.scrollHeight
        });
        
        if (imageData && imageData.length > 1000) {
          kpiImages.push(imageData);
        }
      } catch (err) {
        console.warn('Failed to capture KPI container:', err);
      } finally {
        // Restore original styles
        containerEl.style.width = originalWidth;
        containerEl.style.height = originalHeight;
      }
    }
    
  } catch (error) {
    console.error('Error capturing KPI cards:', error);
  }
  
  return kpiImages;
};

/**
 * Capture complete chart containers including titles and legends
 */
export const captureChartContainers = async (element: HTMLElement): Promise<string[]> => {
  const chartImages: string[] = [];
  
  try {
    // Look for chart containers, not just the SVG elements
    const chartSelectors = [
      '.chart-container',
      '.spending-chart-container',
      '.monthly-trend-chart',
      '.variance-chart',
      '[class*="chart-wrapper"]',
      // Fallback to Recharts containers if no wrapper found
      '.recharts-wrapper'
    ];
    
    for (let i = 0; i < chartSelectors.length; i++) {
      const selector = chartSelectors[i];
      const charts = element.querySelectorAll(selector);
      
      for (let j = 0; j < charts.length; j++) {
        const chart = charts[j];
        const chartEl = chart as HTMLElement;
        
        // Skip if chart is hidden or empty
        if (chartEl.offsetWidth === 0 || chartEl.offsetHeight === 0) continue;
        
        try {
          // Look for parent container that might include title
          let captureElement = chartEl;
          const parentWithTitle = chartEl.closest('.chart-section, .visualization-card, [class*="chart-card"]');
          if (parentWithTitle) {
            captureElement = parentWithTitle as HTMLElement;
          }
          
          // Ensure element has proper dimensions
          const captureWidth = captureElement.scrollWidth || captureElement.offsetWidth;
          const captureHeight = captureElement.scrollHeight || captureElement.offsetHeight;
          
          const imageData = await htmlToImage.toPng(captureElement, {
            quality: 0.95,
            pixelRatio: 2,
            backgroundColor: '#ffffff',
            width: captureWidth,
            height: captureHeight
          });
          
          if (imageData && imageData.length > 1000) {
            chartImages.push(imageData);
          }
        } catch (err) {
          console.warn('Failed to capture chart:', err);
        }
      }
    }
    
  } catch (error) {
    console.error('Error capturing charts:', error);
  }
  
  return chartImages;
};

/**
 * Capture styled sections (vendor grids, etc.)
 */
export const captureStyledSections = async (element: HTMLElement): Promise<{ type: string; image: string }[]> => {
  const sections: { type: string; image: string }[] = [];
  
  try {
    const styledSelectors = [
      { selector: '.vendor-portfolio-section', type: 'vendor-portfolio' },
      { selector: '.hiring-analysis-container', type: 'hiring-analysis' },
      { selector: '.monthly-spending-grid', type: 'monthly-spending' }
    ];
    
    for (let i = 0; i < styledSelectors.length; i++) {
      const { selector, type } = styledSelectors[i];
      const elements = element.querySelectorAll(selector);
      
      for (let j = 0; j < elements.length; j++) {
        const el = elements[j];
        const sectionEl = el as HTMLElement;
        
        if (sectionEl.offsetHeight === 0) continue;
        
        try {
          const imageData = await htmlToImage.toPng(sectionEl, {
            quality: 0.95,
            pixelRatio: 2,
            backgroundColor: '#ffffff'
          });
          
          if (imageData && imageData.length > 1000) {
            sections.push({ type, image: imageData });
          }
        } catch (err) {
          console.warn(`Failed to capture ${type} section:`, err);
        }
      }
    }
    
  } catch (error) {
    console.error('Error capturing styled sections:', error);
  }
  
  return sections;
};

/**
 * Extract text content from tab
 */
export const extractTextContent = (element: HTMLElement, tabId: string): string[] => {
  const content: string[] = [];
  
  // Special handling for executive commentary
  if (tabId === 'executive-commentary') {
    const textarea = element.querySelector('.commentary-textarea') as HTMLTextAreaElement;
    const printText = element.querySelector('.commentary-print-text');
    
    if (textarea && textarea.value) {
      const paragraphs = textarea.value.split(/\n\n+/).filter(p => p.trim());
      return paragraphs.length > 0 ? paragraphs : ['No executive commentary provided'];
    } else if (printText) {
      const paragraphs = Array.from(printText.querySelectorAll('p'))
        .map(p => p.textContent?.trim())
        .filter(text => text && text.length > 0) as string[];
      return paragraphs.length > 0 ? paragraphs : ['No executive commentary provided'];
    }
    return ['No executive commentary content found'];
  }
  
  // For other tabs, extract meaningful text content
  const textSelectors = [
    'h3:not(.kpi-title)',
    'h4:not(.kpi-title)',
    '.summary-text',
    '.description-text',
    '.variance-item',
    '.trend-summary',
    'p:not(.kpi-value)'
  ];
  
  textSelectors.forEach(selector => {
    const elements = element.querySelectorAll(selector);
    elements.forEach(el => {
      const text = el.textContent?.trim();
      if (text && text.length > 10 && !content.includes(text)) {
        // Skip if it's inside a KPI card (already captured as image)
        if (!el.closest('.kpi-card, .kpi-cards')) {
          content.push(text);
        }
      }
    });
  });
  
  return content;
};

/**
 * Extract tables from tab
 */
export const extractTables = (element: HTMLElement): TableData[] => {
  const tables: TableData[] = [];
  
  const tableElements = element.querySelectorAll('table');
  
  tableElements.forEach(table => {
    // Skip tables inside KPI cards
    if (table.closest('.kpi-card, .kpi-cards')) return;
    
    const headers: string[] = [];
    const rows: string[][] = [];
    
    // Extract headers
    const headerCells = table.querySelectorAll('thead th, thead td');
    headerCells.forEach(cell => {
      headers.push(cell.textContent?.trim() || '');
    });
    
    // Extract rows
    const rowElements = table.querySelectorAll('tbody tr');
    rowElements.forEach(row => {
      const cells: string[] = [];
      row.querySelectorAll('td').forEach(cell => {
        cells.push(cell.textContent?.trim() || '');
      });
      if (cells.length > 0) {
        rows.push(cells);
      }
    });
    
    if (headers.length > 0 || rows.length > 0) {
      tables.push({
        headers,
        rows,
        caption: table.caption?.textContent?.trim()
      });
    }
  });
  
  return tables;
};

/**
 * Main orchestration function for content extraction
 */
export const extractAllContentForExport = async (): Promise<SlideData[]> => {
  const tabs = [
    { id: "executive-commentary", label: "Executive Commentary" },
    { id: "overall-budget", label: "Overall Budget" },
    { id: "budget-visuals", label: "Budget Visuals" },
    { id: "resource-allocation", label: "Resource Spend" },
    { id: "vendor-info", label: "Vendor Info" },
    { id: "resources", label: "Resource Allocation" }
  ];

  const slides: SlideData[] = [];

  // Process tabs sequentially to avoid overwhelming the browser
  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i];
    try {
      const slideData = await extractTabContentSimple(tab.id, tab.label);
      if (slideData) {
        slides.push(slideData);
      }
      
      // Small delay between tabs for stability
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.warn(`Failed to extract content for tab ${tab.id}:`, error);
    }
  }

  return slides;
};

/**
 * Expand all sections without complex timing
 */
export const expandAllSectionsSimple = (): void => {
  // Find all collapsed sections
  const collapsedSections = document.querySelectorAll('.collapsed, [data-collapsed="true"]');
  
  collapsedSections.forEach(section => {
    const sectionEl = section as HTMLElement;
    
    // Remove collapsed class
    sectionEl.classList.remove('collapsed');
    
    // Set expanded attributes
    sectionEl.setAttribute('data-collapsed', 'false');
    sectionEl.setAttribute('data-expanded', 'true');
    
    // Ensure visibility
    sectionEl.style.display = 'block';
    sectionEl.style.visibility = 'visible';
    sectionEl.style.height = 'auto';
    sectionEl.style.overflow = 'visible';
  });
  
  // Also click any expand buttons
  const expandButtons = document.querySelectorAll('[aria-label*="Expand"], .expand-button, .toggle-button');
  expandButtons.forEach(button => {
    const buttonEl = button as HTMLElement;
    if (buttonEl.textContent?.includes('Expand') || buttonEl.textContent?.includes('+')) {
      buttonEl.click();
    }
  });
};

/**
 * Simple state restoration
 */
export const restoreSectionStatesSimple = (): void => {
  // This is now handled by the parent component's state restoration
  console.log('Section states will be restored by parent component');
};

/**
 * Transform content for slide-friendly format
 */
export const transformContentForSlides = (slides: SlideData[]): SlideData[] => {
  return slides.map(slide => ({
    ...slide,
    content: transformTextForSlides(slide.content, slide.id)
  }));
};

/**
 * Transform text content for better slide presentation
 */
const transformTextForSlides = (content: string[], slideId: string): string[] => {
  // Executive commentary stays as-is (paragraphs)
  if (slideId === 'executive-commentary') {
    return content;
  }
  
  // For other slides, convert to bullet points
  return content.map(text => {
    // Remove existing bullets
    let cleaned = text.replace(/^[•\-\*]\s*/, '').trim();
    
    // Shorten if too long
    if (cleaned.length > 150) {
      cleaned = cleaned.substring(0, 147) + '...';
    }
    
    return cleaned;
  });
};

// Re-export the functions that ExportModal needs
export const extractAllTabsContentWithCharts = extractAllContentForExport;
export const expandAllSections = expandAllSectionsSimple;
export const restoreSectionStates = restoreSectionStatesSimple;