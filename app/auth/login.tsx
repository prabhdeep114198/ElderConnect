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
    View,
    Dimensions
} from "react-native";
import { Image } from "expo-image";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useResponsive } from "../../hooks/useResponsive";
import { getFontSize } from "../../utils/typography";
import { api } from "../../services/api/client";

export default function LoginScreen() {
    const router = useRouter();
    const { colors, theme, fontSize, uiMode } = useTheme();
    const { t } = useTranslation();
    const { login, signup, loginWithGoogle, loading, user } = useAuth();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");

    const [role, setRole] = useState("elder");

    useEffect(() => {
        if (user) {
            if (user.roles?.includes("admin")) {
                router.replace("/(tabs)/reports"); // Admins go to reports/analytics
            } else if (user.roles?.includes("caregiver")) {
                router.replace("/(tabs)/home"); // Caregivers also see home but filtered
            } else if (user.isOnboarded) {
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
                await signup(email, password, name, [role]);
            }
        } catch (error: any) {
            Alert.alert(t("authFailed"), error.message || t("errorOccurred"));
        }
    };

    const handleForgotPassword = async () => {
        if (!email.trim()) {
            Alert.alert(t("emailRequired", "Email Required"), t("enterEmailFirst", "Please enter your email address to reset your password."));
            return;
        }
        try {
            await api.post('/v1/auth/forgot-password', { email: email.trim() }, { requiresAuth: false });
            Alert.alert(t("checkEmail", "Check Your Email"), t("resetLinkSent", "If an account exists, a password reset link has been sent."));
        } catch (error: any) {
            Alert.alert(t("errorOccurred"), error.message || "Something went wrong. Please try again.");
        }
    };

    const { isDesktop, isWeb } = useResponsive();

    return (
        <ResponsiveView maxWidth={isDesktop ? 1000 : 480} style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1, justifyContent: 'center' }}
            >
                <ScrollView contentContainerStyle={isWeb ? styles.webScrollContent : styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={[styles.content, isDesktop && styles.desktopContent, { backgroundColor: isWeb ? colors.card : 'transparent' }]}>

                        {/* Split Screen Image for Desktop */}
                        {isDesktop && (
                            <View style={styles.imageContainer}>
                                <Image
                                    source={require("../../assets/images/login_banner.png")}
                                    style={styles.bannerImage}
                                    contentFit="cover"
                                    transition={500}
                                />
                                <View style={styles.imageOverlay}>
                                    <Text style={styles.overlayTitle}>{t("ElderConnect") || "ElderConnect"}</Text>
                                    <Text style={styles.overlaySubtitle}>{t("Compassionate care, connected technology.") || "Compassionate care, connected technology."}</Text>
                                </View>
                            </View>
                        )}

                        <View style={[styles.formSection, isDesktop && styles.desktopFormSection]}>
                            {/* Logo */}
                            <View style={[styles.logoContainer, { backgroundColor: colors.card }]}>
                                <Ionicons name="medical" size={isWeb ? 48 : 64} color={colors.primary} />
                            </View>

                            <Text style={[styles.title, { color: colors.text, fontSize: getFontSize(isWeb ? 24 : 28, fontSize) }]}>
                                {isLogin ? t("welcomeBack") : t("createAccount")}
                            </Text>
                            <Text style={[styles.subtitle, { color: colors.mutedText, fontSize: getFontSize(16, fontSize) }]}>
                                {isLogin
                                    ? t("loginSubtitle")
                                    : t("signupSubtitle")}
                            </Text>

                            {/* Role Selector (Always Visible now, for clarity) */}
                            <View style={styles.roleSelector}>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    style={[
                                        styles.roleButton,
                                        { backgroundColor: colors.card, borderColor: role === "elder" ? colors.primary : colors.border },
                                        role === "elder" && { backgroundColor: colors.primary + '10' }
                                    ]}
                                    onPress={() => setRole("elder")}
                                >
                                    <Ionicons name="person" size={24} color={role === "elder" ? colors.primary : colors.mutedText} />
                                    <Text style={[styles.roleLabel, { color: role === "elder" ? colors.primary : colors.mutedText }]}>{t("elder") || "Elderly User"}</Text>
                                </TouchableOpacity>
                                <View style={{ width: 16 }} />
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    style={[
                                        styles.roleButton,
                                        { backgroundColor: colors.card, borderColor: role === "caregiver" ? colors.primary : colors.border },
                                        role === "caregiver" && { backgroundColor: colors.primary + '10' }
                                    ]}
                                    onPress={() => setRole("caregiver")}
                                >
                                    <Ionicons name="heart" size={24} color={role === "caregiver" ? colors.primary : colors.mutedText} />
                                    <Text style={[styles.roleLabel, { color: role === "caregiver" ? colors.primary : colors.mutedText }]}>{t("caregiver") || "Caregiver/Family"}</Text>
                                </TouchableOpacity>
                            </View>

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

                            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: isLogin ? 6 : 16 }]}>
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

                            {isLogin && (
                                <View style={{ width: '100%', alignItems: 'flex-end', marginBottom: 16 }}>
                                    <TouchableOpacity onPress={handleForgotPassword}>
                                        <Text style={{ color: colors.primary, fontSize: getFontSize(13, fontSize), fontWeight: "600" }}>
                                            {t("forgotPassword", "Forgot Password?")}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.mainButton, { backgroundColor: colors.primary }]}
                                onPress={handleAuth}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={[styles.mainButtonText, { color: colors.buttonText, fontSize: getFontSize(18, fontSize) }]}>
                                        {isLogin ? t("signIn") : t("signUp")}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.toggleContainer}>
                                <Text style={[styles.toggleText, { color: colors.mutedText, fontSize: getFontSize(14, fontSize) }]}>
                                    {isLogin ? t("dontHaveAccount") : t("alreadyHaveAccount")}
                                    <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                                        {" "}{isLogin ? t("signUp") : t("signIn")}
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
                                <Text style={[styles.socialButtonText, { color: colors.text, fontSize: getFontSize(16, fontSize) }]}>{t("continueWithGoogle")}</Text>
                            </TouchableOpacity>

                            <Text style={[styles.footerText, { color: colors.mutedText, fontSize: getFontSize(12, fontSize) }]}>
                                {t("termsPrivacy")}
                            </Text>
                        </View>
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
        padding: 16,
    },
    webScrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 24,
        alignItems: 'center',
    },
    content: {
        alignItems: "center",
        width: "100%",
        borderRadius: 24,
        overflow: 'hidden', // Required for split screen rounded corners
    },
    desktopContent: {
        flexDirection: 'row',
        alignItems: 'stretch',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 10,
        minHeight: 650,
    },
    imageContainer: {
        flex: 1.1,
        position: 'relative',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 40,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    overlayTitle: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    overlaySubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 18,
        lineHeight: 24,
    },
    formSection: {
        width: "100%",
        alignItems: "center",
        padding: Platform.OS === 'web' ? 40 : 0,
    },
    desktopFormSection: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 60,
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
    roleSelector: {
        flexDirection: 'row',
        width: '100%',
        marginBottom: 24,
    },
    roleButton: {
        flex: 1,
        height: 80,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'transparent',
        backgroundColor: 'rgba(0,0,0,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
    },
    roleLabel: {
        marginTop: 4,
        fontSize: 14,
        fontWeight: '600',
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
        color: "#FFFFFF",
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
