import { Ionicons } from "@expo/vector-icons";
import { ResponsiveView } from "../../components/ResponsiveView";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export default function LoginScreen() {
    const router = useRouter();
    const { colors, theme } = useTheme();
    const { t } = useTranslation();
    const { login, signup, loginWithGoogle, loading, user } = useAuth();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");

    useEffect(() => {
        if (user) {
            if (user.isOnboarded) {
                router.replace("/(tabs)/home");
            } else {
                router.replace("/onboarding");
            }
        }
    }, [user]);

    const handleAuth = async () => {
        if (!email || !password || (!isLogin && !name)) {
            Alert.alert(t("error"), t("fillAllFields"));
            return;
        }

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password, name);
            }
        } catch (error: any) {
            Alert.alert(t("authFailed"), error.message || t("errorOccurred"));
        }
    };

    return (
        <ResponsiveView maxWidth={480} style={[styles.container, { backgroundColor: Platform.OS === 'web' ? '#F0F2F5' : colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1, justifyContent: 'center' }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.content}>
                        {/* Logo */}
                        <View style={[styles.logoContainer, { backgroundColor: colors.card }]}>
                            <Ionicons name="medical" size={64} color={colors.primary} />
                        </View>

                        <Text style={[styles.title, { color: colors.text }]}>
                            {isLogin ? t("welcomeBack") : t("createAccount")}
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                            {isLogin
                                ? t("loginSubtitle")
                                : t("signupSubtitle")}
                        </Text>

                        {/* Inputs */}
                        {!isLogin && (
                            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Ionicons name="person-outline" size={20} color={colors.mutedText} style={styles.inputIcon} />
                                <TextInput
                                    placeholder={t("fullName")}
                                    placeholderTextColor={colors.mutedText}
                                    style={[styles.input, { color: colors.text }]}
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                        )}

                        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Ionicons name="mail-outline" size={20} color={colors.mutedText} style={styles.inputIcon} />
                            <TextInput
                                placeholder={t("emailAddress")}
                                placeholderTextColor={colors.mutedText}
                                style={[styles.input, { color: colors.text }]}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.mutedText} style={styles.inputIcon} />
                            <TextInput
                                placeholder={t("password")}
                                placeholderTextColor={colors.mutedText}
                                style={[styles.input, { color: colors.text }]}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.mainButton, { backgroundColor: colors.primary }]}
                            onPress={handleAuth}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.mainButtonText}>
                                    {isLogin ? t("signIn") : t("signUp")}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.toggleContainer}>
                            <Text style={[styles.toggleText, { color: colors.mutedText }]}>
                                {isLogin ? t("dontHaveAccount") : t("alreadyHaveAccount")}
                                <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                                    {isLogin ? t("signUp") : t("signIn")}
                                </Text>
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.dividerContainer}>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <Text style={[styles.dividerText, { color: colors.mutedText }]}>{t("or")}</Text>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        </View>

                        {/* Google Login Button */}
                        <TouchableOpacity
                            style={[styles.socialButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                            onPress={loginWithGoogle}
                            disabled={loading}
                        >
                            <Ionicons name="logo-google" size={24} color={colors.text} style={{ marginRight: 12 }} />
                            <Text style={[styles.socialButtonText, { color: colors.text }]}>{t("continueWithGoogle")}</Text>
                        </TouchableOpacity>

                        <Text style={[styles.footerText, { color: colors.mutedText }]}>
                            {t("termsPrivacy")}
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ResponsiveView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        padding: Platform.OS === 'web' ? 24 : 16,
    },
    content: {
        alignItems: "center",
        width: "100%",
        backgroundColor: Platform.OS === 'web' ? '#FFFFFF' : 'transparent',
        padding: Platform.OS === 'web' ? 40 : 0,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: Platform.OS === 'web' ? 0.05 : 0,
        shadowRadius: 20,
        elevation: 5,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
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
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        textAlign: "center",
        marginBottom: 32,
        paddingHorizontal: 10,
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
        color: "#FFF",
        fontSize: 18,
        fontWeight: "bold",
    },
    toggleContainer: {
        marginTop: 20,
        padding: 10,
    },
    toggleText: {
        fontSize: 14,
    },
    dividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        marginVertical: 32,
    },
    divider: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
        fontWeight: "600",
    },
    socialButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 24,
    },
    socialButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    footerText: {
        fontSize: 12,
        textAlign: 'center',
        opacity: 0.8,
        marginTop: 16,
    }
});
