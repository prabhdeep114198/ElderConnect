// app/(tabs)/reports.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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

  const [healthReports, setHealthReports] = useState<HealthReport[]>([
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
        "Ensure consistent sleep schedule, targeting 7-8 hours.",
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
        "Monitor blood pressure regularly and report any significant changes.",
      ],
      downloadLink: "https://example.com/report-nov.pdf",
    },
    {
      id: "3",
      title: "Quarterly Health Review - Q3 2024",
      date: "2024-10-05",
      type: "quarterly",
      summary:
        "Q3 saw a focus on dietary improvements and weight management. Achieved target weight loss of 2kg.",
      keyMetrics: [
        { name: "Weight", value: "68 kg", trend: "down" },
        { name: "BMI", value: "24.5", trend: "down" },
        { name: "Cholesterol", value: "Normal", trend: "stable" },
      ],
      recommendations: [
        "Continue healthy eating habits.",
        "Schedule follow-up with nutritionist next quarter.",
      ],
      downloadLink: "https://example.com/report-q3.pdf",
    },
  ]);

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
    Alert.alert("Download Report", `Attempting to download report from: ${link}`);
    // In a real app, you would use a library like expo-linking or react-native-fs
    // to handle file downloads.
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Health Reports</Text>
            <Text style={styles.headerSubtitle}>View and manage your health summaries</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => Alert.alert("Generate Report", "Feature coming soon!")}
          >
            <Ionicons name="document-text-outline" size={24} color={Colors.buttonText} />
          </TouchableOpacity>
        </View>

        {/* Report Overview */}
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
              <Text style={styles.emptyStateText}>No health reports available yet.</Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => Alert.alert("Generate Report", "Feature coming soon!")}
              >
                <Text style={styles.emptyStateButtonText}>Generate New Report</Text>
              </TouchableOpacity>
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
                    <Text style={[styles.reportTypeText, { color: getReportTypeColor(report.type) }]}>
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
      <Modal visible={!!selectedReport} animationType="slide" presentationStyle="pageSheet">
        {selectedReport && (
          <View style={styles.modalContainer}>
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
                <View style={[styles.reportTypeBadgeLarge, { backgroundColor: getReportTypeColor(selectedReport.type) + "20" }]}>
                  <Text style={[styles.reportTypeTextLarge, { color: getReportTypeColor(selectedReport.type) }]}>
                    {selectedReport.type}
                  </Text>
                </View>
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

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Recommendations</Text>
                {selectedReport.recommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.recommendationText}>{rec}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => downloadReport(selectedReport.downloadLink)}
              >
                <Ionicons name="download" size={20} color={Colors.buttonText} />
                <Text style={styles.downloadButtonText}>Download Full Report</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    flex: 1,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
    marginTop: 8,
  },
  overviewLabel: {
    fontSize: 12,
    color: Colors.mutedText,
    textAlign: "center",
  },
  emptyState: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.mutedText,
    marginVertical: 16,
  },
  emptyStateButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: Colors.buttonText,
    fontWeight: "600",
  },
  reportCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reportTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: Colors.background,
  },
  reportTypeText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  reportDate: {
    fontSize: 12,
    color: Colors.mutedText,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 4,
  },
  reportSummary: {
    fontSize: 14,
    color: Colors.mutedText,
    lineHeight: 20,
    marginBottom: 12,
  },
  reportMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metricText: {
    fontSize: 12,
    color: Colors.text,
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 4,
  },
  detailDate: {
    fontSize: 14,
    color: Colors.mutedText,
    marginBottom: 8,
  },
  reportTypeBadgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  reportTypeTextLarge: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.mutedText,
    lineHeight: 20,
  },
  detailMetricItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailMetricText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
    flex: 1,
  },
  downloadButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  downloadButtonText: {
    color: Colors.buttonText,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
});


