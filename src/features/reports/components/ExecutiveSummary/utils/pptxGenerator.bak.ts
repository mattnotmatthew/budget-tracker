// PowerPoint generation with HTML export approach
import { SlideData, ExportResult, TableData } from '../components/ExportModal';
import { getLayoutConfig } from './exportUtils';

// Create a PowerPoint-compatible HTML format that can be imported
export const generatePPTX = async (
  slides: SlideData[],
  layout: string = 'standard'
): Promise<ExportResult> => {
  try {
    // Create a PowerPoint-ready HTML file that can be imported into PowerPoint
    const config = getLayoutConfig(layout);
    
    // Create HTML content that PowerPoint can import
    let htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Executive Summary - ${new Date().toLocaleDateString()}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
    .slide { 
      width: ${config.width}px; 
      height: ${config.height}px; 
      padding: 40px;
      page-break-after: always;
      position: relative;
      background: white;
      overflow: hidden;
    }
    .slide-title { 
      color: #3B82F6; 
      font-size: ${config.fontSize.title}px; 
      font-weight: bold;
      margin-bottom: 30px;
    }
    .slide-content { font-size: ${config.fontSize.content}px; }
    .bullet-point { margin: 10px 0; padding-left: 20px; }
    .kpi-image, .chart-image, .styled-image { 
      max-width: 100%; 
      margin: 20px 0;
      display: block;
    }
    .slide-number {
      position: absolute;
      bottom: 20px;
      right: 40px;
      color: #9CA3AF;
      font-size: 14px;
    }
    table {
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f0f9ff;
      font-weight: bold;
    }
    @media print {
      .slide { page-break-after: always; }
    }
  </style>
</head>
<body>
`;

    // Add title slide
    htmlContent += `
  <div class="slide">
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%;">
      <h1 style="font-size: 48px; color: #3B82F6; margin-bottom: 20px;">Executive Summary</h1>
      <h2 style="font-size: 24px; color: #6B7280;">2025 Budget Performance Overview</h2>
      <p style="font-size: 16px; color: #9CA3AF; margin-top: 40px;">${new Date().toLocaleDateString()}</p>
    </div>
  </div>
`;

    // Helper function to split long content into multiple slides
    const splitSlideContent = (slide: SlideData, maxContentItems: number = 10, maxTableRows: number = 8): SlideData[] => {
      // If no tables or short content, return as is
      if (!slide.tables || slide.tables.length === 0) {
        return [slide];
      }
      
      const splitSlides: SlideData[] = [];
      let currentSlide: SlideData = {
        ...slide,
        tables: [],
        content: slide.content.slice(0, 5) // Keep first few content items
      };
      
      slide.tables.forEach((table, tableIndex) => {
        // Check if table has many rows
        if (table.rows.length > maxTableRows) {
          // Split table into chunks
          const chunks: TableData[] = [];
          for (let i = 0; i < table.rows.length; i += maxTableRows) {
            chunks.push({
              ...table,
              headers: table.headers, // Keep headers for each chunk
              rows: table.rows.slice(i, i + maxTableRows),
              caption: `${table.caption || 'Table'} (Part ${Math.floor(i/maxTableRows) + 1})`
            });
          }
          
          chunks.forEach(chunk => {
            if (currentSlide.tables!.length >= 2) {
              splitSlides.push(currentSlide);
              currentSlide = {
                ...slide,
                id: `${slide.id}-${splitSlides.length + 1}`,
                title: `${slide.title} (Continued)`,
                content: [],
                kpiCards: [], // Don't repeat KPI cards
                styledSections: [], // Don't repeat styled sections
                tables: [chunk]
              };
            } else {
              currentSlide.tables!.push(chunk);
            }
          });
        } else {
          // Add table normally
          if (currentSlide.tables!.length >= 2) {
            splitSlides.push(currentSlide);
            currentSlide = {
              ...slide,
              id: `${slide.id}-${splitSlides.length + 1}`,
              title: `${slide.title} (Continued)`,
              content: [],
              kpiCards: [], // Don't repeat KPI cards
              styledSections: [], // Don't repeat styled sections
              tables: [table]
            };
          } else {
            currentSlide.tables!.push(table);
          }
        }
      });
      
      splitSlides.push(currentSlide);
      return splitSlides;
    };
    
    // Apply pagination to slides that need it (especially Resource Allocation)
    const paginatedSlides = slides.flatMap(slide => {
      // More aggressive pagination for resource allocation and vendor info
      if (slide.id === 'resources' || slide.id === 'vendor-info') {
        return splitSlideContent(slide, 6, 5);
      } else if (slide.tables && slide.tables.some(t => t.rows.length > 6)) {
        return splitSlideContent(slide, 8, 6);
      }
      return [slide];
    });
    
    // Add content slides
    paginatedSlides.forEach((slide, index) => {
      htmlContent += `
  <div class="slide">
    <h2 class="slide-title">${slide.title}</h2>
    <div class="slide-content">
`;

      // For Overall Budget, we need to render content and images in order
      if (slide.id === 'overall-budget') {
        // Process content and styled sections together to maintain order
        let styledSectionIndex = 0;
        
        slide.content.forEach((text, index) => {
          // Check if this is a markdown header (marked with **text**)
          if (text.startsWith('**') && text.endsWith('**')) {
            const headerText = text.slice(2, -2); // Remove ** markers
            htmlContent += `      <h3 style="color: #1F2937; font-size: ${config.fontSize.content + 4}px; margin: 20px 0 10px 0;">${headerText}</h3>\n`;
            
            // After a header, check if we have a corresponding styled section
            if (slide.styledSections && styledSectionIndex < slide.styledSections.length) {
              const section = slide.styledSections[styledSectionIndex];
              if (section.type.startsWith('overall-budget-section-') && section.image && section.image.startsWith('data:image/')) {
                htmlContent += `      <img src="${section.image}" class="styled-image" alt="${section.type}" style="margin: 10px 0; max-width: 100%;" />\n`;
                styledSectionIndex++;
              }
            }
          } else {
            // Regular text content
            htmlContent += `      <div class="bullet-point">${text}</div>\n`;
          }
        });
      } else {
        // Regular rendering for other slides
        // Add KPI cards as images
        if (slide.kpiCards && slide.kpiCards.length > 0) {
          slide.kpiCards.forEach(kpiImage => {
            if (kpiImage && kpiImage.startsWith('data:image/')) {
              htmlContent += `      <img src="${kpiImage}" class="kpi-image" alt="KPI Card" />\n`;
            }
          });
        }

        // Add styled sections
        if (slide.styledSections && slide.styledSections.length > 0) {
          slide.styledSections.forEach(section => {
            if (section.image && section.image.startsWith('data:image/')) {
              htmlContent += `      <img src="${section.image}" class="styled-image" alt="${section.type}" />\n`;
            }
          });
        }

        // Add text content - always show headers, show other content conditionally
        const hasKPIImages = slide.kpiCards && slide.kpiCards.length > 0;
        const hasStyledImages = slide.styledSections && slide.styledSections.length > 0;
        
        if (slide.content.length > 0) {
          slide.content.forEach(text => {
            // Check if this is a markdown header (marked with **text**)
            if (text.startsWith('**') && text.endsWith('**')) {
              const headerText = text.slice(2, -2); // Remove ** markers
              // Always show headers regardless of images
              htmlContent += `      <h3 style="color: #1F2937; font-size: ${config.fontSize.content + 4}px; margin: 20px 0 10px 0;">${headerText}</h3>\n`;
            } else {
              // Only show non-header content if no redundant images or it's executive commentary
              if (!hasKPIImages && !hasStyledImages || slide.id === 'executive-commentary') {
                const prefix = slide.id === 'executive-commentary' ? '' : '• ';
                htmlContent += `      <div class="bullet-point">${prefix}${text}</div>\n`;
              }
            }
          });
        }
      }

      // Add charts
      if (slide.charts && slide.charts.length > 0) {
        slide.charts.forEach(chartImage => {
          if (chartImage && chartImage.startsWith('data:image/')) {
            htmlContent += `      <img src="${chartImage}" class="chart-image" alt="Chart" />\n`;
          }
        });
      }

      // Add tables
      if (slide.tables && slide.tables.length > 0) {
        slide.tables.forEach(table => {
          htmlContent += `      <table>\n`;
          if (table.caption) {
            htmlContent += `        <caption style="font-weight: bold; margin-bottom: 10px;">${table.caption}</caption>\n`;
          }
          if (table.headers.length > 0) {
            htmlContent += `        <tr>\n`;
            table.headers.forEach(header => {
              htmlContent += `          <th>${header}</th>\n`;
            });
            htmlContent += `        </tr>\n`;
          }
          table.rows.forEach(row => {
            htmlContent += `        <tr>\n`;
            row.forEach(cell => {
              htmlContent += `          <td>${cell}</td>\n`;
            });
            htmlContent += `        </tr>\n`;
          });
          htmlContent += `      </table>\n`;
        });
      }

      htmlContent += `
    </div>
    <div class="slide-number">${index + 2}</div>
  </div>
`; // +2 because index 0 is after title slide
    });

    htmlContent += `
</body>
</html>
`;

    // Create a blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const filename = `Executive-Summary-${layout}-${timestamp}.html`;
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);

    return {
      success: true,
      filename: filename
    };

  } catch (error) {
    console.error('PPTX generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};