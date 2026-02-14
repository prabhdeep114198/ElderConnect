import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import ContactWeb3Form from "../../../components/ContactWeb3Form";
import { ResponsiveView } from "../../../components/ResponsiveView";
import { useTheme } from "../../../context/ThemeContext";

export default function HelpCenterScreen() {
    const router = useRouter();
    const { colors, theme } = useTheme();
    const { t } = useTranslation();

    return (
        <ResponsiveView maxWidth={600} style={[styles.container, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                        <Text style={{ color: colors.primary, fontSize: 17 }}>{t("back") || "Back"}</Text>
                    </TouchableOpacity>
                    <Text style={[styles.largeTitle, { color: colors.text }]}>{t("helpCenter") || "Help Center"}</Text>
                    <Text style={[styles.subtitle, { color: colors.mutedText }]}>Need help? Check out our resources or send us a message.</Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Send us a message</Text>
                    <ContactWeb3Form />
                </View>

                <View style={[styles.faqSection, { borderTopColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
                    <View style={[styles.faqCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.faqQuestion, { color: colors.text }]}>How do I reset my password?</Text>
                        <Text style={[styles.faqAnswer, { color: colors.mutedText }]}>You can reset your password in the Security settings section of the app.</Text>
                    </View>
                    <View style={[styles.faqCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.faqQuestion, { color: colors.text }]}>How do I connect my device?</Text>
                        <Text style={[styles.faqAnswer, { color: colors.mutedText }]}>Go to the Devices section in Settings and follow the pairing instructions for your specific brand.</Text>
                    </View>
                </View>
            </ScrollView>
        </ResponsiveView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 40, paddingTop: Platform.OS === 'web' ? 20 : 60 },
    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
    closeButton: { alignSelf: 'flex-start', paddingBottom: 10 },
    largeTitle: { fontSize: 34, fontWeight: 'bold', letterSpacing: -0.5, marginTop: Platform.OS === 'web' ? 10 : 0 },
    subtitle: { fontSize: 16, marginTop: 8, marginBottom: 20 },
    section: { marginTop: 10, paddingHorizontal: 20 },
    sectionTitle: { fontSize: 22, fontWeight: '700', marginBottom: 15 },
    faqSection: { marginTop: 30, paddingHorizontal: 20, paddingTop: 20, borderTopWidth: 1 },
    faqCard: { padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
    faqQuestion: { fontSize: 17, fontWeight: '600', marginBottom: 5 },
    faqAnswer: { fontSize: 15, lineHeight: 20 },
});
