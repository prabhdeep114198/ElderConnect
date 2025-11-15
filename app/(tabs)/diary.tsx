// app/(tabs)/diary.tsx
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

type Mood = "happy" | "neutral" | "sad" | "anxious" | "angry";
type Weather = "sunny" | "cloudy" | "rainy" | "snowy";
type ActivityValue = "walk" | "reading" | "social" | "exercise" | "meditation" | "hobby";

interface DiaryEntry {
  id: string;
  date: string;
  mood: Mood;
  notes: string;
  tags: string[];
  weather: Weather;
  activity: ActivityValue[];
}

const API_URL = "http://localhost:3000"; // Replace with your backend URL

export default function DiaryScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [newEntry, setNewEntry] = useState<Omit<DiaryEntry, "id">>({
    date: new Date().toISOString().split("T")[0],
    mood: "neutral",
    notes: "",
    tags: [],
    weather: "sunny",
    activity: [],
  });
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  /** --- Fetch diary entries from backend --- */
  const fetchDiaryEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/diary`);
      const data: DiaryEntry[] = await res.json();
      setDiaryEntries(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load diary entries from server.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDiaryEntries();
  }, []);

  const addDiaryEntry = async () => {
    if (!newEntry.notes) {
      Alert.alert("Error", "Please write some notes for your diary entry.");
      return;
    }

    const entryToAdd = {
      ...newEntry,
      date: newEntry.date,
    };

    try {
      const res = await fetch(`${API_URL}/diary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryToAdd),
      });
      const savedEntry: DiaryEntry = await res.json();
      setDiaryEntries((prev) => [savedEntry, ...prev]);
      setNewEntry({
        date: new Date().toISOString().split("T")[0],
        mood: "neutral",
        notes: "",
        tags: [],
        weather: "sunny",
        activity: [],
      });
      setShowAddModal(false);
      Alert.alert("Success", "Diary entry added successfully!");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to add diary entry.");
    }
  };

  const moodOptions: Array<{ icon: string; label: string; value: Mood; color: string }> = [
    { icon: "happy", label: "Happy", value: "happy", color: Colors.success },
    { icon: "happy-outline", label: "Neutral", value: "neutral", color: Colors.info },
    { icon: "sad", label: "Sad", value: "sad", color: Colors.primary },
    { icon: "alert-circle", label: "Anxious", value: "anxious", color: Colors.warning },
    { icon: "sad-outline", label: "Angry", value: "angry", color: Colors.error },
  ];

  const weatherOptions: Array<{ icon: string; label: string; value: Weather }> = [
    { icon: "sunny", label: "Sunny", value: "sunny" },
    { icon: "cloudy", label: "Cloudy", value: "cloudy" },
    { icon: "rainy", label: "Rainy", value: "rainy" },
    { icon: "snow", label: "Snowy", value: "snowy" },
  ];

  const activityOptions: Array<{ icon: string; label: string; value: ActivityValue }> = [
    { icon: "walk", label: "Walk", value: "walk" },
    { icon: "book", label: "Reading", value: "reading" },
    { icon: "people", label: "Social", value: "social" },
    { icon: "fitness", label: "Exercise", value: "exercise" },
    { icon: "meditation", label: "Meditation", value: "meditation" },
    { icon: "brush", label: "Hobby", value: "hobby" },
  ];

  const getMoodColor = (m: DiaryEntry["mood"]) => moodOptions.find((opt) => opt.value === m)?.color || Colors.mutedText;
  const getMoodIcon = (m: DiaryEntry["mood"]) => moodOptions.find((opt) => opt.value === m)?.icon || "happy-outline";

  const toggleActivity = (activity: ActivityValue) => {
    setNewEntry((prev) => ({
      ...prev,
      activity: prev.activity.includes(activity)
        ? prev.activity.filter((a) => a !== activity)
        : [...prev.activity, activity],
    }));
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  if (loading) return <ActivityIndicator size="large" color={Colors.primary} style={{ flex: 1, justifyContent: "center" }} />;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Diary</Text>
            <Text style={styles.headerSubtitle}>Reflect on your day and track your mood</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={24} color={Colors.buttonText} />
          </TouchableOpacity>
        </View>

        {/* Mood Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How have you been feeling?</Text>
          <View style={styles.moodSummaryGrid}>
            {moodOptions.map((opt) => {
              const count = diaryEntries.filter((entry) => entry.mood === opt.value).length;
              return (
                <View key={opt.value} style={styles.moodSummaryCard}>
                  <Ionicons name={opt.icon as any} size={28} color={opt.color} />
                  <Text style={styles.moodSummaryCount}>{count}</Text>
                  <Text style={styles.moodSummaryLabel}>{opt.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent Entries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          {diaryEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={48} color={Colors.mutedText} />
              <Text style={styles.emptyStateText}>No diary entries yet. Start writing!</Text>
              <TouchableOpacity style={styles.emptyStateButton} onPress={() => setShowAddModal(true)}>
                <Text style={styles.emptyStateButtonText}>Add New Entry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            diaryEntries.map((entry) => (
              <TouchableOpacity key={entry.id} style={styles.entryCard} onPress={() => setSelectedEntry(entry)}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryDateContainer}>
                    <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                    <View style={[styles.moodBadge, { backgroundColor: getMoodColor(entry.mood) }]}>
                      <Ionicons name={getMoodIcon(entry.mood) as any} size={14} color="white" />
                      <Text style={styles.moodBadgeText}>{entry.mood}</Text>
                    </View>
                  </View>
                  <View style={styles.weatherIcon}>
                    <Ionicons name={entry.weather as any} size={20} color={Colors.info} />
                  </View>
                </View>
                <Text style={styles.entryNotes} numberOfLines={3}>
                  {entry.notes}
                </Text>
                <View style={styles.entryTags}>
                  {entry.tags.map((tag, index) => (
                    <View key={index} style={styles.tagItem}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                  {entry.activity.map((act, index) => (
                    <View key={index} style={styles.tagItem}>
                      <Text style={styles.tagText}>#{act}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Diary Entry Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Diary Entry</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date</Text>
              <TextInput
                style={styles.textInput}
                value={newEntry.date}
                onChangeText={(text) => setNewEntry((prev) => ({ ...prev, date: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.mutedText}
              />
            </View>

            {/* Mood Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>How are you feeling?</Text>
              <View style={styles.moodSelector}>
                {moodOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.moodButton, newEntry.mood === opt.value && { backgroundColor: opt.color }]}
                    onPress={() => setNewEntry((prev) => ({ ...prev, mood: opt.value }))}
                  >
                    <Ionicons name={opt.icon as any} size={24} color={newEntry.mood === opt.value ? "white" : opt.color} />
                    <Text style={[styles.moodButtonText, newEntry.mood === opt.value && { color: "white" }]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>What&apos;s on your mind?</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newEntry.notes}
                onChangeText={(text) => setNewEntry((prev) => ({ ...prev, notes: text }))}
                placeholder="Write about your day, thoughts, or feelings..."
                placeholderTextColor={Colors.mutedText}
                multiline
                numberOfLines={5}
              />
            </View>

            {/* Tags */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tags (e.g., #family, #work)</Text>
              <TextInput
                style={styles.textInput}
                value={newEntry.tags.join(", ")}
                onChangeText={(text) =>
                  setNewEntry((prev) => ({ ...prev, tags: text ? text.split(",").map((t) => t.trim()) : [] }))
                }
                placeholder="Separate tags with commas"
                placeholderTextColor={Colors.mutedText}
              />
            </View>

            {/* Weather */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weather</Text>
              <View style={styles.weatherSelector}>
                {weatherOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.weatherButton, newEntry.weather === opt.value && styles.selectedWeather]}
                    onPress={() => setNewEntry((prev) => ({ ...prev, weather: opt.value }))}
                  >
                    <Ionicons name={opt.icon as any} size={20} color={newEntry.weather === opt.value ? Colors.buttonText : Colors.text} />
                    <Text style={[styles.weatherButtonText, newEntry.weather === opt.value && { color: Colors.buttonText }]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Activities */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Activities</Text>
              <View style={styles.activitySelector}>
                {activityOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.activityButton, newEntry.activity.includes(opt.value) && styles.selectedActivity]}
                    onPress={() => toggleActivity(opt.value)}
                  >
                    <Ionicons name={opt.icon as any} size={20} color={newEntry.activity.includes(opt.value) ? Colors.buttonText : Colors.text} />
                    <Text style={[styles.activityButtonText, newEntry.activity.includes(opt.value) && { color: Colors.buttonText }]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.addEntryButton} onPress={addDiaryEntry}>
              <Text style={styles.addEntryButtonText}>Add Entry</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Diary Entry Details Modal */}
      <Modal visible={!!selectedEntry} animationType="slide" presentationStyle="pageSheet">
        {selectedEntry && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Diary Entry</Text>
              <TouchableOpacity onPress={() => setSelectedEntry(null)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailDate}>{formatDate(selectedEntry.date)}</Text>
                <View style={[styles.moodBadgeLarge, { backgroundColor: getMoodColor(selectedEntry.mood) }]}>
                  <Ionicons name={getMoodIcon(selectedEntry.mood) as any} size={20} color="white" />
                  <Text style={styles.moodBadgeTextLarge}>{selectedEntry.mood}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.detailText}>{selectedEntry.notes}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Tags</Text>
                <View style={styles.detailTags}>
                  {selectedEntry.tags.map((tag, index) => (
                    <View key={index} style={styles.tagItemLarge}>
                      <Text style={styles.tagTextLarge}>#{tag}</Text>
                    </View>
                  ))}
                  {selectedEntry.activity.map((act, index) => (
                    <View key={index} style={styles.tagItemLarge}>
                      <Text style={styles.tagTextLarge}>#{act}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Weather</Text>
                <View style={styles.detailWeather}>
                  <Ionicons name={selectedEntry.weather as any} size={24} color={Colors.info} />
                  <Text style={styles.detailWeatherText}>{selectedEntry.weather}</Text>
                </View>
              </View>
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
  moodSummaryGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  moodSummaryCard: {
    alignItems: "center",
  },
  moodSummaryCount: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
    marginTop: 8,
  },
  moodSummaryLabel: {
    fontSize: 12,
    color: Colors.mutedText,
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
  entryCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  entryDateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  entryDate: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginRight: 10,
  },
  moodBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moodBadgeText: {
    fontSize: 12,
    color: "white",
    fontWeight: "600",
    marginLeft: 4,
    textTransform: "capitalize",
  },
  weatherIcon: {
    padding: 4,
  },
  entryNotes: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  entryTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagItem: {
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  tagText: {
    fontSize: 12,
    color: Colors.mutedText,
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.card,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  moodSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  moodButton: {
    width: (width - 60) / 3,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  moodButtonText: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 4,
  },
  weatherSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  weatherButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  selectedWeather: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  weatherButtonText: {
    fontSize: 12,
    color: Colors.text,
    marginLeft: 8,
  },
  activitySelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  activityButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  selectedActivity: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  activityButtonText: {
    fontSize: 12,
    color: Colors.text,
    marginLeft: 8,
  },
  addEntryButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  addEntryButtonText: {
    color: Colors.buttonText,
    fontSize: 16,
    fontWeight: "600",
  },
  detailSection: {
    marginBottom: 20,
  },
  detailDate: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 8,
  },
  moodBadgeLarge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  moodBadgeTextLarge: {
    fontSize: 14,
    color: "white",
    fontWeight: "600",
    marginLeft: 6,
    textTransform: "capitalize",
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
  detailTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagItemLarge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  tagTextLarge: {
    fontSize: 14,
    color: Colors.mutedText,
  },
  detailWeather: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailWeatherText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
    textTransform: "capitalize",
  },
});