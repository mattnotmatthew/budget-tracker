// Simplified PowerPoint generation focused on creating useable slides
import { SlideData, ExportResult, TableData } from '../components/ExportModal';

// Global PptxGenJS from CDN
declare global {
  interface Window {
    PptxGenJS: any;
  }
}

// Fixed 16:9 layout configuration
const SLIDE_LAYOUT = {
  width: 10,      // inches
  height: 5.625,  // inches (16:9 ratio)
  margin: 0.5,    // inches
  titleHeight: 0.8,
  contentTop: 1.5,
  footerHeight: 0.3
};

// Content zones for consistent slide layout
const CONTENT_ZONES = {
  title: { x: 0.5, y: 0.25, w: 9, h: 0.8 },
  mainContent: { x: 0.5, y: 1.5, w: 9, h: 3.5 },
  footer: { x: 0.5, y: 5.125, w: 9, h: 0.3 }
};

// Professional color scheme
const COLORS = {
  primary: '1F2937',      // Dark gray for titles
  secondary: '4B5563',    // Medium gray for text
  accent: '3B82F6',       // Blue for highlights
  background: 'FFFFFF',   // White background
  titleSlide: '1E40AF'    // Dark blue for title slide
};

interface ProcessedSlide {
  title: string;
  content: any[];  // Mixed content (text, images, tables)
  slideNumber: number;
}

export const generatePPTX = async (
  slides: SlideData[],
  layout: string = 'standard'
): Promise<ExportResult> => {
  try {
    console.log('Starting simplified PowerPoint generation...');
    
    // Check if PptxGenJS is available
    if (!window.PptxGenJS) {
      throw new Error('PptxGenJS library not loaded. Please refresh the page and try again.');
    }
    
    // Create new presentation
    const pptx = new window.PptxGenJS();
    
    // Set 16:9 layout
    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = 'Budget Tracker';
    pptx.company = 'Executive Summary Export';
    pptx.title = 'Executive Summary Presentation';
    
    // Add title slide
    addTitleSlide(pptx);
    
    // Process slides for optimal distribution
    const processedSlides = distributeContentAcrossSlides(slides);
    
    // Add content slides
    let slideNumber = 2; // Start after title slide
    for (let i = 0; i < processedSlides.length; i++) {
      const slide = processedSlides[i];
      addContentSlide(pptx, slide, slideNumber);
      slideNumber++;
    }
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const filename = `Executive-Summary-${timestamp}.pptx`;
    
    // Download the presentation
    await pptx.writeFile({ fileName: filename });
    
    console.log('PowerPoint generation completed successfully');
    
    return {
      success: true,
      filename: filename
    };

  } catch (error) {
    console.error('PowerPoint generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'PowerPoint generation failed'
    };
  }
};

/**
 * Create professional title slide
 */
function addTitleSlide(pptx: any): void {
  const slide = pptx.addSlide();
  
  // Dark blue background
  slide.background = { color: COLORS.titleSlide };
  
  // Main title
  slide.addText('Executive Summary', {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 1.5,
    fontSize: 48,
    fontFace: 'Arial',
    color: 'FFFFFF',
    bold: true,
    align: 'center',
    valign: 'middle'
  });
  
  // Subtitle with current year
  const currentYear = new Date().getFullYear();
  slide.addText(`${currentYear} Budget Performance Overview`, {
    x: 0.5,
    y: 3.0,
    w: 9,
    h: 0.8,
    fontSize: 28,
    fontFace: 'Arial',
    color: 'E0E7FF',
    align: 'center',
    valign: 'middle'
  });
  
  // Date
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  slide.addText(currentDate, {
    x: 0.5,
    y: 4.5,
    w: 9,
    h: 0.5,
    fontSize: 18,
    fontFace: 'Arial',
    color: 'CBD5E1',
    align: 'center'
  });
}

/**
 * Distribute content across slides intelligently
 */
