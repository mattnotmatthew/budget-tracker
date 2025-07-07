Great! Now that all sections are expanding properly, here's the complete solution for preserving KPI formatting and other styled elements in your PDF export:

## 1. **Capture KPI Cards as Images**

First, update your `exportUtils.ts` to capture KPI cards with their styling:

```typescript
// Add this function to capture KPI cards as images
export const captureKPICards = async (element: HTMLElement): Promise<{ type: 'kpi-cards', images: string[], layout: string }[]> => {
  const kpiSections: { type: 'kpi-cards', images: string[], layout: string }[] = [];
  
  // Find all KPI sections and rows
  const kpiSectionElements = element.querySelectorAll('.kpi-section, .kpi-row, .kpi-cards');
  
  for (const section of kpiSectionElements) {
    const sectionElement = section as HTMLElement;
    
    // Skip if not visible
    if (sectionElement.offsetHeight === 0) continue;
    
    try {
      // Ensure all styles are computed before capture
      sectionElement.style.position = 'relative';
      
      // Capture the entire KPI section as an image
      const canvas = await html2canvas(sectionElement, {
        backgroundColor: '#ffffff',
        scale: 2, // High quality
        logging: false,
        useCORS: true,
        allowTaint: true,
        // This is crucial for preserving CSS
        onclone: (clonedDoc, originalElement) => {
          const clonedElement = clonedDoc.querySelector(`[class="${originalElement.className}"]`);
          if (clonedElement) {
            // Copy computed styles
            const computedStyle = window.getComputedStyle(originalElement);
            (clonedElement as HTMLElement).style.cssText = computedStyle.cssText;
            
            // Also copy styles for all child elements
            const originalChildren = originalElement.querySelectorAll('*');
            const clonedChildren = clonedElement.querySelectorAll('*');
            
            originalChildren.forEach((child, index) => {
              if (clonedChildren[index]) {
                const childStyle = window.getComputedStyle(child);
                (clonedChildren[index] as HTMLElement).style.cssText = childStyle.cssText;
              }
            });
          }
        }
      });
      
      const imageData = canvas.toDataURL('image/png', 0.95);
      
      // Determine layout based on number of cards
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

// Also capture vendor KPI grids and other styled sections
export const captureStyledSections = async (element: HTMLElement): Promise<{ type: string, image: string }[]> => {
  const styledSections: { type: string, image: string }[] = [];
  
  // List of styled sections to capture
  const styledSelectors = [
    { selector: '.vendor-kpi-grid', type: 'vendor-grid' },
    { selector: '.hiring-analysis-container', type: 'hiring-analysis' },
    { selector: '.monthly-spending-grid', type: 'monthly-spending' },
    { selector: '.vendor-tracking-subtitle + .vendor-kpi-grid', type: 'vendor-tracking' }
  ];
  
  for (const { selector, type } of styledSelectors) {
    const sections = element.querySelectorAll(selector);
    
    for (const section of sections) {
      const sectionElement = section as HTMLElement;
      
      if (sectionElement.offsetHeight === 0) continue;
      
      try {
        const canvas = await html2canvas(sectionElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true
        });
        
        const imageData = canvas.toDataURL('image/png', 0.95);
        styledSections.push({ type, image: imageData });
        
      } catch (error) {
        console.error(`Failed to capture ${type} section:`, error);
      }
    }
  }
  
  return styledSections;
};
```

## 2. **Update SlideData Interface**

In your `ExportModal.tsx`, update the interface:

```typescript
export interface SlideData {
  id: string;
  title: string;
  content: string[];
  charts?: string[];
  kpiCards?: string[]; // KPI card images
  kpiLayout?: 'full' | 'half' | 'third' | 'quarter';
  styledSections?: { type: string, image: string }[]; // Other styled sections
  tables?: TableData[];
  metadata?: {
    tabId: string;
    tabLabel: string;
    extractedAt: string;
  };
}
```

## 3. **Update Content Extraction**

