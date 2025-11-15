// app/(tabs)/reports.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
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
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

// ------- Dummy Offline Data --------
const dummyReports: HealthReport[] = [
  {
    id: "1",
    title: "Weekly Health Summary - Dec 1st-7th",
    date: "2024-12-08",
    type: "weekly",
    summary:
      "Overall health metrics remained stable this week. Noted a slight increase in daily steps and consistent medication adherence.",
    keyMetrics: [
      { name: "Steps", value: "35,000", trend: "up" },
      { name: "Sleep", value: "7.2 hrs", trend: "stable" },
      { name: "Medication Adherence", value: "95%", trend: "up" },
    ],
    recommendations: [
      "Continue daily walks and aim for 8,000 steps.",
      "Ensure consistent sleep schedule, targeting 7–8 hours.",
    ],
    downloadLink: "https://example.com/report-dec1-7.pdf",
  },
  {
    id: "2",
    title: "Monthly Health Overview - November",
    date: "2024-12-01",
    type: "monthly",
    summary:
      "November showed good progress in managing blood pressure. Exercise consistency improved significantly.",
    keyMetrics: [
      { name: "Blood Pressure", value: "125/80 mmHg", trend: "down" },
      { name: "Exercise Minutes", value: "200 min", trend: "up" },
      { name: "Water Intake", value: "7 glasses/day", trend: "stable" },
    ],
    recommendations: [
      "Maintain current exercise routine.",
      "Monitor blood pressure regularly.",
    ],
    downloadLink: "https://example.com/report-nov.pdf",
  },
];

export default function ReportsScreen() {
  const [selectedReport, setSelectedReport] = useState<HealthReport | null>(null);
  const [healthReports, setHealthReports] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -------- Backend Fetching ---------
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      // 🔥 CHANGE THIS URL WHEN YOUR BACKEND IS READY
      const response = await fetch("https://your-backend-url.com/api/reports");
      const data = await response.json();
      setHealthReports(data.reports);
    } catch (err) {
      setError("Unable to fetch reports. Showing offline data.");
      setHealthReports(dummyReports);
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

  const downloadReport = (link: string) => {
    Alert.alert("Download Report", `Downloading from: ${link}`);
  };

  // -------- Loading Screen --------
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 10, color: Colors.mutedText }}>
          Fetching health reports...
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
            onPress={() =>
              Alert.alert("Generate Report", "Feature coming soon!")
            }
          >
            <Ionicons
              name="document-text-outline"
              size={24}
              color={Colors.buttonText}
            />
          </TouchableOpacity>
        </View>

        {/* Error Message */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <Ionicons name="calendar" size={28} color={Colors.primary} />
              <Text style={styles.overviewValue}>{healthReports.length}</Text>
              <Text style={styles.overviewLabel}>Total Reports</Text>
            </View>

            <View style={styles.overviewCard}>
              <Ionicons name="trending-up" size={28} color={Colors.success} />
              <Text style={styles.overviewValue}>Good</Text>
              <Text style={styles.overviewLabel}>Overall Trend</Text>
            </View>

            <View style={styles.overviewCard}>
              <Ionicons name="alert-circle" size={28} color={Colors.warning} />
              <Text style={styles.overviewValue}>2</Text>
              <Text style={styles.overviewLabel}>Pending Actions</Text>
            </View>
          </View>
        </View>

        {/* All Reports */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Reports</Text>

          {healthReports.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color={Colors.mutedText} />
              <Text style={styles.emptyStateText}>
                No health reports available yet.
              </Text>
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

      {/* Modal */}
      <Modal visible={!!selectedReport} animationType="slide">
        {selectedReport && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Details</Text>
              <TouchableOpacity onPress={() => setSelectedReport(null)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>{selectedReport.title}</Text>
                <Text style={styles.detailDate}>{selectedReport.date}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Summary</Text>
                <Text style={styles.detailText}>{selectedReport.summary}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Key Metrics</Text>
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
              </View>

              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => downloadReport(selectedReport.downloadLink)}
              >
                <Ionicons name="download" size={20} color={Colors.buttonText} />
                <Text style={styles.downloadButtonText}>
                  Download Full Report
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </View>
  );
}

// ------------------ STYLES ------------------
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.mutedText,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  overviewCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 8,
  },
  overviewLabel: {
    fontSize: 12,
    color: Colors.mutedText,
  },
  emptyState: {
    backgroundColor: Colors.card,
    padding: 32,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.mutedText,
    marginTop: 16,
  },
  reportCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reportTypeBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  reportTypeText: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  reportDate: {
    fontSize: 12,
    color: Colors.mutedText,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 4,
  },
  reportSummary: {
    color: Colors.mutedText,
    marginBottom: 12,
  },
  reportMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  metricItem: {
    flexDirection: "row",
    marginRight: 12,
    alignItems: "center",
  },
  metricText: {
    marginLeft: 4,
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === "android" ? 25 : 0, // Extra safety on Android
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalContent: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  detailDate: {
    fontSize: 14,
    color: Colors.mutedText,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  detailMetricItem: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
  detailMetricText: {
    marginLeft: 8,
    fontSize: 14,
  },
  downloadButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
  },
  downloadButtonText: {
    color: Colors.buttonText,
    fontWeight: "bold",
    marginLeft: 10,
  },
});