function distributeContentAcrossSlides(slides: SlideData[]): ProcessedSlide[] {
  const processedSlides: ProcessedSlide[] = [];
  let slideNumber = 1;
  
  for (let i = 0; i < slides.length; i++) {
    const slideData = slides[i];
    // Handle different tab types
    if (slideData.id === 'executive-commentary') {
      // Split commentary into readable chunks
      const commentarySlides = splitExecutiveCommentary(slideData, slideNumber);
      processedSlides.push(...commentarySlides);
      slideNumber += commentarySlides.length;
    } else if (slideData.kpiCards && slideData.kpiCards.length > 0) {
      // Slides with KPI cards
      const kpiSlides = createKPISlides(slideData, slideNumber);
      processedSlides.push(...kpiSlides);
      slideNumber += kpiSlides.length;
    } else if (slideData.charts && slideData.charts.length > 0) {
      // Slides with charts
      const chartSlides = createChartSlides(slideData, slideNumber);
      processedSlides.push(...chartSlides);
      slideNumber += chartSlides.length;
    } else {
      // General content slides
      const contentSlides = createContentSlides(slideData, slideNumber);
      processedSlides.push(...contentSlides);
      slideNumber += contentSlides.length;
    }
  }
  
  return processedSlides;
}

/**
 * Split executive commentary into readable slides
 */
function splitExecutiveCommentary(slideData: SlideData, startNumber: number): ProcessedSlide[] {
  const slides: ProcessedSlide[] = [];
  const maxParagraphsPerSlide = 3;
  const paragraphs = slideData.content;
  
  for (let i = 0; i < paragraphs.length; i += maxParagraphsPerSlide) {
    const slideContent = paragraphs.slice(i, i + maxParagraphsPerSlide);
    
    slides.push({
      title: i === 0 ? slideData.title : `${slideData.title} (continued)`,
      content: slideContent.map(para => ({
        type: 'text',
        value: para
      })),
      slideNumber: startNumber + slides.length
    });
  }
  
  return slides.length > 0 ? slides : [{
    title: slideData.title,
    content: [{ type: 'text', value: 'No commentary provided' }],
    slideNumber: startNumber
  }];
}

/**
 * Create slides with KPI cards
 */
function createKPISlides(slideData: SlideData, startNumber: number): ProcessedSlide[] {
  const slides: ProcessedSlide[] = [];
  const maxImagesPerSlide = 2;
  
  // Group KPI cards
  for (let i = 0; i < (slideData.kpiCards?.length || 0); i += maxImagesPerSlide) {
    const images = slideData.kpiCards!.slice(i, i + maxImagesPerSlide);
    
    slides.push({
      title: slideData.title,
      content: [
        // Add any relevant text content first
        ...(i === 0 && slideData.content.length > 0 ? 
          slideData.content.slice(0, 3).map(text => ({ type: 'text', value: text })) : 
          []
        ),
        // Add images
        ...images.map(img => ({ type: 'image', value: img, layout: 'kpi' }))
      ],
      slideNumber: startNumber + slides.length
    });
  }
  
  return slides;
}

/**
 * Create slides with charts
 */
function createChartSlides(slideData: SlideData, startNumber: number): ProcessedSlide[] {
  const slides: ProcessedSlide[] = [];
  const maxChartsPerSlide = 2;
  
  // Add overview slide if there's text content
  if (slideData.content.length > 0) {
    slides.push({
      title: slideData.title,
      content: slideData.content.slice(0, 6).map(text => ({ type: 'text', value: text })),
      slideNumber: startNumber
    });
  }
  
  // Add chart slides
  for (let i = 0; i < (slideData.charts?.length || 0); i += maxChartsPerSlide) {
    const charts = slideData.charts!.slice(i, i + maxChartsPerSlide);
    
    slides.push({
      title: `${slideData.title} - Charts`,
      content: charts.map(chart => ({ type: 'image', value: chart, layout: 'chart' })),
      slideNumber: startNumber + slides.length
    });
  }
  
  return slides;
}

