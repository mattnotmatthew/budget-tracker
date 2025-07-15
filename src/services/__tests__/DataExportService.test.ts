/**
 * Unit tests for DataExportService
 */

import { DataExportService } from '../DataExportService';

// Mock dependencies
jest.mock('html-to-image', () => ({
  toPng: jest.fn().mockResolvedValue('data:image/png;base64,mock')
}));

// Mock file download
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock DOM
const mockClick = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
document.body.appendChild = mockAppendChild;
document.body.removeChild = mockRemoveChild;

jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
  const element = document.createElement(tag);
  if (tag === 'a') {
    element.click = mockClick;
  }
  return element;
});

describe('DataExportService', () => {
  let service: DataExportService;

  beforeEach(() => {
    service = DataExportService.getInstance();
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DataExportService.getInstance();
      const instance2 = DataExportService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('CSV Export', () => {
    it('should export single table as CSV', async () => {
      const data = {
        title: 'Test Report',
        tables: [{
          headers: ['Name', 'Value'],
          rows: [['Item 1', '100'], ['Item 2', '200']]
        }]
      };

      await service.export(data, {
        format: 'csv',
        filename: 'test'
      });

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    it('should escape CSV fields with special characters', async () => {
      const data = {
        tables: [{
          headers: ['Name', 'Description'],
          rows: [['Item, with comma', 'Contains "quotes"']]
        }]
      };

      await service.export(data, {
        format: 'csv',
        filename: 'test'
      });

      const blob = mockCreateObjectURL.mock.calls[0][0];
      const content = await blob.text();
      expect(content).toContain('"Item, with comma"');
      expect(content).toContain('"Contains ""quotes"""');
    });

    it('should handle null and undefined values', async () => {
      const data = {
        tables: [{
          headers: ['A', 'B', 'C'],
          rows: [[null, undefined, '']]
        }]
      };

      await service.export(data, {
        format: 'csv',
        filename: 'test'
      });

      const blob = mockCreateObjectURL.mock.calls[0][0];
      const content = await blob.text();
      expect(content).toContain('A,B,C');
      expect(content).toContain(',,');
    });
  });

  describe('Excel Export', () => {
    // Mock XLSX
    const mockWrite = jest.fn().mockReturnValue(new ArrayBuffer(8));
    const mockUtils = {
      book_new: jest.fn().mockReturnValue({}),
      aoa_to_sheet: jest.fn().mockReturnValue({}),
      book_append_sheet: jest.fn()
    };

    jest.mock('xlsx', () => ({
      write: mockWrite,
      utils: mockUtils
    }));

    it('should export data as Excel file', async () => {
      const data = {
        title: 'Excel Test',
        content: ['Summary line 1', 'Summary line 2'],
        tables: [{
          headers: ['Col1', 'Col2'],
          rows: [['A', 'B'], ['C', 'D']]
        }]
      };

      await service.export(data, {
        format: 'excel',
        filename: 'test'
      });

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
    });

    it('should handle multiple sheets', async () => {
      const data = [
        { title: 'Sheet 1', tables: [{ headers: ['A'], rows: [['1']] }] },
        { title: 'Sheet 2', tables: [{ headers: ['B'], rows: [['2']] }] }
      ];

      await service.export(data, {
        format: 'excel',
        filename: 'test'
      });

      expect(mockUtils.book_append_sheet).toHaveBeenCalledTimes(2);
    });
  });

  describe('PDF Export', () => {
    // Mock jsPDF
    const mockSave = jest.fn();
    const mockAddPage = jest.fn();
    const mockText = jest.fn();
    const mockAddImage = jest.fn();
    const mockAutoTable = jest.fn();

    jest.mock('jspdf', () => {
      return {
        default: jest.fn().mockImplementation(() => ({
          save: mockSave,
          addPage: mockAddPage,
          text: mockText,
          addImage: mockAddImage,
          setFontSize: jest.fn(),
          autoTable: mockAutoTable,
          lastAutoTable: { finalY: 100 }
        }))
      };
    });

    it('should export data as PDF', async () => {
      const data = {
        title: 'PDF Test',
        content: ['Line 1', 'Line 2'],
        charts: [{ image: 'data:image/png;base64,test', width: 400, height: 300 }]
      };

      await service.export(data, {
        format: 'pdf',
        filename: 'test'
      });

      expect(mockText).toHaveBeenCalledWith('PDF Test', 40, 60);
      expect(mockAddImage).toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalledWith('test.pdf');
    });
  });

  describe('PowerPoint Export', () => {
    // Mock PptxGenJS
    const mockWriteFile = jest.fn();
    const mockAddSlide = jest.fn().mockReturnValue({
      addText: jest.fn(),
      addImage: jest.fn(),
      addTable: jest.fn()
    });

    (window as any).PptxGenJS = jest.fn().mockImplementation(() => ({
      layout: '',
      author: '',
      title: '',
      addSlide: mockAddSlide,
      writeFile: mockWriteFile
    }));

    it('should export data as PowerPoint', async () => {
      const data = {
        title: 'PPTX Test',
        content: ['Bullet 1', 'Bullet 2'],
        kpiCards: ['data:image/png;base64,kpi']
      };

      await service.export(data, {
        format: 'pptx',
        filename: 'test'
      });

      expect(mockAddSlide).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalledWith({ fileName: 'test.pptx' });
    });
  });

  describe('Utility Methods', () => {
    it('should convert table data correctly', () => {
      const headers = ['A', 'B'];
      const rows = [[1, 2], [3, null]];
      
      const result = service.convertTableData(headers, rows);
      
      expect(result).toEqual({
        headers: ['A', 'B'],
        rows: [[1, 2], [3, '']],
        caption: undefined
      });
    });

    it('should extract table from HTML element', () => {
      const table = document.createElement('table');
      table.innerHTML = `
        <thead>
          <tr><th>Header 1</th><th>Header 2</th></tr>
        </thead>
        <tbody>
          <tr><td>Cell 1</td><td>Cell 2</td></tr>
          <tr><td>Cell 3</td><td>Cell 4</td></tr>
        </tbody>
      `;

      const result = service.extractTableFromElement(table);
      
      expect(result.headers).toEqual(['Header 1', 'Header 2']);
      expect(result.rows).toEqual([
        ['Cell 1', 'Cell 2'],
        ['Cell 3', 'Cell 4']
      ]);
    });

    it('should capture element as image', async () => {
      const element = document.createElement('div');
      element.style.width = '100px';
      element.style.height = '50px';

      const result = await service.captureElementAsImage(element);
      
      expect(result).toBe('data:image/png;base64,mock');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unsupported format', async () => {
      const data = { title: 'Test' };
      
      await expect(service.export(data, {
        format: 'unsupported' as any,
        filename: 'test'
      })).rejects.toThrow('Unsupported export format: unsupported');
    });

    it('should handle capture errors gracefully', async () => {
      const htmlToImage = require('html-to-image');
      htmlToImage.toPng.mockRejectedValueOnce(new Error('Capture failed'));

      const element = document.createElement('div');
      
      await expect(service.captureElementAsImage(element))
        .rejects.toThrow('Capture failed');
    });
  });

  describe('Filename Generation', () => {
    it('should include timestamp when requested', async () => {
      const data = { title: 'Test' };
      const mockDate = new Date('2024-01-15');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      await service.export(data, {
        format: 'csv',
        filename: 'test',
        includeTimestamp: true
      });

      const link = mockAppendChild.mock.calls[0][0];
      expect(link.download).toContain('test_2024-01-15.csv');
    });

    it('should use default filename if not provided', async () => {
      const data = { title: 'Test' };

      await service.export(data, {
        format: 'csv',
        includeTimestamp: false
      });

      const link = mockAppendChild.mock.calls[0][0];
      expect(link.download).toBe('export.csv');
    });
  });
});