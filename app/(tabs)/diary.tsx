import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PlatformDateTimePicker } from "../../components/PlatformDateTimePicker";
import { ResponsiveView } from "../../components/ResponsiveView";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { getDiaryKey } from "../../utils/userStorageKeys";

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

const API_URL = "http://192.168.1.6:3000"; // Replace with your backend URL

export default function DiaryScreen() {
  const { colors, theme } = useTheme();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
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

  /** --- Fetch diary entries from storage --- */
  const fetchDiaryEntries = async () => {
    if (!user?.id) {
      setDiaryEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const key = getDiaryKey(user.id);
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        setDiaryEntries(JSON.parse(stored));
      } else {
        setDiaryEntries([]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load diary entries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiaryEntries();
  }, [user?.id]);

  const addDiaryEntry = async () => {
    if (!newEntry.notes) {
      Alert.alert("Error", "Please write some notes for your diary entry.");
      return;
    }

    const entryToAdd = {
      ...newEntry,
      id: Date.now().toString(),
      date: newEntry.date,
    };

    if (!user?.id) {
      Alert.alert("Error", "Please sign in to save diary entries.");
      return;
    }
    try {
      const updatedEntries = [entryToAdd as DiaryEntry, ...diaryEntries];
      setDiaryEntries(updatedEntries);
      await AsyncStorage.setItem(getDiaryKey(user.id), JSON.stringify(updatedEntries));

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

  const moodOptions: { icon: string; label: string; value: Mood; color: string }[] = [
    { icon: "happy", label: t("happy"), value: "happy", color: colors.success },
    { icon: "happy-outline", label: t("neutral"), value: "neutral", color: colors.info },
    { icon: "sad", label: t("sad"), value: "sad", color: colors.primary },
    { icon: "alert-circle", label: t("anxious"), value: "anxious", color: colors.warning },
    { icon: "sad-outline", label: t("angry"), value: "angry", color: colors.error },
  ];

  const weatherOptions: { icon: string; label: string; value: Weather }[] = [
    { icon: "sunny", label: t("sunny"), value: "sunny" },
    { icon: "cloudy", label: t("cloudy"), value: "cloudy" },
    { icon: "rainy", label: t("rainy"), value: "rainy" },
    { icon: "snow", label: t("snowy"), value: "snowy" },
  ];

  const activityOptions: { icon: string; label: string; value: ActivityValue }[] = [
    { icon: "walk", label: t("walk"), value: "walk" },
    { icon: "book", label: t("reading"), value: "reading" },
    { icon: "people", label: t("social"), value: "social" },
    { icon: "fitness", label: t("exercise"), value: "exercise" },
    { icon: "leaf", label: t("meditation"), value: "meditation" },
    { icon: "brush", label: t("hobby"), value: "hobby" },
  ];

  const getMoodColor = (m: DiaryEntry["mood"]) => moodOptions.find((opt) => opt.value === m)?.color || colors.mutedText;
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
    new Date(dateString).toLocaleDateString(i18n.language, { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  if (loading) return (
    <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  return (
    <ResponsiveView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t("myDiary")}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>{t("reflectOnDay")}</Text>
          </View>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={24} color={colors.buttonText} />
          </TouchableOpacity>
        </View>

        {/* Mood Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("howFeeling")}</Text>
          <View style={[styles.moodSummaryGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {moodOptions.map((opt) => {
              const count = diaryEntries.filter((entry) => entry.mood === opt.value).length;
              return (
                <View key={opt.value} style={styles.moodSummaryCard}>
                  <Ionicons name={opt.icon as any} size={28} color={opt.color} />
                  <Text style={[styles.moodSummaryCount, { color: colors.text }]}>{count}</Text>
                  <Text style={[styles.moodSummaryLabel, { color: colors.mutedText }]}>{opt.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent Entries */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("recentEntries")}</Text>
          {diaryEntries.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="book-outline" size={48} color={colors.mutedText} />
              <Text style={[styles.emptyStateText, { color: colors.mutedText }]}>{t("noDiaryEntries")}</Text>
              <TouchableOpacity style={[styles.emptyStateButton, { backgroundColor: colors.primary }]} onPress={() => setShowAddModal(true)}>
                <Text style={[styles.emptyStateButtonText, { color: colors.buttonText }]}>{t("addNewEntry")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            diaryEntries.map((entry) => (
              <TouchableOpacity key={entry.id} style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setSelectedEntry(entry)}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryDateContainer}>
                    <Text style={[styles.entryDate, { color: colors.text }]}>{formatDate(entry.date)}</Text>
                    <View style={[styles.moodBadge, { backgroundColor: getMoodColor(entry.mood) }]}>
                      <Ionicons name={getMoodIcon(entry.mood) as any} size={14} color="white" />
                      <Text style={styles.moodBadgeText}>{entry.mood}</Text>
                    </View>
                  </View>
                  <View style={styles.weatherIcon}>
                    <Ionicons name={entry.weather as any} size={20} color={colors.info} />
                  </View>
                </View>
                <Text style={[styles.entryNotes, { color: colors.text }]} numberOfLines={3}>
                  {entry.notes}
                </Text>
                <View style={styles.entryTags}>
                  {entry.tags.map((tag, index) => (
                    <View key={`tag-${index}`} style={[styles.tagItem, { backgroundColor: colors.background }]}>
                      <Text style={[styles.tagText, { color: colors.mutedText }]}>#{tag}</Text>
                    </View>
                  ))}
                  {entry.activity.map((act, index) => (
                    <View key={`act-${index}`} style={[styles.tagItem, { backgroundColor: colors.background }]}>
                      <Text style={[styles.tagText, { color: colors.mutedText }]}>#{act}</Text>
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
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t("newDiaryEntry")}</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Date */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t("date")}</Text>
              <TouchableOpacity
                style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.card, justifyContent: 'center' }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: newEntry.date ? colors.text : colors.mutedText, fontSize: 16 }}>
                  {newEntry.date ? formatDate(newEntry.date) : "YYYY-MM-DD"}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <PlatformDateTimePicker
                  value={newEntry.date ? new Date(newEntry.date) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event: any, selectedDate?: Date) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      const year = selectedDate.getFullYear();
                      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                      const day = String(selectedDate.getDate()).padStart(2, '0');
                      setNewEntry((prev) => ({ ...prev, date: `${year}-${month}-${day}` }));
                    }
                  }}
                />
              )}
            </View>

            {/* Mood Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t("howFeeling")}</Text>
              <View style={styles.moodSelector}>
                {moodOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.moodButton,
                      { borderColor: colors.border, backgroundColor: colors.card },
                      newEntry.mood === opt.value && { backgroundColor: opt.color }
                    ]}
                    onPress={() => setNewEntry((prev) => ({ ...prev, mood: opt.value }))}
                  >
                    <Ionicons name={opt.icon as any} size={24} color={newEntry.mood === opt.value ? "white" : opt.color} />
                    <Text style={[
                      styles.moodButtonText,
                      { color: colors.text },
                      newEntry.mood === opt.value && { color: "white" }
                    ]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t("whatsOnYourMind")}</Text>
              <TextInput
                style={[styles.textInput, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                value={newEntry.notes}
                onChangeText={(text) => setNewEntry((prev) => ({ ...prev, notes: text }))}
                placeholder={t("writeAboutDay")}
                placeholderTextColor={colors.mutedText}
                multiline
                numberOfLines={5}
              />
            </View>

            {/* Tags */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t("tags")}</Text>
              <TextInput
                style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                value={newEntry.tags.join(", ")}
                onChangeText={(text) =>
                  setNewEntry((prev) => ({ ...prev, tags: text ? text.split(",").map((t) => t.trim()) : [] }))
                }
                placeholder={t("separateTags")}
                placeholderTextColor={colors.mutedText}
              />
            </View>

            {/* Weather */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t("weather")}</Text>
              <View style={styles.weatherSelector}>
                {weatherOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.weatherButton,
                      { borderColor: colors.border, backgroundColor: colors.card },
                      newEntry.weather === opt.value && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setNewEntry((prev) => ({ ...prev, weather: opt.value }))}
                  >
                    <Ionicons name={opt.icon as any} size={20} color={newEntry.weather === opt.value ? colors.buttonText : colors.text} />
                    <Text style={[
                      styles.weatherButtonText,
                      { color: colors.text },
                      newEntry.weather === opt.value && { color: colors.buttonText }
                    ]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Activities */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t("activities")}</Text>
              <View style={styles.activitySelector}>
                {activityOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.activityButton,
                      { borderColor: colors.border, backgroundColor: colors.card },
                      newEntry.activity.includes(opt.value) && { backgroundColor: colors.secondary, borderColor: colors.secondary }
                    ]}
                    onPress={() => toggleActivity(opt.value)}
                  >
                    <Ionicons name={opt.icon as any} size={20} color={newEntry.activity.includes(opt.value) ? colors.buttonText : colors.text} />
                    <Text style={[
                      styles.activityButtonText,
                      { color: colors.text },
                      newEntry.activity.includes(opt.value) && { color: colors.buttonText }
                    ]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={[styles.addEntryButton, { backgroundColor: colors.primary }]} onPress={addDiaryEntry}>
              <Text style={[styles.addEntryButtonText, { color: colors.buttonText }]}>{t("addEntry")}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Diary Entry Details Modal */}
      <Modal visible={!!selectedEntry} animationType="slide" presentationStyle="pageSheet">
        {selectedEntry && (
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t("myDiary")}</Text>
              <TouchableOpacity onPress={() => setSelectedEntry(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={[styles.detailDate, { color: colors.text }]}>{formatDate(selectedEntry.date)}</Text>
                <View style={[styles.moodBadgeLarge, { backgroundColor: getMoodColor(selectedEntry.mood) }]}>
                  <Ionicons name={getMoodIcon(selectedEntry.mood) as any} size={20} color="white" />
                  <Text style={styles.moodBadgeTextLarge}>{selectedEntry.mood}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.detailLabel, { color: colors.text }]}>{t("notes")}</Text>
                <Text style={[styles.detailText, { color: colors.mutedText }]}>{selectedEntry.notes}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.detailLabel, { color: colors.text }]}>{t("tags")}</Text>
                <View style={styles.detailTags}>
                  {selectedEntry.tags.map((tag, index) => (
                    <View key={`dtag-${index}`} style={[styles.tagItemLarge, { backgroundColor: colors.card }]}>
                      <Text style={[styles.tagTextLarge, { color: colors.mutedText }]}>#{tag}</Text>
                    </View>
                  ))}
                  {selectedEntry.activity.map((act, index) => (
                    <View key={`dact-${index}`} style={[styles.tagItemLarge, { backgroundColor: colors.card }]}>
                      <Text style={[styles.tagTextLarge, { color: colors.mutedText }]}>#{act}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.detailLabel, { color: colors.text }]}>{t("weather")}</Text>
                <View style={styles.detailWeather}>
                  <Ionicons name={selectedEntry.weather as any} size={24} color={colors.info} />
                  <Text style={[styles.detailWeatherText, { color: colors.text }]}>{selectedEntry.weather}</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </ResponsiveView>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  addButton: {
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
    marginBottom: 16,
  },
  moodSummaryGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
  },
  moodSummaryCard: {
    alignItems: "center",
  },
  moodSummaryCount: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 8,
  },
  moodSummaryLabel: {
    fontSize: 12,
  },
  emptyState: {
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
  },
  emptyStateText: {
    fontSize: 16,
    marginVertical: 16,
  },
  emptyStateButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontWeight: "600",
  },
  entryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
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
    lineHeight: 20,
    marginBottom: 12,
  },
  entryTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagItem: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  tagText: {
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
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
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
  },
  moodButtonText: {
    fontSize: 12,
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
  },
  selectedWeather: {
    // handled inline
  },
  weatherButtonText: {
    fontSize: 12,
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
  },
  selectedActivity: {
    // handled inline
  },
  activityButtonText: {
    fontSize: 12,
    marginLeft: 8,
  },
  addEntryButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addEntryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailDate: {
    fontSize: 18,
    fontWeight: "bold",
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
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 20,
  },
  detailTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagItemLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  tagTextLarge: {
    fontSize: 14,
  },
  detailWeather: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailWeatherText: {
    fontSize: 14,
    marginLeft: 8,
    textTransform: "capitalize",
  },
});