/**
 * Create general content slides
 */
function createContentSlides(slideData: SlideData, startNumber: number): ProcessedSlide[] {
  const slides: ProcessedSlide[] = [];
  const maxBulletsPerSlide = 8;
  const maxTablesPerSlide = 1;
  
  let currentSlide: ProcessedSlide = {
    title: slideData.title,
    content: [],
    slideNumber: startNumber
  };
  
  // Add text content
  let bulletCount = 0;
  for (let i = 0; i < slideData.content.length; i++) {
    const text = slideData.content[i];
    if (bulletCount >= maxBulletsPerSlide) {
      slides.push(currentSlide);
      currentSlide = {
        title: `${slideData.title} (continued)`,
        content: [],
        slideNumber: startNumber + slides.length + 1
      };
      bulletCount = 0;
    }
    
    currentSlide.content.push({ type: 'text', value: text });
    bulletCount++;
  }
  
  // Add tables
  if (slideData.tables && slideData.tables.length > 0) {
    for (let i = 0; i < slideData.tables.length; i++) {
      const table = slideData.tables[i];
      if (currentSlide.content.length > 0) {
        slides.push(currentSlide);
        currentSlide = {
          title: `${slideData.title} - ${table.caption || 'Table'}`,
          content: [],
          slideNumber: startNumber + slides.length + 1
        };
      }
      
      currentSlide.content.push({ type: 'table', value: table });
    }
  }
  
  // Add styled sections
  if (slideData.styledSections && slideData.styledSections.length > 0) {
    for (let i = 0; i < slideData.styledSections.length; i++) {
      const section = slideData.styledSections[i];
      if (currentSlide.content.length > 0) {
        slides.push(currentSlide);
        currentSlide = {
          title: slideData.title,
          content: [],
          slideNumber: startNumber + slides.length + 1
        };
      }
      
      currentSlide.content.push({ type: 'image', value: section.image, layout: 'styled' });
    }
  }
  
  if (currentSlide.content.length > 0) {
    slides.push(currentSlide);
  }
  
  return slides.length > 0 ? slides : [{
    title: slideData.title,
    content: [{ type: 'text', value: 'No content available' }],
    slideNumber: startNumber
  }];
}

/**
 * Add content slide to presentation
 */
function addContentSlide(pptx: any, slide: ProcessedSlide, slideNumber: number): void {
  const pptxSlide = pptx.addSlide();
  
  // Add title
  pptxSlide.addText(slide.title, {
    x: CONTENT_ZONES.title.x,
    y: CONTENT_ZONES.title.y,
    w: CONTENT_ZONES.title.w,
    h: CONTENT_ZONES.title.h,
    fontSize: 32,
    fontFace: 'Arial',
    color: COLORS.primary,
    bold: true,
    align: 'left',
    valign: 'top'
  });
  
  // Add title underline
  pptxSlide.addShape('rect', {
    x: CONTENT_ZONES.title.x,
    y: CONTENT_ZONES.title.y + 0.7,
    w: CONTENT_ZONES.title.w,
    h: 0.02,
    fill: { color: COLORS.accent }
  });
  
  // Add content based on type
  let currentY = CONTENT_ZONES.mainContent.y;
  const contentArea = CONTENT_ZONES.mainContent;
  
  for (let i = 0; i < slide.content.length; i++) {
    const item = slide.content[i];
    if (currentY >= contentArea.y + contentArea.h - 0.5) break; // Leave space for footer
    
    switch (item.type) {
      case 'text':
        currentY = addTextContent(pptxSlide, item.value, currentY, contentArea);
        break;
      case 'image':
        currentY = addImageContent(pptxSlide, item.value, currentY, contentArea, item.layout);
        break;
      case 'table':
        currentY = addTableContent(pptxSlide, item.value, currentY, contentArea);
        break;
    }
  }
  
  // Add slide number
  pptxSlide.addText(`${slideNumber}`, {
    x: CONTENT_ZONES.footer.x + CONTENT_ZONES.footer.w - 1,
    y: CONTENT_ZONES.footer.y,
    w: 1,
    h: CONTENT_ZONES.footer.h,
    fontSize: 12,
    fontFace: 'Arial',
    color: COLORS.secondary,
    align: 'right'
  });
}

