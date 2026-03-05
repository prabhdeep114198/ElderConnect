/**
 * Utility for responsive typography scaling based on user settings.
 */
export const getFontSize = (base: number, sizeSetting: string = 'medium') => {
    const scales: { [key: string]: number } = {
        small: 0.9,
        medium: 1,
        large: 1.2,
        extraLarge: 1.5,
    };
    return Math.round(base * (scales[sizeSetting] || 1));
};
