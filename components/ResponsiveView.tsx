import React from 'react';
import { Platform, StyleSheet, View, ViewProps } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../context/ThemeContext';

interface ResponsiveViewProps extends ViewProps {
    children: React.ReactNode;
    /** Max width for content on web. Uses breakpoint-based default if not set. */
    maxWidth?: number;
}

/**
 * ResponsiveView - Constrains content width on web, pass-through on mobile.
 * Mobile UI is unchanged. On web, centers content with max-width.
 */
export const ResponsiveView: React.FC<ResponsiveViewProps> = ({
    children,
    style,
    maxWidth: maxWidthProp,
    ...props
}) => {
    const { containerMaxWidth } = useResponsive();
    const { colors } = useTheme();

    if (Platform.OS !== 'web') {
        return (
            <View style={[styles.mobileContainer, style]} {...props}>
                {children}
            </View>
        );
    }

    const maxWidth = maxWidthProp ?? containerMaxWidth;

    return (
        <View style={[styles.webOuterContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.webInnerContainer, { maxWidth }, style]} {...props}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    mobileContainer: {
        flex: 1,
    },
    webOuterContainer: {
        flex: 1,
        // backgroundColor removed, handled dynamically
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    webInnerContainer: {
        flex: 1,
        width: '100%',
        backgroundColor: 'transparent', // Let the cards handle the background
        paddingHorizontal: 20, // Add some breathing room
        paddingVertical: 30,
        maxWidth: 1200,
    },
});