/**
 * Add text content to slide
 */
function addTextContent(slide: any, text: string, currentY: number, contentArea: any): number {
  const isLongText = text.length > 150;
  const fontSize = isLongText ? 14 : 16;
  const lineHeight = isLongText ? 0.5 : 0.6;
  const bullet = text.length < 150 ? '• ' : '';
  
  slide.addText(`${bullet}${text}`, {
    x: contentArea.x + (bullet ? 0.3 : 0),
    y: currentY,
    w: contentArea.w - (bullet ? 0.3 : 0),
    h: lineHeight,
    fontSize: fontSize,
    fontFace: 'Arial',
    color: COLORS.secondary,
    align: 'left',
    valign: 'top',
    wrap: true
  });
  
  return currentY + lineHeight + 0.1;
}

/**
 * Add image content to slide
 */
function addImageContent(slide: any, imageData: string, currentY: number, contentArea: any, layout: string): number {
  let imageHeight = 2.5; // Default height
  let imageWidth = contentArea.w;
  
  // Adjust size based on layout type
  switch (layout) {
    case 'kpi':
      imageHeight = 2.0;
      break;
    case 'chart':
      imageHeight = 3.0;
      break;
    case 'styled':
      imageHeight = 2.5;
      break;
  }
  
  // Ensure image fits in remaining space
  const remainingHeight = (contentArea.y + contentArea.h) - currentY - 0.5;
  if (imageHeight > remainingHeight) {
    imageHeight = remainingHeight;
  }
  
  try {
    slide.addImage({
      data: imageData,
      x: contentArea.x,
      y: currentY,
      w: imageWidth,
      h: imageHeight,
      sizing: { type: 'contain' }
    });
  } catch (error) {
    console.warn('Failed to add image to slide:', error);
    // Add placeholder text if image fails
    slide.addText('[Image could not be displayed]', {
      x: contentArea.x,
      y: currentY,
      w: imageWidth,
      h: 0.5,
      fontSize: 14,
      fontFace: 'Arial',
      color: COLORS.secondary,
      align: 'center'
    });
    return currentY + 0.5;
  }
  
  return currentY + imageHeight + 0.3;
}

/**
 * Add table content to slide
 */
function addTableContent(slide: any, table: TableData, currentY: number, contentArea: any): number {
  const maxRows = 10; // Limit rows for readability
  
  // Prepare table data
  const tableRows = [];
  
  // Add headers
  if (table.headers.length > 0) {
    tableRows.push(table.headers.map(header => ({
      text: header,
      options: { 
        bold: true, 
        fill: { color: 'F3F4F6' }, 
        color: COLORS.primary,
        fontSize: 12
      }
    })));
  }
  
  // Add data rows (limited)
  const dataRows = table.rows.slice(0, maxRows);
  dataRows.forEach(row => {
    tableRows.push(row.map(cell => ({
      text: cell,
      options: { 
        color: COLORS.secondary,
        fontSize: 11
      }
    })));
  });
  
  // Calculate table height
  const tableHeight = Math.min(tableRows.length * 0.3 + 0.5, 3.0);
  
  try {
    slide.addTable(tableRows, {
      x: contentArea.x,
      y: currentY,
      w: contentArea.w,
      h: tableHeight,
      border: { type: 'solid', pt: 1, color: 'E5E7EB' },
      margin: 0.1,
      align: 'left',
      valign: 'middle'
    });
  } catch (error) {
    console.warn('Failed to add table to slide:', error);
    return currentY;
  }
  
  return currentY + tableHeight + 0.3;
}