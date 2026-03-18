import { Ionicons } from "@expo/vector-icons";
import { ResponsiveView } from "../components/ResponsiveView";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useResponsive } from "../hooks/useResponsive";
import { getFontSize } from "../utils/typography";
import { api } from "../services/api/client";

export default function ResetPasswordScreen() {
    const router = useRouter();
    const { token } = useLocalSearchParams<{ token: string }>();
    const { colors, fontSize } = useTheme();
    
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { isDesktop, isWeb } = useResponsive();

    const handleReset = async () => {
        if (!token) {
            Alert.alert("Missing Token", "This password reset link is invalid or expired.");
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert("Password too short", "Password must be at least 6 characters long.");
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Passwords mismatch", "The passwords you entered do not match.");
            return;
        }

        setLoading(true);
        try {
            await api.post('/v1/auth/reset-password', {
                token: token,
                newPassword: newPassword,
            }, { requiresAuth: false });
            
            Alert.alert(
                "Success!",
                "Your password has been reset successfully. You can now log in.",
                [{ text: "Go to Login", onPress: () => router.replace("/auth/login") }]
            );
        } catch (error: any) {
            Alert.alert("Reset Failed", error.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ResponsiveView maxWidth={isDesktop ? 600 : 480} style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <View style={[styles.content, { backgroundColor: isWeb ? colors.card : 'transparent' }]}>
                    
                    <View style={[styles.logoContainer, { backgroundColor: colors.card }]}>
                        <Ionicons name="lock-closed" size={48} color={colors.primary} />
                    </View>

                    <Text style={[styles.title, { color: colors.text, fontSize: getFontSize(24, fontSize) }]}>
                        Reset Password
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.mutedText, fontSize: getFontSize(16, fontSize) }]}>
                        Enter a new password for your account.
                    </Text>

                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="key-outline" size={20} color={colors.mutedText} style={styles.inputIcon} />
                        <TextInput
                            placeholder="New Password"
                            placeholderTextColor={colors.mutedText}
                            style={[styles.input, { color: colors.text }]}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                        />
                    </View>

                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="checkmark-done-outline" size={20} color={colors.mutedText} style={styles.inputIcon} />
                        <TextInput
                            placeholder="Confirm New Password"
                            placeholderTextColor={colors.mutedText}
                            style={[styles.input, { color: colors.text }]}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.mainButton, { backgroundColor: colors.primary }]}
                        onPress={handleReset}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={[styles.mainButtonText, { fontSize: getFontSize(18, fontSize) }]}>
                                Update Password
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.replace("/auth/login")} style={styles.backButton}>
                        <Text style={[styles.backText, { color: colors.primary, fontSize: getFontSize(14, fontSize) }]}>
                            Back to Login
                        </Text>
                    </TouchableOpacity>

                </View>
            </KeyboardAvoidingView>
        </ResponsiveView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
    },
    content: {
        alignItems: "center",
        width: "100%",
        padding: 24,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 5,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    title: {
        fontWeight: "bold",
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        textAlign: "center",
        marginBottom: 32,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: "100%",
    },
    mainButton: {
        width: "100%",
        height: 56,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    mainButtonText: {
        color: "#FFFFFF",
        fontWeight: "bold",
    },
    backButton: {
        marginTop: 24,
    },
    backText: {
        fontWeight: "600",
    },
});
