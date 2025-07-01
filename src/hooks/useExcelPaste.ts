import { useState, useCallback } from 'react';

type FieldType = 'number' | 'currency' | 'text';

interface ExcelPasteOptions {
  fieldType?: FieldType;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  messageTimeout?: number;
  divisionFactor?: number; // For currency conversion (e.g., /1000)
}

interface MultiRowPasteOptions<T> extends ExcelPasteOptions {
  items: T[];
  startIndex: number;
  fieldKey: keyof T;
  onUpdate: (index: number, field: keyof T, value: any) => void;
}

/**
 * Hook for handling Excel paste functionality
 * Provides utilities for cleaning Excel numbers and handling paste events
 */
export const useExcelPaste = (options: ExcelPasteOptions = {}) => {
  const {
    fieldType = 'text',
    onSuccess,
    onError,
    messageTimeout = 3000,
    divisionFactor = 1,
  } = options;

  const [pasteMessage, setPasteMessage] = useState<string | null>(null);

  /**
   * Clean Excel-formatted numbers
   * Handles common Excel formatting like $ signs, commas, parentheses for negatives
   */
  const cleanExcelNumber = useCallback((value: string): number => {
    if (!value || value === "-" || value === "") return 0;
    
    // Remove common Excel formatting
    let cleaned = value
      .replace(/[$,\s]/g, "") // Remove $ signs, commas, and spaces
      .replace(/^\((.+)\)$/, "-$1") // Convert (123) to -123 for negatives
      .replace(/[()]/g, "") // Remove any remaining parentheses
      .trim();
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }, []);

  /**
   * Process a value based on field type
   */
  const processValue = useCallback((value: string, type: FieldType) => {
    switch (type) {
      case 'number':
        return cleanExcelNumber(value);
      case 'currency':
        return cleanExcelNumber(value) / divisionFactor;
      case 'text':
      default:
        return value.trim();
    }
  }, [cleanExcelNumber, divisionFactor]);

  /**
   * Show a temporary message
   */
  const showMessage = useCallback((message: string, isError: boolean = false) => {
    setPasteMessage(message);
    
    if (isError && onError) {
      onError(message);
    } else if (!isError && onSuccess) {
      onSuccess(message);
    }
    
    setTimeout(() => setPasteMessage(null), messageTimeout);
  }, [onSuccess, onError, messageTimeout]);

  /**
   * Handle single field paste
   */
  const handleSinglePaste = useCallback((
    e: React.ClipboardEvent,
    onUpdate: (value: any) => void,
    type: FieldType = fieldType
  ) => {
    e.preventDefault();
    
    try {
      const pastedData = e.clipboardData.getData("text");
      const processedValue = processValue(pastedData, type);
      
      onUpdate(processedValue);
      
      if (type === 'number' || type === 'currency') {
        showMessage("Excel number cleaned and pasted!");
      } else {
        showMessage("Text pasted successfully!");
      }
    } catch (error) {
      showMessage("Paste failed", true);
    }
  }, [fieldType, processValue, showMessage]);

  /**
   * Handle multi-row paste (for tables)
   */
  const handleMultiRowPaste = useCallback(<T,>(
    e: React.ClipboardEvent,
    options: MultiRowPasteOptions<T>
  ) => {
    e.preventDefault();
    
    try {
      const pasteData = e.clipboardData.getData("text");
      const lines = pasteData.split("\n").filter(line => line.trim() !== "");
      
      if (lines.length === 0) {
        showMessage("No data to paste", true);
        return;
      }

      let successCount = 0;
      const { items, startIndex, fieldKey, onUpdate } = options;

      for (let i = 0; i < lines.length; i++) {
        const targetIndex = startIndex + i;
        if (targetIndex >= items.length) break;

        const value = lines[i].trim();
        const processedValue = processValue(value, options.fieldType || fieldType);
        
        try {
          onUpdate(targetIndex, fieldKey, processedValue);
          successCount++;
        } catch (error) {
          console.warn(`Failed to update item at index ${targetIndex}:`, error);
        }
      }

      if (successCount > 0) {
        showMessage(`✅ Pasted ${successCount} values successfully!`);
      } else {
        showMessage("⚠️ Paste failed - no valid values found", true);
      }
    } catch (error) {
      showMessage("⚠️ Paste failed", true);
    }
  }, [fieldType, processValue, showMessage]);

  /**
   * Create a paste handler for a specific field
   */
  const createPasteHandler = useCallback((
    onUpdate: (value: any) => void,
    type: FieldType = fieldType
  ) => {
    return (e: React.ClipboardEvent) => handleSinglePaste(e, onUpdate, type);
  }, [handleSinglePaste, fieldType]);

  /**
   * Create a multi-row paste handler
   */
  const createMultiRowPasteHandler = useCallback(<T,>(
    options: Omit<MultiRowPasteOptions<T>, 'fieldType'> & { fieldType?: FieldType }
  ) => {
    return (e: React.ClipboardEvent) => handleMultiRowPaste(e, {
      ...options,
      fieldType: options.fieldType || fieldType,
    });
  }, [handleMultiRowPaste, fieldType]);

  return {
    pasteMessage,
    cleanExcelNumber,
    processValue,
    handleSinglePaste,
    handleMultiRowPaste,
    createPasteHandler,
    createMultiRowPasteHandler,
    showMessage,
  };
};