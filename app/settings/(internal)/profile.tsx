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

export default function ProfileScreen() {
    const router = useRouter();
    const { colors, accentColor } = useTheme();
    const { t } = useTranslation();
    const { user, updateProfile } = useAuth();
    const [name, setName] = useState(user?.name || "");
    const [loading, setLoading] = useState(false);
    const [nameActive, setNameActive] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Error", "Name cannot be empty");
            return;
        }
        setLoading(true);
        try {
            await updateProfile(name);
            Alert.alert("✅ Success", "Profile updated successfully");
            router.back();
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const initials = (user?.name || "?")
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <LinearGradient colors={[accentColor + "30", "transparent"]} style={styles.hero}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
                        <Ionicons name="chevron-back" size={22} color={colors.text} />
                    </TouchableOpacity>

                    {/* Avatar */}
                    <View style={styles.avatarWrapper}>
                        <LinearGradient colors={[accentColor, accentColor + "BB"]} style={styles.avatar}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </LinearGradient>
                        <TouchableOpacity style={[styles.cameraBtn, { backgroundColor: accentColor }]}>
                            <Ionicons name="camera" size={16} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.heroName, { color: colors.text }]}>{user?.name || "Your Name"}</Text>
                    <Text style={[styles.heroSub, { color: colors.mutedText }]}>{user?.email}</Text>
                </LinearGradient>

                <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                    {/* Personal Info Card */}
                    <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>PERSONAL INFORMATION</Text>
                    <View style={[styles.card, { backgroundColor: colors.card }]}>
                        {/* Name field */}
                        <View style={[styles.fieldRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                            <View style={[styles.fieldIcon, { backgroundColor: accentColor + "18" }]}>
                                <Ionicons name="person" size={18} color={accentColor} />
                            </View>
                            <View style={styles.fieldContent}>
                                <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>{t("fullName")}</Text>
                                <TextInput
                                    style={[styles.fieldInput, { color: colors.text, borderColor: nameActive ? accentColor : "transparent" }]}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder={t("fullName")}
                                    placeholderTextColor={colors.mutedText}
                                    onFocus={() => setNameActive(true)}
                                    onBlur={() => setNameActive(false)}
                                />
                            </View>
                        </View>
                        {/* Email field (read-only) */}
                        <View style={styles.fieldRow}>
                            <View style={[styles.fieldIcon, { backgroundColor: "#5856D618" }]}>
                                <Ionicons name="mail" size={18} color="#5856D6" />
                            </View>
                            <View style={styles.fieldContent}>
                                <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>{t("email")}</Text>
                                <Text style={[styles.fieldValue, { color: colors.text }]}>{user?.email}</Text>
                            </View>
                            <View style={[styles.lockBadge, { backgroundColor: colors.border + "80" }]}>
                                <Ionicons name="lock-closed" size={12} color={colors.mutedText} />
                            </View>
                        </View>
                    </View>
                    <Text style={[styles.hint, { color: colors.mutedText }]}>
                        Your email is locked and used for account security. It cannot be changed.
                    </Text>

                    {/* SDG Badges & Impact Dashboard Section */}
                    <Text style={[styles.sectionLabel, { color: colors.mutedText, marginTop: 24 }]}>SUSTAINABILITY IMPACT</Text>
                    <View style={[styles.card, { backgroundColor: colors.card, marginBottom: 24 }]}>
                        <TouchableOpacity style={styles.fieldRow} onPress={() => router.push('/sdg-dashboard' as any)}>
                            <View style={[styles.fieldIcon, { backgroundColor: '#4CAF5018' }]}>
                                <Ionicons name="globe" size={18} color="#4CAF50" />
                            </View>
                            <View style={styles.fieldContent}>
                                <Text style={[styles.fieldValue, { color: colors.text }]}>UN SDG Impact Dashboard</Text>
                                <Text style={[{ color: colors.mutedText, fontSize: 13, marginTop: 2 }]}>View how you contribute to global goals.</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.border} />
                        </TouchableOpacity>

                        {/* Badges */}
                        <View style={[styles.badgesContainer, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                            <Text style={[styles.fieldLabel, { color: colors.mutedText, marginLeft: 16, marginTop: 12, marginBottom: 8 }]}>EARNED BADGES</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesScroll}>
                                <View style={[styles.badgeItem, { backgroundColor: colors.background }]}>
                                    <Ionicons name="shield-checkmark" size={28} color="#FF9800" />
                                    <Text style={[styles.badgeTitle, { color: colors.text }]}>Health Guardian</Text>
                                    <Text style={[styles.badgeSub, { color: colors.mutedText }]} numberOfLines={2}>Logged vitals for 7 days</Text>
                                </View>
                                <View style={[styles.badgeItem, { backgroundColor: colors.background }]}>
                                    <Ionicons name="home" size={28} color="#4CAF50" />
                                    <Text style={[styles.badgeTitle, { color: colors.text }]}>Independent Champ</Text>
                                    <Text style={[styles.badgeSub, { color: colors.mutedText }]} numberOfLines={2}>No falls for 30 days</Text>
                                </View>
                                <View style={[styles.badgeItem, { backgroundColor: colors.background }]}>
                                    <Ionicons name="leaf" size={28} color="#00BCD4" />
                                    <Text style={[styles.badgeTitle, { color: colors.text }]}>Eco Saver</Text>
                                    <Text style={[styles.badgeSub, { color: colors.mutedText }]} numberOfLines={2}>Eco mode active 24h+</Text>
                                </View>
                            </ScrollView>
                        </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: accentColor, opacity: loading ? 0.7 : 1 }]}
                        onPress={handleSave}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <Text style={styles.saveBtnText}>{t("saving")}</Text>
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.saveBtnText}>{t("saveChanges")}</Text>
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
    avatarWrapper: { marginTop: 20, marginBottom: 14, position: "relative" },
    avatar: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
    avatarText: { fontSize: 38, fontWeight: "800", color: "#FFF", letterSpacing: 1 },
    cameraBtn: { position: "absolute", bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: "#FFF" },
    heroName: { fontSize: 24, fontWeight: "800", letterSpacing: -0.3 },
    heroSub: { fontSize: 14, marginTop: 4 },

    body: { padding: 20, paddingBottom: 48 },
    sectionLabel: { fontSize: 12, fontWeight: "600", letterSpacing: 0.8, marginBottom: 10, marginLeft: 4 },
    card: { borderRadius: 18, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    fieldRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
    fieldIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 14 },
    fieldContent: { flex: 1 },
    fieldLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5, marginBottom: 3 },
    fieldInput: { fontSize: 16, fontWeight: "500", borderBottomWidth: 1.5, paddingBottom: 2 },
    fieldValue: { fontSize: 16, fontWeight: "500" },
    lockBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: "row", alignItems: "center" },
    hint: { fontSize: 12, lineHeight: 18, marginTop: 10, marginLeft: 4, marginBottom: 32 },
    saveBtn: { flexDirection: "row", height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    saveBtnText: { color: "#FFF", fontSize: 17, fontWeight: "700" },
    
    // Badges
    badgesContainer: { paddingBottom: 16 },
    badgesScroll: { paddingHorizontal: 16 },
    badgeItem: { width: 110, padding: 12, borderRadius: 12, alignItems: 'center', marginRight: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
    badgeTitle: { fontSize: 13, fontWeight: 'bold', marginTop: 8, textAlign: 'center' },
    badgeSub: { fontSize: 11, textAlign: 'center', marginTop: 4 },
});
