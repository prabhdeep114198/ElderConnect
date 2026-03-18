import { Ionicons } from "@expo/vector-icons";
import { ResponsiveView } from "../components/ResponsiveView";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useResponsive } from "../hooks/useResponsive";
import { getFontSize } from "../utils/typography";
import { api } from "../services/api/client";

export default function VerifyEmailScreen() {
    const router = useRouter();
    const { token } = useLocalSearchParams<{ token: string }>();
    const { colors, fontSize } = useTheme();
    const { isDesktop, isWeb } = useResponsive();

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setErrorMessage("Invalid or missing verification token.");
            return;
        }

        const verify = async () => {
            try {
                await api.post('/v1/auth/verify-email', { token }, { requiresAuth: false });
                setStatus("success");
            } catch (err: any) {
                setStatus("error");
                setErrorMessage(err.message || "Email verification failed.");
            }
        };

        verify();
    }, [token]);

    return (
        <ResponsiveView maxWidth={isDesktop ? 600 : 480} style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.content, { backgroundColor: isWeb ? colors.card : 'transparent' }]}>
                
                {status === "loading" && (
                    <>
                        <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 20 }} />
                        <Text style={[styles.title, { color: colors.text, fontSize: getFontSize(22, fontSize) }]}>
                            Verifying your email...
                        </Text>
                    </>
                )}

                {status === "success" && (
                    <>
                        <View style={[styles.logoContainer, { backgroundColor: '#4CD96420' }]}>
                            <Ionicons name="checkmark-circle" size={56} color="#4CD964" />
                        </View>
                        <Text style={[styles.title, { color: colors.text, fontSize: getFontSize(24, fontSize) }]}>
                            Email Verified!
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.mutedText, fontSize: getFontSize(16, fontSize) }]}>
                            Your email address has been successfully verified. You can now access all features.
                        </Text>
                        <TouchableOpacity
                            style={[styles.mainButton, { backgroundColor: colors.primary }]}
                            onPress={() => router.replace("/auth/login")}
                        >
                            <Text style={[styles.mainButtonText, { fontSize: getFontSize(18, fontSize) }]}>
                                Continue to App
                            </Text>
                        </TouchableOpacity>
                    </>
                )}

                {status === "error" && (
                    <>
                        <View style={[styles.logoContainer, { backgroundColor: '#FF3B3020' }]}>
                            <Ionicons name="close-circle" size={56} color="#FF3B30" />
                        </View>
                        <Text style={[styles.title, { color: colors.text, fontSize: getFontSize(24, fontSize) }]}>
                            Verification Failed
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.mutedText, fontSize: getFontSize(16, fontSize) }]}>
                            {errorMessage}
                        </Text>
                        <TouchableOpacity
                            style={[styles.mainButton, { backgroundColor: colors.primary }]}
                            onPress={() => router.replace("/auth/login")}
                        >
                            <Text style={[styles.mainButtonText, { fontSize: getFontSize(18, fontSize) }]}>
                                Back to Login
                            </Text>
                        </TouchableOpacity>
                    </>
                )}

            </View>
        </ResponsiveView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
    },
    content: {
        alignItems: "center",
        width: "100%",
        padding: 32,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 5,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },
    title: {
        fontWeight: "bold",
        marginBottom: 12,
        textAlign: "center",
    },
    subtitle: {
        textAlign: "center",
        marginBottom: 32,
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
});
