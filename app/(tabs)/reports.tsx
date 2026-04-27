import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router";
import * as Sharing from 'expo-sharing';
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Animated, Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View, TextInput } from "react-native";
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from "react-native-svg";
import { HealthCharts } from "../../components/HealthCharts";
import { ResponsiveView } from "../../components/ResponsiveView";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useFeatureFlags } from "../../hooks/useFeatureFlags";
import { useResponsive } from "../../hooks/useResponsive";
import { deviceService } from "../../services/api/device";
import { GraphData, graphService } from "../../services/api/graph";
import { profileService } from "../../services/api/profile";
import { sustainabilityService } from "../../services/api/sustainability";
import {
  computeImpact,
  getLocalSustainability,
  incrementLocalReports,
} from "../../utils/sustainabilityStorage";
import {
  getDiaryKey,
  getHealthMetricsKey,
  getProfileKey,
  getTicketsKey,
  getVitalSignsKey,
} from "../../utils/userStorageKeys";

const { width: staticWidth } = Dimensions.get("window");

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
  const { colors, theme, uiMode, fontSize } = useTheme();
  const { t } = useTranslation();
  const { user, requireAuth } = useAuth();
  const { isWeb, contentWidth } = useResponsive();
  const params = useLocalSearchParams();
  const targetUserId = (params.userId as string) || user?.id;

  const isSenior = uiMode === "senior";
  const width = isWeb ? contentWidth : staticWidth;


  const [userData, setUserData] = useState<any>(null);
  const [exerciseData, setExerciseData] = useState<any>(null);
  const [vitalSignsData, setVitalSignsData] = useState<any[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<any[]>([]);
  const [reportMetrics, setReportMetrics] = useState<any[]>([]);
  const [scores, setScores] = useState({
    physical: 65,
    social: 40,
    mental: 70,
    sleep: 80,
    diet: 55,
    exercise: 60
  });
  const [weeklyTrends, setWeeklyTrends] = useState<any>({
    avgSteps: 0,
    avgSleep: 0,
    avgHeartRate: 0,
    compliance: 0,
    weightTrend: 'stable'
  });
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [sustainabilityImpact, setSustainabilityImpact] = useState<{
    reportsGenerated: number;
    paperSavedSheets: number;
    carbonSavedKg: number;
    tripsAvoided: number;
    year: number;
    powerDraw?: number;
    solarActive?: boolean;
    devicesRecycled?: number;
  } | null>(null);
  const [remoteGraphData, setRemoteGraphData] = useState<GraphData | null>(null);
  const [streaks, setStreaks] = useState({ health: 0, steps: 0, medication: 0 });
  const [badges, setBadges] = useState<any[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Donation Modal State
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donationDate, setDonationDate] = useState("Tomorrow, 10:00 AM");
  const [donationAddress, setDonationAddress] = useState((user as any)?.address || "");
  const [donationDevice, setDonationDevice] = useState("");
  const [recentAlerts, setRecentAlerts] = useState<any[]>([
    { id: '1', type: 'Fall Detected', user: 'George Miller', time: '10m ago', status: 'Handled' },
    { id: '2', type: 'SOS Button', user: 'Martha Stewart', time: '1h ago', status: 'Active' },
  ]);

  const [systemStats, setSystemStats] = useState({
    totalUsers: 124,
    activeElders: 86,
    alertsLast24h: 3,
    avgCompliance: 92
  });

  const flags = useFeatureFlags(["download_reports", "advanced_trends", "ai_health_insights", "nostalgia_service"]);
  const { usePremiumFeature } = require("../../hooks/useFeatureFlags");
  const hasSubscription = usePremiumFeature();
  const canDownload = hasSubscription || flags.download_reports?.enabled;
  const showAdvancedTrends = flags.advanced_trends?.enabled || false;
  const showAiInsights = flags.ai_health_insights?.enabled || false;
  const showNostalgia = flags.nostalgia_service?.enabled || false;

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
      loadSustainabilityImpact();
      loadGraphData();
      loadGamificationData();
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }, [user?.id])
  );

  const loadSustainabilityImpact = async () => {
    const userId = targetUserId;
    if (!userId) {
      const savedUser = await AsyncStorage.getItem("user_session");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed?.id) {
            const local = await getLocalSustainability(parsed.id);
            setSustainabilityImpact(computeImpact(local));
          }
        } catch (_) { }
      }
      return;
    }
    try {
      const res: any = await sustainabilityService.getUserImpact(userId);
      if (res?.data) {
        setSustainabilityImpact(res.data);
      } else {
        const local = await getLocalSustainability(userId);
        setSustainabilityImpact(computeImpact(local));
      }
    } catch (_) {
      const local = await getLocalSustainability(userId);
      setSustainabilityImpact(computeImpact(local));
    }
  };

  const loadGraphData = async () => {
    try {
      const savedUser = await AsyncStorage.getItem("user_session");
      const sessionData = savedUser ? JSON.parse(savedUser) : null;
      const userId = targetUserId || sessionData?.id;
      if (userId) {
        const gData = await graphService.getUserGraph(userId);
        if (gData && gData.nodes && gData.nodes.length > 0) {
          setRemoteGraphData(gData);
        }
      }
    } catch (error) {
      console.error("Failed to load graph data:", error);
    }
  };

  const loadGamificationData = async () => {
    try {
      const savedUser = await AsyncStorage.getItem("user_session");
      const sessionData = savedUser ? JSON.parse(savedUser) : null;
      const userId = targetUserId || sessionData?.id;

      if (userId) {
        const streaksRes: any = await profileService.getStreaks(userId);
        if (streaksRes?.data?.streaks) {
          setStreaks(streaksRes.data.streaks);
        }

        const achievementsRes: any = await profileService.getAchievements(userId);
        if (achievementsRes?.data?.achievements) {
          setBadges(achievementsRes.data.achievements);
        }
      }
    } catch (error) {
      console.error("Failed to load gamification data:", error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const savedUser = await AsyncStorage.getItem("user_session");
      const sessionData = savedUser ? JSON.parse(savedUser) : null;
      const userId = targetUserId || sessionData?.id;

      const profileKey = userId ? getProfileKey(userId) : "user_profile_data";
      const ticketsKey = userId ? getTicketsKey(userId) : "user_tickets";
      const diaryKey = userId ? getDiaryKey(userId) : "user_diary_entries";
      const healthKey = userId ? getHealthMetricsKey(userId) : "health_metrics";
      const vitalsKey = userId ? getVitalSignsKey(userId) : "vital_signs";

      // Try fetching from API first, then fallback to AsyncStorage
      let activeProfileData = null;

      if (userId) {
        try {
          const apiResponse: any = await graphService.getUserGraph(userId); // This triggers a sync
          const profileResponse: any = await profileService.getProfile(userId);
          if (profileResponse?.data?.profile) {
            activeProfileData = profileResponse.data.profile;
            await AsyncStorage.setItem(profileKey, JSON.stringify(activeProfileData));
          }
        } catch (apiError) {
          console.log("Failed to fetch profile from API, using local storage", apiError);
        }
      }

      if (!activeProfileData) {
        const storedProfile = await AsyncStorage.getItem(profileKey);
        if (storedProfile) {
          activeProfileData = JSON.parse(storedProfile);
        }
      }

      const tickets = await AsyncStorage.getItem(ticketsKey);
      const diary = await AsyncStorage.getItem(diaryKey);
      const healthMetrics = await AsyncStorage.getItem(healthKey);
      const vitalSigns = await AsyncStorage.getItem(vitalsKey);

      let calculatedScores = {
        physical: 65,
        social: 40,
        mental: 70,
        sleep: 80,
        diet: 55,
        exercise: 60
      };

      if (activeProfileData) {
        setUserData(activeProfileData);

        // 1. Process Profile (Base Scores)
        if (activeProfileData.interests) {
          calculatedScores.social = Math.min(85, 30 + (activeProfileData.interests.length * 5));
        }

        if (activeProfileData.mobilityLevel) {
          if (activeProfileData.mobilityLevel === "Independent") calculatedScores.physical = 85;
          else if (activeProfileData.mobilityLevel === "Uses Cane") calculatedScores.physical = 70;
          else if (activeProfileData.mobilityLevel === "Uses Walker") calculatedScores.physical = 55;
          else calculatedScores.physical = 40;
        }

        if (activeProfileData.activityLevel) {
          const activityBoost = { Sedentary: 0, "Light Activity": 5, "Moderate Activity": 15, "Very Active": 25 };
          calculatedScores.physical = Math.min(100, calculatedScores.physical + (activityBoost[activeProfileData.activityLevel as keyof typeof activityBoost] || 0));
        }

        if (activeProfileData.dietaryPreferences && activeProfileData.dietaryPreferences.length > 0) {
          calculatedScores.diet = Math.min(95, 60 + (activeProfileData.dietaryPreferences.length * 5));
        }
      } else {
        // Use mock profile data
        const mockData = {
          name: "Demo User",
          age: 65,
          interests: ["Reading", "Gardening", "Walking"],
          conditions: ["Hypertension"],
          emergencyContacts: [{ name: "John Doe", phone: "555-0123", relation: "Son" }],
          mobilityLevel: "Independent",
          activityLevel: "Moderate Activity",
          phone: "+15550000000",
          dietaryPreferences: ["Vegetarian", "Low Sodium"]
        };
        setUserData(mockData);
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
      // 4. Process Health Metrics (Exercise & Sleep) - REAL DATA
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const [metricsRes, complianceRes, medsRes]: any = await Promise.all([
          profileService.getMetricsRange(userId, startDate.toISOString(), endDate.toISOString()),
          profileService.getComplianceReport(userId, 7),
          profileService.getMedications(userId)
        ]);

        if (medsRes?.data?.medications) {
          setUserData((prev: any) => ({ ...prev, medications: medsRes.data.medications }));
        }

        if (metricsRes?.data?.metrics) {
          const metrics = metricsRes.data.metrics;
          setReportMetrics(metrics);

          // Calculate Scores based on last 7 days average vs Targets
          const last7 = metrics.slice(-7);
          const avgSteps = last7.reduce((acc: number, m: any) => acc + (Number(m.steps) || 0), 0) / (last7.length || 1);
          const avgSleep = last7.reduce((acc: number, m: any) => acc + (Number(m.sleepHours) || 0), 0) / (last7.length || 1);

          // Exercise Score (Target 6000 steps)
          calculatedScores.exercise = Math.min(100, Math.round((avgSteps / 6000) * 100));

          // Sleep Score (Target 7-9 hours)
          calculatedScores.sleep = avgSleep >= 7 && avgSleep <= 9 ? 100 : Math.max(40, 100 - (Math.abs(8 - avgSleep) * 20));

          // Set detail data for modal
          setExerciseData([{ history: metrics.map((m: any) => ({ date: m.date, value: m.steps })) }]);

          // 6. Generate Weekly Trends (Real Data)
          const avgHR = last7.reduce((acc: number, m: any) => acc + (Number(m.heartRate) || 0), 0) / (last7.length || 1);

          setWeeklyTrends({
            avgSteps: Math.round(avgSteps),
            avgSleep: avgSleep.toFixed(1),
            avgHeartRate: Math.round(avgHR),
            compliance: Math.round(complianceRes?.overallCompliance || 0),
            weightTrend: 'stable' // Can be derived if weight history exists
          });
        }
      } catch (e) {
        console.log("Error loading metrics:", e);
      }

      // 5. Process Vital Signs - REAL DATA
      if (userId) {
        try {
          const vitalsRes: any = await deviceService.getVitals(userId, { limit: 5 });
          if (vitalsRes?.data?.vitals) {
            setVitalSignsData(vitalsRes.data.vitals);
          }
        } catch (e) { console.log("Error loading vitals:", e); }
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
            { text: t("upgradeNow"), onPress: () => router.push("/settings" as any) }
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
            body { font-family: 'Times New Roman', serif; padding: 50px; color: #000; line-height: 1.4; }
            .header-row { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
            .meta { text-align: right; font-size: 12px; }
            .title { text-align: center; font-size: 22px; font-weight: bold; margin: 30px 0; text-decoration: underline; text-underline-offset: 5px; }
            
            .section { margin-bottom: 30px; }
            .section-header { font-size: 16px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px; text-transform: uppercase; }
            
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px; }
            .info-item { display: flex; }
            .info-label { font-weight: bold; width: 140px; }
            
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; }
            
            .vitals-summary { display: flex; justify-content: space-between; margin-bottom: 20px; border: 1px solid #000; padding: 15px; background: #fafafa; }
            .vital-box { text-align: center; }
            .vital-val { font-size: 18px; font-weight: bold; display: block; }
            .vital-lbl { font-size: 11px; text-transform: uppercase; }
            
            .notes-area { border: 1px solid #ccc; height: 100px; padding: 10px; font-style: italic; color: #666; margin-top: 10px; }
            
            .footer { margin-top: 50px; border-top: 1px solid #000; padding-top: 10px; font-size: 10px; display: flex; justify-content: space-between; }
            .signature-line { margin-top: 60px; border-top: 1px solid #000; width: 250px; text-align: center; font-size: 12px; float: right; }
          </style>
        </head>
        <body>
          <div class="header-row">
            <div class="logo">ElderConnect Health</div>
            <div class="meta">
               <div>Report ID: #${Math.floor(Math.random() * 1000000)}</div>
               <div>Date: ${new Date().toLocaleDateString()}</div>
               <div>Generated By: Dr. AI (Automated)</div>
            </div>
          </div>
          
          <div class="title">COMPREHENSIVE MEDICAL REPORT</div>

          <div class="section">
            <div class="section-header">Patient Demographics</div>
            <div class="info-grid">
               <div class="info-item"><div class="info-label">Patient Name:</div> <div>${user?.name || userData.name}</div></div>
               <div class="info-item"><div class="info-label">Age/Gender:</div> <div>${userData.age || 'N/A'} / ${userData.gender || '-'}</div></div>
               <div class="info-item"><div class="info-label">Patient ID:</div> <div>${user?.id?.substring(0, 8).toUpperCase() || '-'}</div></div>
               <div class="info-item"><div class="info-label">Blood Type:</div> <div>${userData.bloodType || 'Unknown'}</div></div>
               <div class="info-item"><div class="info-label">Primary Physician:</div> <div>${userData.physician || 'Not Assigned'}</div></div>
               <div class="info-item"><div class="info-label">Contact:</div> <div>${userData.phone || 'N/A'}</div></div>
            </div>
          </div>

          <div class="section">
             <div class="section-header">Clinical Vitals Summary</div>
             <div class="vitals-summary">
                <div class="vital-box"><span class="vital-val">${weeklyTrends.avgHeartRate} BPM</span><span class="vital-lbl">Avg Heart Rate</span></div>
                <div class="vital-box"><span class="vital-val">${userData.bloodPressure || '120/80'}</span><span class="vital-lbl">Blood Pressure</span></div>
                <div class="vital-box"><span class="vital-val">${userData.weight || 'N/A'} kg</span><span class="vital-lbl">Weight</span></div>
                <div class="vital-box"><span class="vital-val">${weeklyTrends.avgSteps}</span><span class="vital-lbl">Avg Daily Steps</span></div>
                <div class="vital-box"><span class="vital-val">${weeklyTrends.avgSleep} hrs</span><span class="vital-lbl">Avg Sleep</span></div>
             </div>
          </div>

          <div class="section">
             <div class="section-header">Last 7 Days Metrics History</div>
             <table>
                <thead>
                   <tr>
                      <th>Date</th>
                      <th>Steps</th>
                      <th>Heart Rate (Avg)</th>
                      <th>Sleep (Hrs)</th>
                      <th>Water (Glasses)</th>
                   </tr>
                </thead>
                <tbody>
                   ${reportMetrics.slice(-7).reverse().map((m: any) => `
                      <tr>
                         <td>${new Date(m.date).toLocaleDateString()}</td>
                         <td>${m.steps || '-'}</td>
                         <td>${m.heartRate || '-'}</td>
                         <td>${m.sleepHours || '-'}</td>
                         <td>${m.waterIntake || '-'}</td>
                      </tr>
                   `).join('') || '<tr><td colspan="5">No recent data recorded.</td></tr>'}
                </tbody>
             </table>
          </div>

          <div class="section">
             <div class="section-header">Medication Adherence</div>
             <div class="info-item" style="margin-bottom: 10px;">
                <div class="info-label">Weekly Compliance:</div>
                <div>${weeklyTrends.compliance}%</div>
             </div>
             <table>
                <thead>
                   <tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Status</th></tr>
                </thead>
                <tbody>
                   ${userData.medications?.map((m: any) => `
                      <tr>
                         <td>${m.name}</td>
                         <td>${m.dosage}</td>
                         <td>${m.frequency}</td>
                         <td>Active</td>
                      </tr>
                   `).join('') || '<tr><td colspan="4">No active medications.</td></tr>'}
                </tbody>
             </table>
          </div>

          <div class="section">
             <div class="section-header">Clinical Notes / Observations</div>
             <div class="notes-area">
                Patient metrics indicate ${scores.physical > 60 ? 'good' : 'low'} physical activity levels. 
                Sleep patterns are ${weeklyTrends.avgSleep > 6 ? 'adequate' : 'irregular'}. 
                Medication compliance is ${weeklyTrends.compliance > 80 ? 'excellent' : 'optimal'}.
                <br/><br/>
                Signed: ___________________________________
             </div>
          </div>

          <div class="signature-line">
             Authorized Signature<br/>
             ${new Date().toLocaleDateString()}
          </div>
          <div style="clear: both;"></div>

          <div class="footer">
             <div>CONFIDENTIAL - This document contains private medical information.</div>
             <div>Page 1 of 1</div>
          </div>
        </body>
      </html>
    `;

      try {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        const savedUser = await AsyncStorage.getItem("user_session");
        const uid = user?.id || (savedUser ? JSON.parse(savedUser)?.id : null);
        if (uid) {
          await incrementLocalReports(uid, 1);
          try {
            await sustainabilityService.trackReport(uid, 1);
          } catch (_) { }
          loadSustainabilityImpact();
        }
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Failed to generate or share report.");
      }
    });
  };

  const getDetailContent = () => {
    if (!selectedNode) return null;

    switch (selectedNode.type) {
      case 'exercise':
        return (
          <View>
            <Text style={styles.modalTitle}>{t("exerciseDetails") || "Exercise Details"}</Text>
            <View style={styles.modalRow}>
              <Ionicons name="footsteps" size={24} color={selectedNode.color} />
              <Text style={styles.modalValue}>{selectedNode.label}</Text>
            </View>
            <Text style={styles.modalSubtext}>
              {selectedNode.sublabel === 'Steps'
                ? "Daily step count target: 8000"
                : "Recommended active minutes: 30-60m"}
            </Text>
            {exerciseData && (
              <View style={styles.historyContainer}>
                <Text style={styles.historyTitle}>Recent History:</Text>
                {exerciseData[0]?.history?.slice(0, 3).map((h: any, i: number) => (
                  <View key={i} style={styles.historyRow}>
                    <Text style={styles.historyDate}>{new Date(h.date).toLocaleDateString()}</Text>
                    <Text style={styles.historyVal}>{h.value}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      case 'vital':
        return (
          <View>
            <Text style={styles.modalTitle}>{selectedNode.sublabel}</Text>
            <View style={styles.modalRow}>
              <Ionicons name="pulse" size={24} color={selectedNode.color} />
              <Text style={styles.modalValue}>{selectedNode.label}</Text>
            </View>
            <View style={[styles.statusBadge, {
              backgroundColor: selectedNode.status === 'normal' ? colors.success + '20' : colors.error + '20'
            }]}>
              <Text style={[styles.statusText, {
                color: selectedNode.status === 'normal' ? colors.success : colors.error
              }]}>
                {selectedNode.status?.toUpperCase() || 'NORMAL'}
              </Text>
            </View>
            <Text style={styles.modalSubtext}>Last recorded: Today</Text>
          </View>
        );
      case 'mood':
        const latestEntry = diaryEntries[0];
        return (
          <View>
            <Text style={styles.modalTitle}>{t("emotionalStatus") || "Emotional Status"}</Text>
            <View style={styles.modalRow}>
              <Text style={{ fontSize: 40 }}>{selectedNode.label}</Text>
              <Text style={[styles.modalValue, { marginLeft: 10 }]}>{selectedNode.sublabel}</Text>
            </View>
            {latestEntry && (
              <View style={[styles.noteContainer, { backgroundColor: colors.background }]}>
                <Text style={styles.noteText}>"{latestEntry.notes}"</Text>
                <Text style={styles.noteDate}>{new Date(latestEntry.date).toLocaleDateString()}</Text>
              </View>
            )}
          </View>
        );
      case 'summary':
        return (
          <View>
            <Text style={styles.modalTitle}>{t("healthScore") || "Health Score"}</Text>
            <View style={styles.modalRow}>
              <View style={[styles.scoreCircle, { borderColor: selectedNode.color }]}>
                <Text style={[styles.scoreText, { color: selectedNode.color }]}>{selectedNode.label}</Text>
              </View>
            </View>
            <Text style={styles.modalSubtext}>Combined score from physical, mental, and social metrics.</Text>
          </View>
        );
      default:
        return (
          <View>
            <Text style={styles.modalTitle}>{selectedNode.label}</Text>
            <Text style={styles.modalSubtext}>{selectedNode.sublabel || selectedNode.type}</Text>
          </View>
        );
    }
  };


  // --- RADAR CHART LOGIC ---
  const responsiveWidth = isWeb ? (contentWidth / 2) - 40 : width;
  const radarSize = Math.min(responsiveWidth - 60, 400);
  const radarCenter = radarSize / 2;
  const radarRadius = (radarSize - 120) / 2;
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
  const kgSize = Math.min(responsiveWidth - 40, 400);
  const kgCenter = kgSize / 2;

  const renderKnowledgeGraph = (inRow?: boolean) => {
    if (!userData) return null;

    const onNodePress = (node: any) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectedNode(node);
    };

    const nodes: any[] = [];
    if (remoteGraphData?.nodes && remoteGraphData.nodes.length > 0) {
      remoteGraphData.nodes.forEach(node => nodes.push({ ...node, color: node.color || colors.primary }));
    } else {
      nodes.push({ id: 'User', label: (user?.name || userData.name)?.split(" ")[0] || 'User', type: 'main', color: colors.primary });
      const avgScore = Math.round((scores.physical + scores.social + scores.mental + scores.sleep + scores.diet + scores.exercise) / 6);
      nodes.push({
        id: 'health_summary',
        label: `${avgScore}%`,
        sublabel: 'Overall',
        type: 'summary',
        color: avgScore > 70 ? '#4CAF50' : avgScore > 50 ? '#FFC107' : '#FF5252'
      });
    }

    const nodeDist = kgSize / 3.5;
    return (
      <View style={[styles.kgCard, inRow && styles.graphCardInRow, { backgroundColor: theme === 'dark' ? colors.background : colors.card, borderColor: theme === 'dark' ? '#2C2C2E' : 'rgba(0,0,0,0.1)' }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{t("dataKnowledgeGraph") || "Data Knowledge Graph"}</Text>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: fadeAnim }], marginVertical: 15 }}>
          <Svg height={kgSize} width={kgSize}>
            {nodes.map((node, i) => {
              let nx = kgCenter, ny = kgCenter;
              if (i > 0) {
                const angle = (i - 1) * ((Math.PI * 2) / (nodes.length - 1));
                nx = kgCenter + nodeDist * Math.cos(angle);
                ny = kgCenter + nodeDist * Math.sin(angle);
              }
              const r = i === 0 ? 40 : 30;
              return (
                <G key={node.id} onPress={() => onNodePress(node)}>
                  <Circle cx={nx} cy={ny} r={r} fill={node.color} opacity={0.9} />
                  <SvgText x={nx} y={ny} fill="#fff" fontSize={11} fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">{node.label}</SvgText>
                </G>
              );
            })}
          </Svg>
        </Animated.View>
      </View>
    );
  };

  const getFontSize = (base: number) => {
    const scales: any = { small: 0.9, medium: 1, large: 1.2, extraLarge: 1.5 };
    return base * (scales[fontSize] || 1);
  };

  if (user?.roles?.includes('admin')) {
    return (
      <ResponsiveView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.adminHeader}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>Admin Command Center</Text>
            <Text style={[styles.pageSubtitle, { color: colors.mutedText }]}>System-wide analytics and safety monitoring</Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Ionicons name="people" size={24} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{systemStats.totalUsers}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>Total Users</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Ionicons name="warning" size={24} color={colors.error} />
              <Text style={[styles.statValue, { color: colors.text }]}>{systemStats.alertsLast24h}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>Alerts (24h)</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.text }]}>{systemStats.avgCompliance}%</Text>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>Med Compliance</Text>
            </View>
          </View>

          {/* Recent Alerts */}
          <View style={styles.adminSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Safety Alerts</Text>
            {recentAlerts.map(alert => (
              <View key={alert.id} style={[styles.alertCard, { backgroundColor: colors.card, borderLeftColor: alert.status === 'Active' ? colors.error : colors.success }]}>
                <View style={styles.alertMain}>
                  <Text style={[styles.alertType, { color: colors.text }]}>{alert.type}</Text>
                  <Text style={[styles.alertUser, { color: colors.mutedText }]}>{alert.user} • {alert.time}</Text>
                </View>
                <View style={[styles.alertStatus, { backgroundColor: alert.status === 'Active' ? colors.error + '20' : colors.success + '20' }]}>
                  <Text style={{ color: alert.status === 'Active' ? colors.error : colors.success, fontWeight: 'bold' }}>{alert.status}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* User Management Quick Action */}
          <TouchableOpacity style={[styles.adminAction, { backgroundColor: colors.primary }]}>
            <Ionicons name="person-add" size={20} color="#FFF" />
            <Text style={styles.adminActionText}>Manage User Access</Text>
          </TouchableOpacity>
        </ScrollView>
      </ResponsiveView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Modal
        animationType="fade"
        transparent={true}
        visible={!!selectedNode}
        onRequestClose={() => setSelectedNode(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedNode(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                {getDetailContent()}
                <Pressable
                  style={{ marginTop: 20, padding: 10 }}
                  onPress={() => setSelectedNode(null)}
                >
                  <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Close</Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDonationModal}
        onRequestClose={() => setShowDonationModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDonationModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { width: '90%', backgroundColor: colors.card }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 }}>
                  <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 0 }]}>Schedule E-Waste Pickup</Text>
                  <TouchableOpacity onPress={() => setShowDonationModal(false)}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.modalSubtext, { textAlign: 'left', alignSelf: 'flex-start', marginBottom: 5 }]}>Device Type</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. Broken Smartwatch, Old Phone"
                  placeholderTextColor={colors.mutedText}
                  value={donationDevice}
                  onChangeText={setDonationDevice}
                />

                <Text style={[styles.modalSubtext, { textAlign: 'left', alignSelf: 'flex-start', marginBottom: 5 }]}>Pickup Address</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  placeholder="Enter your full address"
                  placeholderTextColor={colors.mutedText}
                  value={donationAddress}
                  onChangeText={setDonationAddress}
                />

                <Text style={[styles.modalSubtext, { textAlign: 'left', alignSelf: 'flex-start', marginBottom: 5 }]}>Preferred Time</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. Next Monday, 2:00 PM"
                  placeholderTextColor={colors.mutedText}
                  value={donationDate}
                  onChangeText={setDonationDate}
                />

                <TouchableOpacity
                  style={{ backgroundColor: colors.primary, padding: 15, borderRadius: 12, width: '100%', alignItems: 'center', marginTop: 10 }}
                  onPress={() => {
                    if (!donationAddress || !donationDevice) {
                      Alert.alert("Missing Details", "Please provide a device type and address.");
                      return;
                    }
                    setShowDonationModal(false);
                    // Reset fields
                    setDonationDevice("");
                    Alert.alert('Pickup Confirmed!', `Our team will collect your ${donationDevice} at ${donationAddress} on ${donationDate}. Thank you for supporting our E-Waste reduction!`);
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Confirm Pickup</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text, fontSize: getFontSize(24) }]}>{t("healthReports")}</Text>
            <Text style={[styles.subtitle, { color: colors.mutedText, fontSize: getFontSize(16) }]}>{t("yourActivitySummary")}</Text>
          </View>
          <TouchableOpacity
            style={[styles.downloadButton, { backgroundColor: colors.primary + '15' }]}
            onPress={generatePDF}
          >
            <Ionicons name="download-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {showAdvancedTrends && (
          <TouchableOpacity
            style={[styles.pdfButton, { backgroundColor: colors.secondary || '#6366f1', marginTop: -10 }]}
            onPress={() => router.push("/AnalyticsDashboard")}
          >
            <Ionicons name="trending-up" size={24} color="#fff" />
            <Text style={styles.pdfButtonText}>{t("viewTrends") || "View Trends Dashboard"}</Text>
          </TouchableOpacity>
        )}




        {/* KNOWLEDGE GRAPH + HEALTH INDICES (side by side on web) */}
        {
          isWeb ? (
            <View style={styles.kgRadarRow}>
              <View style={styles.kgRadarHalf}>{renderKnowledgeGraph(true)}</View>
              <View style={styles.kgRadarHalf}>
                <View style={[styles.graphCard, styles.graphCardInRow, { backgroundColor: theme === 'dark' ? '#1C1C1E' : colors.card, borderColor: theme === 'dark' ? '#2C2C2E' : 'rgba(0,0,0,0.1)', overflow: 'hidden' }]}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{t("healthBalanceIndices")}</Text>
                  <View style={{ alignItems: 'center', justifyContent: 'center', height: radarSize, width: '100%', overflow: 'hidden' }}>
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
              </View>
            </View>
          ) : (
            <>
              {renderKnowledgeGraph(false)}
              <View style={[styles.graphCard, { backgroundColor: theme === 'dark' ? '#1C1C1E' : colors.card, borderColor: theme === 'dark' ? '#2C2C2E' : 'rgba(0,0,0,0.1)', overflow: 'hidden' }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t("healthBalanceIndices")}</Text>
                <View style={{ alignItems: 'center', justifyContent: 'center', height: radarSize, width: '100%', overflow: 'hidden' }}>
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
            </>
          )
        }


        {
          sustainabilityImpact && (
            <View style={[styles.impactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View>
                  <Text style={[styles.impactTitle, { color: colors.text }]}>{t("yourImpact") || "Sustainability & Carbon Ledger"}</Text>
                  <Text style={[styles.impactSubtitle, { color: colors.mutedText, marginBottom: 0 }]}>
                    {t("digitalCareSaved") || "Your digital care saved"} {sustainabilityImpact.carbonSavedKg} kg CO2 {t("thisYear") || "this year"}
                  </Text>
                </View>
                <Ionicons name="leaf" size={28} color="#22C55E" />
              </View>

              <View style={styles.impactGrid}>
                <View style={[styles.impactItem, { backgroundColor: colors.background }]}>
                  <Ionicons name="cloud-offline-outline" size={20} color="#22C55E" />
                  <Text style={[styles.impactValue, { color: colors.text }]}>{sustainabilityImpact?.carbonSavedKg} kg</Text>
                  <Text style={[styles.impactLabel, { color: colors.mutedText, textAlign: 'center' }]}>{t("co2Saved") || "CO2 Tracked & Saved"}</Text>
                </View>
                <View style={[styles.impactItem, { backgroundColor: colors.background }]}>
                  <Ionicons name="hardware-chip-outline" size={20} color="#3B82F6" />
                  <Text style={[styles.impactValue, { color: colors.text }]}>
                    {sustainabilityImpact.powerDraw ? `${sustainabilityImpact.powerDraw} W` : '0.42 W'}
                  </Text>
                  <Text style={[styles.impactLabel, { color: colors.mutedText, textAlign: 'center' }]}>Avg Device Power Draw</Text>
                </View>
                <View style={[styles.impactItem, { backgroundColor: colors.background }]}>
                  <Ionicons name="sunny-outline" size={20} color={sustainabilityImpact.solarActive ? "#F59E0B" : "#9CA3AF"} />
                  <Text style={[styles.impactValue, { color: colors.text }]}>
                    {sustainabilityImpact.solarActive ? 'Active' : 'Standby'}
                  </Text>
                  <Text style={[styles.impactLabel, { color: colors.mutedText, textAlign: 'center' }]}>Solar Charging Mode</Text>
                </View>
              </View>

              <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
                <Text style={[styles.impactTitle, { fontSize: 16, color: colors.text }]}>Community Impact: E-Waste Reduction</Text>
                <Text style={[styles.impactSubtitle, { color: colors.mutedText, fontSize: 12, marginBottom: 12 }]}>
                  Help us reduce E-Waste! Our devices are 90% modular and recyclable. Got an old wearable?
                </Text>
                <TouchableOpacity
                  style={{ backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' }}
                  onPress={() => setShowDonationModal(true)}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Schedule Device Donation Pickup</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        }

        {/* ACHIEVEMENTS & GAMIFICATION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("achievements") || "Achievements & Streaks"}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            <View style={[styles.streakCard, { backgroundColor: colors.card, borderColor: '#FFB300' }]}>
              <View style={styles.streakHeader}>
                <Ionicons name="flame" size={24} color="#FF9800" />
                <Text style={[styles.streakValue, { color: colors.text }]}>{streaks.medication} Days</Text>
              </View>
              <Text style={[styles.streakLabel, { color: colors.mutedText }]}>Medication Streak</Text>
            </View>

            <View style={[styles.streakCard, { backgroundColor: colors.card, borderColor: '#4CAF50' }]}>
              <View style={styles.streakHeader}>
                <Ionicons name="footsteps" size={24} color="#4CAF50" />
                <Text style={[styles.streakValue, { color: colors.text }]}>{streaks.steps} Days</Text>
              </View>
              <Text style={[styles.streakLabel, { color: colors.mutedText }]}>Active Streak</Text>
            </View>

            <View style={[styles.streakCard, { backgroundColor: colors.card, borderColor: '#2196F3' }]}>
              <View style={styles.streakHeader}>
                <Ionicons name="shield-checkmark" size={24} color="#2196F3" />
                <Text style={[styles.streakValue, { color: colors.text }]}>{streaks.health} Days</Text>
              </View>
              <Text style={[styles.streakLabel, { color: colors.mutedText }]}>Perfect Week</Text>
            </View>
          </ScrollView>

          <View style={styles.badgesContainer}>
            {badges.map((badge) => (
              <TouchableOpacity
                key={badge.id}
                style={[
                  styles.badgeIconBox,
                  { backgroundColor: colors.card },
                  isWeb && { width: (width - 60) / 3 },
                ]}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  Alert.alert(badge.name, `Earned on ${new Date(badge.date).toLocaleDateString()}`);
                }}
              >
                <View style={[styles.badgeInner, { backgroundColor: badge.color + '20' }]}>
                  <Ionicons name={badge.icon as any} size={28} color={badge.color} />
                </View>
                <Text style={[styles.badgeName, { color: colors.text }]} numberOfLines={1}>{badge.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* WEEKLY TRENDS SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("last7DaysImportantValues") || "Last 7 Days Important Values"}</Text>
          <View style={styles.trendsGrid}>
            <View style={[styles.trendCard, { backgroundColor: colors.card }, isWeb && { width: '48%', marginBottom: 16 }]}>
              <Ionicons name="walk" size={24} color={colors.primary} />
              <Text style={[styles.trendValue, { color: colors.text }]}>{weeklyTrends.avgSteps}</Text>
              <Text style={[styles.trendLabel, { color: colors.mutedText }]}>Avg Steps/Day</Text>
            </View>
            <View style={[styles.trendCard, { backgroundColor: colors.card }, isWeb && { width: '48%', marginBottom: 16 }]}>
              <Ionicons name="moon" size={24} color={colors.info} />
              <Text style={[styles.trendValue, { color: colors.text }]}>{weeklyTrends.avgSleep}h</Text>
              <Text style={[styles.trendLabel, { color: colors.mutedText }]}>Avg Sleep</Text>
            </View>
            <View style={[styles.trendCard, { backgroundColor: colors.card }, isWeb && { width: '48%', marginBottom: 16 }]}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text style={[styles.trendValue, { color: colors.text }]}>{weeklyTrends.compliance}%</Text>
              <Text style={[styles.trendLabel, { color: colors.mutedText }]}>Compliance</Text>
            </View>
            <View style={[styles.trendCard, { backgroundColor: colors.card }, isWeb && { width: '48%', marginBottom: 16 }]}>
              <Ionicons name="heart" size={24} color={colors.error} />
              <Text style={[styles.trendValue, { color: colors.text }]}>{weeklyTrends.avgHeartRate}</Text>
              <Text style={[styles.trendLabel, { color: colors.mutedText }]}>Avg Heart Rate</Text>
            </View>
          </View>
          <View style={{ marginTop: 24 }}>
            <HealthCharts userId={user?.id || userData?.id || ""} />
          </View>
        </View>

        {/* DIGITAL LEGACY TIMELINE */}
        {showNostalgia && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Digital Legacy</Text>
            <TouchableOpacity
              style={[styles.impactCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary, alignItems: 'center', paddingVertical: 25 }]}
              onPress={() => router.push({ pathname: "/memory-timeline" as any, params: { userId: targetUserId } })}
            >
              <Ionicons name="library" size={40} color={colors.primary} style={{ marginBottom: 10 }} />
              <Text style={[styles.impactTitle, { color: colors.text, fontSize: 18 }]}>View Memory Archive</Text>
              <Text style={[styles.impactSubtitle, { color: colors.mutedText, textAlign: 'center', marginTop: 5 }]}>
                Listen to the life stories and memories recorded by {userData?.name?.split(" ")[0] || "this elder"}.
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {showAiInsights && (
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
        )}
        <View style={{ height: 40 }} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontWeight: "bold" },
  subtitle: { marginTop: 4 },
  downloadButton: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },

  // Admin Styles
  adminHeader: { marginBottom: 30 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 6 },
  pageSubtitle: { fontSize: 16 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statCard: { flex: 1, padding: 16, borderRadius: 16, marginRight: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  statValue: { fontSize: 22, fontWeight: 'bold', marginVertical: 4 },
  statLabel: { fontSize: 12 },
  adminSection: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  alertCard: { flexDirection: 'row', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, alignItems: 'center', justifyContent: 'space-between' },
  alertMain: { flex: 1 },
  alertType: { fontSize: 16, fontWeight: 'bold' },
  alertUser: { fontSize: 14, marginTop: 2 },
  alertStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  adminAction: { flexDirection: 'row', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  adminActionText: { color: '#FFF', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },

  // Existing Styles
  responsiveContent: { paddingHorizontal: 20 },
  impactCard: { borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1 },
  impactTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  impactSubtitle: { fontSize: 14, marginBottom: 12 },
  impactGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  impactItem: { width: "48%", padding: 12, borderRadius: 12, marginBottom: 16, alignItems: "center" },
  impactLabel: { fontSize: 12, marginTop: 4, textAlign: "center" },
  impactValue: { fontSize: 18, fontWeight: "bold" },
  pdfButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 12, marginBottom: 24 },
  pdfButtonText: { color: "#fff", fontWeight: "bold", marginLeft: 8, fontSize: 16 },
  graphCard: { padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, alignItems: "center" },
  graphCardInRow: { marginBottom: 0, height: '100%', flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 4, alignSelf: 'flex-start' },
  cardSubtitle: { fontSize: 14, marginBottom: 16, alignSelf: 'flex-start' },
  kgCard: { padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, alignItems: "center" },
  kgLegend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", marginHorizontal: 8, marginVertical: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { fontSize: 11 },
  dataSummary: { width: "100%", padding: 12, borderTopWidth: 1, marginTop: 15 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  summaryLabel: { fontSize: 11 },
  summaryValue: { fontSize: 11, fontWeight: "bold" },
  kgRadarRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  kgRadarHalf: { width: '48.5%' },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { width: "100%", borderRadius: 20, padding: 24, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  modalRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  modalValue: { fontSize: 28, fontWeight: "bold", marginLeft: 12 },
  modalSubtext: { fontSize: 14, textAlign: "center" },
  scoreCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 8, justifyContent: "center", alignItems: "center" },
  scoreText: { fontSize: 24, fontWeight: "bold" },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
  statusText: { fontSize: 12, fontWeight: "bold" },
  noteContainer: { padding: 16, borderRadius: 12, marginTop: 16, width: "100%" },
  noteText: { fontSize: 14, fontStyle: "italic" },
  noteDate: { fontSize: 11, color: "#8E8E93", marginTop: 8, textAlign: "right" },
  historyContainer: { width: "100%", marginTop: 20 },
  historyTitle: { fontSize: 14, fontWeight: "bold", marginBottom: 8 },
  historyRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#E5E5EA" },
  historyDate: { fontSize: 13 },
  historyVal: { fontSize: 13, fontWeight: "bold" },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  section: { marginBottom: 20 },
  streakCard: {
    width: 140,
    padding: 16,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  streakHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  streakValue: { fontSize: 18, fontWeight: '800', marginLeft: 6 },
  streakLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  horizontalScroll: { marginBottom: 15, paddingBottom: 5 },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10
  },
  badgeIconBox: {
    width: (staticWidth - 60) / 3,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  badgeInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  badgeName: { fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  insightCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4 },
  insightContent: { marginLeft: 16, flex: 1 },
  insightTitle: { fontSize: 16, fontWeight: 'bold' },
  insightText: { fontSize: 14, lineHeight: 20 },
  trendsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10
  },
  trendCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  trendValue: { fontSize: 18, fontWeight: 'bold', marginVertical: 4 },
  trendLabel: { fontSize: 12 },
});
