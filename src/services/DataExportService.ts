/**
 * Unified Data Export Service
 * Consolidates all export functionality from across the application
 * Replaces multiple export utility versions with a single, consistent API
 */

import * as htmlToImage from 'html-to-image';

// Types
export interface ExportOptions {
  filename?: string;
  format: 'csv' | 'excel' | 'pdf' | 'pptx';
  includeHeaders?: boolean;
  includeTimestamp?: boolean;
  customStyles?: any;
}

export interface TableData {
  headers: string[];
  rows: (string | number)[][];
  caption?: string;
}

export interface ChartData {
  image: string;
  title?: string;
  width?: number;
  height?: number;
}

export interface ExportData {
  title?: string;
  content?: string[];
  tables?: TableData[];
  charts?: ChartData[];
  kpiCards?: string[];
  metadata?: Record<string, any>;
}

/**
 * Main DataExportService class
 * Provides unified export functionality for all data formats
 */
export class DataExportService {
  private static instance: DataExportService;

  private constructor() {}

  static getInstance(): DataExportService {
    if (!DataExportService.instance) {
      DataExportService.instance = new DataExportService();
    }
    return DataExportService.instance;
  }

  /**
   * Export data in the specified format
   */
  async export(data: ExportData | ExportData[], options: ExportOptions): Promise<void> {
    const timestamp = options.includeTimestamp ? `_${new Date().toISOString().split('T')[0]}` : '';
    const filename = options.filename || `export${timestamp}`;

    switch (options.format) {
      case 'csv':
        return this.exportCSV(data, filename);
      case 'excel':
        return this.exportExcel(data, filename);
      case 'pdf':
        return this.exportPDF(data, filename, options);
      case 'pptx':
        return this.exportPPTX(data, filename, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export data as CSV
   * Consolidates CSV export logic from VendorManagement and FunctionalAllocation
   */
  private async exportCSV(data: ExportData | ExportData[], filename: string): Promise<void> {
    const dataArray = Array.isArray(data) ? data : [data];
    const csvContent: string[] = [];

    dataArray.forEach((dataset, index) => {
      if (index > 0) csvContent.push(''); // Empty line between datasets

      // Add title if present
      if (dataset.title) {
        csvContent.push(this.escapeCSVField(dataset.title));
        csvContent.push('');
      }

      // Add content if present
      if (dataset.content && dataset.content.length > 0) {
        dataset.content.forEach(line => {
          csvContent.push(this.escapeCSVField(line));
        });
        csvContent.push('');
      }

      // Add tables
      if (dataset.tables) {
        dataset.tables.forEach(table => {
          // Add caption
          if (table.caption) {
            csvContent.push(this.escapeCSVField(table.caption));
          }

          // Add headers
          if (table.headers.length > 0) {
            csvContent.push(table.headers.map(h => this.escapeCSVField(h)).join(','));
          }

          // Add rows
          table.rows.forEach(row => {
            csvContent.push(row.map(cell => this.escapeCSVField(String(cell))).join(','));
          });

          csvContent.push(''); // Empty line after table
        });
      }
    });

    // Download CSV
    this.downloadFile(csvContent.join('\n'), `${filename}.csv`, 'text/csv');
  }

  /**
   * Export data as Excel (XLSX)
   * New functionality - not previously implemented
   */
  private async exportExcel(data: ExportData | ExportData[], filename: string): Promise<void> {
    // Dynamic import to avoid loading heavy library unless needed
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    const dataArray = Array.isArray(data) ? data : [data];

    dataArray.forEach((dataset, sheetIndex) => {
      const sheetName = dataset.title || `Sheet${sheetIndex + 1}`;
      const worksheetData: any[][] = [];

      // Add title
      if (dataset.title) {
        worksheetData.push([dataset.title]);
        worksheetData.push([]); // Empty row
      }

      // Add content
      if (dataset.content) {
        dataset.content.forEach(line => {
          worksheetData.push([line]);
        });
        worksheetData.push([]); // Empty row
      }

      // Add tables
      if (dataset.tables) {
        dataset.tables.forEach(table => {
          if (table.caption) {
            worksheetData.push([table.caption]);
          }

          if (table.headers.length > 0) {
            worksheetData.push(table.headers);
          }

          table.rows.forEach(row => {
            worksheetData.push(row);
          });

          worksheetData.push([]); // Empty row after table
        });
      }

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31)); // Excel sheet names limited to 31 chars
    });

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    this.downloadBlob(blob, `${filename}.xlsx`);
  }

  /**
   * Export data as PDF
   * Consolidates PDF generation from ExecutiveSummary
   */
  private async exportPDF(data: ExportData | ExportData[], filename: string, options: ExportOptions): Promise<void> {
    // Dynamic import to avoid loading heavy library unless needed
    const jsPDF = (await import('jspdf')).default;
    // await import('jspdf-autotable'); // TODO: Install jspdf-autotable package

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'letter'
    });

