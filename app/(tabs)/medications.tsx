import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { Colors } from "../../constants/colors";

const { width } = Dimensions.get("window");

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  taken: boolean[];
  color: string;
  instructions: string;
  sideEffects: string[];
  prescribedBy: string;
  startDate: string;
  endDate?: string;
}

export default function MedicationsScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [newMedication, setNewMedication] = useState({
    name: "",
    dosage: "",
    frequency: "",
    instructions: "",
  });

  // ✅ Fetch medications from backend dynamically
  const fetchMedications = async () => {
    try {
      setLoading(true);
      const response = await fetch("https://your-backend.com/api/medications");
      if (!response.ok) throw new Error("Failed to fetch medications");
      const data: Medication[] = await response.json();
      setMedications(data);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message || "Failed to load medications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  const todayStats = {
    totalMeds: medications.length,
    takenMeds: medications.reduce(
      (sum, med) => sum + med.taken.filter((t) => t).length,
      0
    ),
    totalDoses: medications.reduce((sum, med) => sum + med.times.length, 0),
    compliance: 0,
  };
  todayStats.compliance = todayStats.totalDoses
    ? Math.round((todayStats.takenMeds / todayStats.totalDoses) * 100)
    : 0;

  // ✅ Toggle taken status and update backend dynamically
  const markAsTaken = async (medId: string, timeIndex: number) => {
    try {
      setMedications((prev) =>
        prev.map((med) => {
          if (med.id === medId) {
            const newTaken = [...med.taken];
            newTaken[timeIndex] = !newTaken[timeIndex];
            return { ...med, taken: newTaken };
          }
          return med;
        })
      );

      // Update backend
      await fetch(`https://your-backend.com/api/medications/${medId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taken: medications.find((m) => m.id === medId)?.taken,
        }),
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to update medication status.");
    }
  };

  // ✅ Add new medication dynamically via backend
  const addMedication = async () => {
    if (!newMedication.name || !newMedication.dosage) {
      Alert.alert("Error", "Please fill in medication name and dosage.");
      return;
    }

    const newMed: Medication = {
      id: Date.now().toString(),
      name: newMedication.name,
      dosage: newMedication.dosage,
      frequency: newMedication.frequency || "Once daily",
      times: ["8:00 AM"],
      taken: [false],
      color: "#6366F1",
      instructions: newMedication.instructions,
      sideEffects: [],
      prescribedBy: "Self-added",
      startDate: new Date().toISOString().split("T")[0],
    };

    try {
      const response = await fetch("https://your-backend.com/api/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMed),
      });

      if (!response.ok) throw new Error("Failed to add medication");

      const savedMed: Medication = await response.json();
      setMedications((prev) => [...prev, savedMed]);
      setNewMedication({ name: "", dosage: "", frequency: "", instructions: "" });
      setShowAddModal(false);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message || "Failed to add medication.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ color: Colors.text, marginTop: 10 }}>
          Loading medications...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Medications</Text>
            <Text style={styles.headerSubtitle}>
              Manage your daily medications dynamically
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={24} color={Colors.buttonText} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today&apos;s Summary</Text>
          <Text style={{ color: Colors.mutedText }}>
            Total Medications: {todayStats.totalMeds} | Compliance:{" "}
            {todayStats.compliance}%
          </Text>
        </View>

        {medications.map((med) => (
          <View key={med.id} style={styles.medicationCard}>
            <Text style={styles.medicationName}>{med.name}</Text>
            <Text style={styles.medicationDosage}>
              {med.dosage} • {med.frequency}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {med.times.map((time, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.markButton,
                    med.taken[idx] && { backgroundColor: Colors.success },
                  ]}
                  onPress={() => markAsTaken(med.id, idx)}
                >
                  <Text style={styles.markButtonText}>
                    {time} {med.taken[idx] ? "✓" : ""}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add Medication Modal */}
      <Modal visible={showAddModal} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Medication</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.textInput}
              placeholder="Medication Name"
              value={newMedication.name}
              onChangeText={(text) =>
                setNewMedication((prev) => ({ ...prev, name: text }))
              }
            />
            <TextInput
              style={styles.textInput}
              placeholder="Dosage (e.g. 10mg)"
              value={newMedication.dosage}
              onChangeText={(text) =>
                setNewMedication((prev) => ({ ...prev, dosage: text }))
              }
            />
            <TextInput
              style={styles.textInput}
              placeholder="Frequency (e.g. Twice daily)"
              value={newMedication.frequency}
              onChangeText={(text) =>
                setNewMedication((prev) => ({ ...prev, frequency: text }))
              }
            />
            <TextInput
              style={styles.textInput}
              placeholder="Instructions"
              value={newMedication.instructions}
              onChangeText={(text) =>
                setNewMedication((prev) => ({ ...prev, instructions: text }))
              }
            />

            <TouchableOpacity
              style={styles.addMedicationButton}
              onPress={addMedication}
            >
              <Text style={styles.addMedicationButtonText}>Add</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 20 },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: Colors.text },
  headerSubtitle: { color: Colors.mutedText },
  addButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 8,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 8,
  },
  medicationCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  medicationName: { fontSize: 16, fontWeight: "bold", color: Colors.text },
  medicationDosage: { color: Colors.mutedText, marginVertical: 4 },
  markButton: {
    backgroundColor: Colors.primary,
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  markButtonText: { color: Colors.buttonText },
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: Colors.text },
  modalContent: { padding: 16 },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: Colors.text,
  },
  addMedicationButton: {
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  addMedicationButtonText: { color: Colors.buttonText, fontWeight: "bold" },
});
