import { SlideData, TableData } from '../components/ExportModal';
import * as htmlToImage from 'html-to-image';

export const generateAlerts = (
  entries: any[],
  categories: any[],
  year: number
) => {
  // Simple stub: return empty array
  return [];
};

// Tab content extraction functionality
export const extractAllTabsContent = (): SlideData[] => {
  const tabs = [
    { id: "executive-commentary", label: "Executive Commentary" },
    { id: "overall-budget", label: "Overall Budget" },
    { id: "budget-visuals", label: "Budget Visuals" },
    { id: "resource-allocation", label: "Resource Spend" },
    { id: "vendor-info", label: "Vendor Info" },
    { id: "resources", label: "Resource Allocation" }
  ];

  const slides: SlideData[] = [];

  tabs.forEach(tab => {
    const slideData = extractTabContent(tab.id, tab.label);
    if (slideData) {
      slides.push(slideData);
    }
  });

  return slides;
};

export const extractTabContent = (tabId: string, tabLabel: string): SlideData | null => {
  console.log(`Looking for tab panel: ${tabId}`);
  
  // Try multiple selectors
  let tabPanel = document.querySelector(`[aria-labelledby="tab-${tabId}"]`) ||
                 document.querySelector(`#tab-panel-${tabId}`) ||
                 document.querySelector(`.tab-panel[data-tab="${tabId}"]`) ||
                 document.querySelector(`[role="tabpanel"][id*="${tabId}"]`);
  
  // If not found, look for visible tab panels with matching content
  if (!tabPanel) {
    const allPanels = document.querySelectorAll('.tab-panel');
    for (let i = 0; i < allPanels.length; i++) {
      const panel = allPanels[i];
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
    tabPanel = findTabPanelByContent(tabId);
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

  console.log(`Extracting content for ${tabId} from:`, tabPanel);

  // Extract content from the tab
  const content = extractTextContent(tabPanel as HTMLElement, tabId);
  const tables = extractTables(tabPanel as HTMLElement);
  
  console.log(`Extracted ${content.length} content items and ${tables.length} tables for ${tabId}`);
  
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

// Helper function to find tab panel when standard selectors don't work
const findTabPanelByContent = (tabId: string): Element | null => {
  // Look for elements that might contain tab content
  const possibleContainers = document.querySelectorAll('.tab-panel, .tab-content, [class*="tab"]');
  
  for (let i = 0; i < possibleContainers.length; i++) {
    const container = possibleContainers[i];
    const containerText = container.textContent?.toLowerCase() || '';
    
    // Match based on tab ID patterns
    if (containerText.includes(tabId.replace('-', ' ')) ||
        container.id.includes(tabId) ||
        container.className.includes(tabId)) {
      return container;
    }
  }
  
  return null;
};

// Extract text content selectively (skip if captured as images)
const extractTextContentSelectively = (element: HTMLElement, tabId?: string, skipKPIText?: boolean): string[] => {
  const content: string[] = [];
  
  // For Executive Commentary, get the full text
  if (tabId === 'executive-commentary') {
    const textarea = element.querySelector('.commentary-textarea') as HTMLTextAreaElement;
    const printText = element.querySelector('.commentary-print-text');
    const summaryElement = element.querySelector('.intelligent-summary, .executive-summary-content, [class*="summary"]');
    
    if (textarea && textarea.value) {
      const paragraphs = textarea.value.split(/\n\n+/).filter(p => p.trim());
      return paragraphs.length > 0 ? paragraphs : ['No executive commentary provided'];
    } else if (printText) {
      const paragraphs = Array.from(printText.querySelectorAll('p'))
        .map(p => p.textContent?.trim())
        .filter(text => text && text.length > 0) as string[];
      return paragraphs.length > 0 ? paragraphs : ['No executive commentary provided'];
    } else if (summaryElement) {
      const summaryText = summaryElement.textContent?.trim();
      if (summaryText) {
        const paragraphs = summaryText.split(/\n\n+/).filter(p => p.trim().length > 0);
        return paragraphs.map(p => p.trim());
      }
    }
    return ['No executive commentary content found'];
  }
  
  // For other tabs, skip KPI content if we captured it as images
  if (skipKPIText) {
    // Enhanced skip selectors to prevent vendor duplication
    const skipSelectors = [
      '.kpi-card',
      '.kpi-cards',
      '.kpi-section',
      '.vendor-kpi-grid',
      '.vendor-kpi-card',
      '.vendor-kpi-title',
      '.vendor-kpi-value',
      '.vendor-kpi-label',
      '.vendor-kpi-description',
      '.vendor-variance-title',
      '.vendor-variance-amount',
      '.vendor-variance-label',
      '.vendor-variance-description',
      '.hiring-analysis-container',
      '.monthly-spending-grid'
    ];
    
    // Only get non-KPI content
    const nonKPISelectors = [
      '.section-container > p',
      '.summary-text',
      '.description-text',
      'h3:not(.kpi-title)',
      'h4:not(.kpi-title)',
      '.variance-item', // Include variance items even when skipping KPIs
      '.trend-summary',
      '.resource-metric:not(.kpi-card)',
      '.vendor-metric:not(.kpi-card)'
    ];
    
    nonKPISelectors.forEach(selector => {
      const elements = element.querySelectorAll(selector);
      elements.forEach(el => {
        // Enhanced check: Skip if element or any parent matches skip selectors
        const shouldSkip = skipSelectors.some(skipSelector => 
          el.matches(skipSelector) || el.closest(skipSelector)
        );
        
        if (shouldSkip) return;
        
        const text = el.textContent?.trim();
        if (text && text.length > 10 && !content.includes(text)) {
          content.push(text);
        }
      });
    });
  } else {
    // Use original text extraction logic
    return extractTextContent(element, tabId);
  }
  
  return content.length > 0 ? content : [`No additional content for ${tabId || 'this section'}`];
};

// Extract meaningful text content from an element
const extractTextContent = (element: HTMLElement, tabId?: string): string[] => {
  const content: string[] = [];
  const processedElements = new Set<Element>();

  // Debug log
  console.log(`Extracting content for ${tabId}, element:`, element);
  console.log(`Element visible:`, element.offsetHeight > 0);

  // Special handling for Executive Commentary
  if (tabId === 'executive-commentary') {
    // Look for the textarea or the print-text div
    const textarea = element.querySelector('.commentary-textarea') as HTMLTextAreaElement;
    const printText = element.querySelector('.commentary-print-text');
    const summaryElement = element.querySelector('.intelligent-summary, .executive-summary-content, [class*="summary"]');
    
    if (textarea && textarea.value) {
      const paragraphs = textarea.value.split(/\n\n+/).filter(p => p.trim());
      return paragraphs.length > 0 ? paragraphs : ['No executive commentary provided'];
    } else if (printText) {
      const paragraphs = Array.from(printText.querySelectorAll('p'))
        .map(p => p.textContent?.trim())
        .filter(text => text && text.length > 0) as string[];
      return paragraphs.length > 0 ? paragraphs : ['No executive commentary provided'];
    } else if (summaryElement) {
      const summaryText = summaryElement.textContent?.trim();
      if (summaryText) {
        const paragraphs = summaryText.split(/\n\n+/).filter(p => p.trim().length > 0);
        return paragraphs.map(p => p.trim());
      }
    }
    return ['No executive commentary content found'];
  }

  // Overall Budget is handled normally here - the special handling is in extractTabContentWithCharts

  // Special handling for Resources tab
  if (tabId === 'resources') {
    // Extract team summary KPIs
    const kpiCards = element.querySelectorAll('.kpi-card');
    kpiCards.forEach(card => {
      const title = card.querySelector('.kpi-title')?.textContent?.trim();
      const value = card.querySelector('.kpi-value')?.textContent?.trim();
      if (title && value) {
        content.push(`${title}: ${value}`);
      }
    });
    
    // Extract team tables
    const tables = element.querySelectorAll('.team-details-table');
    tables.forEach(table => {
      const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent?.trim() || '');
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      
      if (headers.length > 0 && rows.length > 0) {
        content.push('Team Details:');
        rows.forEach(row => {
          const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent?.trim() || '');
          if (cells.length > 0 && cells[0]) {
            content.push(`- ${cells.join(' | ')}`);
          }
        });
      }
    });
  }

  // For other tabs, look for specific content areas
  const contentSelectors = [
    // '.kpi-card', // Removed to prevent duplication - KPI cards are handled separately
    '.metric-card', // Metric cards
    '.variance-item', // Variance items
    '.trend-summary', // Trend summaries
    '.resource-metric', // Resource metrics
    '.vendor-metric', // Vendor metrics
    '.section-content', // General section content
    '.data-point', // Data points
    '.summary-item' // Summary items
  ];

  // First try to find structured content
  for (const selector of contentSelectors) {
    const elements = element.querySelectorAll(selector);
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const text = el.textContent?.trim();
      if (text && text.length > 5) {
        const cleanText = text
          .replace(/\s+/g, ' ')
          .replace(/^\d+\.\s*/, '')
          .trim();
        
        if (cleanText && !content.includes(cleanText)) {
          content.push(cleanText);
          processedElements.add(el);
        }
      }
    }
  }

  // If no structured content found, fall back to general text extraction
  if (content.length === 0) {
    const textElements = element.querySelectorAll('p, h3, h4, li:not(.toggle-label), .metric-value, .metric-label');
    
    for (let i = 0; i < textElements.length; i++) {
      const el = textElements[i];
      if (processedElements.has(el)) continue;
      
      // Skip navigation and control elements
      if (el.closest('.toggle-controls, .export-controls, .tab-navigation, .btn-group')) continue;
      
      // Skip if this element is inside another text element we've already processed
      let isNested = false;
      const processedArray = Array.from(processedElements);
      for (let j = 0; j < processedArray.length; j++) {
        const processed = processedArray[j];
        if (processed.contains(el)) {
          isNested = true;
          break;
        }
      }
      
      if (isNested) continue;
      
      const text = el.textContent?.trim();
      if (text && text.length > 10) { // Only include meaningful text
        // Clean up the text
        const cleanText = text
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/^\d+\.\s*/, '') // Remove numbering
          .trim();
        
        if (cleanText && !content.includes(cleanText)) {
          content.push(cleanText);
          processedElements.add(el);
        }
      }
    }
  }

  // Ensure we always return something
  return content.length > 0 ? content.slice(0, 15) : [`No content found for ${tabId || 'this section'}`];
};

