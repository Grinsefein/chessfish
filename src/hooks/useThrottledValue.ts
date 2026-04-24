import { useState, useEffect, useRef } from 'react';

export function useThrottledValue<T>(value: T, limitMs: number = 100): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdateRef = useRef<number>(Date.now());
  const pendingValueRef = useRef<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    if (timeSinceLastUpdate >= limitMs) {
      lastUpdateRef.current = now;
      setThrottledValue(value);
    } else {
      pendingValueRef.current = value;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        lastUpdateRef.current = Date.now();
        setThrottledValue(pendingValueRef.current);
      }, limitMs - timeSinceLastUpdate);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, limitMs]);

  return throttledValue;
}

export function useRafBatchedCallback<T extends (...args: any[]) => void>(
  callback: T,
  limitMs: number = 100
): T {
  const pendingRef = useRef<Parameters<T> | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRunRef = useRef<number>(0);
  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  return ((...args: Parameters<T>) => {
    pendingRef.current = args;

    const now = Date.now();
    const timeSinceLastRun = now - lastRunRef.current;

    if (timeSinceLastRun >= limitMs) {
      lastRunRef.current = now;
      callbackRef.current(...args);
      pendingRef.current = null;
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        lastRunRef.current = Date.now();
        if (pendingRef.current) {
          callbackRef.current(...pendingRef.current);
        }
        pendingRef.current = null;
      }, limitMs - timeSinceLastRun);
    }
  }) as T;
}
