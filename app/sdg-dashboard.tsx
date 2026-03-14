import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ResponsiveView } from '../components/ResponsiveView';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function ImpactDashboard() {
  const { colors, fontSize } = useTheme();
  
  const getFontSize = (base: number) => {
    switch (fontSize) {
      case 'small': return base * 0.9;
      case 'large': return base * 1.2;
      case 'extraLarge': return base * 1.4;
      default: return base;
    }
  };
  const { t } = useTranslation();
  const router = useRouter();

  // Mock data for presentation purposes
  const [metrics, setMetrics] = useState({
    sdg3: { vitals: 124, reminders: 45, sosEvents: 2 },
    sdg10: { wcagEnabled: true, touchTargets: "48px", voiceQueries: 18 },
    sdg11: { safeDays: 140, checkIns: 98 },
    sdg12: { telemetryBatched: 1204, ecoHoursSaved: 48, devicesSaved: 1 }
  });

  return (
    <ResponsiveView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text, fontSize: getFontSize ? getFontSize(24) : 24 }]}>
            Global Impact Goals
          </Text>
        </View>

        <Text style={[styles.subtitle, { color: colors.mutedText, fontSize: getFontSize ? getFontSize(16) : 16 }]}>
          ElderConnect aligns with the United Nations Sustainable Development Goals (SDGs) to create a more inclusive and sustainable future.
        </Text>

        {/* SDG 3 */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: '#4CAF50' }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="heart" size={28} color="#4CAF50" />
            <Text style={[styles.cardTitle, { color: colors.text, fontSize: getFontSize ? getFontSize(20) : 20 }]}>SDG 3: Good Health</Text>
          </View>
          <Text style={[styles.desc, { color: colors.mutedText }]}>Ensuring healthy lives and promoting well-being for all at all ages.</Text>
          <View style={styles.statsGrid}>
            <StatBox label="Vitals Logged" value={metrics.sdg3.vitals} colors={colors} />
            <StatBox label="SOS Handled" value={metrics.sdg3.sosEvents} colors={colors} />
            <StatBox label="Med Reminders" value={metrics.sdg3.reminders} colors={colors} />
          </View>
        </View>

        {/* SDG 10 */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: '#E91E63' }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="people" size={28} color="#E91E63" />
            <Text style={[styles.cardTitle, { color: colors.text, fontSize: getFontSize ? getFontSize(20) : 20 }]}>SDG 10: Reduced Inequalities</Text>
          </View>
          <Text style={[styles.desc, { color: colors.mutedText }]}>ElderConnect ensures seniors are not excluded from digital technology by enforcing strict WCAG compliance.</Text>
          <View style={styles.statsGrid}>
            <StatBox label="Min Touch Target" value={metrics.sdg10.touchTargets} colors={colors} />
            <StatBox label="Voice Queries" value={metrics.sdg10.voiceQueries} colors={colors} />
          </View>
        </View>

        {/* SDG 11 */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: '#FF9800' }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="home" size={28} color="#FF9800" />
            <Text style={[styles.cardTitle, { color: colors.text, fontSize: getFontSize ? getFontSize(20) : 20 }]}>SDG 11: Sustainable Communities</Text>
          </View>
          <Text style={[styles.desc, { color: colors.mutedText }]}>Promoting independent "aging-in-place" to reduce the strain on institutionalized healthcare systems.</Text>
          <View style={styles.statsGrid}>
            <StatBox label="Independent Days" value={metrics.sdg11.safeDays} colors={colors} />
            <StatBox label="Safety Checks" value={metrics.sdg11.checkIns} colors={colors} />
          </View>
        </View>

        {/* SDG 12 */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: '#00BCD4' }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="leaf" size={28} color="#00BCD4" />
            <Text style={[styles.cardTitle, { color: colors.text, fontSize: getFontSize ? getFontSize(20) : 20 }]}>SDG 12: Responsible Consumption</Text>
          </View>
          <Text style={[styles.desc, { color: colors.mutedText }]}>Using Eco Mode to batch telemetry, reducing energy footprint, and maintaining compatibility on 5+ year old smartphones.</Text>
          <View style={styles.statsGrid}>
            <StatBox label="Requests Batched" value={metrics.sdg12.telemetryBatched} colors={colors} />
            <StatBox label="Eco Hours" value={metrics.sdg12.ecoHoursSaved} colors={colors} />
          </View>
        </View>

      </ScrollView>
    </ResponsiveView>
  );
}

function StatBox({ label, value, colors }: { label: string, value: string | number, colors: any }) {
  return (
    <View style={[styles.statBox, { backgroundColor: colors.background }]}>
      <Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedText }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingTop: 40 },
  backBtn: { marginRight: 15 },
  title: { fontWeight: 'bold' },
  subtitle: { marginBottom: 25, lineHeight: 24 },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderLeftWidth: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontWeight: 'bold', marginLeft: 10 },
  desc: { fontSize: 14, lineHeight: 20, marginBottom: 15 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  statBox: {
    width: '48%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10
  },
  statValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 12, textAlign: 'center', fontWeight: 'bold' }
});
