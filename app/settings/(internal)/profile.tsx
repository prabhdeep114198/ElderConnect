import { Ionicons } from "@expo/vector-icons";
import { ResponsiveView } from "../../../components/ResponsiveView";
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
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";

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
        <ResponsiveView maxWidth={600} style={[styles.container, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]}>
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
                        <Text style={[styles.largeTitle, { color: colors.text }]}>Profile</Text>
                    </View>

                    <View style={styles.avatarSection}>
                        <View style={[styles.avatarCircle, { backgroundColor: colors.card }]}>
                            <Ionicons name="person" size={80} color={colors.primary} />
                            <TouchableOpacity style={styles.editAvatarBtn}>
                                <Ionicons name="camera" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionHeader, { color: colors.mutedText }]}>PERSONAL INFORMATION</Text>
                        <View style={[styles.card, { backgroundColor: colors.card }]}>
                            <View style={[styles.inputRow, { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
                                <Text style={[styles.label, { color: colors.text }]}>Name</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Full Name"
                                    placeholderTextColor={colors.mutedText}
                                />
                            </View>
                            <View style={styles.inputRow}>
                                <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                                <Text style={[styles.readOnlyText, { color: colors.mutedText }]}>{user?.email}</Text>
                            </View>
                        </View>
                        <Text style={styles.footerText}>Your email address cannot be changed. It is used for account recovery and security notifications.</Text>
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            <Text style={styles.saveButtonText}>{loading ? "Saving..." : "Save Changes"}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ResponsiveView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
    closeButton: { alignSelf: 'flex-start', paddingBottom: 10 },
    largeTitle: { fontSize: 34, fontWeight: 'bold', letterSpacing: -0.5 },
    avatarSection: { alignItems: 'center', marginVertical: 30 },
    avatarCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#007AFF',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    section: { marginTop: 10, paddingHorizontal: 20 },
    sectionHeader: { fontSize: 13, fontWeight: '400', marginBottom: 8, marginLeft: 16 },
    card: { borderRadius: 12, overflow: 'hidden' },
    inputRow: { flexDirection: 'row', alignItems: 'center', padding: 12, marginLeft: 16, paddingLeft: 0 },
    label: { fontSize: 17, width: 80 },
    input: { flex: 1, fontSize: 17, textAlign: 'right' },
    readOnlyText: { flex: 1, fontSize: 17, textAlign: 'right' },
    footerText: { color: '#8E8E93', fontSize: 13, paddingHorizontal: 16, marginTop: 10, lineHeight: 18 },
    buttonContainer: { marginTop: 40, paddingHorizontal: 20 },
    saveButton: { height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    saveButtonText: { color: "#FFF", fontSize: 17, fontWeight: "600" },
});
