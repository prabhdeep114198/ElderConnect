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
    const { colors } = useTheme();
    const { t } = useTranslation();
    const { updatePassword } = useAuth();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

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
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={28} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>{t("changePassword")}</Text>
                </View>

                <View style={styles.content}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.mutedText }]}>{t("currentPassword")}</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.card,
                                    color: colors.text,
                                    borderColor: colors.border,
                                },
                            ]}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            placeholder={t("currentPassword")}
                            placeholderTextColor={colors.mutedText}
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.mutedText }]}>{t("newPassword")}</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.card,
                                    color: colors.text,
                                    borderColor: colors.border,
                                },
                            ]}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder={t("newPassword")}
                            placeholderTextColor={colors.mutedText}
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.mutedText }]}>{t("confirmPassword")}</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.card,
                                    color: colors.text,
                                    borderColor: colors.border,
                                },
                            ]}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder={t("confirmPassword")}
                            placeholderTextColor={colors.mutedText}
                            secureTextEntry
                        />
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
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.cancelButton, { borderColor: colors.border }]}
                        onPress={() => router.back()}
                        disabled={loading}
                    >
                        <Text style={[styles.cancelButtonText, { color: colors.text }]}>{t("cancel")}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingBottom: 40 },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        marginBottom: 32,
        flexDirection: "row",
        alignItems: "center",
    },
    backButton: { marginRight: 16 },
    backButtonText: { fontSize: 18, fontWeight: "600" },
    title: { fontSize: 32, fontWeight: "bold" },
    content: { paddingHorizontal: 24 },
    inputGroup: { marginBottom: 24 },
    label: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
    input: {
        height: 60,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        fontSize: 18,
    },
    saveButton: {
        height: 60,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    saveButtonText: { color: "#FFF", fontSize: 20, fontWeight: "bold" },
    cancelButton: {
        height: 60,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 12,
    },
    cancelButtonText: { fontSize: 18, fontWeight: "600" },
});
