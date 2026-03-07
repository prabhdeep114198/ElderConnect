import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";

type PasswordField = {
    label: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    setShow: (v: boolean) => void;
    placeholder: string;
};

export default function ChangePasswordScreen() {
    const router = useRouter();
    const { colors, accentColor } = useTheme();
    const { t } = useTranslation();
    const { updatePassword } = useAuth();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const strengthScore = (() => {
        if (!newPassword) return 0;
        let s = 0;
        if (newPassword.length >= 8) s++;
        if (/[A-Z]/.test(newPassword)) s++;
        if (/[0-9]/.test(newPassword)) s++;
        if (/[^A-Za-z0-9]/.test(newPassword)) s++;
        return s;
    })();
    const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
    const strengthColors = ["", "#FF3B30", "#FF9500", "#34C759", "#007AFF"];

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert("Error", "All fields are required"); return;
        }
        if (newPassword.length < 8) {
            Alert.alert("Error", "New password must be at least 8 characters"); return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match"); return;
        }
        setLoading(true);
        try {
            await updatePassword(newPassword, currentPassword);
            Alert.alert("✅ Password Updated", "Your password has been changed successfully.");
            router.back();
        } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    const fields: PasswordField[] = [
        { label: t("currentPassword"), value: currentPassword, onChange: setCurrentPassword, show: showCurrent, setShow: setShowCurrent, placeholder: "Enter current password" },
        { label: t("newPassword"), value: newPassword, onChange: setNewPassword, show: showNew, setShow: setShowNew, placeholder: "Min 8 characters" },
        { label: t("confirmPassword"), value: confirmPassword, onChange: setConfirmPassword, show: showConfirm, setShow: setShowConfirm, placeholder: "Repeat new password" },
    ];

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <LinearGradient colors={["#FF9500" + "28", "transparent"]} style={styles.hero}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
                        <Ionicons name="chevron-back" size={22} color={colors.text} />
                    </TouchableOpacity>
                    <View style={[styles.heroIcon, { backgroundColor: "#FF9500" + "20" }]}>
                        <Ionicons name="lock-closed" size={38} color="#FF9500" />
                    </View>
                    <Text style={[styles.heroTitle, { color: colors.text }]}>Security</Text>
                    <Text style={[styles.heroSub, { color: colors.mutedText }]}>Update your account password</Text>
                </LinearGradient>

                <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>CHANGE PASSWORD</Text>
                    <View style={[styles.card, { backgroundColor: colors.card }]}>
                        {fields.map((field, idx) => (
                            <View
                                key={idx}
                                style={[styles.fieldRow, idx < fields.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                            >
                                <View style={styles.fieldContent}>
                                    <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>{field.label}</Text>
                                    <TextInput
                                        style={[styles.fieldInput, { color: colors.text }]}
                                        value={field.value}
                                        onChangeText={field.onChange}
                                        secureTextEntry={!field.show}
                                        placeholder={field.placeholder}
                                        placeholderTextColor={colors.mutedText}
                                        autoCapitalize="none"
                                    />
                                </View>
                                <TouchableOpacity onPress={() => field.setShow(!field.show)} style={[styles.eyeBtn, { backgroundColor: colors.background }]}>
                                    <Ionicons name={field.show ? "eye-off" : "eye"} size={18} color={colors.mutedText} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    {/* Strength meter */}
                    {newPassword.length > 0 && (
                        <View style={styles.strengthWrapper}>
                            <View style={styles.strengthBars}>
                                {[1, 2, 3, 4].map(i => (
                                    <View
                                        key={i}
                                        style={[styles.strengthBar, {
                                            backgroundColor: i <= strengthScore ? strengthColors[strengthScore] : colors.border,
                                        }]}
                                    />
                                ))}
                            </View>
                            <Text style={[styles.strengthLabel, { color: strengthColors[strengthScore] }]}>
                                {strengthLabels[strengthScore]}
                            </Text>
                        </View>
                    )}

                    {/* Tips */}
                    <View style={[styles.tipsCard, { backgroundColor: "#FF9500" + "12", borderColor: "#FF9500" + "30" }]}>
                        <Ionicons name="shield-checkmark" size={18} color="#FF9500" style={{ marginRight: 10, marginTop: 2 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.tipsTitle, { color: "#FF9500" }]}>Password Tips</Text>
                            {["Use at least 8 characters", "Mix uppercase, lowercase & numbers", "Add special characters for strength"].map((tip, i) => (
                                <Text key={i} style={[styles.tip, { color: colors.mutedText }]}>• {tip}</Text>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: "#FF9500", opacity: loading ? 0.7 : 1 }]}
                        onPress={handleChangePassword}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <Text style={styles.saveBtnText}>{t("updating")}</Text>
                        ) : (
                            <>
                                <Ionicons name="shield-checkmark" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.saveBtnText}>{t("updatePassword")}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    hero: { paddingTop: Platform.OS === "web" ? 24 : 60, paddingHorizontal: 20, paddingBottom: 30, alignItems: "center" },
    backBtn: { position: "absolute", top: Platform.OS === "web" ? 24 : 56, left: 20, width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
    heroIcon: { width: 84, height: 84, borderRadius: 42, justifyContent: "center", alignItems: "center", marginTop: 20, marginBottom: 14 },
    heroTitle: { fontSize: 28, fontWeight: "800", letterSpacing: -0.3 },
    heroSub: { fontSize: 14, marginTop: 4 },

    body: { padding: 20, paddingBottom: 48 },
    sectionLabel: { fontSize: 12, fontWeight: "600", letterSpacing: 0.8, marginBottom: 10, marginLeft: 4 },
    card: { borderRadius: 18, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    fieldRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
    fieldContent: { flex: 1 },
    fieldLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5, marginBottom: 4 },
    fieldInput: { fontSize: 16, fontWeight: "500" },
    eyeBtn: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center", marginLeft: 10 },

    strengthWrapper: { flexDirection: "row", alignItems: "center", marginTop: 12, marginLeft: 4 },
    strengthBars: { flexDirection: "row", flex: 1, gap: 4, marginRight: 10 },
    strengthBar: { flex: 1, height: 4, borderRadius: 2 },
    strengthLabel: { fontSize: 12, fontWeight: "700", minWidth: 48, textAlign: "right" },

    tipsCard: { flexDirection: "row", borderRadius: 14, padding: 14, marginTop: 20, borderWidth: 1, marginBottom: 8 },
    tipsTitle: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
    tip: { fontSize: 12, lineHeight: 20 },

    saveBtn: { flexDirection: "row", height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center", marginTop: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    saveBtnText: { color: "#FFF", fontSize: 17, fontWeight: "700" },
});