// Extract table data from an element
const extractTables = (element: HTMLElement): TableData[] => {
  const tables: TableData[] = [];
  // Look for all tables including team details tables
  const tableElements = element.querySelectorAll('table, .team-details-table, .trend-table, .variance-table');
  
  for (let i = 0; i < tableElements.length; i++) {
    const table = tableElements[i];
    const index = i;
    const headers: string[] = [];
    const rows: string[][] = [];
    
    // Extract headers
    const headerCells = table.querySelectorAll('thead th, tr:first-child th, tr:first-child td');
    for (let j = 0; j < headerCells.length; j++) {
      const cell = headerCells[j];
      const text = cell.textContent?.trim();
      if (text) headers.push(text);
    }
    
    // Extract data rows (skip header row)
    const dataRows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
    for (let k = 0; k < dataRows.length; k++) {
      const row = dataRows[k];
      const rowData: string[] = [];
      const cells = row.querySelectorAll('td, th');
      for (let l = 0; l < cells.length; l++) {
        const cell = cells[l];
        const text = cell.textContent?.trim() || '';
        rowData.push(text);
      }
      if (rowData.some(cell => cell.length > 0)) {
        rows.push(rowData);
      }
    }
    
    if (headers.length > 0 || rows.length > 0) {
      tables.push({
        headers: headers,
        rows: rows.slice(0, 8), // Limit rows for slide readability
        caption: `Table ${index + 1}`
      });
    }
  }
  
  return tables;
};

