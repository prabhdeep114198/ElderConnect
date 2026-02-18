import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { CHART_DEFAULTS } from '../constants/breakpoints';
import { useResponsive } from '../hooks/useResponsive';

interface ResponsiveChartWrapperProps {
  children: (dimensions: { width: number; height: number }) => React.ReactNode;
  style?: ViewStyle;
  /** When true (web only), chart fits in a 2-column grid - uses half width */
  gridItem?: boolean;
}

/**
 * ResponsiveChartWrapper - Wraps chart components for responsive sizing on web.
 *
 * - On mobile: Passes through native dimensions (width - 40, height 220). UI unchanged.
 * - On web: Constrains chart width with maxWidth, uses aspect-ratio-aware height to avoid
 *   vertical overflow and stretched layouts.
 *
 * Usage:
 *   <ResponsiveChartWrapper>
 *     {({ width, height }) => (
 *       <BarChart data={...} width={width} height={height} />
 *     )}
 *   </ResponsiveChartWrapper>
 */
export const ResponsiveChartWrapper: React.FC<ResponsiveChartWrapperProps> = ({
  children,
  style,
  gridItem = false,
}) => {
  const { chartWidth, chartHeight, contentWidth } = useResponsive();

  const width = Platform.OS === 'web' && gridItem
    ? Math.min((contentWidth / 2) - 30, chartWidth)
    : chartWidth;
  const height = Platform.OS === 'web' && gridItem
    ? Math.min(
        Math.max(Math.round(width / CHART_DEFAULTS.aspectRatio), CHART_DEFAULTS.minHeight),
        CHART_DEFAULTS.maxHeight
      )
    : chartHeight;

  if (Platform.OS !== 'web') {
    // Mobile: render children with dimensions, no wrapper styling
    return (
      <View style={[styles.mobileWrapper, style]}>
        {children({ width, height })}
      </View>
    );
  }

  // Web: wrap in a constrained container to prevent overflow
  return (
    <View style={[styles.webOuter, style]}>
      <View style={styles.webInner}>
        {children({ width, height })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mobileWrapper: {
    alignItems: 'center' as const,
  },
  webOuter: {
    width: '100%',
    alignItems: 'center' as const,
  },
  webInner: {
    alignItems: 'center' as const,
  },
});
