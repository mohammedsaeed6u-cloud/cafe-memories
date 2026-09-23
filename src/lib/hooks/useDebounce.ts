'use client';

import { useState, useEffect } from 'react';

/**
 * useDebounce hook to delay execution until delayMs has passed since the last change.
 * Prevents unnecessary re-renders and costly recalculations on every keystroke.
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
