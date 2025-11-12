import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../constants/colors";

const { width } = Dimensions.get('window');

interface HealthMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  target?: number;
  icon: string;
  color: string;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
  history: { date: string; value: number }[];
}

interface VitalSign {
  id: string;
  name: string;
  systolic?: number;
  diastolic?: number;
  value?: number;
  unit: string;
  status: 'normal' | 'high' | 'low' | 'critical';
  timestamp: string;
  notes?: string;
}

export default function HealthTrackerScreen() {
  const [showVitalModal, setShowVitalModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<HealthMetric | null>(null);
  const [newVital, setNewVital] = useState({
    type: 'blood_pressure',
    systolic: '',
    diastolic: '',
    value: '',
    notes: ''
  });

  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [loading, setLoading] = useState(true);

  /** Fetch metrics and vitals dynamically from backend */
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch health metrics
      const metricsRes = await fetch("https://your-backend.com/api/health-metrics");
      if (!metricsRes.ok) throw new Error("Failed to fetch health metrics");
      const metricsData: HealthMetric[] = await metricsRes.json();
      setHealthMetrics(metricsData);

      // Fetch vital signs
      const vitalsRes = await fetch("https://your-backend.com/api/vitals");
      if (!vitalsRes.ok) throw new Error("Failed to fetch vital signs");
      const vitalsData: VitalSign[] = await vitalsRes.json();
      setVitalSigns(vitalsData);

    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message || "Failed to fetch data from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /** Add a new vital sign dynamically via backend */
  const addVitalSign = async () => {
    if (newVital.type === 'blood_pressure' && (!newVital.systolic || !newVital.diastolic)) {
      Alert.alert('Error', 'Please enter both systolic and diastolic values.');
      return;
    }
    if (newVital.type !== 'blood_pressure' && !newVital.value) {
      Alert.alert('Error', 'Please enter a value.');
      return;
    }

    const payload = {
      type: newVital.type,
      systolic: newVital.systolic ? parseInt(newVital.systolic) : undefined,
      diastolic: newVital.diastolic ? parseInt(newVital.diastolic) : undefined,
      value: newVital.value ? parseFloat(newVital.value) : undefined,
      notes: newVital.notes || ''
    };

    try {
      const res = await fetch("https://your-backend.com/api/vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to log vital");

      const savedVital: VitalSign = await res.json();
      setVitalSigns(prev => [savedVital, ...prev]);
      setShowVitalModal(false);
      setNewVital({ type: 'blood_pressure', systolic: '', diastolic: '', value: '', notes: '' });
      Alert.alert('Success', 'Vital sign recorded successfully!');

    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message || "Failed to log vital sign");
    }
  };

  /** Utility functions */
  const getVitalName = (type: string) => ({
    blood_pressure: 'Blood Pressure',
    blood_sugar: 'Blood Sugar',
    temperature: 'Temperature',
    oxygen: 'Oxygen Saturation'
  }[type] || 'Unknown');

  const getVitalUnit = (type: string) => ({
    blood_pressure: 'mmHg',
    blood_sugar: 'mg/dL',
    temperature: '°F',
    oxygen: '%'
  }[type] || '');

  const updateMetric = async (metricId: string, newValue: number) => {
    try {
      const res = await fetch(`https://your-backend.com/api/health-metrics/${metricId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: newValue })
      });
      if (!res.ok) throw new Error("Failed to update metric");
      const updatedMetric: HealthMetric = await res.json();

      setHealthMetrics(prev => prev.map(metric => metric.id === metricId ? updatedMetric : metric));

    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message || "Failed to update metric");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: Colors.text }}>Loading health data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={healthMetrics}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Health Tracker</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => setShowVitalModal(true)}>
                <Ionicons name="add" size={24} color={Colors.buttonText} />
              </TouchableOpacity>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => setSelectedMetric(item)}
          >
            <Text style={styles.metricName}>{item.name}</Text>
            <Text style={styles.metricValue}>{item.value} {item.unit}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Add Vital Modal */}
      <Modal visible={showVitalModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Log Vital Sign</Text>

          {newVital.type === 'blood_pressure' ? (
            <>
              <TextInput
                placeholder="Systolic"
                keyboardType="numeric"
                value={newVital.systolic}
                onChangeText={(text) => setNewVital(prev => ({ ...prev, systolic: text }))}
                style={styles.input}
              />
              <TextInput
                placeholder="Diastolic"
                keyboardType="numeric"
                value={newVital.diastolic}
                onChangeText={(text) => setNewVital(prev => ({ ...prev, diastolic: text }))}
                style={styles.input}
              />
            </>
          ) : (
            <TextInput
              placeholder={`Enter ${getVitalName(newVital.type)} (${getVitalUnit(newVital.type)})`}
              keyboardType="numeric"
              value={newVital.value}
              onChangeText={(text) => setNewVital(prev => ({ ...prev, value: text }))}
              style={styles.input}
            />
          )}

          <TextInput
            placeholder="Notes (optional)"
            value={newVital.notes}
            onChangeText={(text) => setNewVital(prev => ({ ...prev, notes: text }))}
            style={styles.input}
          />

          <TouchableOpacity style={styles.saveButton} onPress={addVitalSign}>
            <Text style={styles.saveButtonText}>Log Vital</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowVitalModal(false)} style={{ marginTop: 12 }}>
            <Text style={{ color: Colors.error }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  addButton: { backgroundColor: Colors.primary, padding: 12, borderRadius: 24 },
  metricCard: { padding: 16, marginBottom: 12, backgroundColor: Colors.card, borderRadius: 12 },
  metricName: { fontSize: 16, color: Colors.text },
  metricValue: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
  modalContainer: { flex: 1, padding: 20, backgroundColor: Colors.background },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: Colors.text },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, marginBottom: 12 },
  saveButton: { backgroundColor: Colors.primary, padding: 16, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: Colors.buttonText, fontWeight: 'bold' }
});
