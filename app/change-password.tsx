import { Ionicons } from "@expo/vector-icons";
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
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <View style={[styles.topBranding, { backgroundColor: colors.primary }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="chevron-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.brandingTitle}>{t("changePassword")}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.iconHeaderSection}>
                    <View style={[styles.iconCircle, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                        <Ionicons name="lock-closed" size={50} color={colors.primary} />
                    </View>
                    <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
                        Create a strong password to keep your account secure
                    </Text>
                </View>

                <View style={styles.content}>
                    <View style={[styles.card, { backgroundColor: colors.card }]}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>{t("currentPassword")}</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: theme === 'dark' ? colors.background : '#F9FCFF',
                                            color: colors.text,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    placeholder={t("currentPassword")}
                                    placeholderTextColor={colors.mutedText}
                                    secureTextEntry={!showCurrent}
                                />
                                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCurrent(!showCurrent)}>
                                    <Ionicons name={showCurrent ? "eye-off" : "eye"} size={22} color={colors.mutedText} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>{t("newPassword")}</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: theme === 'dark' ? colors.background : '#F9FCFF',
                                            color: colors.text,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder={t("newPassword")}
                                    placeholderTextColor={colors.mutedText}
                                    secureTextEntry={!showNew}
                                />
                                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNew(!showNew)}>
                                    <Ionicons name={showNew ? "eye-off" : "eye"} size={22} color={colors.mutedText} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={[styles.inputGroup, { marginBottom: 10 }]}>
                            <Text style={[styles.label, { color: colors.text }]}>{t("confirmPassword")}</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: theme === 'dark' ? colors.background : '#F9FCFF',
                                            color: colors.text,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder={t("confirmPassword")}
                                    placeholderTextColor={colors.mutedText}
                                    secureTextEntry={!showConfirm}
                                />
                                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
                                    <Ionicons name={showConfirm ? "eye-off" : "eye"} size={22} color={colors.mutedText} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 },
                        ]}
                        onPress={handleChangePassword}
                        disabled={loading}
                    >
                        <Text style={styles.saveButtonText}>{loading ? t("updating") : t("updatePassword")}</Text>
                        {!loading && <Ionicons name="shield-checkmark" size={20} color="#FFF" style={{ marginLeft: 8 }} />}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.cancelButton, { borderStyle: 'dashed', borderColor: colors.border }]}
                        onPress={() => router.back()}
                        disabled={loading}
                    >
                        <Text style={[styles.cancelButtonText, { color: colors.mutedText }]}>{t("cancel")}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    topBranding: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    brandingTitle: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: 'bold',
    },
    scrollContent: { flexGrow: 1, paddingBottom: 40 },
    iconHeaderSection: {
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 30,
        paddingHorizontal: 40,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    headerSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
    },
    content: { paddingHorizontal: 20 },
    card: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
    },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: "600", marginBottom: 8, marginLeft: 4 },
    inputWrapper: {
        position: 'relative',
        justifyContent: 'center',
    },
    input: {
        height: 55,
        borderRadius: 15,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingRight: 50,
        fontSize: 16,
    },
    eyeBtn: {
        position: 'absolute',
        right: 15,
        height: '100%',
        justifyContent: 'center',
    },
    saveButton: {
        height: 60,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 10,
    },
    saveButtonText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
    cancelButton: {
        height: 55,
        borderRadius: 18,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 15,
    },
    cancelButtonText: { fontSize: 16, fontWeight: "600" },
});
