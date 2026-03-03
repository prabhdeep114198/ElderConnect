import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RiskMeterProps {
    score: number; // 0 to 100
    size?: number;
    accessible?: boolean;
    accessibilityLabel?: string;
    accessibilityRole?: "summary" | "header" | "button" | "none" | "link" | "search" | "image" | "keyboardkey" | "text" | "adjustable" | "imagebutton" | "menu" | "menubar" | "menuitem" | "progressbar" | "radiogroup" | "scrollbar" | "spinbutton" | "switch" | "tab" | "tablist" | "timer" | "toolbar";
}

export const RiskMeter: React.FC<RiskMeterProps> = ({
    score,
    size = 200,
    accessible,
    accessibilityLabel,
    accessibilityRole
}) => {
    const { colors } = useTheme();
    // ... rest
    const strokeWidth = size * 0.1;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: score,
            duration: 1500,
            useNativeDriver: true,
        }).start();
    }, [score]);

    const strokeDashoffset = animatedValue.interpolate({
        inputRange: [0, 100],
        outputRange: [circumference, 0],
    });

    const getRiskColor = (val: number) => {
        if (val < 40) return colors.success;
        if (val < 70) return colors.warning;
        return colors.error;
    };

    const currentColor = getRiskColor(score);

    return (
        <View
            style={[styles.container, { width: size, height: size }]}
            accessible={accessible}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole={accessibilityRole}
        >
            <Svg width={size} height={size}>
                <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                    {/* Background Circle */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={colors.border}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeOpacity={0.2}
                    />
                    {/* Progress Circle */}
                    <AnimatedCircle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={currentColor}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                    />
                </G>
            </Svg>
            <View style={styles.textContainer}>
                <Text style={[styles.scoreText, { color: currentColor }]}>{Math.round(score)}</Text>
                <Text style={[styles.label, { color: colors.mutedText }]}>Risk Score</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreText: {
        fontSize: 48,
        fontWeight: 'bold',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: -5,
    },
});
