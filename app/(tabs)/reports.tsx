import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from 'expo-print';
import { useFocusEffect } from "expo-router";
import * as Sharing from 'expo-sharing';
import { useCallback, useState } from "react";
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from "react-native-svg";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

// Metrics for the Radar Chart
const METRICS = [
  { label: "Physical", key: "physical", max: 100 },
  { label: "Social", key: "social", max: 100 },
  { label: "Mental", key: "mental", max: 100 },
  { label: "Sleep", key: "sleep", max: 100 },
  { label: "Diet", key: "diet", max: 100 },
];

export default function ReportsScreen() {
  const { colors, theme } = useTheme();
  const [userData, setUserData] = useState<any>(null);
  const [scores, setScores] = useState({
    physical: 65,
    social: 40,
    mental: 70,
    sleep: 80,
    diet: 55
  });

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

      let calculatedScores = {
        physical: 65,
        social: 40,
        mental: 70,
        sleep: 80,
        diet: 55
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
      }

      setScores(calculatedScores);
    } catch (e) {
      console.error(e);
    }
  };

  const generatePDF = async () => {
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

    const nodes: any[] = [{ id: 'User', label: userData.name?.split(" ")[0], type: 'main', color: colors.primary }];

    // Add Interest nodes
    if (userData.interests) {
      userData.interests.slice(0, 3).forEach((int: string) => {
        nodes.push({ id: `int_${int}`, label: int, type: 'interest', color: '#448AFF' });
      });
    }
    // Add Condition nodes
    if (userData.conditions) {
      userData.conditions.slice(0, 2).forEach((cond: string) => {
        if (cond !== "None") {
          nodes.push({ id: `cond_${cond}`, label: cond, type: 'condition', color: '#FF5252' });
        }
      });
    }
    // Add Contact nodes
    if (userData.emergencyContacts) {
      userData.emergencyContacts.forEach((c: any, i: number) => {
        if (c.name) {
          nodes.push({ id: `cont_${i}`, label: c.name.split(" ")[0], type: 'contact', color: '#69F0AE' });
        }
      });
    }

    const nodeDist = kgSize / 2.8;
    return (
      <View style={[styles.kgCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Data Knowledge Graph</Text>
        <Svg height={kgSize} width={kgSize}>
          {nodes.map((node, i) => {
            if (i === 0) return null;
            const angle = (i - 1) * ((Math.PI * 2) / (nodes.length - 1));
            const nx = kgCenter + nodeDist * Math.cos(angle);
            const ny = kgCenter + nodeDist * Math.sin(angle);
            return (
              <G key={`edge_${node.id}`}>
                <Line x1={kgCenter} y1={kgCenter} x2={nx} y2={ny} stroke={colors.border} strokeWidth="2" strokeDasharray="5,5" />
              </G>
            );
          })}

          {nodes.map((node, i) => {
            let nx = kgCenter;
            let ny = kgCenter;
            if (i > 0) {
              const angle = (i - 1) * ((Math.PI * 2) / (nodes.length - 1));
              nx = kgCenter + nodeDist * Math.cos(angle);
              ny = kgCenter + nodeDist * Math.sin(angle);
            }

            const r = i === 0 ? 35 : 25;
            return (
              <G key={node.id}>
                <Circle cx={nx} cy={ny} r={r} fill={node.color} opacity={i === 0 ? 1 : 0.8} />
                <SvgText x={nx} y={ny} fill="#fff" fontSize={i === 0 ? 12 : 10} fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">
                  {node.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
        <View style={styles.kgLegend}>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#448AFF' }]} /><Text style={[styles.legendText, { color: colors.mutedText }]}>Interests</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#FF5252' }]} /><Text style={[styles.legendText, { color: colors.mutedText }]}>Health</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#69F0AE' }]} /><Text style={[styles.legendText, { color: colors.mutedText }]}>Contacts</Text></View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Wellness Report</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          {userData ? `Analysis for ${userData.name}` : "Your Health Overview"}
        </Text>
      </View>

      <TouchableOpacity style={[styles.pdfButton, { backgroundColor: colors.primary }]} onPress={generatePDF}>
        <Ionicons name="download-outline" size={24} color="#fff" />
        <Text style={styles.pdfButtonText}>Download Detailed Report (PDF)</Text>
      </TouchableOpacity>

      {/* KNOWLEDGE GRAPH */}
      {renderKnowledgeGraph()}

      {/* RADAR CHART CARD */}
      <View style={[styles.graphCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Health Balance Indices</Text>
        <View style={{ alignItems: 'center', justifyContent: 'center', height: radarSize }}>
          <Svg height={radarSize} width={radarSize}>
            <Polygon points={buildRadarPolygon({ physical: 100, social: 100, mental: 100, sleep: 100, diet: 100 })} stroke={colors.border} strokeWidth="1" fill="none" />
            <Polygon points={buildRadarPolygon({ physical: 50, social: 50, mental: 50, sleep: 50, diet: 50 })} stroke={colors.border} strokeWidth="0.5" strokeDasharray="4,4" fill="none" />

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
              return <SvgText key={i} x={x} y={y} fill={colors.text} fontSize="11" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">{m.label}</SvgText>;
            })}
          </Svg>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Smart Insights</Text>
        {scores.physical < 60 && (
          <View style={[styles.insightCard, { backgroundColor: colors.card, borderLeftColor: colors.warning }]}>
            <Ionicons name="walk-outline" size={24} color={colors.warning} />
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: colors.text }]}>Mobility Focus</Text>
              <Text style={[styles.insightText, { color: colors.mutedText }]}>We noticed your mobility score is lower. Try gentle chair yoga or stretching.</Text>
            </View>
          </View>
        )}
        {scores.social < 60 && (
          <View style={[styles.insightCard, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
            <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} />
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: colors.text }]}>Social Activity</Text>
              <Text style={[styles.insightText, { color: colors.mutedText }]}>Joining a local club for {userData?.interests?.[0] || 'your hobbies'} could improve your mood!</Text>
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
  kgLegend: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 12 },
  graphCard: { borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 24, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, alignSelf: 'flex-start' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  insightCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4 },
  insightContent: { marginLeft: 16, flex: 1 },
  insightTitle: { fontSize: 16, fontWeight: 'bold' },
  insightText: { fontSize: 14, lineHeight: 20 }
});
