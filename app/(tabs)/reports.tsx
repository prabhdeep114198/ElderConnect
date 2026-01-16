import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from 'expo-print';
import { useFocusEffect, useRouter } from "expo-router";
import * as Sharing from 'expo-sharing';
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFlags } from "react-native-flagsmith/react";
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from "react-native-svg";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { N8NService } from "../../services/N8NService";

const { width } = Dimensions.get("window");

// Metrics for the Radar Chart
const METRICS = [
  { label: "Physical", key: "physical", max: 100 },
  { label: "Exercise", key: "exercise", max: 100 },
  { label: "Social", key: "social", max: 100 },
  { label: "Mental", key: "mental", max: 100 },
  { label: "Sleep", key: "sleep", max: 100 },
  { label: "Diet", key: "diet", max: 100 },
];

export default function ReportsScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { t } = useTranslation();
  const { requireAuth } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [exerciseData, setExerciseData] = useState<any>(null);
  const [vitalSignsData, setVitalSignsData] = useState<any[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<any[]>([]);
  const [scores, setScores] = useState({
    physical: 65,
    social: 40,
    mental: 70,
    sleep: 80,
    diet: 55,
    exercise: 60
  });

  const flags = useFlags(["download_reports"]);
  const canDownload = flags.download_reports.enabled;

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
    }, [])
  );

  const loadUserProfile = async () => {
    try {
      const profile = await AsyncStorage.getItem("user_profile_data");
      const tickets = await AsyncStorage.getItem("user_tickets");
      const diary = await AsyncStorage.getItem("user_diary_entries");
      const healthMetrics = await AsyncStorage.getItem("health_metrics");
      const vitalSigns = await AsyncStorage.getItem("vital_signs");

      let calculatedScores = {
        physical: 65,
        social: 40,
        mental: 70,
        sleep: 80,
        diet: 55,
        exercise: 60
      };

      if (profile) {
        const data = JSON.parse(profile);
        setUserData(data);

        // 1. Process Profile (Base Scores)
        if (data.interests) {
          calculatedScores.social = Math.min(85, 30 + (data.interests.length * 5));
        }

        if (data.mobilityLevel) {
          if (data.mobilityLevel === "Independent") calculatedScores.physical = 85;
          else if (data.mobilityLevel === "Uses Cane") calculatedScores.physical = 70;
          else if (data.mobilityLevel === "Uses Walker") calculatedScores.physical = 55;
          else calculatedScores.physical = 40;
        }

        if (data.activityLevel) {
          const activityBoost = { Sedentary: 0, "Light Activity": 5, "Moderate Activity": 15, "Very Active": 25 };
          calculatedScores.physical = Math.min(100, calculatedScores.physical + (activityBoost[data.activityLevel as keyof typeof activityBoost] || 0));
        }

        if (data.dietaryPreferences && data.dietaryPreferences.length > 0) {
          calculatedScores.diet = Math.min(95, 60 + (data.dietaryPreferences.length * 5));
        }
      } else {
        // Use mock profile data
        setUserData({
          name: "Demo User",
          age: 65,
          interests: ["Reading", "Gardening", "Walking"],
          conditions: ["Hypertension"],
          emergencyContacts: [{ name: "John Doe", phone: "555-0123", relation: "Son" }],
          mobilityLevel: "Independent",
          activityLevel: "Moderate Activity",
          phone: "+15550000000",
          dietaryPreferences: ["Vegetarian", "Low Sodium"]
        });
      }

      // 2. Process Tickets (Boost Social)
      if (tickets) {
        const ticketList = JSON.parse(tickets);
        const ticketBoost = Math.min(20, ticketList.length * 5);
        calculatedScores.social = Math.min(100, calculatedScores.social + ticketBoost);
      }

      // 3. Process Diary (Mental Score)
      if (diary) {
        const entries = JSON.parse(diary);
        setDiaryEntries(entries.slice(0, 5)); // Store latest 5 entries
        if (entries.length > 0) {
          let totalMoodScore = 0;
          entries.forEach((e: any) => {
            if (e.mood === 'happy') totalMoodScore += 90;
            else if (e.mood === 'neutral') totalMoodScore += 70;
            else if (e.mood === 'sad') totalMoodScore += 40;
            else if (e.mood === 'anxious') totalMoodScore += 50;
            else if (e.mood === 'angry') totalMoodScore += 30;
            else totalMoodScore += 60;
          });
          calculatedScores.mental = Math.round(totalMoodScore / entries.length);
        }
      } else {
        // Load mock diary data
        const { fetchMockDiaryEntries } = await import('../../services/MockEventService');
        const mockDiary = await fetchMockDiaryEntries();
        setDiaryEntries(mockDiary.slice(0, 5));
        calculatedScores.mental = 75;
      }

      // 4. Process Health Metrics (Exercise & Sleep)
      if (healthMetrics) {
        const metrics = JSON.parse(healthMetrics);
        setExerciseData(metrics);

        const exerciseMetric = metrics.find((m: any) => m.name === 'Exercise');
        if (exerciseMetric && exerciseMetric.target) {
          const exercisePercentage = (exerciseMetric.value / exerciseMetric.target) * 100;
          calculatedScores.exercise = Math.min(100, Math.round(exercisePercentage));
        }

        const sleepMetric = metrics.find((m: any) => m.name === 'Sleep');
        if (sleepMetric && sleepMetric.target) {
          const sleepPercentage = (sleepMetric.value / sleepMetric.target) * 100;
          calculatedScores.sleep = Math.min(100, Math.round(sleepPercentage));
        }
      } else {
        // Load mock health metrics
        const { fetchMockHealthMetrics } = await import('../../services/MockEventService');
        const mockMetrics = await fetchMockHealthMetrics();
        setExerciseData(mockMetrics);

        const exerciseMetric = mockMetrics.find((m: any) => m.name === 'Exercise');
        if (exerciseMetric && exerciseMetric.target) {
          calculatedScores.exercise = Math.round((exerciseMetric.value / exerciseMetric.target) * 100);
        }

        const sleepMetric = mockMetrics.find((m: any) => m.name === 'Sleep');
        if (sleepMetric && sleepMetric.target) {
          calculatedScores.sleep = Math.round((sleepMetric.value / sleepMetric.target) * 100);
        }
      }

      // 5. Process Vital Signs
      if (vitalSigns) {
        const vitals = JSON.parse(vitalSigns);
        setVitalSignsData(vitals.slice(0, 3)); // Store latest 3 vitals
      } else {
        // Load mock vital signs
        const { fetchMockVitalSigns } = await import('../../services/MockEventService');
        const mockVitals = await fetchMockVitalSigns();
        setVitalSignsData(mockVitals.slice(0, 3));
      }

      setScores(calculatedScores);
    } catch (e) {
      console.error(e);
    }
  };

  const generatePDF = async () => {
    requireAuth(async () => {
      if (!canDownload) {
        Alert.alert(
          t("premiumFeature"),
          t("upgradeToDownload"),
          [
            { text: t("cancel"), style: "cancel" },
            { text: t("upgradeNow"), onPress: () => router.push("/SettingsScreen") }
          ]
        );
        return;
      }

      if (!userData) {
        Alert.alert("Error", "No profile data found to generate report.");
        return;
      }

      const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #5a67d8; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .section-title { color: #5a67d8; font-size: 20px; font-weight: bold; margin-bottom: 15px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .card { background: #f7fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .label { font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; }
            .value { font-size: 16px; font-weight: 500; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e2e8f0; }
            th { background: #edf2f7; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ElderConnect Health Report</h1>
            <p>Participant: ${userData.name}</p>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="section">
            <div class="section-title">Personal Profile</div>
            <div class="grid">
              <div class="card"><div class="label">Age</div><div class="value">${userData.age || 'N/A'}</div></div>
              <div class="card"><div class="label">Living Arrangement</div><div class="value">${userData.livingArrangement || 'N/A'}</div></div>
              <div class="card"><div class="label">Activity Level</div><div class="value">${userData.activityLevel || 'N/A'}</div></div>
              <div class="card"><div class="label">Mobility</div><div class="value">${userData.mobilityLevel || 'N/A'}</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Wellness Indices</div>
            <table>
              <thead>
                <tr><th>Metric</th><th>Score</th><th>Status</th></tr>
              </thead>
              <tbody>
                <tr><td>Physical</td><td>${scores.physical}%</td><td>${scores.physical > 70 ? 'Excellent' : scores.physical > 50 ? 'Good' : 'Needs Improvement'}</td></tr>
                <tr><td>Social</td><td>${scores.social}%</td><td>${scores.social > 70 ? 'Connected' : scores.social > 50 ? 'Steady' : 'Isolated'}</td></tr>
                <tr><td>Mental</td><td>${scores.mental}%</td><td>${scores.mental > 70 ? 'Strong' : scores.mental > 50 ? 'Balanced' : 'Vulnerable'}</td></tr>
                <tr><td>Dietary</td><td>${scores.diet}%</td><td>${scores.diet > 70 ? 'Healthy' : scores.diet > 50 ? 'Standard' : 'Unbalanced'}</td></tr>
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Health Conditions & Medications</div>
            <div class="card">
                <strong>Conditions:</strong> ${userData.conditions?.join(", ") || 'None stated'}<br/>
                <strong style="margin-top: 10px; display: block;">Medication Frequency:</strong> ${userData.medicationFrequency || 'N/A'}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Interests & Hobbies</div>
            <p>${userData.interests?.join(" • ") || 'None listed'}</p>
          </div>

          <div class="section">
            <div class="section-title">Emergency Contacts</div>
            <table>
                <thead>
                    <tr><th>Name</th><th>Phone</th><th>Relation</th></tr>
                </thead>
                <tbody>
                    ${userData.emergencyContacts?.map((c: any) => `
                        <tr><td>${c.name}</td><td>${c.phone}</td><td>${c.relation}</td></tr>
                    `).join('') || '<tr><td colspan="3">No contacts listed</td></tr>'}
                </tbody>
            </table>
          </div>

          <div style="margin-top: 50px; font-size: 10px; color: #a0aec0; text-align: center;">
            This report is generated by ElderConnect and is intended for informational purposes only.
          </div>
        </body>
      </html>
    `;

      try {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Failed to generate or share report.");
      }
    });
  };

  // Function to trigger n8n automation
  const sendWhatsAppReport = async () => {
    if (!userData) return;

    const contactName = userData.emergencyContacts?.[0]?.name || t("caregiver");

    Alert.alert(
      t("shareViaWhatsApp") || "Share via WhatsApp",
      `${t("sendSummaryTo") || "Send summary to"} ${contactName}?`,
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("send"),
          onPress: async () => {
            // Generate a simple dynamic tip
            let tip = "Great job maintaining health!";
            if (scores.physical < 60) tip = "Encourage a short 10-minute walk today.";
            else if (scores.social < 60) tip = "A phone call to a friend would be great for morale.";
            else if (scores.sleep < 70) tip = "Try to establish a consistent bedtime routine.";

            const result = await N8NService.sendHealthReport(
              userData,
              scores,
              vitalSignsData,
              tip
            );

            if (result.success) {
              Alert.alert("Success", "Report sent to your Caregiver via WhatsApp! 🚀");
            } else {
              Alert.alert("Error", "Could not connect to automation server.");
            }
          }
        }
      ]
    );
  };

  // --- RADAR CHART LOGIC ---
  const radarSize = width - 60;
  const radarCenter = radarSize / 2;
  const radarRadius = (radarSize - 80) / 2;
  const angleSlice = (Math.PI * 2) / METRICS.length;

  const getRadarCoordinates = (value: number, index: number) => {
    const angle = index * angleSlice - Math.PI / 2;
    const r = (value / 100) * radarRadius;
    return { x: radarCenter + r * Math.cos(angle), y: radarCenter + r * Math.sin(angle) };
  };

  const buildRadarPolygon = (dataScores: any) => {
    return METRICS.map((m, i) => {
      const { x, y } = getRadarCoordinates(dataScores[m.key], i);
      return `${x},${y}`;
    }).join(" ");
  };

  // --- KNOWLEDGE GRAPH LOGIC ---
  const kgSize = width - 40;
  const kgCenter = kgSize / 2;

  const renderKnowledgeGraph = () => {
    if (!userData) return null;

    const nodes: any[] = [
      { id: 'User', label: userData.name?.split(" ")[0] || 'User', type: 'main', color: colors.primary }
    ];

    // Add Exercise nodes (from health metrics)
    if (exerciseData) {
      const exerciseMetric = exerciseData.find((m: any) => m.name === 'Exercise');
      const stepsMetric = exerciseData.find((m: any) => m.name === 'Steps');

      if (exerciseMetric) {
        nodes.push({
          id: 'exercise_main',
          label: `${exerciseMetric.value}min`,
          sublabel: 'Exercise',
          type: 'exercise',
          color: '#FF9800'
        });
      }

      if (stepsMetric) {
        nodes.push({
          id: 'steps',
          label: `${stepsMetric.value}`,
          sublabel: 'Steps',
          type: 'exercise',
          color: '#FF9800'
        });
      }
    }

    // Add Vital Signs nodes (health summaries)
    if (vitalSignsData && vitalSignsData.length > 0) {
      vitalSignsData.forEach((vital: any, i: number) => {
        const displayValue = vital.systolic && vital.diastolic
          ? `${vital.systolic}/${vital.diastolic}`
          : vital.value;

        nodes.push({
          id: `vital_${i}`,
          label: `${displayValue}`,
          sublabel: vital.name,
          type: 'vital',
          color: '#E91E63',
          status: vital.status
        });
      });
    }

    // Add Diary/Mood nodes
    if (diaryEntries && diaryEntries.length > 0) {
      const recentMood = diaryEntries[0]?.mood;
      if (recentMood) {
        const moodEmojiMap: Record<string, string> = {
          'happy': '😊',
          'sad': '😢',
          'neutral': '😐',
          'anxious': '😰',
          'angry': '😠'
        };
        const moodEmoji = moodEmojiMap[recentMood] || '😊';

        nodes.push({
          id: 'mood',
          label: moodEmoji,
          sublabel: recentMood,
          type: 'mood',
          color: '#9C27B0'
        });
      }

      // Add recent activities from diary
      const recentActivities = diaryEntries[0]?.activity;
      if (recentActivities && recentActivities.length > 0) {
        nodes.push({
          id: 'activity',
          label: recentActivities[0],
          sublabel: 'Activity',
          type: 'activity',
          color: '#00BCD4'
        });
      }
    }

    // Add Interest nodes
    if (userData.interests) {
      userData.interests.slice(0, 2).forEach((int: string) => {
        nodes.push({
          id: `int_${int}`,
          label: int,
          type: 'interest',
          color: '#448AFF'
        });
      });
    }

    // Add Condition nodes
    if (userData.conditions) {
      userData.conditions.slice(0, 2).forEach((cond: string) => {
        if (cond !== "None") {
          nodes.push({
            id: `cond_${cond}`,
            label: cond,
            type: 'condition',
            color: '#FF5252'
          });
        }
      });
    }

    // Add Health Summary node
    const avgScore = Math.round((scores.physical + scores.social + scores.mental + scores.sleep + scores.diet + scores.exercise) / 6);
    nodes.push({
      id: 'health_summary',
      label: `${avgScore}%`,
      sublabel: 'Overall',
      type: 'summary',
      color: avgScore > 70 ? '#4CAF50' : avgScore > 50 ? '#FFC107' : '#FF5252'
    });

    // Add Contact nodes (reduced to 1)
    if (userData.emergencyContacts && userData.emergencyContacts.length > 0) {
      const contact = userData.emergencyContacts[0];
      if (contact.name) {
        nodes.push({
          id: 'cont_0',
          label: contact.name.split(" ")[0],
          sublabel: contact.relation || 'Contact',
          type: 'contact',
          color: '#69F0AE'
        });
      }
    }

    const nodeDist = kgSize / 3.2;
    const nodeLabelOffset = 30;

    return (
      <View style={[styles.kgCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{t("dataKnowledgeGraph") || "Health Knowledge Graph"}</Text>
        <Text style={[styles.cardSubtitle, { color: colors.mutedText }]}>Live data from your health ecosystem</Text>

        <Svg height={kgSize} width={kgSize}>
          {/* Draw edges from center to all other nodes */}
          {nodes.map((node, i) => {
            if (i === 0) return null;
            const angle = (i - 1) * ((Math.PI * 2) / (nodes.length - 1));
            const nx = kgCenter + nodeDist * Math.cos(angle);
            const ny = kgCenter + nodeDist * Math.sin(angle);
            return (
              <G key={`edge_${node.id}`}>
                <Line
                  x1={kgCenter}
                  y1={kgCenter}
                  x2={nx}
                  y2={ny}
                  stroke={node.color}
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity={0.6}
                />
              </G>
            );
          })}

          {/* Draw nodes */}
          {nodes.map((node, i) => {
            let nx = kgCenter;
            let ny = kgCenter;
            if (i > 0) {
              const angle = (i - 1) * ((Math.PI * 2) / (nodes.length - 1));
              nx = kgCenter + nodeDist * Math.cos(angle);
              ny = kgCenter + nodeDist * Math.sin(angle);
            }

            const r = i === 0 ? 40 : 30;
            const fontSize = i === 0 ? 13 : 11;

            return (
              <G key={node.id}>
                {/* Node circle with gradient effect */}
                <Circle cx={nx} cy={ny} r={r + 3} fill={node.color} opacity={0.2} />
                <Circle cx={nx} cy={ny} r={r} fill={node.color} opacity={i === 0 ? 1 : 0.9} />

                {/* Status indicator for vitals */}
                {node.status && node.status === 'normal' && (
                  <Circle cx={nx + r - 8} cy={ny - r + 8} r={5} fill="#4CAF50" stroke="#fff" strokeWidth="1" />
                )}

                {/* Main label */}
                <SvgText
                  x={nx}
                  y={node.sublabel ? ny - 3 : ny}
                  fill="#fff"
                  fontSize={fontSize}
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {node.label.length > 8 ? node.label.substring(0, 8) + '...' : node.label}
                </SvgText>

                {/* Sublabel */}
                {node.sublabel && (
                  <SvgText
                    x={nx}
                    y={ny + 10}
                    fill="#fff"
                    fontSize={8}
                    fontWeight="normal"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    opacity={0.9}
                  >
                    {node.sublabel}
                  </SvgText>
                )}
              </G>
            );
          })}
        </Svg>

        {/* Enhanced Legend */}
        <View style={styles.kgLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
            <Text style={[styles.legendText, { color: colors.mutedText }]}>Exercise</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#E91E63' }]} />
            <Text style={[styles.legendText, { color: colors.mutedText }]}>Vitals</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#9C27B0' }]} />
            <Text style={[styles.legendText, { color: colors.mutedText }]}>Mood</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#448AFF' }]} />
            <Text style={[styles.legendText, { color: colors.mutedText }]}>Interests</Text>
          </View>
        </View>

        {/* Data Summary */}
        <View style={styles.dataSummary}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.mutedText }]}>Last Updated:</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{new Date().toLocaleTimeString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.mutedText }]}>Active Nodes:</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{nodes.length}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t("wellnessReport")}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          {userData ? `${t("analysisFor")} ${userData.name}` : t("yourHealthOverview")}
        </Text>
      </View>



      <TouchableOpacity style={[styles.pdfButton, { backgroundColor: colors.primary }]} onPress={generatePDF}>
        <Ionicons name="download-outline" size={24} color="#fff" />
        <Text style={styles.pdfButtonText}>{t("downloadPDF")}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.pdfButton, { backgroundColor: '#25D366', marginTop: -10 }]}
        onPress={sendWhatsAppReport}
      >
        <Ionicons name="logo-whatsapp" size={24} color="#fff" />
        <Text style={styles.pdfButtonText}>{t("shareWhatsApp") || "Share Summary on WhatsApp"}</Text>
      </TouchableOpacity>


      {/* KNOWLEDGE GRAPH */}
      {renderKnowledgeGraph()}

      {/* RADAR CHART CARD */}
      <View style={[styles.graphCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{t("healthBalanceIndices")}</Text>
        <View style={{ alignItems: 'center', justifyContent: 'center', height: radarSize }}>
          <Svg height={radarSize} width={radarSize}>
            <Polygon points={buildRadarPolygon({ physical: 100, exercise: 100, social: 100, mental: 100, sleep: 100, diet: 100 })} stroke={colors.border} strokeWidth="1" fill="none" />
            <Polygon points={buildRadarPolygon({ physical: 50, exercise: 50, social: 50, mental: 50, sleep: 50, diet: 50 })} stroke={colors.border} strokeWidth="0.5" strokeDasharray="4,4" fill="none" />

            {METRICS.map((m, i) => {
              const { x, y } = getRadarCoordinates(100, i);
              return <Line key={i} x1={radarCenter} y1={radarCenter} x2={x} y2={y} stroke={colors.border} strokeWidth="1" />;
            })}

            <Polygon points={buildRadarPolygon(scores)} fill={colors.primary} fillOpacity="0.3" stroke={colors.primary} strokeWidth="2" />

            {METRICS.map((m, i) => {
              const { x, y } = getRadarCoordinates(scores[m.key as keyof typeof scores], i);
              return <Circle key={i} cx={x} cy={y} r="4" fill={colors.primary} />;
            })}

            {METRICS.map((m, i) => {
              const { x, y } = getRadarCoordinates(120, i);
              return <SvgText key={i} x={x} y={y} fill={colors.text} fontSize="11" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">{t(m.key)}</SvgText>;
            })}
          </Svg>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("smartInsights")}</Text>
        {scores.physical < 60 && (
          <View style={[styles.insightCard, { backgroundColor: colors.card, borderLeftColor: colors.warning }]}>
            <Ionicons name="walk-outline" size={24} color={colors.warning} />
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: colors.text }]}>{t("mobilityFocus")}</Text>
              <Text style={[styles.insightText, { color: colors.mutedText }]}>{t("mobilityInsight")}</Text>
            </View>
          </View>
        )}
        {scores.social < 60 && (
          <View style={[styles.insightCard, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
            <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} />
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: colors.text }]}>{t("socialActivity")}</Text>
              <Text style={[styles.insightText, { color: colors.mutedText }]}>{t("socialInsight")}</Text>
            </View>
          </View>
        )}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { marginBottom: 20, marginTop: 20 },
  title: { fontSize: 32, fontWeight: "bold" },
  subtitle: { fontSize: 16 },
  pdfButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, marginBottom: 24, elevation: 2 },
  pdfButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  kgCard: { borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 24, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardSubtitle: { fontSize: 14, marginBottom: 15, alignSelf: 'flex-start', fontStyle: 'italic' },
  kgLegend: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 10, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 12 },
  dataSummary: { marginTop: 15, width: '100%', paddingTop: 15, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  summaryLabel: { fontSize: 13, fontWeight: '500' },
  summaryValue: { fontSize: 13, fontWeight: 'bold' },
  graphCard: { borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 24, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, alignSelf: 'flex-start' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  insightCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4 },
  insightContent: { marginLeft: 16, flex: 1 },
  insightTitle: { fontSize: 16, fontWeight: 'bold' },
  insightText: { fontSize: 14, lineHeight: 20 }
});
