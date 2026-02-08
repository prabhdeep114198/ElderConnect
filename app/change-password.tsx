import { Ionicons } from "@expo/vector-icons";
import { ResponsiveView } from "../components/ResponsiveView";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    StatusBar
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function ChangePasswordScreen() {
    const router = useRouter();
    const { colors, theme } = useTheme();
    const { t } = useTranslation();
    const { updatePassword } = useAuth();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert("Error", "All fields are required");
            return;
        }

        if (newPassword.length < 8) {
            Alert.alert("Error", "New password must be at least 8 characters long");
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            await updatePassword(newPassword, currentPassword);
            Alert.alert("Success", "Password updated successfully");
            router.back();
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to update password. Please check your current password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ResponsiveView maxWidth={500} style={[styles.container, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                            <Text style={{ color: colors.primary, fontSize: 17 }}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={[styles.largeTitle, { color: colors.text }]}>Security</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionHeader, { color: colors.mutedText }]}>PASSWORD</Text>
                        <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1C1C1E' : colors.card, borderWidth: theme === 'dark' ? 1 : 0, borderColor: theme === 'dark' ? '#2C2C2E' : 'transparent' }]}>
                            <View style={[styles.inputRow, { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
                                <Text style={[styles.label, { color: colors.text }]}>Current</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    secureTextEntry={!showCurrent}
                                    placeholder="Required"
                                    placeholderTextColor={colors.mutedText}
                                />
                                <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                                    <Ionicons name={showCurrent ? "eye-off" : "eye"} size={20} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.inputRow, { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
                                <Text style={[styles.label, { color: colors.text }]}>New</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry={!showNew}
                                    placeholder="At least 8 chars"
                                    placeholderTextColor={colors.mutedText}
                                />
                                <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                                    <Ionicons name={showNew ? "eye-off" : "eye"} size={20} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.inputRow}>
                                <Text style={[styles.label, { color: colors.text }]}>Confirm</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirm}
                                    placeholder="Verify new"
                                    placeholderTextColor={colors.mutedText}
                                />
                                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                                    <Ionicons name={showConfirm ? "eye-off" : "eye"} size={20} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <Text style={[styles.footerText, { color: colors.mutedText }]}>A strong password helps prevent unauthorized access to your health data and personal information.</Text>
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
                            onPress={handleChangePassword}
                            disabled={loading}
                        >
                            <Text style={styles.saveButtonText}>{loading ? "Updating..." : "Update Password"}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ResponsiveView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 40, paddingTop: Platform.OS === 'web' ? 20 : 60 },
    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
    closeButton: { alignSelf: 'flex-start', paddingBottom: 10 },
    largeTitle: { fontSize: 34, fontWeight: 'bold', letterSpacing: -0.5, marginTop: Platform.OS === 'web' ? 10 : 0 },
    section: { marginTop: 25, paddingHorizontal: 20 },
    sectionHeader: { fontSize: 13, fontWeight: '400', marginBottom: 8, marginLeft: 16 },
    card: { borderRadius: 12, overflow: 'hidden' },
    inputRow: { flexDirection: 'row', alignItems: 'center', padding: 12, marginLeft: 16, paddingLeft: 0 },
    label: { fontSize: 17, width: 100 },
    input: { flex: 1, fontSize: 17, textAlign: 'right', paddingRight: 10 },
    footerText: { color: '#8E8E93', fontSize: 13, paddingHorizontal: 16, marginTop: 10, lineHeight: 18 },
    buttonContainer: { marginTop: 40, paddingHorizontal: 20 },
    saveButton: { height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    saveButtonText: { color: "#FFF", fontSize: 17, fontWeight: "600" },
});