Modify `extractTabContentWithCharts` to capture styled elements:

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
  
  // Prepare charts for capture
  prepareChartsForCapture(tabElement);
  
  // Capture KPI cards BEFORE extracting text
  const kpiSections = await captureKPICards(tabElement);
  const kpiCardImages = kpiSections.flatMap(section => section.images);
  const kpiLayout = kpiSections[0]?.layout || 'third';
  
  // Capture other styled sections
  const styledSections = await captureStyledSections(tabElement);
  
  // Extract text content, but skip if we have KPI images
  const skipKPIText = kpiCardImages.length > 0;
  const content = extractTextContentSelectively(tabElement, tabId, skipKPIText);
  
  // Extract tables (but not if they're already captured as styled sections)
  const tables = extractTables(tabElement);
  
  // Convert charts to images
  const chartImages = await detectAndConvertCharts(tabElement);
  
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
};

// New selective text extraction
const extractTextContentSelectively = (element: HTMLElement, tabId?: string, skipKPIText?: boolean): string[] => {
  const content: string[] = [];
  
  // For Executive Commentary, get the full text
  if (tabId === 'executive-commentary') {
    const textarea = element.querySelector('.commentary-textarea') as HTMLTextAreaElement;
    if (textarea && textarea.value) {
      const paragraphs = textarea.value.split(/\n\n+/).filter(p => p.trim());
      return paragraphs.length > 0 ? paragraphs : ['No executive commentary provided'];
    }
  }
  
  // For other tabs, skip KPI content if we captured it as images
  if (skipKPIText) {
    // Only get non-KPI content
    const nonKPISelectors = [
      '.section-container > p',
      '.summary-text',
      '.description-text',
      'h3:not(.kpi-title)',
      'h4:not(.kpi-title)'
    ];
    
    nonKPISelectors.forEach(selector => {
      const elements = element.querySelectorAll(selector);
      elements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 10 && !content.includes(text)) {
          content.push(text);
        }
      });
    });
  } else {
    // Original text extraction logic
    return extractTextContent(element, tabId);
  }
  
  return content;
};
```

## 4. **Update PDF Generation**

Modify `pdfGenerator.ts` to render the captured images:

```typescript
export const generatePDF = async (
  slides: SlideData[],
  layout: string = 'standard'
): Promise<ExportResult> => {
  try {
    const config = getLayoutConfig(layout);
    
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [config.width, config.height]
    });

    let isFirstSlide = true;

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      
      if (!isFirstSlide) {
        pdf.addPage();
      } else {
        isFirstSlide = false;
      }

      let yPosition = config.margins.top;

      // Add title
      pdf.setFontSize(config.fontSize.title);
      pdf.setFont('Arial', 'bold');
      pdf.setTextColor(59, 130, 246);
      pdf.text(slide.title, config.margins.left, yPosition);
      yPosition += config.fontSize.title * 1.5;

      // Add KPI Cards if present
      if (slide.kpiCards && slide.kpiCards.length > 0) {
        for (const kpiImage of slide.kpiCards) {
          if (kpiImage && kpiImage.startsWith('data:image/')) {
            try {
              // Calculate dimensions
              const maxWidth = config.width - config.margins.left - config.margins.right;
              const imageWidth = maxWidth * 0.9; // 90% of available width
              const imageHeight = 200; // Adjust based on your KPI card heights
              
              // Check if we need a new page
              if (yPosition + imageHeight > config.height - config.margins.bottom) {
                pdf.addPage();
                yPosition = config.margins.top;
              }
              
              // Add the KPI card image
              pdf.addImage(
                kpiImage,
                'PNG',
                config.margins.left,
                yPosition,
                imageWidth,
                imageHeight,
                undefined,
                'FAST'
              );
              
              yPosition += imageHeight + 20;
              
            } catch (error) {
              console.warn('Failed to add KPI card to PDF:', error);
            }
          }
        }
      }

      // Add other styled sections
      if (slide.styledSections && slide.styledSections.length > 0) {
        for (const section of slide.styledSections) {
          if (section.image && section.image.startsWith('data:image/')) {
            try {
              const maxWidth = config.width - config.margins.left - config.margins.right;
              const imageWidth = maxWidth * 0.9;
              let imageHeight = 150; // Default height
              
              // Adjust height based on section type
              if (section.type === 'vendor-grid') imageHeight = 250;
              if (section.type === 'hiring-analysis') imageHeight = 400;
              if (section.type === 'monthly-spending') imageHeight = 200;
              
              if (yPosition + imageHeight > config.height - config.margins.bottom) {
                pdf.addPage();
                yPosition = config.margins.top;
              }
              
              pdf.addImage(
                section.image,
                'PNG',
                config.margins.left,
                yPosition,
                imageWidth,
                imageHeight,
                undefined,
                'FAST'
              );
              
              yPosition += imageHeight + 20;
              
            } catch (error) {
              console.warn(`Failed to add ${section.type} to PDF:`, error);
            }
          }
        }
      }

      // Add charts
      if (slide.charts && slide.charts.length > 0) {
        for (const chartImage of slide.charts) {
          if (chartImage && chartImage.startsWith('data:image/')) {
            try {
              const chartWidth = Math.min(600, (config.width - config.margins.left - config.margins.right) * 0.8);
              const chartHeight = chartWidth * 0.6;
              
              if (yPosition + chartHeight > config.height - config.margins.bottom) {
                pdf.addPage();
                yPosition = config.margins.top;
              }
              
              pdf.addImage(
                chartImage,
                'PNG',
                config.margins.left,
                yPosition,
                chartWidth,
                chartHeight,
                undefined,
                'FAST'
              );
              
              yPosition += chartHeight + 20;
            } catch (error) {
              console.warn('Failed to add chart to PDF:', error);
            }
          }
        }
      }

      // Add text content (only if not redundant with images)
      if (slide.content && slide.content.length > 0) {
        const hasKPIImages = slide.kpiCards && slide.kpiCards.length > 0;
        const hasStyledSections = slide.styledSections && slide.styledSections.length > 0;
        
        // Only add text if it's not already captured in images
        if (!hasKPIImages || slide.id === 'executive-commentary') {
          pdf.setFontSize(config.fontSize.content);
          pdf.setFont('Arial', 'normal');
          pdf.setTextColor(0, 0, 0);

          const lineHeight = config.fontSize.content * 1.6;
          const maxWidth = config.width - config.margins.left - config.margins.right;

          slide.content.forEach((bullet) => {
            if (yPosition + lineHeight > config.height - config.margins.bottom) {
              pdf.addPage();
              yPosition = config.margins.top;
            }
            
            const bulletText = `• ${bullet}`;
            const lines = pdf.splitTextToSize(bulletText, maxWidth - 20);
            
            lines.forEach((line: string) => {
              pdf.text(line, config.margins.left, yPosition);
              yPosition += lineHeight;
            });
          });
        }
      }

      // Add tables (if not already captured as styled sections)
      if (slide.tables && slide.tables.length > 0) {
        // Add table rendering code here...
      }
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const filename = `Executive-Summary-${layout}-${timestamp}.pdf`;

    // Save the PDF
    pdf.save(filename);

    return {
      success: true,
      filename: filename
    };

  } catch (error) {
    console.error('PDF generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
```

## 5. **Tips for Better Capture Quality**

Add this helper to ensure elements are ready for capture:

```typescript
export const prepareElementForCapture = async (element: HTMLElement): Promise<void> => {
  // Force layout recalculation
  element.offsetHeight;
  
  // Ensure all images are loaded
  const images = element.querySelectorAll('img');
  const imagePromises = Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(resolve => {
      img.addEventListener('load', resolve);
      img.addEventListener('error', resolve);
    });
  });
  
  await Promise.all(imagePromises);
  
  // Ensure all fonts are loaded
  if ('fonts' in document) {
    await document.fonts.ready;
  }
  
  // Small delay for any CSS transitions
  await new Promise(resolve => setTimeout(resolve, 100));
};
```

Use it before capturing:

```typescript
await prepareElementForCapture(sectionElement);
const canvas = await html2canvas(sectionElement, { ... });
```

This approach will preserve your KPI cards, vendor grids, and other styled sections exactly as they appear on screen!