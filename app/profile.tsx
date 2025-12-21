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

export default function ProfileScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { t } = useTranslation();
    const { user, updateProfile } = useAuth();
    const [name, setName] = useState(user?.name || "");
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Error", "Name cannot be empty");
            return;
        }

        setLoading(true);
        try {
            await updateProfile(name);
            Alert.alert("Success", "Profile updated successfully");
            router.back();
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to update profile");
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
                    <Text style={[styles.title, { color: colors.text }]}>{t("profile")}</Text>
                </View>

                <View style={styles.content}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.mutedText }]}>{t("fullName")}</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.card,
                                    color: colors.text,
                                    borderColor: colors.border,
                                },
                            ]}
                            value={name}
                            onChangeText={setName}
                            placeholder={t("fullName")}
                            placeholderTextColor={colors.mutedText}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.mutedText }]}>{t("emailAddress")}</Text>
                        <TextInput
                            style={[
                                styles.input,
                                styles.disabledInput,
                                {
                                    backgroundColor: colors.border,
                                    color: colors.mutedText,
                                    borderColor: colors.border,
                                },
                            ]}
                            value={user?.email}
                            editable={false}
                            placeholder={t("emailAddress")}
                        />
                        <Text style={styles.infoText}>{t("emailCannotBeChanged")}</Text>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 },
                        ]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <Text style={styles.saveButtonText}>{loading ? t("saving") : t("saveChanges")}</Text>
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
    disabledInput: { opacity: 0.8 },
    infoText: {
        fontSize: 14,
        color: "#666",
        marginTop: 4,
        fontStyle: "italic",
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
