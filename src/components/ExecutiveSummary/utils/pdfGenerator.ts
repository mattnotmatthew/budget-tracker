import jsPDF from 'jspdf';
import { SlideData, ExportResult } from '../components/ExportModal';
import { getLayoutConfig } from './exportUtils';

export const generatePDF = async (
  slides: SlideData[],
  layout: string = 'standard'
): Promise<ExportResult> => {
  try {
    const config = getLayoutConfig(layout);
    
    // Create new PDF document with landscape orientation
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [config.width, config.height]
    });

    // Set font
    pdf.setFont('Arial', 'normal');

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
      pdf.setTextColor(59, 130, 246); // Blue color
      pdf.text(slide.title, config.margins.left, yPosition);
      yPosition += config.fontSize.title * 1.5;

      const maxWidth = config.width - config.margins.left - config.margins.right;

      // Add KPI Cards if present
      if (slide.kpiCards && slide.kpiCards.length > 0) {
        for (const kpiImage of slide.kpiCards) {
          if (kpiImage && kpiImage.startsWith('data:image/')) {
            try {
              // Calculate dimensions
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

      // Add content bullets (only if not redundant with images)
      const hasKPIImages = slide.kpiCards && slide.kpiCards.length > 0;
      const hasStyledSections = slide.styledSections && slide.styledSections.length > 0;
      
      // Only add text if it's not already captured in images OR if it's executive commentary
      if (slide.content && slide.content.length > 0 && (!hasKPIImages || slide.id === 'executive-commentary')) {
        pdf.setFontSize(config.fontSize.content);
        pdf.setFont('Arial', 'normal');
        pdf.setTextColor(0, 0, 0); // Black color

        const lineHeight = config.fontSize.content * 1.6;

        slide.content.forEach((bullet, index) => {
          const bulletText = slide.id === 'executive-commentary' ? bullet : `• ${bullet}`;
          
          // Split text if too long
          const lines = pdf.splitTextToSize(bulletText, maxWidth - 20);
          
          lines.forEach((line: string, lineIndex: number) => {
            if (yPosition + lineHeight > config.height - config.margins.bottom) {
              // Add new page if content doesn't fit
              pdf.addPage();
              yPosition = config.margins.top;
            }
            
            pdf.text(line, config.margins.left + (lineIndex > 0 ? 20 : 0), yPosition);
            yPosition += lineHeight;
          });
          
          yPosition += lineHeight * 0.3; // Extra spacing between bullets
        });
      }

      // Add charts if any
      if (slide.charts && slide.charts.length > 0) {
        yPosition += 20;
        
        slide.charts.forEach((chartImage, chartIndex) => {
          if (chartImage && chartImage.startsWith('data:image/')) {
            try {
              const chartWidth = Math.min(400, maxWidth * 0.6);
              const chartHeight = chartWidth * 0.6; // Maintain aspect ratio
              
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
                chartHeight
              );
              
              yPosition += chartHeight + 20;
            } catch (error) {
              console.warn(`Failed to add chart ${chartIndex} to PDF:`, error);
            }
          }
        });
      }

      // Add tables if any
      if (slide.tables && slide.tables.length > 0) {
        yPosition += 20;
        
        slide.tables.forEach((table, tableIndex) => {
          if (yPosition + 100 > config.height - config.margins.bottom) {
            pdf.addPage();
            yPosition = config.margins.top;
          }
          
          // Table title
          if (table.caption) {
            pdf.setFontSize(config.fontSize.table + 2);
            pdf.setFont('Arial', 'bold');
            pdf.text(table.caption, config.margins.left, yPosition);
            yPosition += (config.fontSize.table + 2) * 1.4;
          }
          
          // Table headers
          pdf.setFontSize(config.fontSize.table);
          pdf.setFont('Arial', 'bold');
          
          const columnWidth = Math.min(120, maxWidth / Math.max(table.headers.length, 1));
          let xPosition = config.margins.left;
          
          table.headers.forEach((header) => {
            pdf.text(header, xPosition, yPosition);
            xPosition += columnWidth;
          });
          
          yPosition += config.fontSize.table * 1.4;
          
          // Table rows
          pdf.setFont('Arial', 'normal');
          const maxRowsToFit = Math.min(8, table.rows.length);
          
          for (let rowIndex = 0; rowIndex < maxRowsToFit; rowIndex++) {
            const row = table.rows[rowIndex];
            xPosition = config.margins.left;
            
            // Check if we have space for another row
            if (yPosition + config.fontSize.table * 1.4 > config.height - config.margins.bottom) {
              break; // Stop adding rows if no space
            }
            
            row.forEach((cell) => {
              const cellText = pdf.splitTextToSize(cell || '', columnWidth - 10);
              pdf.text(cellText[0] || '', xPosition, yPosition);
              xPosition += columnWidth;
            });
            
            yPosition += config.fontSize.table * 1.4;
          }
          
          yPosition += 15; // Space after table
        });
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