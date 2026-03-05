import React from 'react';
import { Text as RNText, TextProps } from 'react-native';
import { useTranslation } from 'react-i18next';

interface TranslatableTextProps extends TextProps {
    children?: React.ReactNode;
    i18nKey?: string;
}

/**
 * TranslatableText
 * A wrapper around React Native's Text component that automatically
 * attempts to translate its children if they are strings.
 * 
 * Usage:
 * <TranslatableText>Hello World</TranslatableText>
 * If "Hello World" is in your JSON, it shows the translation.
 * 
 * You can also pass an explicit key:
 * <TranslatableText i18nKey="greeting">Hello World</TranslatableText>
 */
export const TranslatableText: React.FC<TranslatableTextProps> = ({
    children,
    i18nKey,
    ...props
}) => {
    const { t } = useTranslation();

    let content = children;

    if (i18nKey) {
        content = t(i18nKey);
    } else if (typeof children === 'string') {
        // If it's a string, try to translate it. 
        // i18next will return the string itself if no key is found.
        // We can also check if it contains spaces to decide if it's a key or just text.
        content = t(children);
    }

    return <RNText {...props}>{content}</RNText>;
};