// Section expansion/restoration utilities
interface SectionState {
  element: HTMLElement;
  originalDisplay: string;
  originalHeight: string;
  originalOverflow: string;
  wasCollapsed: boolean;
}

let savedSectionStates: SectionState[] = [];

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

// Helper function to ensure specific Executive Summary sections are expanded
export const expandExecutiveSummarySections = (): void => {
  // Executive Summary specific expansion
  const specificSections = [
    'isStrategicContextExpanded',
    'isYTDPerformanceExpanded', 
    'isForwardLookingExpanded',
    'isRiskVelocityExpanded',
    'isVendorSpendingExpanded',
    'isVendorPortfolioExpanded'
  ];

  // Find and expand trend tables
  const trendTables = document.querySelectorAll(
    '.trend-table-section, .monthly-trend-table, .rolling-trend-table'
  );
  
  trendTables.forEach(table => {
    const tableElement = table as HTMLElement;
    if (tableElement.style.display === 'none') {
      tableElement.style.display = 'block';
      tableElement.setAttribute('data-export-expanded', 'true');
    }
  });

  // Expand any vendor portfolio sections
  const vendorSections = document.querySelectorAll('.vendor-portfolio-section, .vendor-info-section');
  vendorSections.forEach(section => {
    const sectionElement = section as HTMLElement;
    sectionElement.style.display = 'block';
    sectionElement.classList.remove('collapsed');
  });
};

