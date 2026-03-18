import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { getCheckoutHtml } from '../../../services/PaymentService';
import { API_BASE_URL } from '../../../services/api/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function UpgradePlanScreen() {
    const { colors } = useTheme();
    const { refreshSubscription } = useAuth();
    const [htmlContent, setHtmlContent] = useState<string | null>(null);
    const router = useRouter();
    const { tier } = useLocalSearchParams();

    useEffect(() => {
        prepareCheckout();
    }, []);

    const prepareCheckout = async () => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (token) {
                const html = await getCheckoutHtml(tier as string || 'PREMIUM', token);
                setHtmlContent(html);
            } else {
                Alert.alert('Error', 'Please login again to upgrade.');
                router.back();
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not initialize payment.');
            router.back();
        }
    };

    const handleNavigationStateChange = async (navState: any) => {
        if (navState.url.includes('verify-payment-web') || navState.url.includes('success')) {
            // Wait a brief moment to ensure backend processing key
            setTimeout(async () => {
                Alert.alert('Success', 'Thank you for your purchase!');
                await refreshSubscription();
                router.replace('/settings/manage-subscription');
            }, 1000);
        }
    };

    if (!htmlContent) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    // Calculate the base URL for the WebView to handle relative paths in the form action
    // Removing /api if present to point to root or keeping it?
    // The service returns action="verify-payment-web" which is relative.
    // We should set baseUrl to `${API_BASE_URL}/subscriptions/` so that action="verify-payment-web" resolves to `${API_BASE_URL}/subscriptions/verify-payment-web`
    const baseUrl = `${API_BASE_URL}/subscriptions/`;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <WebView
                originWhitelist={['*']}
                source={{ html: htmlContent, baseUrl: baseUrl }}
                onNavigationStateChange={handleNavigationStateChange}
                startInLoadingState={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                renderLoading={() => (
                    <ActivityIndicator
                        style={{ position: 'absolute', top: '50%', left: '50%' }}
                        size="large"
                        color={colors.primary}
                    />
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
});
