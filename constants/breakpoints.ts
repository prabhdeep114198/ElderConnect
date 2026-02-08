/**
 * Responsive breakpoints for web layout.
 * Used ONLY when Platform.OS === 'web'. Mobile layouts are unchanged.
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

/**
 * Max width for content containers at each breakpoint.
 * Prevents full-width stretched layouts on large screens.
 */
export const CONTAINER_MAX_WIDTHS = {
  sm: 640,
  md: 768,
  lg: 960,
  xl: 1200,
  xxl: 1400,
} as const;

/**
 * Chart dimensions for web - prevents vertical overflow and maintains aspect ratio.
 */
export const CHART_DEFAULTS = {
  /** Max width of chart on web - prevents over-stretching */
  maxWidth: 600,
  /** Aspect ratio for charts (width / height) - e.g. 2.7 = ~16:6 */
  aspectRatio: 2.7,
  /** Min height to prevent charts from becoming too small */
  minHeight: 180,
  /** Max height to prevent excessive vertical space */
  maxHeight: 280,
} as const;
