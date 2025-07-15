# Claude Code Implementation Guide - CDN PptxGenJS Solution

## Problem Summary
The current PowerPoint export is broken due to:
1. HTML export approach that doesn't create real PowerPoint files
2. Webpack bundling errors with Node.js modules (`node:fs`, `node:https`)
3. Content cutoff and formatting issues

## Solution Overview
Replace the broken HTML approach with CDN-based PptxGenJS that creates real .pptx files.

---

## File Changes Required

### Change 1: Update `public/index.html`

**Action**: Add CDN script tag to the `<head>` section

**Location**: `public/index.html`

**Find this section**:
```html
<head>
  <meta charset="utf-8" />
  <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
  <!-- other meta tags -->
</head>
```

**Add this line before the closing `</head>` tag**:
```html
<!-- Add PptxGenJS CDN for PowerPoint export -->
<script src="https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js"></script>
```

**Result should look like**:
```html
<head>
  <meta charset="utf-8" />
  <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#000000" />
  
  <!-- Add PptxGenJS CDN for PowerPoint export -->
  <script src="https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js"></script>
  
  <title>Budget Tracker</title>
</head>
```

### Change 2: Replace `src/utils/pptxGenerator.ts`

**Action**: Replace entire file content

**Location**: `src/utils/pptxGenerator.ts`

