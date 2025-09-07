import { useEffect, useRef, useCallback, useState } from 'react';

// Debounce hook for optimizing input handlers
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook for optimizing scroll/resize handlers
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args) => {
      const now = Date.now();
      
      if (now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      } else {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRun.current = Date.now();
        }, delay - (now - lastRun.current));
      }
    }) as T,
    [callback, delay]
  );
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
}

// Virtual scrolling helper
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 3
) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }
  };
}

// Memoization helper for expensive computations
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);

    // Limit cache size
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  }) as T;
}

// Request batching for API calls
export class RequestBatcher<T, R> {
  private queue: Array<{ args: T; resolve: (value: R) => void; reject: (error: any) => void }> = [];
  private timeout: NodeJS.Timeout | null = null;
  private readonly batchSize: number;
  private readonly delay: number;
  private readonly batchFn: (items: T[]) => Promise<R[]>;

  constructor(
    batchFn: (items: T[]) => Promise<R[]>,
    options: { batchSize?: number; delay?: number } = {}
  ) {
    this.batchFn = batchFn;
    this.batchSize = options.batchSize || 10;
    this.delay = options.delay || 50;
  }

  async request(args: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ args, resolve, reject });

      if (this.queue.length >= this.batchSize) {
        this.flush();
      } else if (!this.timeout) {
        this.timeout = setTimeout(() => this.flush(), this.delay);
      }
    });
  }

  private async flush() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    const batch = this.queue.splice(0, this.batchSize);
    if (batch.length === 0) return;

    try {
      const results = await this.batchFn(batch.map(item => item.args));
      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(item => {
        item.reject(error);
      });
    }
  }
}

// Image lazy loading with blur placeholder
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      setIsLoading(false);
    };
    
    img.src = src;
  }, [src]);

  return { imageSrc, isLoading, imgRef };
}

// Prefetch data for better perceived performance
export class DataPrefetcher {
  private cache = new Map<string, Promise<any>>();

  async prefetch<T>(key: string, fetcher: () => Promise<T>): Promise<void> {
    if (!this.cache.has(key)) {
      this.cache.set(key, fetcher());
    }
  }

  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (!this.cache.has(key)) {
      this.cache.set(key, fetcher());
    }
    return this.cache.get(key)!;
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

export const dataPrefetcher = new DataPrefetcher();

// Performance monitoring
export class PerformanceMonitor {
  private marks = new Map<string, number>();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string): number {
    const start = this.marks.get(startMark);
    if (!start) {
      console.warn(`No mark found: ${startMark}`);
      return 0;
    }
    
    const duration = performance.now() - start;
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`[Performance] ${name} failed after ${duration.toFixed(2)}ms`);
      throw error;
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Memory leak prevention
export function useCleanup(cleanup: () => void) {
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
}

// Optimize re-renders with custom comparison
export function useDeepCompareEffect(
  callback: React.EffectCallback,
  dependencies: React.DependencyList
) {
  const ref = useRef<React.DependencyList>();

  if (!isEqual(dependencies, ref.current)) {
    ref.current = dependencies;
  }

  useEffect(callback, [ref.current]);
}

function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      if (typeof a[i] === 'object' && typeof b[i] === 'object') {
        if (!isEqual(a[i], b[i])) return false;
      } else {
        return false;
      }
    }
  }
  return true;
}

// Export all utilities
export {
  useDebounce,
  useThrottle,
  useIntersectionObserver,
  useVirtualScroll,
  memoize,
  RequestBatcher,
  useLazyImage,
  DataPrefetcher,
  PerformanceMonitor,
  useCleanup,
  useDeepCompareEffect
};