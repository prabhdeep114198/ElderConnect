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

export default function ContactUsScreen() {
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
                    <Text style={[styles.largeTitle, { color: colors.text }]}>{t("contactUs") || "Contact Us"}</Text>
                    <Text style={[styles.subtitle, { color: colors.mutedText }]}>We'd love to hear from you. Please fill out the form below.</Text>
                </View>

                <View style={styles.section}>
                    <ContactWeb3Form />
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
});
