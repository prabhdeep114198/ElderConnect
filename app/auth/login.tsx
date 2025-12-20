import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password, name);
            }
        } catch (error: any) {
            Alert.alert("Authentication Failed", error.message || "An error occurred");
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    {/* Logo */}
                    <View style={[styles.logoContainer, { backgroundColor: colors.card }]}>
                        <Ionicons name="medical" size={64} color={colors.primary} />
                    </View>

                    <Text style={[styles.title, { color: colors.text }]}>
                        {isLogin ? "Welcome Back" : "Create Account"}
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                        {isLogin
                            ? "Your companion for a healthier, happier life."
                            : "Join us in making elder care simpler and better."}
                    </Text>

                    {/* Inputs */}
                    {!isLogin && (
                        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Ionicons name="person-outline" size={20} color={colors.mutedText} style={styles.inputIcon} />
                            <TextInput
                                placeholder="Full Name"
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
                            placeholder="Email Address"
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
                            placeholder="Password"
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
                                {isLogin ? "Sign In" : "Sign Up"}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.toggleContainer}>
                        <Text style={[styles.toggleText, { color: colors.mutedText }]}>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                                {isLogin ? "Sign Up" : "Sign In"}
                            </Text>
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <Text style={[styles.dividerText, { color: colors.mutedText }]}>OR</Text>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    </View>

                    {/* Google Login Button */}
                    <TouchableOpacity
                        style={[styles.socialButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={loginWithGoogle}
                        disabled={loading}
                    >
                        <Ionicons name="logo-google" size={24} color={colors.text} style={{ marginRight: 12 }} />
                        <Text style={[styles.socialButtonText, { color: colors.text }]}>Continue with Google</Text>
                    </TouchableOpacity>

                    <Text style={[styles.footerText, { color: colors.mutedText }]}>
                        By continuing, you agree to our Terms & Privacy Policy.
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 24,
    },
    content: {
        alignItems: "center",
        width: "100%",
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
