// Alternative PowerPoint export approach
import { SlideData, ExportResult } from '../components/ExportModal';

export const generatePPTXAlternative = async (
  slides: SlideData[],
  layout: string = 'standard'
): Promise<ExportResult> => {
  try {
    // Create a structured JSON that represents the PowerPoint presentation
    const presentation = {
      metadata: {
        title: 'Executive Summary',
        subtitle: '2025 Budget Performance Overview',
        layout: layout,
        createdAt: new Date().toISOString(),
        format: 'pptx-json'
      },
      slides: slides.map((slide, index) => ({
        slideNumber: index + 1,
        title: slide.title,
        content: slide.content,
        hasKPICards: !!(slide.kpiCards && slide.kpiCards.length > 0),
        kpiCardsCount: slide.kpiCards?.length || 0,
        hasStyledSections: !!(slide.styledSections && slide.styledSections.length > 0),
        styledSectionsCount: slide.styledSections?.length || 0,
        hasCharts: !!(slide.charts && slide.charts.length > 0),
        chartsCount: slide.charts?.length || 0,
        hasTables: !!(slide.tables && slide.tables.length > 0),
        tablesCount: slide.tables?.length || 0,
        // Include base64 images
        kpiCards: slide.kpiCards || [],
        styledSections: slide.styledSections || [],
        charts: slide.charts || [],
        tables: slide.tables || []
      }))
    };

    // Convert to JSON and create a downloadable file
    const jsonString = JSON.stringify(presentation, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const filename = `Executive-Summary-${layout}-${timestamp}.json`;
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);

    return {
      success: true,
      filename: filename
    };
  } catch (error) {
    console.error('Alternative PPTX generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};