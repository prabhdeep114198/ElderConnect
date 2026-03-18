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

    const handleUpgrade = (tier: string) => {
        if (tier === 'CORE') {
            Alert.alert("Already on Free Tier", "You are currently on the Core free tier.");
            return;
        }
        router.push({ pathname: '/settings/upgrade-plan', params: { tier } });
    };

    const isCurrentTier = (tier: string) => {
        if (!status?.tier && tier === 'CORE') return true;
        return status?.tier === tier;
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Subscription Plans</Text>
                <Text style={[styles.subtitle, { color: colors.mutedText }]}>Select a plan that fits your needs</Text>
            </View>

            {/* CORE TIER */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: isCurrentTier('CORE') ? colors.primary : colors.border }]}>
                <Text style={[styles.planName, { color: colors.text }]}>Core Care</Text>
                <Text style={[styles.planPrice, { color: colors.primary }]}>₹0<Text style={styles.planInterval}>/mo</Text></Text>
                <Text style={[styles.planDesc, { color: colors.mutedText }]}>Essential tracking and AI chat for everyday safety.</Text>
                
                <View style={styles.featureList}>
                    <Text style={[styles.featureRow, { color: colors.text }]}><Ionicons name="checkmark-circle" size={18} color={colors.primary} /> Basic Medication Reminders</Text>
                    <Text style={[styles.featureRow, { color: colors.text }]}><Ionicons name="checkmark-circle" size={18} color={colors.primary} /> Text-based AI Coach</Text>
                    <Text style={[styles.featureRow, { color: colors.text }]}><Ionicons name="checkmark-circle" size={18} color={colors.primary} /> 1 Caregiver Connection</Text>
                </View>
                
                <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: isCurrentTier('CORE') ? colors.border : colors.primary }]}
                    onPress={() => handleUpgrade('CORE')}
                    disabled={isCurrentTier('CORE')}
                >
                    <Text style={styles.actionButtonText}>{isCurrentTier('CORE') ? 'Current Plan' : 'Select Core'}</Text>
                </TouchableOpacity>
            </View>

            {/* PREMIUM TIER */}
            <View style={[styles.popularCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                <View style={[styles.popularTag, { backgroundColor: colors.primary }]}>
                    <Text style={styles.popularTagText}>MOST POPULAR</Text>
                </View>
                <Text style={[styles.planName, { color: colors.text }]}>Premium Care</Text>
                <Text style={[styles.planPrice, { color: colors.primary }]}>₹249<Text style={styles.planInterval}>/mo</Text></Text>
                <Text style={[styles.planDesc, { color: colors.mutedText }]}>Full IoT Fall Detection and AI Voice access.</Text>
                
                <View style={styles.featureList}>
                    <Text style={[styles.featureRow, { color: colors.text }]}><Ionicons name="checkmark-circle" size={18} color={colors.primary} /> All Core Features</Text>
                    <Text style={[styles.featureRow, { color: colors.text }]}><Ionicons name="checkmark-circle" size={18} color={colors.primary} /> 24/7 ESP32 Fall Detection</Text>
                    <Text style={[styles.featureRow, { color: colors.text }]}><Ionicons name="checkmark-circle" size={18} color={colors.primary} /> AI Voice Companion</Text>
                    <Text style={[styles.featureRow, { color: colors.text }]}><Ionicons name="checkmark-circle" size={18} color={colors.primary} /> Unlimited Caregivers</Text>
                </View>
                
                <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: isCurrentTier('PREMIUM') ? colors.border : colors.primary }]}
                    onPress={() => handleUpgrade('PREMIUM')}
                    disabled={isCurrentTier('PREMIUM')}
                >
                    <Text style={styles.actionButtonText}>{isCurrentTier('PREMIUM') ? 'Current Plan' : 'Upgrade to Premium'}</Text>
                </TouchableOpacity>
            </View>

            {/* ENTERPRISE TIER */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: isCurrentTier('ENTERPRISE') ? colors.primary : colors.border }]}>
                <Text style={[styles.planName, { color: colors.text }]}>Enterprise Care</Text>
                <Text style={[styles.planPrice, { color: colors.primary }]}>₹499<Text style={styles.planInterval}>/mo/user</Text></Text>
                <Text style={[styles.planDesc, { color: colors.mutedText }]}>B2B solution for Nursing Homes and Assisted Living.</Text>
                
                <View style={styles.featureList}>
                    <Text style={[styles.featureRow, { color: colors.text }]}><Ionicons name="checkmark-circle" size={18} color={colors.primary} /> All Premium Features</Text>
                    <Text style={[styles.featureRow, { color: colors.text }]}><Ionicons name="checkmark-circle" size={18} color={colors.primary} /> Bulk 50+ Device Monitoring</Text>
                    <Text style={[styles.featureRow, { color: colors.text }]}><Ionicons name="checkmark-circle" size={18} color={colors.primary} /> Staff Triage Dashboards</Text>
                </View>
                
                <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: isCurrentTier('ENTERPRISE') ? colors.border : colors.primary }]}
                    onPress={() => handleUpgrade('ENTERPRISE')}
                    disabled={isCurrentTier('ENTERPRISE')}
                >
                    <Text style={styles.actionButtonText}>{isCurrentTier('ENTERPRISE') ? 'Current Plan' : 'Upgrade to Enterprise'}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: colors.primary }]}
                    onPress={() => router.push('/settings/billing-history')}
                >
                    <Ionicons name="receipt-outline" size={24} color={colors.primary} />
                    <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Billing History</Text>
                </TouchableOpacity>
            </View>
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { marginBottom: 30, paddingTop: 40 },
    title: { fontSize: 28, fontWeight: 'bold' },
    subtitle: { fontSize: 16, marginTop: 4 },
    card: {
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 20,
    },
    popularCard: {
        padding: 24,
        borderRadius: 16,
        borderWidth: 2,
        marginBottom: 20,
        position: 'relative',
    },
    popularTag: {
        position: 'absolute',
        top: -12,
        alignSelf: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
    },
    popularTagText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    planName: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
    planPrice: { fontSize: 32, fontWeight: '800', marginBottom: 8 },
    planInterval: { fontSize: 16, fontWeight: 'normal' },
    planDesc: { fontSize: 14, marginBottom: 16 },
    featureList: { gap: 8, marginBottom: 24 },
    featureRow: { fontSize: 14, fontWeight: '500' },
    actions: { gap: 16, marginTop: 10 },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        gap: 12,
    },
    actionButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
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
});
