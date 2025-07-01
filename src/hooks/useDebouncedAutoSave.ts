import { useEffect, useRef, useCallback } from 'react';

export const useDebouncedAutoSave = <T>(
  data: T,
  saveFunction: (data: T) => void,
  delay: number = 1000,
  shouldSkip?: (data: T) => boolean
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialDataRef = useRef<T | null>(null);

  // Store the initial data to compare against
  useEffect(() => {
    if (initialDataRef.current === null) {
      initialDataRef.current = data;
    }
  }, []);

  const debouncedSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      // Skip saving if shouldSkip function returns true
      if (shouldSkip && shouldSkip(data)) {
        console.log("Skipping debounced save due to shouldSkip condition");
        return;
      }

      // Skip if data hasn't changed from initial
      if (initialDataRef.current === data) {
        console.log("Skipping debounced save - data unchanged from initial state");
        return;
      }

      console.log("Executing debounced save after", delay + "ms");
      saveFunction(data);
      timeoutRef.current = null;
    }, delay);
  }, [data, saveFunction, delay, shouldSkip]);

  // Trigger debounced save when data changes
  useEffect(() => {
    // Skip on initial render
    if (initialDataRef.current === data) {
      return;
    }

    debouncedSave();

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debouncedSave]);

  // Force save immediately (for manual saves)
  const forceSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    saveFunction(data);
  }, [data, saveFunction]);

  // Check if there's a pending save
  const hasPendingSave = useCallback(() => {
    return timeoutRef.current !== null;
  }, []);

  return {
    forceSave,
    hasPendingSave,
  };
};