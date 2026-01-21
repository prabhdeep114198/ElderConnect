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
    StatusBar,
    ScrollView,
    Switch
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Reminder, ReminderService } from "../utils/reminderService";

export default function RemindersScreen() {
    const router = useRouter();
    const { colors, theme } = useTheme();
    const { user } = useAuth();
    const { t } = useTranslation();
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // New reminder form state
    const [title, setTitle] = useState("");
    const [date, setDate] = useState(new Date(Date.now() + 10 * 60 * 1000));
    const [type, setType] = useState<'general' | 'medication' | 'appointment'>('general');
    const [notifyFamily, setNotifyFamily] = useState(false);

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
                body: type === 'medication' ? `Time for your medicine: ${title}` : `Reminder: ${title}`,
                date: date.toISOString(),
                type,
            }, notifyFamily, user);

            setShowAddModal(false);
            resetForm();
            loadReminders();
            Alert.alert("Success", "Reminder set successfully!");
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to set reminder");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTitle("");
        setDate(new Date(Date.now() + 10 * 60 * 1000));
        setType('general');
        setNotifyFamily(false);
    };

    const handleDeleteReminder = async (id: string) => {
        Alert.alert(
            "Delete",
            "Are you sure you want to cancel this reminder?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
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
    };

    const ReminderItem = ({ item, isLast }: { item: Reminder; isLast: boolean }) => (
        <View style={[styles.reminderItem, { borderBottomWidth: isLast ? 0 : 0.5, borderBottomColor: colors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: item.type === 'medication' ? '#FF3B3015' : colors.primary + '10' }]}>
                <Ionicons
                    name={item.type === 'medication' ? 'medkit' : item.type === 'appointment' ? 'calendar' : 'alarm'}
                    size={20}
                    color={item.type === 'medication' ? '#FF3B30' : colors.primary}
                />
            </View>
            <View style={styles.reminderContent}>
                <Text style={[styles.reminderTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.reminderTime, { color: colors.mutedText }]}>
                    {new Date(item.date).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteReminder(item.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color="#FF3B30" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                        <Text style={{ color: colors.primary, fontSize: 17 }}>Done</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
                        <Ionicons name="add" size={26} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.largeTitle, { color: colors.text }]}>Reminders</Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.mutedText }]}>SCHEDULED</Text>
                    <View style={[styles.card, { backgroundColor: colors.card }]}>
                        {reminders.length > 0 ? (
                            reminders.map((item, index) => (
                                <ReminderItem key={item.id} item={item} isLast={index === reminders.length - 1} />
                            ))
                        ) : (
                            <View style={styles.emptyCard}>
                                <Ionicons name="notifications-off" size={40} color="#8E8E93" />
                                <Text style={[styles.emptyText, { color: colors.mutedText }]}>No Reminders</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.footerText}>Stay on top of your medications, appointments, and daily routines with smart notifications.</Text>
                </View>
            </ScrollView>

            <Modal visible={showAddModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={[styles.modalContent, { backgroundColor: theme === 'dark' ? colors.card : '#FFF' }]}
                    >
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Text style={{ color: colors.primary, fontSize: 17 }}>Cancel</Text>
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Reminder</Text>
                            <TouchableOpacity onPress={handleAddReminder} disabled={loading}>
                                <Text style={{ color: colors.primary, fontSize: 17, fontWeight: '600' }}>Add</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7', paddingLeft: 16 }]}>
                                <View style={styles.inputRow}>
                                    <TextInput
                                        style={[styles.input, { color: colors.text }]}
                                        value={title}
                                        onChangeText={setTitle}
                                        placeholder="Reminder title (e.g. Antibiotics 500mg)"
                                        placeholderTextColor={colors.mutedText}
                                    />
                                </View>
                            </View>

                            <Text style={[styles.sectionHeader, { color: colors.mutedText, marginTop: 20 }]}>REMINDER TYPE</Text>
                            <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]}>
                                <View style={[styles.typeSelectorRow, { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
                                    <TouchableOpacity
                                        style={[styles.typeBtn, type === 'medication' && { backgroundColor: '#FF3B3020' }]}
                                        onPress={() => setType('medication')}
                                    >
                                        <Ionicons name="medkit" size={20} color={type === 'medication' ? '#FF3B30' : '#8E8E93'} />
                                        <Text style={[styles.typeBtnText, { color: type === 'medication' ? '#FF3B30' : colors.text }]}>Medication</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.typeBtn, type === 'appointment' && { backgroundColor: colors.primary + '20' }]}
                                        onPress={() => setType('appointment')}
                                    >
                                        <Ionicons name="calendar" size={20} color={type === 'appointment' ? colors.primary : '#8E8E93'} />
                                        <Text style={[styles.typeBtnText, { color: type === 'appointment' ? colors.primary : colors.text }]}>Appointment</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.typeBtn, type === 'general' && { backgroundColor: '#8E8E9320' }]}
                                        onPress={() => setType('general')}
                                    >
                                        <Ionicons name="alarm" size={20} color={type === 'general' ? colors.text : '#8E8E93'} />
                                        <Text style={[styles.typeBtnText, { color: colors.text }]}>General</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7', marginTop: 20 }]}>
                                <View style={styles.modalSwitchRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.switchLabel, { color: colors.text }]}>Notify Family</Text>
                                        <Text style={styles.switchSublabel}>Alert contacts via n8n (WhatsApp/SMS)</Text>
                                    </View>
                                    <Switch value={notifyFamily} onValueChange={setNotifyFamily} />
                                </View>
                            </View>

                            <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7', marginTop: 20, marginBottom: 40 }]}>
                                <DateTimePicker
                                    value={date}
                                    mode="datetime"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onDateChange}
                                    minimumDate={new Date()}
                                    themeVariant={theme}
                                    style={{ height: 180 }}
                                />
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
    closeButton: { alignSelf: 'flex-start', position: 'absolute', top: 20, left: 20, zIndex: 1 },
    addButton: { alignSelf: 'flex-end', position: 'absolute', top: 20, right: 20, zIndex: 1 },
    largeTitle: { fontSize: 34, fontWeight: 'bold', letterSpacing: -0.5, marginTop: 40 },
    section: { marginTop: 25, paddingHorizontal: 20 },
    sectionHeader: { fontSize: 13, fontWeight: '400', marginBottom: 8, marginLeft: 16 },
    card: { borderRadius: 12, overflow: 'hidden' },
    reminderItem: { flexDirection: 'row', alignItems: 'center', padding: 12, marginLeft: 16, paddingLeft: 0 },
    iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    reminderContent: { flex: 1 },
    reminderTitle: { fontSize: 17, fontWeight: '400' },
    reminderTime: { fontSize: 13, marginTop: 1 },
    deleteBtn: { padding: 8 },
    emptyCard: { padding: 40, alignItems: 'center', justifyContent: 'center' },
    emptyText: { marginTop: 10, fontSize: 15 },
    footerText: { color: '#8E8E93', fontSize: 13, paddingHorizontal: 16, marginTop: 10, lineHeight: 18 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 15, borderTopRightRadius: 15, padding: 16, minHeight: 450 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 17, fontWeight: '600' },
    modalBody: { flex: 1 },
    inputRow: { padding: 12, paddingLeft: 0 },
    input: { fontSize: 17, height: 24 },
    typeSelectorRow: { flexDirection: 'row', padding: 10, justifyContent: 'space-around' },
    typeBtn: { alignItems: 'center', padding: 10, borderRadius: 10, flex: 1 },
    typeBtnText: { fontSize: 12, marginTop: 4, fontWeight: '500' },
    modalSwitchRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    switchLabel: { fontSize: 17 },
    switchSublabel: { fontSize: 12, color: '#8E8E93', marginTop: 2 }
});