    const dataArray = Array.isArray(data) ? data : [data];
    let firstPage = true;

    for (const dataset of dataArray) {
      if (!firstPage) {
        doc.addPage();
      }
      firstPage = false;

      let yPosition = 60;

      // Add title
      if (dataset.title) {
        doc.setFontSize(24);
        doc.text(dataset.title, 40, yPosition);
        yPosition += 40;
      }

      // Add content
      if (dataset.content) {
        doc.setFontSize(12);
        dataset.content.forEach(line => {
          if (yPosition > 500) {
            doc.addPage();
            yPosition = 60;
          }
          doc.text(line, 40, yPosition);
          yPosition += 20;
        });
      }

      // Add KPI cards as images
      if (dataset.kpiCards) {
        for (const kpiImage of dataset.kpiCards) {
          if (yPosition > 400) {
            doc.addPage();
            yPosition = 60;
          }
          doc.addImage(kpiImage, 'PNG', 40, yPosition, 700, 150);
          yPosition += 170;
        }
      }

      // Add charts
      if (dataset.charts) {
        for (const chart of dataset.charts) {
          if (yPosition > 300) {
            doc.addPage();
            yPosition = 60;
          }
          const width = chart.width || 400;
          const height = chart.height || 300;
          doc.addImage(chart.image, 'PNG', 40, yPosition, width, height);
          yPosition += height + 20;
        }
      }

      // Add tables
      if (dataset.tables) {
        for (const table of dataset.tables) {
          if (yPosition > 450) {
            doc.addPage();
            yPosition = 60;
          }

          if (table.caption) {
            doc.setFontSize(14);
            doc.text(table.caption, 40, yPosition);
            yPosition += 20;
          }

          /* TODO: Uncomment when jspdf-autotable is installed
          (doc as any).autoTable({
            head: table.headers.length > 0 ? [table.headers] : undefined,
            body: table.rows,
            startY: yPosition,
            margin: { left: 40 },
            styles: { fontSize: 10 },
            headStyles: { fillColor: [41, 128, 185] }
          });

          yPosition = (doc as any).lastAutoTable.finalY + 20;
          */
        }
      }
    }