**Replace with**:
```typescript
// CDN-based PowerPoint generation using PptxGenJS
import { SlideData, ExportResult, TableData } from '../components/ExportModal';
import { getLayoutConfig } from './exportUtils';

// Global PptxGenJS from CDN
declare global {
  interface Window {
    PptxGenJS: any;
  }
}

// Enhanced interfaces for PptxGenJS compatibility
interface PptxSlide {
  title: string;
  content: string[];
  images: { type: string; data: string; width?: number; height?: number }[];
  tables: TableData[];
  pageNumber: number;
}

interface SlideLayout {
  width: number;
  height: number;
  margin: number;
  contentArea: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export const generatePPTX = async (
  slides: SlideData[],
  layout: string = 'standard'
): Promise<ExportResult> => {
  try {
    console.log('Starting CDN PowerPoint generation...');
    
    // Check if PptxGenJS is available from CDN
    if (!window.PptxGenJS) {
      throw new Error('PptxGenJS library not loaded. Please refresh the page and try again.');
    }
    
    // Create new presentation using CDN version
    const pptx = new window.PptxGenJS();
    
    // Configure presentation layout
    const layoutConfig = getLayoutConfig(layout);
    const slideLayout = configureSlideLayout(pptx, layoutConfig);
    
    // Add title slide
    await addTitleSlide(pptx, slideLayout);
    
    // Process and add content slides
    const processedSlides = processSlides(slides);
    
    for (const slide of processedSlides) {
      await addContentSlide(pptx, slide, slideLayout);
    }
    
    // Generate and download the presentation
    const filename = `Executive-Summary-${layout}-${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.pptx`;
    
    // Use CDN version's writeFile method
    await pptx.writeFile({ fileName: filename });
    
    console.log('CDN PowerPoint generation completed successfully');
    
    return {
      success: true,
      filename: filename
    };

  } catch (error) {
    console.error('CDN PowerPoint generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'PowerPoint generation failed. Please refresh and try again.'
    };
  }
};

// Configure slide layout based on user selection
function configureSlideLayout(pptx: any, config: any): SlideLayout {
  // Set presentation layout
  if (config.aspectRatio === '16:9') {
    pptx.layout = 'LAYOUT_WIDE';
  } else if (config.aspectRatio === '4:3') {
    pptx.layout = 'LAYOUT_4x3';
  } else {
    pptx.layout = 'LAYOUT_16x10';
  }
  
  // Calculate dimensions in inches (PptxGenJS uses inches)
  const width = config.width / 96; // Convert pixels to inches (96 DPI)
  const height = config.height / 96;
  const margin = 0.5; // 0.5 inch margins
  
  return {
    width,
    height,
    margin,
    contentArea: {
      x: margin,
      y: margin + 1, // Extra space for title
      w: width - (margin * 2),
      h: height - (margin * 2) - 1 // Account for title space
    }
  };
}

// Add professional title slide
async function addTitleSlide(pptx: any, layout: SlideLayout): Promise<void> {
  const slide = pptx.addSlide();
  
  // Add background color
  slide.background = { color: '4472C4' };
  
  // Add main title
  slide.addText('Executive Summary', {
    x: layout.margin,
    y: layout.height * 0.3,
    w: layout.width - (layout.margin * 2),
    h: 1.5,
    fontSize: 44,
    fontFace: 'Arial',
    color: 'FFFFFF',
    bold: true,
    align: 'center',
    valign: 'middle'
  });
  
  // Add subtitle
  slide.addText('2025 Budget Performance Overview', {
    x: layout.margin,
    y: layout.height * 0.5,
    w: layout.width - (layout.margin * 2),
    h: 1,
    fontSize: 24,
    fontFace: 'Arial',
    color: 'E7E6E6',
    align: 'center',
    valign: 'middle'
  });
  
  // Add date
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  slide.addText(currentDate, {
    x: layout.margin,
    y: layout.height * 0.7,
    w: layout.width - (layout.margin * 2),
    h: 0.5,
    fontSize: 16,
    fontFace: 'Arial',
    color: 'D0D0D0',
    align: 'center',
    valign: 'middle'
  });
}

// Process slides and handle content splitting
function processSlides(slides: SlideData[]): PptxSlide[] {
  const processedSlides: PptxSlide[] = [];
  let pageCounter = 1;
  
  slides.forEach(slide => {
    const splitSlides = splitSlideIntelligently(slide);
    
    splitSlides.forEach((splitSlide, index) => {
      const processedSlide: PptxSlide = {
        title: index === 0 ? splitSlide.title : `${splitSlide.title} (Part ${index + 1})`,
        content: splitSlide.content,
        images: convertSlideImages(splitSlide),
        tables: splitSlide.tables || [],
        pageNumber: pageCounter++
      };
      
      processedSlides.push(processedSlide);
    });
  });
  
  return processedSlides;
}

// Intelligently split slides based on content volume
function splitSlideIntelligently(slide: SlideData): SlideData[] {
  // For executive commentary - split by paragraphs
  if (slide.id === 'executive-commentary') {
    return splitExecutiveCommentary(slide);
  }
  
  // For overall budget - maintain header-image relationships
  if (slide.id === 'overall-budget') {
    return splitOverallBudget(slide);
  }
  
  // For table-heavy slides
  if (slide.tables && slide.tables.some(table => table.rows.length > 15)) {
    return splitTableHeavySlide(slide);
  }
  
  // For content-heavy slides
  if (slide.content.length > 12) {
    return splitContentHeavySlide(slide);
  }
  
  return [slide];
}

// Split executive commentary by paragraphs
function splitExecutiveCommentary(slide: SlideData): SlideData[] {
  const slides: SlideData[] = [];
  const paragraphs = slide.content;
  const maxParagraphsPerSlide = 3;
  
  for (let i = 0; i < paragraphs.length; i += maxParagraphsPerSlide) {
    const slideContent = paragraphs.slice(i, i + maxParagraphsPerSlide);
    
    slides.push({
      ...slide,
      content: slideContent,
      // Only first slide gets images
      kpiCards: i === 0 ? slide.kpiCards : [],
      styledSections: i === 0 ? slide.styledSections : [],
      charts: i === 0 ? slide.charts : [],
      tables: i === 0 ? slide.tables : []
    });
  }
  
  return slides.length > 0 ? slides : [slide];
}

// Split overall budget maintaining structure
function splitOverallBudget(slide: SlideData): SlideData[] {
  const slides: SlideData[] = [];
  let currentSlide: SlideData = {
    ...slide,
    content: [],
    styledSections: []
  };
  
  let contentCount = 0;
  let imageCount = 0;
  let styledSectionIndex = 0;
  
  slide.content.forEach(text => {
    const isHeader = text.startsWith('**') && text.endsWith('**');
    const willHaveImage = isHeader && slide.styledSections && styledSectionIndex < slide.styledSections.length;
    
    // Start new slide if getting too full
    if (contentCount >= 8 || (willHaveImage && imageCount >= 2)) {
      if (currentSlide.content.length > 0) {
        slides.push(currentSlide);
        currentSlide = {
          ...slide,
          content: [],
          styledSections: [],
          kpiCards: [], // Only first slide gets these
          charts: [],
          tables: []
        };
        contentCount = 0;
        imageCount = 0;
      }
    }
    
    currentSlide.content.push(text);
    contentCount++;
    
    // Add corresponding image
    if (isHeader && slide.styledSections && styledSectionIndex < slide.styledSections.length) {
      const section = slide.styledSections[styledSectionIndex];
      if (section.type.startsWith('overall-budget-section-')) {
        currentSlide.styledSections = currentSlide.styledSections || [];
        currentSlide.styledSections.push(section);
        imageCount++;
        styledSectionIndex++;
      }
    }
  });
  
  if (currentSlide.content.length > 0) {
    slides.push(currentSlide);
  }
  
  return slides.length > 0 ? slides : [slide];
}

// Split table-heavy slides
function splitTableHeavySlide(slide: SlideData): SlideData[] {
  const slides: SlideData[] = [];
  
  // First slide gets content and small tables
  let firstSlide: SlideData = {
    ...slide,
    tables: [],
    content: slide.content.slice(0, 8)
  };
  
  // Distribute tables
  let currentSlide = firstSlide;
  
  slide.tables?.forEach(table => {
    if (table.rows.length <= 15) {
      // Small table - add to current slide
      currentSlide.tables = currentSlide.tables || [];
      currentSlide.tables.push(table);
    } else {
      // Large table - needs its own slide(s)
      if (currentSlide.tables && currentSlide.tables.length > 0) {
        slides.push(currentSlide);
      }
      
      // Split large table
      const splitTables = splitLargeTable(table);
      splitTables.forEach(splitTable => {
        slides.push({
          ...slide,
          content: [],
          kpiCards: [],
          styledSections: [],
          charts: [],
          tables: [splitTable]
        });
      });
      
      currentSlide = {
        ...slide,
        content: [],
        kpiCards: [],
        styledSections: [],
        charts: [],
        tables: []
      };
    }
  });
  
  if (currentSlide.tables && currentSlide.tables.length > 0 || currentSlide.content.length > 0) {
    slides.push(currentSlide);
  }
  
  return slides.length > 0 ? slides : [slide];
}

// Split large tables
function splitLargeTable(table: TableData): TableData[] {
  const maxRowsPerSlide = 15;
  const chunks: TableData[] = [];
  
  for (let i = 0; i < table.rows.length; i += maxRowsPerSlide) {
    chunks.push({
      headers: table.headers,
      rows: table.rows.slice(i, i + maxRowsPerSlide),
      caption: `${table.caption || 'Table'} (Part ${Math.floor(i / maxRowsPerSlide) + 1})`
    });
  }
  
  return chunks;
}

// Split content-heavy slides
function splitContentHeavySlide(slide: SlideData): SlideData[] {
  const slides: SlideData[] = [];
  const maxContentPerSlide = 12;
  
  for (let i = 0; i < slide.content.length; i += maxContentPerSlide) {
    slides.push({
      ...slide,
      content: slide.content.slice(i, i + maxContentPerSlide),
      // Only first slide gets images
      kpiCards: i === 0 ? slide.kpiCards : [],
      styledSections: i === 0 ? slide.styledSections : [],
      charts: i === 0 ? slide.charts : [],
      tables: i === 0 ? slide.tables : []
    });
  }
  
  return slides;
}

// Convert slide images to proper format
function convertSlideImages(slide: SlideData): { type: string; data: string; width?: number; height?: number }[] {
  const images: { type: string; data: string; width?: number; height?: number }[] = [];
  
  // Add KPI card images
  slide.kpiCards?.forEach(kpiImage => {
    if (kpiImage && kpiImage.startsWith('data:image/')) {
      images.push({
        type: 'kpi',
        data: kpiImage,
        width: 8,
        height: 2
      });
    }
  });
  
  // Add styled section images
  slide.styledSections?.forEach(section => {
    if (section.image && section.image.startsWith('data:image/')) {
      images.push({
        type: section.type,
        data: section.image,
        width: 8,
        height: 3
      });
    }
  });
  
  // Add chart images
  slide.charts?.forEach(chartImage => {
    if (chartImage && chartImage.startsWith('data:image/')) {
      images.push({
        type: 'chart',
        data: chartImage,
        width: 7,
        height: 4
      });
    }
  });
  
  return images;
}

// Add content slide to presentation
async function addContentSlide(pptx: any, slide: PptxSlide, layout: SlideLayout): Promise<void> {
  const pptxSlide = pptx.addSlide();
  
  let currentY = layout.contentArea.y;
  
  // Add slide title
  pptxSlide.addText(slide.title, {
    x: layout.contentArea.x,
    y: layout.margin,
    w: layout.contentArea.w,
    h: 0.8,
    fontSize: 28,
    fontFace: 'Arial',
    color: '1F2937',
    bold: true,
    align: 'left',
    valign: 'middle'
  });
  
  // Add title underline
  pptxSlide.addShape('rect', {
    x: layout.contentArea.x,
    y: layout.margin + 0.7,
    w: layout.contentArea.w,
    h: 0.05,
    fill: '3B82F6'
  });
  
  // Add images first
  if (slide.images.length > 0) {
    for (const image of slide.images) {
      if (currentY + 3 > layout.height - layout.margin) break;
      
      try {
        pptxSlide.addImage({
          data: image.data,
          x: layout.contentArea.x,
          y: currentY,
          w: Math.min(image.width || 6, layout.contentArea.w),
          h: image.height || 2.5
        });
        
        currentY += (image.height || 2.5) + 0.3;
      } catch (error) {
        console.warn('Failed to add image to slide:', error);
        // Continue without the image
      }
    }
  }
  
  // Add content text
  if (slide.content.length > 0 && currentY < layout.height - layout.margin - 1) {
    slide.content.forEach((text, index) => {
      if (currentY >= layout.height - layout.margin - 0.5) return;
      
      if (text.startsWith('**') && text.endsWith('**')) {
        // Header text
        const headerText = text.slice(2, -2);
        pptxSlide.addText(headerText, {
          x: layout.contentArea.x,
          y: currentY,
          w: layout.contentArea.w,
          h: 0.4,
          fontSize: 18,
          fontFace: 'Arial',
          color: '1F2937',
          bold: true,
          align: 'left'
        });
        currentY += 0.5;
      } else if (text.length > 150) {
        // Paragraph text
        const textHeight = Math.min(text.length / 120, 1.2);
        pptxSlide.addText(text, {
          x: layout.contentArea.x,
          y: currentY,
          w: layout.contentArea.w,
          h: textHeight,
          fontSize: 14,
          fontFace: 'Arial',
          color: '374151',
          align: 'left',
          valign: 'top'
        });
        currentY += textHeight + 0.2;
      } else {
        // Bullet point
        pptxSlide.addText(`• ${text}`, {
          x: layout.contentArea.x,
          y: currentY,
          w: layout.contentArea.w,
          h: 0.3,
          fontSize: 14,
          fontFace: 'Arial',
          color: '374151',
          align: 'left'
        });
        currentY += 0.35;
      }
    });
  }
  
  // Add tables
  if (slide.tables.length > 0 && currentY < layout.height - layout.margin - 2) {
    for (const table of slide.tables) {
      if (currentY >= layout.height - layout.margin - 2) break;
      
      try {
        // Add table caption
        if (table.caption) {
          pptxSlide.addText(table.caption, {
            x: layout.contentArea.x,
            y: currentY,
            w: layout.contentArea.w,
            h: 0.3,
            fontSize: 14,
            fontFace: 'Arial',
            color: '1F2937',
            bold: true
          });
          currentY += 0.4;
        }
        
        // Prepare table data
        const tableRows = [];
        
        // Add headers
        if (table.headers.length > 0) {
          tableRows.push(table.headers.map(header => ({
            text: header,
            options: { bold: true, fill: 'F8FAFC', color: '374151' }
          })));
        }
        
        // Add data rows
        table.rows.forEach(row => {
          tableRows.push(row.map(cell => ({
            text: cell,
            options: { color: '374151' }
          })));
        });
        
        // Add table to slide
        const tableHeight = Math.min(tableRows.length * 0.25 + 0.5, 4);
        
        pptxSlide.addTable(tableRows, {
          x: layout.contentArea.x,
          y: currentY,
          w: layout.contentArea.w,
          h: tableHeight,
          fontSize: 11,
          border: { pt: 1, color: 'D1D5DB' },
          margin: 0.1
        });
        
        currentY += tableHeight + 0.3;
      } catch (error) {
        console.warn('Failed to add table to slide:', error);
        // Continue without the table
      }
    }
  }
  
  // Add slide number
  pptxSlide.addText(`Slide ${slide.pageNumber + 1}`, {
    x: layout.width - 1.5,
    y: layout.height - 0.5,
    w: 1,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Arial',
    color: '9CA3AF',
    align: 'right'
  });
}
```

### Change 3: Clean Up npm Package (Optional)

**Action**: Remove the npm package since we're using CDN

**Command**:
```bash
npm uninstall pptxgenjs
```

---

## Implementation Steps

1. **Add CDN script** to `public/index.html`
2. **Replace entire content** of `src/utils/pptxGenerator.ts` 
3. **Remove npm package** (optional)
4. **Restart development server** (`npm start`)
5. **Test PowerPoint export**

---

## Testing Checklist

After implementation, verify:

✅ **App loads without errors** (no more `node:fs` webpack errors)
✅ **Export modal opens** and loads content normally
✅ **PowerPoint export downloads .pptx file** (not .html file)
✅ **File opens directly in PowerPoint** (no import needed)
✅ **Content appears properly** with professional formatting
✅ **Multiple slides created** for large content (no cutoff)
✅ **Images display correctly** in slides
✅ **Tables are properly formatted**

---

## Expected Behavior Changes

### Before (Broken HTML Export):
- ❌ Downloads .html file
- ❌ Requires manual import to PowerPoint  
- ❌ Content gets cut off
- ❌ Poor formatting and layout
- ❌ Webpack bundling errors

### After (CDN PptxGenJS):
- ✅ Downloads .pptx file
- ✅ Opens directly in PowerPoint
- ✅ Intelligent content pagination (no cutoff)
- ✅ Professional slide formatting
- ✅ No bundling errors
- ✅ Real PowerPoint elements (not HTML/CSS)

---

## Key Features of New Implementation

1. **Professional Title Slide**: Gradient background with company branding
2. **Smart Content Splitting**: 
   - Executive Commentary splits by paragraphs
   - Overall Budget maintains header-image relationships
   - Large tables split across multiple slides
   - Content-heavy slides distribute bullets intelligently
3. **Native PowerPoint Elements**: Text, images, tables, shapes
4. **Proper Slide Layouts**: Respects different aspect ratios (16:9, 16:10, 4:3)
5. **Error Handling**: Graceful fallbacks if images or tables fail

---

## Why This Solution Works

- **CDN Loading**: Bypasses webpack bundling issues entirely
- **Browser-Optimized**: Uses browser-specific version of PptxGenJS
- **Real PPTX Files**: Creates actual PowerPoint files using OOXML format
- **No Import Required**: Files open directly in PowerPoint/Keynote/LibreOffice
- **Professional Output**: Native PowerPoint formatting and features

This solution completely replaces the broken HTML approach with a proper PowerPoint generation system.