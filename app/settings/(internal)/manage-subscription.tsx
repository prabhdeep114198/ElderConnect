import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { getSubscriptionStatus } from '../../../services/PaymentService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ManageSubscriptionScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (token) {
                const data = await getSubscriptionStatus(token);
                setStatus(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Subscription</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.planInfo}>
                    <Text style={[styles.planLabel, { color: colors.mutedText }]}>Current Plan</Text>
                    <Text style={[styles.planName, { color: colors.primary }]}>
                        {user?.isSubscribed ? 'Premium Plan' : 'Free Plan'}
                    </Text>
                </View>

                {user?.isSubscribed && status?.expiresAt && (
                    <View style={styles.expiryInfo}>
                        <Text style={[styles.expiryLabel, { color: colors.mutedText }]}>Renews on</Text>
                        <Text style={[styles.expiryDate, { color: colors.text }]}>
                            {new Date(status.expiresAt).toLocaleDateString()}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.actions}>
                {!user?.isSubscribed && (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.primary }]}
                        onPress={() => router.push('/settings/upgrade-plan')}
                    >
                        <Ionicons name="rocket-outline" size={24} color="#FFF" />
                        <Text style={styles.actionButtonText}>Upgrade to Premium</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: colors.primary }]}
                    onPress={() => router.push('/settings/billing-history')}
                >
                    <Ionicons name="receipt-outline" size={24} color={colors.primary} />
                    <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Billing History</Text>
                </TouchableOpacity>

                {user?.isSubscribed && (
                    <TouchableOpacity
                        style={[styles.dangerButton]}
                        onPress={() => Alert.alert('Cancel Subscription', 'Please contact support to cancel your subscription.')}
                    >
                        <Text style={styles.dangerButtonText}>Cancel Subscription</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { marginBottom: 30, paddingTop: 60 },
    title: { fontSize: 28, fontWeight: 'bold' },
    card: {
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    planInfo: { marginBottom: 20 },
    planLabel: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
    planName: { fontSize: 24, fontWeight: 'bold' },
    expiryInfo: {},
    expiryLabel: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
    expiryDate: { fontSize: 18, fontWeight: '500' },
    actions: { gap: 16 },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    actionButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    secondaryButtonText: { fontSize: 16, fontWeight: '600' },
    dangerButton: {
        padding: 16,
        alignItems: 'center',
    },
    dangerButtonText: { color: '#EF4444', fontSize: 16, fontWeight: '500' },
});
