import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

// Define Types
interface SettingItemType {
  type: "item" | "toggle";
  title: string;
  subtitle?: string;
  key?: string; // for toggle
  action?: string; // for item
}

interface SettingsSectionType {
  title: string;
  data: SettingItemType[];
}

// Mock function to fetch settings from backend
const fetchSettings = (t: any): SettingsSectionType[] => [
  {
    title: t("account"),
    data: [
      { type: "item", title: t("profile"), subtitle: t("profileSubtitle"), action: "profile" },
      { type: "item", title: t("myDevices"), subtitle: t("myDevicesSubtitle") || "Connect your watch or monitor", action: "devices" },
      { type: "item", title: t("changePassword"), subtitle: t("changePasswordSubtitle"), action: "changePassword" },
      { type: "item", title: t("emailPreferences"), subtitle: t("emailPreferencesSubtitle"), action: "emailPreferences" },
    ],

  },
  {
    title: t("subscription"),
    data: [
      { type: "item", title: t("manageSubscription"), subtitle: t("manageSubscriptionSubtitle"), action: "manageSubscription" },
      { type: "item", title: t("billingHistory"), subtitle: t("billingHistorySubtitle"), action: "billingHistory" },
      { type: "item", title: t("upgradePlan"), subtitle: t("upgradePlanSubtitle"), action: "upgradePlan" },
    ],
  },
  {
    title: t("preferences"),
    data: [
      { type: "toggle", title: t("notifications"), key: "notifications", subtitle: t("notificationsSubtitle") },
      { type: "toggle", title: t("darkMode"), key: "darkMode", subtitle: t("darkModeSubtitle") },
      { type: "item", title: t("language"), subtitle: t("languageSubtitleEnglish"), action: "language" },
    ],
  },
  {
    title: t("support"),
    data: [
      { type: "item", title: t("helpCenter"), action: "helpCenter", subtitle: t("helpCenterSubtitle") },
      { type: "item", title: t("contactUs"), action: "contactUs", subtitle: t("contactUsSubtitle") },
      { type: "item", title: t("privacyPolicy"), action: "privacyPolicy" },
      { type: "item", title: t("termsOfService"), action: "termsOfService" },
    ],
  },
];