// Content transformation functions (web → slide format)
export const transformContentForSlides = (slides: SlideData[]): SlideData[] => {
  return slides.map(slide => ({
    ...slide,
    content: transformTextContent(slide.content, slide.id),
    tables: slide.tables?.map(table => transformTableForSlide(table))
  }));
};

// Transform text content to bullet points and slide-friendly format
const transformTextContent = (content: string[], slideId?: string): string[] => {
  // For Executive Commentary, return content as-is (already in paragraph form)
  if (slideId === 'executive-commentary') {
    return content;
  }

  const transformed: string[] = [];
  
  content.forEach(text => {
    // Skip very short or empty content
    if (!text || text.length < 5) return;
    
    // Transform long paragraphs to bullet points
    if (text.length > 200) {
      const bulletPoints = splitIntoBulletPoints(text);
      transformed.push(...bulletPoints);
    } else {
      // Clean and format shorter content
      const cleanText = cleanTextForSlide(text);
      if (cleanText) {
        transformed.push(cleanText);
      }
    }
  });
  
  return transformed.slice(0, 12); // Increase limit for better content coverage
};

// Split long paragraphs into bullet points
const splitIntoBulletPoints = (text: string): string[] => {
  // Try to split on sentences first
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  if (sentences.length > 1) {
    return sentences
      .map(sentence => cleanTextForSlide(sentence.trim()))
      .filter(s => s && s.length > 5)
      .slice(0, 4); // Max 4 bullets from long text
  }
  
  // If no good sentence breaks, split on key phrases
  const keyPhrases = text.split(/(?:, and|, but|, however|; therefore|; thus|: )/);
  if (keyPhrases.length > 1) {
    return keyPhrases
      .map(phrase => cleanTextForSlide(phrase.trim()))
      .filter(p => p && p.length > 10)
      .slice(0, 3);
  }
  
  // Last resort: truncate and add ellipsis
  return [cleanTextForSlide(text.substring(0, 120) + '...')].filter(Boolean);
};

// Clean text for slide display
const cleanTextForSlide = (text: string): string => {
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/^\d+\.\s*/, '') // Remove numbering
    .replace(/^[•\-\*]\s*/, '') // Remove existing bullets
    .replace(/\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g, '$$$1') // Format currency
    .replace(/(\d+\.?\d*)%/g, '$1%') // Ensure percentage formatting
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, (date) => { // Format dates
      return new Date(date).toLocaleDateString();
    })
    .trim();
};

// Transform tables for slide display
const transformTableForSlide = (table: TableData): TableData => {
  // Limit columns and rows for readability
  const maxColumns = 4;
  const maxRows = 6;
  
  let headers = table.headers.slice(0, maxColumns);
  let rows = table.rows.slice(0, maxRows).map(row => row.slice(0, maxColumns));
  
  // Abbreviate long header names
  headers = headers.map(header => abbreviateHeader(header));
  
  // Format cell content
  rows = rows.map(row => 
    row.map(cell => formatCellContent(cell))
  );
  
  return {
    headers,
    rows,
    caption: table.caption
  };
};

// Abbreviate long header names for slides
const abbreviateHeader = (header: string): string => {
  const abbreviations: Record<string, string> = {
    'Budget vs Actual': 'Budget vs Act.',
    'Year to Date': 'YTD',
    'Month over Month': 'MoM',
    'Quarter over Quarter': 'QoQ',
    'Percentage': '%',
    'Amount': 'Amt',
    'Category': 'Cat.',
    'Department': 'Dept.',
    'Description': 'Desc.',
    'Allocation': 'Alloc.',
    'Variance': 'Var.',
    'Total': 'Tot.'
  };
  
  let abbreviated = header;
  Object.entries(abbreviations).forEach(([full, abbrev]) => {
    abbreviated = abbreviated.replace(new RegExp(full, 'gi'), abbrev);
  });
  
  // Truncate if still too long
  if (abbreviated.length > 15) {
    abbreviated = abbreviated.substring(0, 12) + '...';
  }
  
  return abbreviated;
};

