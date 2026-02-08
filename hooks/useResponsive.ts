import { useMemo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import {
    BreakpointKey,
    BREAKPOINTS,
    CHART_DEFAULTS,
    CONTAINER_MAX_WIDTHS,
} from '../constants/breakpoints';

export interface ResponsiveValues {
  /** Whether we're on web platform */
  isWeb: boolean;
  /** Whether we're on native (iOS/Android) - mobile UI path */
  isNative: boolean;
  /** Current window width */
  width: number;
  /** Current window height */
  height: number;
  /** Current breakpoint name (only meaningful on web) */
  breakpoint: BreakpointKey;
  /** Container max-width for content (only applied on web) */
  containerMaxWidth: number;
  /** Effective content width - min(width, containerMaxWidth) on web, width on native */
  contentWidth: number;
  /** For charts: width to use (responsive on web) */
  chartWidth: number;
  /** For charts: height to use (responsive on web, maintains aspect ratio) */
  chartHeight: number;
  /** Whether screen is tablet-sized or larger (>= 768px) - web only */
  isTabletOrLarger: boolean;
  /** Whether screen is desktop-sized (>= 1024px) - web only */
  isDesktop: boolean;
  /** Number of columns for grid layouts on web (1-3) */
  gridColumns: number;
}

/**
 * useResponsive - Central hook for responsive layout values.
 *
 * CRITICAL: Mobile (iOS/Android) is NEVER changed.
 * - On native: returns static values matching current mobile behavior
 * - On web: returns dynamic values based on useWindowDimensions()
 *
 * All responsive styling should gate on isWeb:
 *   const { isWeb, contentWidth, chartWidth, chartHeight } = useResponsive();
 *   const cardWidth = isWeb ? (contentWidth - gap) / gridColumns : (width - 60) / 2;
 */
export function useResponsive(): ResponsiveValues {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isWeb = Platform.OS === 'web';
    const isNative = !isWeb;

    // On native: use dimensions as-is (mobile unchanged)
    if (isNative) {
      return {
        isWeb: false,
        isNative: true,
        width,
        height,
        breakpoint: 'sm' as BreakpointKey,
        containerMaxWidth: width,
        contentWidth: width,
        chartWidth: width - 40,
        chartHeight: 220,
        isTabletOrLarger: false,
        isDesktop: false,
        gridColumns: 1,
      };
    }

    // Web-only: compute responsive values
    const breakpoint: BreakpointKey =
      width >= BREAKPOINTS.xxl
        ? 'xxl'
        : width >= BREAKPOINTS.xl
          ? 'xl'
          : width >= BREAKPOINTS.lg
            ? 'lg'
            : width >= BREAKPOINTS.md
              ? 'md'
              : 'sm';

    const containerMaxWidth = CONTAINER_MAX_WIDTHS[breakpoint];
    const contentWidth = Math.min(width, containerMaxWidth);

    // Chart dimensions: cap width, maintain aspect ratio, avoid overflow
    const rawChartWidth = Math.min(width - 40, CHART_DEFAULTS.maxWidth);
    const chartWidth = rawChartWidth;
    const chartHeight = Math.min(
      Math.max(
        Math.round(chartWidth / CHART_DEFAULTS.aspectRatio),
        CHART_DEFAULTS.minHeight
      ),
      CHART_DEFAULTS.maxHeight
    );

    const isTabletOrLarger = width >= BREAKPOINTS.md;
    const isDesktop = width >= BREAKPOINTS.lg;

    // Grid columns: 1 on small, 2 on tablet, 3 on desktop
    const gridColumns = width >= BREAKPOINTS.lg ? 3 : width >= BREAKPOINTS.md ? 2 : 1;

    return {
      isWeb: true,
      isNative: false,
      width,
      height,
      breakpoint,
      containerMaxWidth,
      contentWidth,
      chartWidth,
      chartHeight,
      isTabletOrLarger,
      isDesktop,
      gridColumns,
    };
  }, [width, height]);
}
