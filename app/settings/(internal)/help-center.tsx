import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    LayoutAnimation,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from "react-native";
import ContactWeb3Form from "../../../components/ContactWeb3Form";
import { useTheme } from "../../../context/ThemeContext";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
    { q: "How do I reset my password?", a: "Go to Settings → Security → Change Password. You can update it there." },
    { q: "How do I connect my wearable device?", a: "Go to Settings → Devices and follow the on-screen pairing instructions for your device brand." },
    { q: "How does the voice assistant work?", a: 'Tap the mic icon and speak naturally. Try saying "go to fall risk" or "call family".' },
    { q: "Can I use the app in my language?", a: "Yes! Go to Settings → Language and select from 10 supported languages including Hindi, Spanish, and more." },
    { q: "How do I set medication reminders?", a: "Navigate to the Medications tab, add your medication, and enable reminder notifications." },
    { q: "How is my health data kept private?", a: "All your data is encrypted and stored securely. We never share your information with third parties." },
];

export default function HelpCenterScreen() {
    const router = useRouter();
    const { colors, accentColor } = useTheme();
    const { t } = useTranslation();
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const toggleFaq = (idx: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOpenFaq(openFaq === idx ? null : idx);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero */}
                <LinearGradient colors={["#007AFF28", "transparent"]} style={styles.hero}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
                        <Ionicons name="chevron-back" size={22} color={colors.text} />
                    </TouchableOpacity>
                    <View style={[styles.heroIcon, { backgroundColor: "#007AFF20" }]}>
                        <Ionicons name="help-circle" size={40} color="#007AFF" />
                    </View>
                    <Text style={[styles.heroTitle, { color: colors.text }]}>{t("helpCenter")}</Text>
                    <Text style={[styles.heroSub, { color: colors.mutedText }]}>Find answers or reach out to us</Text>
                </LinearGradient>

                <View style={styles.body}>
                    {/* Quick links */}
                    <View style={styles.quickGrid}>
                        {[
                            { icon: "chatbubble-ellipses", label: "Live Chat", color: "#34C759" },
                            { icon: "mail", label: "Email Us", color: "#007AFF" },
                            { icon: "document-text", label: "User Guide", color: "#FF9500" },
                            { icon: "videocam", label: "Video Tutorials", color: "#AF52DE" },
                        ].map((item, i) => (
                            <View key={i} style={[styles.quickCard, { backgroundColor: colors.card }]}>
                                <View style={[styles.quickIcon, { backgroundColor: item.color + "20" }]}>
                                    <Ionicons name={item.icon as any} size={24} color={item.color} />
                                </View>
                                <Text style={[styles.quickLabel, { color: colors.text }]}>{item.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* FAQ */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
                    {FAQS.map((faq, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={[styles.faqCard, { backgroundColor: colors.card, borderColor: openFaq === idx ? accentColor + "40" : colors.border }]}
                            onPress={() => toggleFaq(idx)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.faqHeader}>
                                <Text style={[styles.faqQ, { color: colors.text, flex: 1 }]}>{faq.q}</Text>
                                <View style={[styles.faqChevron, { backgroundColor: openFaq === idx ? accentColor + "18" : colors.background }]}>
                                    <Ionicons name={openFaq === idx ? "chevron-up" : "chevron-down"} size={16} color={openFaq === idx ? accentColor : colors.mutedText} />
                                </View>
                            </View>
                            {openFaq === idx && (
                                <Text style={[styles.faqA, { color: colors.mutedText, borderTopColor: colors.border }]}>{faq.a}</Text>
                            )}
                        </TouchableOpacity>
                    ))}

                    {/* Contact Form */}
                    <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 32 }]}>Still need help?</Text>
                    <Text style={[styles.sectionSub, { color: colors.mutedText }]}>Send us a message and we'll get back to you within 24 hours.</Text>
                    <View style={[styles.formWrapper, { backgroundColor: colors.card }]}>
                        <ContactWeb3Form />
                    </View>
                </View>
            </ScrollView>
        </View>
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
    quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
    quickCard: { width: "47%", padding: 16, borderRadius: 16, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    quickIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 8 },
    quickLabel: { fontSize: 13, fontWeight: "600" },

    sectionTitle: { fontSize: 20, fontWeight: "800", marginBottom: 12 },
    sectionSub: { fontSize: 14, marginBottom: 16, lineHeight: 20 },

    faqCard: { borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1 },
    faqHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    faqQ: { fontSize: 15, fontWeight: "600", paddingRight: 12, lineHeight: 22 },
    faqChevron: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
    faqA: { fontSize: 14, lineHeight: 22, marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },

    formWrapper: { borderRadius: 18, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
});
