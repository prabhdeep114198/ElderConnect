import React from 'react';
import {
    Platform,
    ScrollView,
    ScrollViewProps,
    StyleSheet,
    View,
    ViewProps,
} from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

interface ResponsiveContainerProps extends ViewProps {
  children: React.ReactNode;
  /** Max width for content on web. Ignored on mobile. */
  maxWidth?: number;
  /** Center content on web when screen is wider than maxWidth */
  center?: boolean;
  /** Padding around content on web */
  paddingHorizontal?: number;
}

interface ResponsiveScrollContainerProps extends ScrollViewProps {
  children: React.ReactNode;
  maxWidth?: number;
  center?: boolean;
  paddingHorizontal?: number;
}

/**
 * ResponsiveContainer - Wraps screen content for web-responsive layout.
 *
 * - On mobile: Renders children in a simple View. No layout changes.
 * - On web: Wraps in a max-width container, centered, to avoid full-width stretch.
 *
 * Use this at the root of ScrollView content or screen layout for web.
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  style,
  maxWidth: maxWidthProp,
  center = true,
  paddingHorizontal = 20,
  ...props
}) => {
  const { isWeb, contentWidth, containerMaxWidth } = useResponsive();

  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.nativeContainer, style]} {...props}>
        {children}
      </View>
    );
  }

  const maxWidth = maxWidthProp ?? containerMaxWidth;

  return (
    <View style={[styles.webOuter, center && styles.webOuterCentered]} {...props}>
      <View
        style={[
          styles.webInner,
          { maxWidth, paddingHorizontal },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

/**
 * ResponsiveScrollContainer - ScrollView with responsive content width on web.
 */
export const ResponsiveScrollContainer: React.FC<ResponsiveScrollContainerProps> = ({
  children,
  style,
  contentContainerStyle,
  maxWidth: maxWidthProp,
  center = true,
  paddingHorizontal = 20,
  ...props
}) => {
  const { isWeb, containerMaxWidth } = useResponsive();

  if (Platform.OS !== 'web') {
    return (
      <ScrollView
        style={style}
        contentContainerStyle={contentContainerStyle}
        {...props}
      >
        {children}
      </ScrollView>
    );
  }

  const maxWidth = maxWidthProp ?? containerMaxWidth;

  return (
    <ScrollView
      style={[styles.scrollView, style]}
      contentContainerStyle={[
        styles.scrollContentOuter,
        center && styles.scrollContentCentered,
      ]}
      {...props}
    >
      <View style={[styles.scrollContentInner, { maxWidth, paddingHorizontal }]}>
        {children}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  nativeContainer: {
    flex: 1,
  },
  webOuter: {
    flex: 1,
    width: '100%',
  },
  webOuterCentered: {
    alignItems: 'center',
  },
  webInner: {
    flex: 1,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContentOuter: {
    flexGrow: 1,
  },
  scrollContentCentered: {
    alignItems: 'center',
  },
  scrollContentInner: {
    width: '100%',
  },
});