// Format cell content for slides
const formatCellContent = (cell: string): string => {
  if (!cell || cell.trim() === '') return '';
  
  // Format currency values
  if (cell.match(/^\$?\d+(?:,\d{3})*(?:\.\d{2})?$/)) {
    const num = parseFloat(cell.replace(/[$,]/g, ''));
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num.toLocaleString()}`;
  }
  
  // Format percentage values
  if (cell.match(/^\d+\.?\d*%$/)) {
    return cell;
  }
  
  // Truncate long text
  if (cell.length > 20) {
    return cell.substring(0, 17) + '...';
  }
  
  return cell;
};

// Utility function to detect and preserve important financial data
export const preserveFinancialFormatting = (text: string): string => {
  return text
    .replace(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g, '$$$1') // Preserve currency
    .replace(/(\d+\.?\d*)%/g, '$1%') // Preserve percentages
    .replace(/\b(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\b/g, (match) => {
      // Preserve large numbers with commas
      const num = parseFloat(match.replace(/,/g, ''));
      return num >= 1000 ? num.toLocaleString() : match;
    });
};

// Capture KPI cards as images to preserve styling
// Simple KPI card capture with explicit sizing for export
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
    
    // --- Begin: Explicit sizing for export ---
    const originalWidth = sectionElement.style.width;
    const originalHeight = sectionElement.style.height;
    sectionElement.style.width = '800px'; // or set to your preferred fixed width
    sectionElement.style.height = 'auto';
    sectionElement.offsetHeight; // force reflow
    // --- End: Explicit sizing for export ---
    
    try {
      console.log('Capturing KPI section with explicit sizing...');
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
    } finally {
      // Restore original styles
      sectionElement.style.width = originalWidth;
      sectionElement.style.height = originalHeight;
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

// Simplified element preparation for html-to-image compatibility
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

// Chart detection and conversion functionality
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

// Helper function to get a unique selector for an element
const getElementSelector = (element: HTMLElement): string => {
  if (element.id) {
    return `#${element.id}`;
  }
  
  if (element.className) {
    const classes = element.className.split(' ').filter(c => c.trim());
    if (classes.length > 0) {
      return `.${classes[0]}`;
    }
  }
  
  return element.tagName.toLowerCase();
};


// Enhanced overall budget content extraction
async function extractOverallBudgetContent(tabElement: HTMLElement): Promise<{ content: string[], styledSections: { type: string, image: string }[] }> {
  const content: string[] = [];
  const styledSections: { type: string, image: string }[] = [];
  
  const kpiSectionElements = tabElement.querySelectorAll('.kpi-section');
  
  for (let i = 0; i < kpiSectionElements.length; i++) {
    const section = kpiSectionElements[i] as HTMLElement;
    
    // Get the section header
    const sectionHeader = section.querySelector('.section-header h4, .section-title');
    let sectionTitle = '';
    if (sectionHeader) {
      const title = sectionHeader.textContent?.trim();
      if (title) {
        const cleanTitle = title.replace(/[−+]\s*/g, '').replace(/\s+/g, ' ').trim();
        if (cleanTitle && cleanTitle.length > 0 && !cleanTitle.includes('Expand') && !cleanTitle.includes('Collapse')) {
          sectionTitle = cleanTitle;
          content.push(`**${cleanTitle}**`);
        }
      }
    }
    
    // Capture just this section's KPI cards as an image
    const sectionKpiCards = section.querySelector('.kpi-cards');
    if (sectionKpiCards && (sectionKpiCards as HTMLElement).offsetHeight > 0) {
      try {
        // Enhanced preparation
        await prepareElementForCapture(sectionKpiCards as HTMLElement);
        
        const imageData = await htmlToImage.toPng(sectionKpiCards as HTMLElement, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: '#ffffff'
        });
        // Add as styled section to maintain order with headers
        styledSections.push({
          type: `overall-budget-section-${sectionTitle.toLowerCase().replace(/\s+/g, '-')}`,
          image: imageData
        });
      } catch (error) {
        console.error(`Failed to capture KPI section for ${sectionTitle}:`, error);
      }
    }
  }
  
  return { content, styledSections };
}