const LANGUAGES = [
  { label: "English", value: "en", subtitle: "English (US)" },
  { label: "Hindi", value: "hi", subtitle: "हिन्दी" },
  { label: "Punjabi", value: "pa", subtitle: "ਪੰਜਾਬੀ" },
  { label: "Spanish", value: "es", subtitle: "Español" },
  { label: "French", value: "fr", subtitle: "Français" },
  { label: "German", value: "de", subtitle: "Deutsch" },
  { label: "Bengali", value: "bn", subtitle: "বাংলা" },
  { label: "Tamil", value: "ta", subtitle: "தமிழ்" },
  { label: "Telugu", value: "te", subtitle: "తెలుగు" },
  { label: "Marathi", value: "mr", subtitle: "मराठी" },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, colors, toggleTheme } = useTheme();
  const { user, logout, requireAuth, refreshSubscription } = useAuth();
  const { t, i18n } = useTranslation();
  const [settingsSections, setSettingsSections] = useState<SettingsSectionType[]>([]);
  const [toggles, setToggles] = useState<{ [key: string]: boolean }>({
    notifications: true,
    darkMode: theme === "dark",
  });
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);

  useEffect(() => {
    setToggles((prev) => ({ ...prev, darkMode: theme === "dark" }));
  }, [theme]);

  useEffect(() => {
    const loadSettings = () => {
      const data = fetchSettings(t);
      setSettingsSections(data);
    };
    loadSettings();
  }, [i18n.language]);

  const handleToggleChange = (key: string, value: boolean) => {
    if (key === "darkMode") {
      toggleTheme();
    } else {
      setToggles((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleItemAction = (action?: string) => {
    if (!action) return;

    switch (action) {
      case "profile":
        requireAuth(() => router.push("/profile"));
        break;
      case "devices":
        requireAuth(() => router.push("/DevicesScreen"));
        break;
      case "changePassword":

        requireAuth(() => router.push("/change-password"));
        break;
      case "upgradePlan":
        requireAuth(() => router.push("/upgrade-plan"));
        break;
      case "manageSubscription":
        requireAuth(() => router.push("/manage-subscription"));
        break;
      case "billingHistory":
        requireAuth(() => router.push("/billing-history"));
        break;
      case "language":
        setIsLanguageModalVisible(true);
        break;
      default:
        Alert.alert("Action", `Perform ${action}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Router redirection is handled in AuthContext or _layout, but we can double check
    } catch (err: any) {
      Alert.alert("Logout Failed", err.message);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert("Delete Account", "Are you sure? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Alert.alert("Success", "Account deleted");
          logout();
        },
      },
    ]);
  };

  const SettingItem = ({ title, subtitle, onPress }: any) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.settingTextContainer}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: colors.mutedText }]}>{subtitle}</Text>}
      </View>
      <Text style={[styles.arrow, { color: colors.mutedText }]}>›</Text>
    </TouchableOpacity>
  );

  const SettingToggle = ({ title, subtitle, value, onValueChange }: any) => (
    <View style={[styles.settingItem, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <View style={styles.settingTextContainer}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: colors.mutedText }]}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.card}
      />
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.primary }]}>{t("settings")}</Text>

      {settingsSections.map((section, index) => (
        <View key={index} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>{section.title}</Text>

          {section.data.map((item: SettingItemType, idx: number) => {

            if (item.type === "item") {
              return (
                <SettingItem
                  key={idx}
                  title={item.title}
                  subtitle={item.action === "language" ? LANGUAGES.find(l => l.value === i18n.language)?.subtitle : item.subtitle}
                  onPress={() => handleItemAction(item.action)}
                />
              );
            } else if (item.type === "toggle") {
              const isDarkMode = item.key === "darkMode";
              const value = isDarkMode ? theme === "dark" : (item.key ? toggles[item.key] : false);

              return (
                <SettingToggle
                  key={idx}
                  title={item.title}
                  subtitle={item.subtitle}
                  value={value}
                  onValueChange={(val: boolean) => item.key && handleToggleChange(item.key, val)}
                />
              );
            }
          })}
        </View>
      ))}

      <View style={styles.section}>
        {user ? (
          <>
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: colors.card, borderColor: colors.primary }]}
              onPress={handleLogout}
            >
              <Text style={[styles.logoutButtonText, { color: colors.primary }]}>{t("logout")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: colors.card }]}
              onPress={handleDeleteAccount}
            >
              <Text style={styles.deleteButtonText}>{t("deleteAccount")}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={[styles.loginButtonText, { color: colors.buttonText }]}>{t("signIn") || "Sign In"}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.mutedText }]}>{t("version")} 1.0.0</Text>
      </View>

      <Modal
        visible={isLanguageModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Language</Text>
              <TouchableOpacity onPress={() => setIsLanguageModalVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.primary }]}>Close</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageOption,
                    { borderBottomColor: colors.border },
                    i18n.language === item.value && { backgroundColor: colors.border + "40" }
                  ]}
                  onPress={() => {
                    i18n.changeLanguage(item.value);
                    setIsLanguageModalVisible(false);
                  }}
                >
                  <View>
                    <Text style={[styles.languageLabel, { color: colors.text }]}>{item.label}</Text>
                    <Text style={[styles.languageSubtitle, { color: colors.mutedText }]}>{item.subtitle}</Text>
                  </View>
                  {i18n.language === item.value && (
                    <Text style={{ color: colors.primary, fontSize: 20 }}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 32, fontWeight: "bold", padding: 24, paddingTop: 60 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    paddingHorizontal: 24,
    paddingVertical: 12,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  settingTextContainer: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: "500", marginBottom: 4 },
  settingSubtitle: { fontSize: 14 },
  arrow: { fontSize: 24, marginLeft: 12 },
  logoutButton: {
    padding: 16,
    marginHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    borderStyle: 'solid'
  },
  logoutButtonText: { fontWeight: "bold", textAlign: "center", fontSize: 16 },
  deleteButton: {
    padding: 16,
    marginHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EF4444",
    marginBottom: 12,
    borderStyle: 'solid'
  },
  deleteButtonText: { color: "#EF4444", fontWeight: "bold", textAlign: "center", fontSize: 16 },
  loginButton: {
    padding: 16,
    marginHorizontal: 24,
    borderRadius: 10,
    marginBottom: 12,
  },
  loginButtonText: { fontWeight: "bold", textAlign: "center", fontSize: 16 },
  footer: { padding: 24, paddingBottom: 60, alignItems: "center" },
  footerText: { fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  closeButton: { fontSize: 16, fontWeight: "600" },
  languageOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  languageLabel: { fontSize: 18, fontWeight: "600" },
  languageSubtitle: { fontSize: 14, marginTop: 2 },
});
