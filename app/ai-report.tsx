import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api/client';

interface XaiReport {
    summary: string;
    scoreBreakdown: {
        label: string;
        status: 'Good' | 'Warning';
        reason: string;
    }[];
    whyItChanged: string;
    severity: 'NORMAL' | 'WARNING' | 'CRITICAL';
    recommendations: string[];
    encouragement: string;
}

const XaiReportScreen = () => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<{ score: number; report: XaiReport } | null>(null);

    useEffect(() => {
        const fetchReport = async () => {
            if (!user?.id) return;
            try {
                const data = await api.get<{ score: number; report: XaiReport }>(`/ai/health-report/${user.id}`);
                setReportData(data);
            } catch (error) {
                console.error('Failed to fetch AI report:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [user?.id]);

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.mutedText }]}>Analyzing your health story...</Text>
            </View>
        );
    }

    if (!reportData) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="alert-circle" size={64} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.text }]}>Unable to generate report.</Text>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.primary }]}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { score, report } = reportData;

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Health Story</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                {/* Score Gauge Section */}
                <View style={styles.scoreSection}>
                    <View style={[styles.scoreCircle, { borderColor: score > 80 ? colors.success : score > 50 ? colors.warning : colors.error }]}>
                        <Text style={[styles.scoreText, { color: colors.text }]}>{score}</Text>
                        <Text style={[styles.scoreLabel, { color: colors.mutedText }]}>Health Score</Text>
                    </View>
                    <View style={[styles.severityBadge, { backgroundColor: report.severity === 'CRITICAL' ? colors.error : report.severity === 'WARNING' ? colors.warning : colors.success }]}>
                        <Text style={styles.severityText}>{report.severity}</Text>
                    </View>
                </View>

                {/* Summary Section */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="sparkles" size={20} color={colors.primary} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>AI Summary</Text>
                    </View>
                    <Text style={[styles.summaryText, { color: colors.text }]}>{report.summary}</Text>
                </View>

                {/* The "Why" Section */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Why your score changed</Text>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                   <Text style={[styles.whyText, { color: colors.text }]}>{report.whyItChanged}</Text>
                </View>

                {/* Score Breakdown Cards */}
                <View style={styles.breakdownContainer}>
                    {report.scoreBreakdown.map((item, index) => (
                        <View key={index} style={[styles.breakdownItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={[styles.statusIcon, { backgroundColor: item.status === 'Good' ? colors.success + '20' : colors.warning + '20' }]}>
                                <Ionicons 
                                    name={item.label === 'Medication' ? 'medical' : item.label === 'Activity' ? 'walk' : 'heart'} 
                                    size={18} 
                                    color={item.status === 'Good' ? colors.success : colors.warning} 
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.breakdownLabel, { color: colors.text }]}>{item.label}</Text>
                                <Text style={[styles.breakdownReason, { color: colors.mutedText }]}>{item.reason}</Text>
                            </View>
                            <Ionicons 
                                name={item.status === 'Good' ? 'checkmark-circle' : 'alert-circle'} 
                                size={20} 
                                color={item.status === 'Good' ? colors.success : colors.warning} 
                            />
                        </View>
                    ))}
                </View>

                {/* Recommendations */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Next Steps for you</Text>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {report.recommendations.map((rec, index) => (
                        <View key={index} style={styles.recItem}>
                            <Ionicons name="arrow-forward-circle" size={20} color={colors.primary} />
                            <Text style={[styles.recText, { color: colors.text }]}>{rec}</Text>
                        </View>
                    ))}
                </View>

                {/* Encouragement */}
                <View style={styles.footer}>
                    <Text style={[styles.encouragementText, { color: colors.primary }]}>{report.encouragement}</Text>
                </View>

                <View style={{ height: 40 }} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        paddingHorizontal: 20,
    },
    scoreSection: {
        alignItems: 'center',
        marginVertical: 20,
    },
    scoreCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    scoreText: {
        fontSize: 36,
        fontWeight: 'bold',
    },
    scoreLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    severityBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    severityText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    card: {
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    summaryText: {
        fontSize: 15,
        lineHeight: 22,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        marginTop: 10,
    },
    whyText: {
        fontSize: 14,
        lineHeight: 20,
    },
    breakdownContainer: {
        marginBottom: 20,
    },
    breakdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 10,
    },
    statusIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    breakdownLabel: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    breakdownReason: {
        fontSize: 12,
        marginTop: 2,
    },
    recItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    recText: {
        fontSize: 14,
        marginLeft: 10,
        flex: 1,
    },
    footer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    encouragementText: {
        fontSize: 16,
        fontWeight: 'bold',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '500',
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        marginBottom: 20,
    },
    backButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    }
});

export default XaiReportScreen;
