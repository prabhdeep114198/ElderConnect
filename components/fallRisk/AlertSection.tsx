import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface Alert {
    id: string;
    type: 'warning' | 'danger' | 'info';
    message: string;
    timestamp: string;
}

interface AlertSectionProps {
    alerts: Alert[];
}

export const AlertSection: React.FC<AlertSectionProps> = ({ alerts }) => {
    const { colors } = useTheme();

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'danger': return 'alert-circle';
            case 'warning': return 'warning';
            default: return 'information-circle';
        }
    };

    const getAlertColor = (type: string) => {
        switch (type) {
            case 'danger': return colors.error;
            case 'warning': return colors.warning;
            default: return colors.primary;
        }
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: colors.text }]}>Recent Alerts</Text>
            {alerts.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="shield-checkmark" size={40} color={colors.success} />
                    <Text style={[styles.emptyText, { color: colors.mutedText }]}>No active risks detected</Text>
                </View>
            ) : (
                alerts.map(alert => (
                    <TouchableOpacity
                        key={alert.id}
                        style={[styles.alertCard, { backgroundColor: colors.card, borderLeftColor: getAlertColor(alert.type) }]}
                    >
                        <View style={styles.alertHeader}>
                            <Ionicons name={getAlertIcon(alert.type)} size={20} color={getAlertColor(alert.type)} />
                            <Text style={[styles.alertTime, { color: colors.mutedText }]}>{alert.timestamp}</Text>
                        </View>
                        <Text style={[styles.alertMessage, { color: colors.text }]}>{alert.message}</Text>
                    </TouchableOpacity>
                ))
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 15,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    emptyState: {
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    emptyText: {
        marginTop: 10,
        fontSize: 14,
        fontWeight: '500',
    },
    alertCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        borderLeftWidth: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    alertHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    alertTime: {
        fontSize: 12,
    },
    alertMessage: {
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
    },
});
