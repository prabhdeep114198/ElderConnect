// app/(tabs)/diary.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../constants/colors";

const { width } = Dimensions.get("window");

// Type definitions
type Mood = "happy" | "neutral" | "sad" | "anxious" | "angry";
type Weather = "sunny" | "cloudy" | "rainy" | "snowy";
type ActivityValue =
  | "walk"
  | "reading"
  | "social"
  | "exercise"
  | "meditation"
  | "hobby";

interface DiaryEntry {
  id: string;
  date: string;
  mood: Mood;
  notes: string;
  tags: string[];
  weather: Weather;
  activity: ActivityValue[];
}

export default function DiaryScreen() {
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [moodOptions, setMoodOptions] = useState<any[]>([]);
  const [weatherOptions, setWeatherOptions] = useState<any[]>([]);
  const [activityOptions, setActivityOptions] = useState<any[]>([]);

  const [newEntry, setNewEntry] = useState<Omit<DiaryEntry, "id">>({
    date: new Date().toISOString().split("T")[0],
    mood: "neutral",
    notes: "",
    tags: [],
    weather: "sunny",
    activity: [],
  });

  // Simulate fetching data from backend
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Simulate API delay
        await new Promise((res) => setTimeout(res, 1000));

        // Later: replace with actual API calls like:
        // const res = await fetch("https://your-backend.com/api/diary");
        // const data = await res.json();

        setMoodOptions([
          { icon: "happy", label: "Happy", value: "happy", color: Colors.success },
          { icon: "happy-outline", label: "Neutral", value: "neutral", color: Colors.info },
          { icon: "sad", label: "Sad", value: "sad", color: Colors.primary },
          { icon: "alert-circle", label: "Anxious", value: "anxious", color: Colors.warning },
          { icon: "sad-outline", label: "Angry", value: "angry", color: Colors.error },
        ]);

        setWeatherOptions([
          { icon: "sunny", label: "Sunny", value: "sunny" },
          { icon: "cloudy", label: "Cloudy", value: "cloudy" },
          { icon: "rainy", label: "Rainy", value: "rainy" },
          { icon: "snow", label: "Snowy", value: "snowy" },
        ]);

        setActivityOptions([
          { icon: "walk", label: "Walk", value: "walk" },
          { icon: "book", label: "Reading", value: "reading" },
          { icon: "people", label: "Social", value: "social" },
          { icon: "fitness", label: "Exercise", value: "exercise" },
          { icon: "meditation", label: "Meditation", value: "meditation" },
          { icon: "brush", label: "Hobby", value: "hobby" },
        ]);

        setDiaryEntries([
          {
            id: "1",
            date: "2024-12-12",
            mood: "happy",
            notes:
              "Had a wonderful day with family. Visited the park and enjoyed the sunshine.",
            tags: ["family", "park", "grateful"],
            weather: "sunny",
            activity: ["walk", "social"],
          },
          {
            id: "2",
            date: "2024-12-11",
            mood: "neutral",
            notes: "Routine day. Finished chores and read a book.",
            tags: ["reading", "peaceful"],
            weather: "cloudy",
            activity: ["reading"],
          },
        ]);
      } catch (err) {
        Alert.alert("Error", "Failed to fetch diary data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const addDiaryEntry = async () => {
    if (!newEntry.notes) {
      Alert.alert("Error", "Please write some notes.");
      return;
    }

    const entry: DiaryEntry = {
      ...newEntry,
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
    };

    // Later: POST request to backend API
    // await fetch("https://your-backend.com/api/diary", { method: "POST", body: JSON.stringify(entry) });

    setDiaryEntries((prev) => [entry, ...prev]);
    setNewEntry({
      date: new Date().toISOString().split("T")[0],
      mood: "neutral",
      notes: "",
      tags: [],
      weather: "sunny",
      activity: [],
    });
    setShowAddModal(false);
    Alert.alert("Success", "Diary entry added!");
  };

  const getMoodColor = (m: Mood) =>
    moodOptions.find((opt) => opt.value === m)?.color || Colors.mutedText;
  const getMoodIcon = (m: Mood) =>
    moodOptions.find((opt) => opt.value === m)?.icon || "happy-outline";

  const toggleActivity = (act: ActivityValue) =>
    setNewEntry((prev) => ({
      ...prev,
      activity: prev.activity.includes(act)
        ? prev.activity.filter((a) => a !== act)
        : [...prev.activity, act],
    }));

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ color: Colors.mutedText, marginTop: 8 }}>Loading diary...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Diary</Text>
            <Text style={styles.headerSubtitle}>Reflect and track your mood</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={24} color={Colors.buttonText} />
          </TouchableOpacity>
        </View>

        {/* Recent Entries */}
        {diaryEntries.map((entry) => (
          <TouchableOpacity
            key={entry.id}
            style={styles.entryCard}
            onPress={() => setSelectedEntry(entry)}
          >
            <View style={styles.entryHeader}>
              <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
              <View style={[styles.moodBadge, { backgroundColor: getMoodColor(entry.mood) }]}>
                <Ionicons name={getMoodIcon(entry.mood)} size={16} color="white" />
                <Text style={styles.moodBadgeText}>{entry.mood}</Text>
              </View>
            </View>
            <Text style={styles.entryNotes} numberOfLines={2}>
              {entry.notes}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Entry</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TextInput
              style={[styles.textInput, { marginBottom: 12 }]}
              placeholder="Write about your day..."
              value={newEntry.notes}
              onChangeText={(text) => setNewEntry((prev) => ({ ...prev, notes: text }))}
              multiline
            />

            <Text style={styles.inputLabel}>Select Mood</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {moodOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.moodButton,
                    newEntry.mood === opt.value && { backgroundColor: opt.color },
                  ]}
                  onPress={() => setNewEntry((prev) => ({ ...prev, mood: opt.value }))}
                >
                  <Ionicons
                    name={opt.icon}
                    size={20}
                    color={newEntry.mood === opt.value ? "white" : opt.color}
                  />
                  <Text
                    style={[
                      styles.moodButtonText,
                      newEntry.mood === opt.value && { color: "white" },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.addEntryButton, { marginTop: 30 }]}
              onPress={addDiaryEntry}
            >
              <Text style={styles.addEntryButtonText}>Save Entry</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 20,
    alignItems: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: Colors.text },
  headerSubtitle: { color: Colors.mutedText },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  entryCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  entryHeader: { flexDirection: "row", justifyContent: "space-between" },
  entryDate: { color: Colors.text, fontWeight: "600" },
  entryNotes: { color: Colors.mutedText, marginTop: 8 },
  moodBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  moodBadgeText: { color: "white", marginLeft: 4, textTransform: "capitalize" },
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: Colors.text },
  modalContent: { padding: 20 },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.card,
    color: Colors.text,
  },
  inputLabel: { fontWeight: "600", color: Colors.text, marginBottom: 6 },
  moodButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  moodButtonText: { marginLeft: 6, color: Colors.text },
  addEntryButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  addEntryButtonText: { color: "white", fontWeight: "bold" },
});
