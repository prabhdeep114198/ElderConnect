import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import ContactWeb3Form from "../../../components/ContactWeb3Form";
import { useTheme } from "../../../context/ThemeContext";

const CONTACT_CARDS = [
    { icon: "mail-outline", label: "Email Support", value: "support@elderconnect.app", color: "#007AFF", action: "mailto:support@elderconnect.app" },
    { icon: "call-outline", label: "Phone", value: "+1 (800) ELDER-01", color: "#34C759", action: "tel:+18003533701" },
    { icon: "logo-twitter", label: "Twitter / X", value: "@ElderConnectApp", color: "#1DA1F2", action: "https://twitter.com/ElderConnectApp" },
];

export default function ContactUsScreen() {
    const router = useRouter();
    const { colors, accentColor } = useTheme();
    const { t } = useTranslation();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero */}
                <LinearGradient colors={["#34C75928", "transparent"]} style={styles.hero}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
                        <Ionicons name="chevron-back" size={22} color={colors.text} />
                    </TouchableOpacity>
                    <View style={[styles.heroIcon, { backgroundColor: "#34C75920" }]}>
                        <Ionicons name="chatbubble-ellipses" size={40} color="#34C759" />
                    </View>
                    <Text style={[styles.heroTitle, { color: colors.text }]}>{t("contactUs")}</Text>
                    <Text style={[styles.heroSub, { color: colors.mutedText }]}>We're here for you 24/7</Text>
                </LinearGradient>

                <View style={styles.body}>
                    {/* Contact channels */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Reach Out Directly</Text>
                    {CONTACT_CARDS.map((card, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.contactCard, { backgroundColor: colors.card }]}
                            onPress={() => Linking.openURL(card.action)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.contactIcon, { backgroundColor: card.color + "18" }]}>
                                <Ionicons name={card.icon as any} size={24} color={card.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.contactLabel, { color: colors.mutedText }]}>{card.label}</Text>
                                <Text style={[styles.contactValue, { color: colors.text }]}>{card.value}</Text>
                            </View>
                            <Ionicons name="open-outline" size={16} color={colors.mutedText} />
                        </TouchableOpacity>
                    ))}

                    {/* Info banner */}
                    <View style={[styles.infoBanner, { backgroundColor: accentColor + "12", borderColor: accentColor + "30" }]}>
                        <Ionicons name="time-outline" size={18} color={accentColor} />
                        <Text style={[styles.infoBannerText, { color: colors.text }]}>
                            <Text style={{ fontWeight: "700" }}>Response time: </Text>
                            We typically reply within 2-4 business hours.
                        </Text>
                    </View>

                    {/* Form */}
                    <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 28 }]}>Send a Message</Text>
                    <Text style={[styles.sectionSub, { color: colors.mutedText }]}>Fill out the form and we'll get back to you shortly.</Text>
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
    sectionTitle: { fontSize: 20, fontWeight: "800", marginBottom: 12 },
    sectionSub: { fontSize: 14, marginBottom: 16, lineHeight: 20 },

    contactCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    contactIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center", marginRight: 14 },
    contactLabel: { fontSize: 12, fontWeight: "500", marginBottom: 2 },
    contactValue: { fontSize: 15, fontWeight: "600" },

    infoBanner: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 4 },
    infoBannerText: { fontSize: 13, flex: 1, lineHeight: 20 },

    formWrapper: { borderRadius: 18, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
});