// Update the extractTabContent function to include chart conversion
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
      kpiLayout = 'full'//(kpiSections[0]?.layout || 'third') as 'full' | 'half' | 'third' | 'quarter';
      
      styledSections = await captureStyledSections(tabElement);
      
      const skipKPIText = kpiCardImages.length > 0;
      content = extractTextContentSelectively(tabElement, tabId, skipKPIText);
    }
    
    // 5. Extract tables and charts
    const tables = extractTables(tabElement);
    const chartImages = await detectAndConvertCharts(tabElement);
    
    // 6. Content extraction complete
    
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
    return null;
  }
};

// Enhanced function to extract all tabs with charts
export const extractAllTabsContentWithCharts = async (): Promise<SlideData[]> => {
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
  for (const tab of tabs) {
    try {
      const slideData = await extractTabContentWithCharts(tab.id, tab.label);
      if (slideData) {
        slides.push(slideData);
      }
      
      // Small delay between tabs to ensure proper rendering
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.warn(`Failed to extract content for tab ${tab.id}:`, error);
    }
  }

  return slides;
};

// Responsive sizing for different slide layouts
export interface SlideLayoutConfig {
  aspectRatio: string;
  width: number;
  height: number;
  chartScale: number;
  fontSize: {
    title: number;
    content: number;
    table: number;
  };
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export const getLayoutConfig = (layout: string): SlideLayoutConfig => {
  const configs: Record<string, SlideLayoutConfig> = {
    'standard': { // 16:9
      aspectRatio: '16:9',
      width: 1920,
      height: 1080,
      chartScale: 2,
      fontSize: {
        title: 36,
        content: 18,
        table: 14
      },
      margins: {
        top: 80,
        bottom: 80,
        left: 80,
        right: 80
      }
    },
    'widescreen': { // 16:10
      aspectRatio: '16:10',
      width: 1920,
      height: 1200,
      chartScale: 2,
      fontSize: {
        title: 38,
        content: 19,
        table: 15
      },
      margins: {
        top: 90,
        bottom: 90,
        left: 80,
        right: 80
      }
    },
    'traditional': { // 4:3
      aspectRatio: '4:3',
      width: 1024,
      height: 768,
      chartScale: 1.5,
      fontSize: {
        title: 32,
        content: 16,
        table: 12
      },
      margins: {
        top: 60,
        bottom: 60,
        left: 60,
        right: 60
      }
    }
  };
  
  return configs[layout] || configs['standard'];
};

// Chart sizing based on layout
export const getChartDimensionsForLayout = (layout: string): { width: number; height: number } => {
  const config = getLayoutConfig(layout);
  const availableWidth = config.width - config.margins.left - config.margins.right;
  const availableHeight = config.height - config.margins.top - config.margins.bottom;
  
  // Reserve space for title and content
  const titleHeight = config.fontSize.title * 1.5;
  const contentHeight = config.fontSize.content * 8; // Approximate space for content
  const chartHeight = Math.max(200, availableHeight - titleHeight - contentHeight - 40);
  
  return {
    width: Math.min(availableWidth, 800),
    height: Math.min(chartHeight, 400)
  };
};

// Enhanced chart conversion with layout-specific sizing
export const convertChartToImageWithLayout = async (
  chartElement: HTMLElement,
  layout: string = 'standard'
): Promise<string | null> => {
  const config = getLayoutConfig(layout);
  const dimensions = getChartDimensionsForLayout(layout);
  
  try {
    // Temporarily resize chart for optimal capture
    const originalStyle = {
      width: chartElement.style.width,
      height: chartElement.style.height,
      maxWidth: chartElement.style.maxWidth,
      maxHeight: chartElement.style.maxHeight
    };
    
    // Apply layout-specific dimensions
    chartElement.style.width = `${dimensions.width}px`;
    chartElement.style.height = `${dimensions.height}px`;
    chartElement.style.maxWidth = `${dimensions.width}px`;
    chartElement.style.maxHeight = `${dimensions.height}px`;
    
    // Force reflow
    chartElement.offsetHeight;
    
    // Wait for chart to re-render
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const imageData = await htmlToImage.toPng(chartElement, {
      quality: 0.9,
      pixelRatio: config.chartScale,
      backgroundColor: '#ffffff',
      width: dimensions.width,
      height: dimensions.height
    });
    
    // Restore original styling
    Object.assign(chartElement.style, originalStyle);
    return imageData && imageData.length > 1000 ? imageData : null;
    
  } catch (error) {
    console.error('Error converting chart with layout:', error);
    return null;
  }
};

// Content fitting utilities for different layouts
export const fitContentToLayout = (content: string[], layout: string): string[] => {
  const config = getLayoutConfig(layout);
  const maxLines = layout === 'traditional' ? 6 : 8; // 4:3 has less space
  
  if (content.length <= maxLines) {
    return content;
  }
  
  // Prioritize shorter, more impactful content
  const prioritized = content
    .map(text => ({
      text,
      score: calculateContentScore(text, layout)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxLines)
    .map(item => item.text);
  
  return prioritized;
};

// Score content based on importance and layout constraints
const calculateContentScore = (text: string, layout: string): number => {
  let score = 0;
  
  // Prefer shorter text for slides
  if (text.length < 50) score += 3;
  else if (text.length < 100) score += 2;
  else score += 1;
  
  // Prefer content with numbers/data
  if (/\$[\d,]+|\d+%|\d+\.\d+/.test(text)) score += 2;
  
  // Prefer content with key business terms
  const businessTerms = ['budget', 'actual', 'variance', 'performance', 'target', 'goal'];
  businessTerms.forEach(term => {
    if (text.toLowerCase().includes(term)) score += 1;
  });
  
  // Penalty for very long text in traditional layout
  if (layout === 'traditional' && text.length > 80) score -= 2;
  
  return score;
};

// Debug helper to check tab visibility
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
      hasContent: el.textContent?.length || 0,
      ariaLabel: el.getAttribute('aria-labelledby')
    });
  });
};

