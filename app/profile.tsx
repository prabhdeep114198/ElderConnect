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
    const { colors, theme } = useTheme();
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
            <View style={[styles.topBranding, { backgroundColor: colors.primary }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="chevron-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.brandingTitle}>{t("profile")}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.avatarSection}>
                    <View style={[styles.avatarCircle, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                        <Ionicons name="person" size={80} color={colors.primary} />
                        <TouchableOpacity style={styles.editAvatarBtn}>
                            <Ionicons name="camera" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.profileNamePrimary, { color: colors.text }]}>{user?.name}</Text>
                    <Text style={[styles.profileEmailSecondary, { color: colors.mutedText }]}>{user?.email}</Text>
                </View>

                <View style={styles.content}>
                    <View style={[styles.card, { backgroundColor: colors.card }]}>
                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Ionicons name="person-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                                <Text style={[styles.label, { color: colors.text }]}>{t("fullName")}</Text>
                            </View>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: theme === 'dark' ? colors.background : '#F9FCFF',
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

                        <View style={[styles.inputGroup, { marginBottom: 10 }]}>
                            <View style={styles.labelRow}>
                                <Ionicons name="mail-outline" size={18} color={colors.mutedText} style={{ marginRight: 8 }} />
                                <Text style={[styles.label, { color: colors.mutedText }]}>{t("emailAddress")}</Text>
                            </View>
                            <TextInput
                                style={[
                                    styles.input,
                                    styles.disabledInput,
                                    {
                                        backgroundColor: theme === 'dark' ? colors.background : '#F0F0F0',
                                        color: colors.mutedText,
                                        borderColor: colors.border,
                                    },
                                ]}
                                value={user?.email}
                                editable={false}
                                placeholder={t("emailAddress")}
                            />
                            <View style={styles.infoRow}>
                                <Ionicons name="information-circle-outline" size={14} color={colors.mutedText} style={{ marginRight: 4 }} />
                                <Text style={[styles.infoText, { color: colors.mutedText }]}>{t("emailCannotBeChanged")}</Text>
                            </View>
                        </View>
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
                        {!loading && <Ionicons name="checkmark-circle" size={20} color="#FFF" style={{ marginLeft: 8 }} />}
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
    avatarSection: {
        alignItems: 'center',
        marginTop: -40,
        marginBottom: 20,
    },
    avatarCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#2E5EAA',
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    profileNamePrimary: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 15,
    },
    profileEmailSecondary: {
        fontSize: 16,
        marginTop: 4,
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
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: { fontSize: 14, fontWeight: "600" },
    input: {
        height: 55,
        borderRadius: 15,
        borderWidth: 1,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    disabledInput: { opacity: 0.8 },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    infoText: {
        fontSize: 12,
        fontStyle: "italic",
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
