import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Colors } from "../../constants/colors";

const { width } = Dimensions.get("window");

interface HealthReport {
  id: string;
  title: string;
  date: string;
  type: "weekly" | "monthly" | "quarterly" | "annual";
  summary: string;
  keyMetrics: {
    name: string;
    value: string;
    trend: "up" | "down" | "stable";
  }[];
  recommendations: string[];
  downloadLink: string;
}

export default function ReportsScreen() {
  const [selectedReport, setSelectedReport] = useState<HealthReport | null>(null);
  const [healthReports, setHealthReports] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch reports dynamically from backend
  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch("https://your-backend.com/api/reports");
      if (!response.ok) throw new Error("Failed to fetch reports");
      const data: HealthReport[] = await response.json();
      setHealthReports(data);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message || "Failed to load reports. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return "trending-up";
      case "down":
        return "trending-down";
      default:
        return "remove";
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return Colors.success;
      case "down":
        return Colors.error;
      default:
        return Colors.mutedText;
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case "weekly":
        return Colors.primary;
      case "monthly":
        return Colors.info;
      case "quarterly":
        return Colors.warning;
      case "annual":
        return Colors.error;
      default:
        return Colors.mutedText;
    }
  };

  const downloadReport = async (link: string) => {
    try {
      const supported = await Linking.canOpenURL(link);
      if (supported) {
        await Linking.openURL(link);
      } else {
        Alert.alert("Error", "Cannot open this link.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to open report link.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ color: Colors.text, marginTop: 10 }}>
          Loading reports...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Health Reports</Text>
            <Text style={styles.headerSubtitle}>
              View and manage your health summaries
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => Alert.alert("Generate Report", "Feature coming soon!")}
          >
            <Ionicons name="document-text-outline" size={24} color={Colors.buttonText} />
          </TouchableOpacity>
        </View>

        {/* Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <Ionicons name="calendar" size={28} color={Colors.primary} />
              <Text style={styles.overviewValue}>{healthReports.length}</Text>
              <Text style={styles.overviewLabel}>Total Reports</Text>
            </View>
          </View>
        </View>

        {/* Reports List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Reports</Text>
          {healthReports.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color={Colors.mutedText} />
              <Text style={styles.emptyStateText}>No reports found.</Text>
            </View>
          ) : (
            healthReports.map((report) => (
              <TouchableOpacity
                key={report.id}
                style={styles.reportCard}
                onPress={() => setSelectedReport(report)}
              >
                <View style={styles.reportHeader}>
                  <View style={styles.reportTypeBadge}>
                    <Text
                      style={[
                        styles.reportTypeText,
                        { color: getReportTypeColor(report.type) },
                      ]}
                    >
                      {report.type}
                    </Text>
                  </View>
                  <Text style={styles.reportDate}>{report.date}</Text>
                </View>
                <Text style={styles.reportTitle}>{report.title}</Text>
                <Text style={styles.reportSummary} numberOfLines={2}>
                  {report.summary}
                </Text>
                <View style={styles.reportMetrics}>
                  {report.keyMetrics.map((metric, index) => (
                    <View key={index} style={styles.metricItem}>
                      <Ionicons
                        name={getTrendIcon(metric.trend) as any}
                        size={14}
                        color={getTrendColor(metric.trend)}
                      />
                      <Text style={styles.metricText}>
                        {metric.name}: {metric.value}
                      </Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Report Details Modal */}
      <Modal visible={!!selectedReport} animationType="slide">
        {selectedReport && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Details</Text>
              <TouchableOpacity onPress={() => setSelectedReport(null)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.detailTitle}>{selectedReport.title}</Text>
              <Text style={styles.detailDate}>{selectedReport.date}</Text>

              <Text style={styles.detailLabel}>Summary</Text>
              <Text style={styles.detailText}>{selectedReport.summary}</Text>

              <Text style={[styles.detailLabel, { marginTop: 12 }]}>Key Metrics</Text>
              {selectedReport.keyMetrics.map((metric, index) => (
                <View key={index} style={styles.detailMetricItem}>
                  <Ionicons
                    name={getTrendIcon(metric.trend) as any}
                    size={16}
                    color={getTrendColor(metric.trend)}
                  />
                  <Text style={styles.detailMetricText}>
                    {metric.name}: {metric.value}
                  </Text>
                </View>
              ))}

              <Text style={[styles.detailLabel, { marginTop: 12 }]}>Recommendations</Text>
              {selectedReport.recommendations.map((rec, i) => (
                <View key={i} style={styles.recommendationItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}

              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => downloadReport(selectedReport.downloadLink)}
              >
                <Ionicons name="download" size={20} color={Colors.buttonText} />
                <Text style={styles.downloadButtonText}>Download Report</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: 20 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: Colors.text },
  headerSubtitle: { fontSize: 14, color: Colors.mutedText, marginTop: 2 },
  addButton: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: Colors.text, marginBottom: 16 },
  overviewGrid: { flexDirection: "row", justifyContent: "space-between" },
  overviewCard: {
    flex: 1,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },
  overviewValue: { fontSize: 20, fontWeight: "bold", color: Colors.text, marginTop: 8 },
  overviewLabel: { fontSize: 12, color: Colors.mutedText },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    color: Colors.mutedText,
    fontSize: 16,
    marginTop: 10,
  },
  reportCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reportHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  reportTypeBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  reportTypeText: { fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
  reportDate: { fontSize: 12, color: Colors.mutedText },
  reportTitle: { fontSize: 16, fontWeight: "bold", color: Colors.text },
  reportSummary: { fontSize: 14, color: Colors.mutedText, marginVertical: 6 },
  reportMetrics: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricItem: { flexDirection: "row", alignItems: "center" },
  metricText: { fontSize: 12, color: Colors.text, marginLeft: 4 },
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: Colors.text },
  modalContent: { flex: 1, padding: 20 },
  detailTitle: { fontSize: 20, fontWeight: "bold", color: Colors.text },
  detailDate: { fontSize: 14, color: Colors.mutedText, marginBottom: 10 },
  detailLabel: { fontSize: 14, fontWeight: "600", color: Colors.text },
  detailText: { fontSize: 14, color: Colors.mutedText, marginTop: 4 },
  detailMetricItem: { flexDirection: "row", alignItems: "center", marginVertical: 4 },
  detailMetricText: { fontSize: 14, color: Colors.text, marginLeft: 8 },
  recommendationItem: { flexDirection: "row", alignItems: "flex-start", marginVertical: 4 },
  recommendationText: { fontSize: 14, color: Colors.text, marginLeft: 8, flex: 1 },
  downloadButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  downloadButtonText: { color: Colors.buttonText, fontSize: 16, marginLeft: 10 },
});