    // Save PDF
    doc.save(`${filename}.pdf`);
  }

  /**
   * Export data as PowerPoint (PPTX)
   * Consolidates multiple PPTX generator versions
   */
  private async exportPPTX(data: ExportData | ExportData[], filename: string, options: ExportOptions): Promise<void> {
    // Dynamic import PptxGenJS
    const PptxGenJS = (window as any).PptxGenJS;
    if (!PptxGenJS) {
      throw new Error('PptxGenJS not loaded. Please ensure the library is included.');
    }

    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = 'Budget Tracker';
    pptx.title = filename;

    const dataArray = Array.isArray(data) ? data : [data];

    dataArray.forEach((dataset, slideIndex) => {
      const slide = pptx.addSlide();

      // Add title
      if (dataset.title) {
        slide.addText(dataset.title, {
          x: 0.5,
          y: 0.5,
          w: '90%',
          h: 0.8,
          fontSize: 32,
          bold: true,
          color: '363636'
        });
      }

      let yPosition = 1.5;

      // Add content as bullet points
      if (dataset.content && dataset.content.length > 0) {
        const bullets = dataset.content.map(text => ({ text, options: { bullet: true } }));
        slide.addText(bullets, {
          x: 0.5,
          y: yPosition,
          w: '90%',
          h: 'auto',
          fontSize: 14,
          color: '363636',
          bullet: { type: 'bullet' }
        });
        yPosition += Math.min(dataset.content.length * 0.3, 2);
      }

      // Add KPI cards
      if (dataset.kpiCards && dataset.kpiCards.length > 0) {
        const kpiCard = dataset.kpiCards[0]; // Use first KPI card
        slide.addImage({
          data: kpiCard,
          x: 0.5,
          y: yPosition,
          w: 9,
          h: 2
        });
        yPosition += 2.5;
      }

      // Add charts
      if (dataset.charts && dataset.charts.length > 0) {
        const chart = dataset.charts[0]; // Use first chart
        slide.addImage({
          data: chart.image,
          x: 0.5,
          y: yPosition,
          w: 5,
          h: 3.5
        });
      }

      // Add tables (simplified for slides)
      if (dataset.tables && dataset.tables.length > 0 && yPosition < 5) {
        const table = dataset.tables[0]; // Use first table
        const rows = [
          table.headers.map(h => ({ text: h, options: { bold: true, fill: '2980B9', color: 'FFFFFF' } })),
          ...table.rows.slice(0, 5).map(row => row.map(cell => String(cell)))
        ];

        slide.addTable(rows, {
          x: 0.5,
          y: yPosition,
          w: 9,
          fontSize: 12,
          border: { type: 'solid', pt: 0.5, color: 'CCCCCC' }
        });
      }
    });

    // Save presentation
    await pptx.writeFile({ fileName: `${filename}.pptx` });
  }

  /**
   * Capture element as image
   * Consolidates chart/KPI capture functionality
   */
  async captureElementAsImage(element: HTMLElement, options?: { width?: number; height?: number; quality?: number }): Promise<string> {
    const config = {
      quality: options?.quality || 0.95,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      width: options?.width || element.scrollWidth,
      height: options?.height || element.scrollHeight
    };

    try {
      return await htmlToImage.toPng(element, config);
    } catch (error) {
      console.error('Failed to capture element as image:', error);
      throw error;
    }
  }

  /**
   * Utility: Escape CSV field
   * Consolidated from VendorManagement
   */
  private escapeCSVField(field: string): string {
    if (field == null) return '';
    const fieldStr = String(field);
    if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
      return `"${fieldStr.replace(/"/g, '""')}"`;
    }
    return fieldStr;
  }

  /**
   * Utility: Download file
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    this.downloadBlob(blob, filename);
  }

  /**
   * Utility: Download blob
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Convert table data from component format
   * Helper for migrating existing code
   */
  convertTableData(headers: string[], rows: any[][], caption?: string): TableData {
    return {
      headers,
      rows: rows.map(row => row.map(cell => cell ?? '')),
      caption
    };
  }

  /**
   * Extract table data from HTML table element
   */
  extractTableFromElement(tableElement: HTMLTableElement): TableData {
    const headers: string[] = [];
    const rows: string[][] = [];

    // Extract headers
    const headerCells = tableElement.querySelectorAll('thead th, thead td');
    headerCells.forEach(cell => {
      headers.push(cell.textContent?.trim() || '');
    });

    // Extract rows
    const rowElements = tableElement.querySelectorAll('tbody tr');
    rowElements.forEach(row => {
      const cells: string[] = [];
      row.querySelectorAll('td').forEach(cell => {
        cells.push(cell.textContent?.trim() || '');
      });
      if (cells.length > 0) {
        rows.push(cells);
      }
    });

    return {
      headers,
      rows,
      caption: tableElement.caption?.textContent?.trim()
    };
  }
}

// Export singleton instance
export const dataExportService = DataExportService.getInstance();