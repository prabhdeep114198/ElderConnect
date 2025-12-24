import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Reminder, ReminderService } from "../utils/reminderService";

export default function RemindersScreen() {
    const router = useRouter();
    const { colors, theme } = useTheme();
    const { t } = useTranslation();
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // New reminder form state
    const [title, setTitle] = useState("");
    const [date, setDate] = useState(new Date(Date.now() + 10 * 60 * 1000)); // Default 10 mins from now
    const [mode, setMode] = useState<"date" | "time">("date");

    useEffect(() => {
        loadReminders();
    }, []);

    const loadReminders = async () => {
        const data = await ReminderService.getAllReminders();
        setReminders(data);
    };

    const handleAddReminder = async () => {
        if (!title.trim()) {
            Alert.alert("Error", "Please enter a title for the reminder");
            return;
        }

        if (date <= new Date()) {
            Alert.alert("Invalid Time", "Please select a future time.");
            return;
        }

        setLoading(true);
        try {
            await ReminderService.scheduleReminder({
                title,
                body: "This is your scheduled reminder from ElderConnect.",
                date: date.toISOString(),
                type: 'general',
            });
            setShowAddModal(false);
            setTitle("");
            setDate(new Date(Date.now() + 10 * 60 * 1000));
            loadReminders();
            Alert.alert("Success", "Reminder set successfully!");
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to set reminder");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReminder = async (id: string) => {
        Alert.alert(
            "Delete Reminder",
            "Are you sure you want to cancel this reminder?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Delete",
                    style: "destructive",
                    onPress: async () => {
                        await ReminderService.cancelReminder(id);
                        loadReminders();
                    }
                }
            ]
        );
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        setDate(currentDate);
        if (Platform.OS === 'android' && mode === 'date') {
            setMode('time');
        }
    };

    const renderReminderItem = ({ item }: { item: Reminder }) => (
        <View style={[styles.reminderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.reminderInfo}>
                <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons
                        name={item.type === 'medication' ? 'medkit' : item.type === 'appointment' ? 'calendar' : 'alarm'}
                        size={24}
                        color={colors.primary}
                    />
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.reminderTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.reminderTime, { color: colors.mutedText }]}>
                        {new Date(item.date).toLocaleString([], {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Text>
                </View>
            </View>
            <TouchableOpacity onPress={() => handleDeleteReminder(item.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={22} color={colors.error} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t("reminders")}</Text>
                <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.headerAddBtn}>
                    <Ionicons name="add" size={28} color="#FFF" />
                </TouchableOpacity>
            </View>

            {reminders.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="notifications-off-outline" size={80} color={colors.mutedText} />
                    <Text style={[styles.emptyText, { color: colors.mutedText }]}>No reminders set.</Text>
                    <TouchableOpacity
                        style={[styles.emptyAddBtn, { backgroundColor: colors.primary }]}
                        onPress={() => setShowAddModal(true)}
                    >
                        <Text style={styles.emptyAddBtnText}>Add Reminder</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={reminders}
                    renderItem={renderReminderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* ADD REMINDER MODAL */}
            <Modal visible={showAddModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={[styles.modalContent, { backgroundColor: theme === 'dark' ? colors.card : '#FFF' }]}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>New Reminder</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Ionicons name="close" size={28} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>What should we remind you about?</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                    value={title}
                                    onChangeText={setTitle}
                                    placeholder="e.g. Call my daughter, Evening walk"
                                    placeholderTextColor={colors.mutedText}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>When?</Text>
                                <View style={styles.pickerContainer}>
                                    <DateTimePicker
                                        value={date}
                                        mode={Platform.OS === 'ios' ? 'datetime' : mode}
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={onDateChange}
                                        minimumDate={new Date()}
                                        themeVariant={theme}
                                        style={{ height: 120 }}
                                    />
                                    {Platform.OS === 'android' && (
                                        <TouchableOpacity
                                            style={[styles.modeToggle, { backgroundColor: colors.primary + '20' }]}
                                            onPress={() => setMode(mode === 'date' ? 'time' : 'date')}
                                        >
                                            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
                                                Switch to {mode === 'date' ? 'Time' : 'Date'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
                                onPress={handleAddReminder}
                                disabled={loading}
                            >
                                <Text style={styles.saveBtnText}>{loading ? "Saving..." : "Set Reminder"}</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
    backButton: { padding: 5 },
    headerAddBtn: { padding: 5 },
    listContent: { padding: 20, paddingBottom: 40 },
    reminderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 15,
        borderWidth: 1,
        justifyContent: 'space-between',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    reminderInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    textContainer: { flex: 1 },
    reminderTitle: { fontSize: 18, fontWeight: 'bold' },
    reminderTime: { fontSize: 14, marginTop: 2 },
    deleteBtn: { padding: 10 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { fontSize: 18, marginTop: 20, textAlign: 'center' },
    emptyAddBtn: { marginTop: 30, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 15 },
    emptyAddBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, minHeight: 400 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 22, fontWeight: 'bold' },
    modalBody: { gap: 20 },
    inputGroup: { gap: 10 },
    label: { fontSize: 16, fontWeight: '600' },
    input: { height: 55, borderRadius: 15, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
    pickerContainer: { alignItems: 'center', justifyContent: 'center' },
    saveBtn: { height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    modeToggle: { padding: 10, borderRadius: 10, marginTop: 10 }
});