// Enhanced debug helper for content extraction
export const debugContentExtraction = () => {
  console.log('=== Content Extraction Debug ===');
  
  // Check for tab panels
  const tabPanels = document.querySelectorAll('[role="tabpanel"]');
  console.log(`Found ${tabPanels.length} tab panels with role="tabpanel"`);
  
  // Check what aria-labelledby values exist
  tabPanels.forEach((panel, i) => {
    const label = panel.getAttribute('aria-labelledby');
    const display = window.getComputedStyle(panel).display;
    const el = panel as HTMLElement;
    console.log(`Panel ${i}: aria-labelledby="${label}", display="${display}", height=${el.offsetHeight}px`);
  });
  
  // Check for tab navigation
  const tabNav = document.querySelector('.tab-navigation');
  console.log('Tab navigation found:', !!tabNav);
  
  // Try to find panels by each specific ID
  const tabIds = ['executive-commentary', 'overall-budget', 'budget-visuals', 'resource-allocation', 'vendor-info'];
  tabIds.forEach(id => {
    const panel = document.querySelector(`[aria-labelledby="tab-${id}"]`);
    const panelEl = panel as HTMLElement;
    console.log(`Panel for ${id}:`, !!panel, panel ? `height=${panelEl.offsetHeight}px` : 'not found');
  });
  
  // Check for visible .tab-panel elements
  const visibleTabPanels = Array.from(document.querySelectorAll('.tab-panel')).filter(panel => {
    const el = panel as HTMLElement;
    return window.getComputedStyle(el).display !== 'none';
  });
  console.log(`Visible .tab-panel elements: ${visibleTabPanels.length}`);
};

// Debug helper to check section expansion states
export const debugSectionStates = () => {
  console.log('=== Section States Debug ===');
  
  // Check section headers
  const sectionHeaders = document.querySelectorAll('.section-header');
  console.log(`Found ${sectionHeaders.length} section headers`);
  
  sectionHeaders.forEach((header, i) => {
    const title = header.querySelector('.section-title')?.textContent;
    const expandIcon = header.querySelector('.expand-icon')?.textContent;
    const isExpanded = expandIcon === '−';
    console.log(`Section ${i}: "${title}" - ${isExpanded ? 'EXPANDED' : 'COLLAPSED'}`);
  });
  
  // Check collapsible tables
  const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
  console.log(`Found ${collapsibleHeaders.length} collapsible headers`);
  
  collapsibleHeaders.forEach((header, i) => {
    const text = header.textContent;
    const isExpanded = text?.includes('−');
    console.log(`Collapsible ${i}: "${text}" - ${isExpanded ? 'EXPANDED' : 'COLLAPSED'}`);
  });
  
  // Check specific sections by class
  const strategicContext = document.querySelector('.strategic-context');
  console.log('Strategic Context section found:', !!strategicContext);
  
  const ytdPerformance = document.querySelector('.ytd-performance');
  console.log('YTD Performance section found:', !!ytdPerformance);
};