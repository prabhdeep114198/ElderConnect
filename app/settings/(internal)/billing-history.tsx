import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { getBillingHistory } from '../../../services/PaymentService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BillingHistoryScreen() {
    const { colors } = useTheme();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (token) {
                const data = await getBillingHistory(token);
                setHistory(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: any) => (
        <View style={[styles.item, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <View style={styles.itemMain}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>Premium Subscription</Text>
                <Text style={[styles.itemDate, { color: colors.mutedText }]}>
                    {new Date(item.createdAt).toLocaleDateString()}
                </Text>
            </View>
            <View style={styles.itemSide}>
                <Text style={[styles.itemAmount, { color: colors.text }]}>
                    {item.currency} {item.amount}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#D1FAE5' : '#FEE2E2' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'active' ? '#065F46' : '#991B1B' }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Billing History</Text>
            </View>

            <FlatList
                data={history}
                keyExtractor={(item: any) => item.id}
                renderItem={renderItem}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={[styles.emptyText, { color: colors.mutedText }]}>No payment records found.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, paddingTop: 60 },
    title: { fontSize: 24, fontWeight: 'bold' },
    item: {
        flexDirection: 'row',
        padding: 20,
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    itemMain: { flex: 1 },
    itemTitle: { fontSize: 16, fontWeight: '600' },
    itemDate: { fontSize: 14, marginTop: 4 },
    itemSide: { alignItems: 'flex-end' },
    itemAmount: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    empty: { padding: 40, alignItems: 'center' },
    emptyText: { fontSize: 16 },
});
