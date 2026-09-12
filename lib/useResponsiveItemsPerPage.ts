'use client';

import { useState, useEffect } from 'react';

export interface ResponsiveItemsConfig {
  mobile?: number;  // < 640px (1 col: e.g. 8 cards = 8 rows x 1)
  sm?: number;      // 640px - 767px (2 cols: e.g. 10 cards = 5 rows x 2)
  md?: number;      // 768px - 1023px (3 cols: e.g. 12 cards = 4 rows x 3)
  lg?: number;      // 1024px - 1535px (4 cols: e.g. 16 cards = 4 rows x 4)
  xl2?: number;     // >= 1536px (5 cols: e.g. 20 cards = 4 rows x 5)
  defaultItems?: number;
}

const DEFAULT_PAGINATION_CONFIG: Required<ResponsiveItemsConfig> = {
  mobile: 8,   // 8 rows of 1 col
  sm: 10,      // 5 rows of 2 cols
  md: 12,      // 4 rows of 3 cols
  lg: 16,      // 4 rows of 4 cols
  xl2: 20,     // 4 rows of 5 cols
  defaultItems: 16, // Safe SSR default
};

/**
 * Hook to calculate responsive items per page to guarantee complete, unorphaned rows
 * across all screen sizes (Mobile, SM, MD, LG, 2XL).
 */
export function useResponsiveItemsPerPage(config?: ResponsiveItemsConfig): number {
  const mergedConfig = { ...DEFAULT_PAGINATION_CONFIG, ...config };
  const [itemsPerPage, setItemsPerPage] = useState<number>(mergedConfig.defaultItems);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const calculateItems = () => {
      const width = window.innerWidth;
      if (width >= 1536) {
        return mergedConfig.xl2;
      } else if (width >= 1024) {
        return mergedConfig.lg;
      } else if (width >= 768) {
        return mergedConfig.md;
      } else if (width >= 640) {
        return mergedConfig.sm;
      } else {
        return mergedConfig.mobile;
      }
    };

    setItemsPerPage(calculateItems());

    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setItemsPerPage(calculateItems());
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [mergedConfig.mobile, mergedConfig.sm, mergedConfig.md, mergedConfig.lg, mergedConfig.xl2]);

  return itemsPerPage;
}
