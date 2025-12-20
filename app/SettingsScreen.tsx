import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
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
const fetchSettings = async (): Promise<SettingsSectionType[]> => [
  {
    title: "Account",
    data: [
      { type: "item", title: "Profile", subtitle: "Update your personal information", action: "profile" },
      { type: "item", title: "Change Password", subtitle: "Update your password", action: "changePassword" },
      { type: "item", title: "Email Preferences", subtitle: "Manage your email settings", action: "emailPreferences" },
    ],
  },
  {
    title: "Subscription",
    data: [
      { type: "item", title: "Manage Subscription", subtitle: "View and manage your plan", action: "manageSubscription" },
      { type: "item", title: "Billing History", subtitle: "View past transactions", action: "billingHistory" },
      { type: "item", title: "Upgrade Plan", subtitle: "Explore premium features", action: "upgradePlan" },
    ],
  },
  {
    title: "Preferences",
    data: [
      { type: "toggle", title: "Push Notifications", key: "notifications", subtitle: "Receive app notifications" },
      { type: "toggle", title: "Dark Mode", key: "darkMode", subtitle: "Switch to dark theme" },
      { type: "item", title: "Language", subtitle: "English (US)", action: "language" },
    ],
  },
  {
    title: "Support",
    data: [
      { type: "item", title: "Help Center", action: "helpCenter", subtitle: "Get help and support" },
      { type: "item", title: "Contact Us", action: "contactUs", subtitle: "Reach out to our team" },
      { type: "item", title: "Privacy Policy", action: "privacyPolicy" },
      { type: "item", title: "Terms of Service", action: "termsOfService" },
    ],
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, colors, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [settingsSections, setSettingsSections] = useState<SettingsSectionType[]>([]);
  const [toggles, setToggles] = useState<{ [key: string]: boolean }>({
    notifications: true,
    darkMode: theme === "dark",
  });

  useEffect(() => {
    setToggles((prev) => ({ ...prev, darkMode: theme === "dark" }));
  }, [theme]);

  useEffect(() => {
    const loadSettings = async () => {
      const data = await fetchSettings();
      setSettingsSections(data);
    };
    loadSettings();
  }, []);

  const handleToggleChange = (key: string, value: boolean) => {
    if (key === "darkMode") {
      toggleTheme();
    } else {
      setToggles((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleItemAction = (action?: string) => {
    if (!action) return;
    Alert.alert("Action", `Perform ${action}`);
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
      <Text style={[styles.header, { color: colors.primary }]}>Settings</Text>

      {settingsSections.map((section, index) => (
        <View key={index} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>{section.title}</Text>

          {section.data.map((item: SettingItemType, idx: number) => {

            if (item.type === "item") {
              return (
                <SettingItem
                  key={idx}
                  title={item.title}
                  subtitle={item.subtitle}
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
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.card, borderColor: colors.primary }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutButtonText, { color: colors.primary }]}>Log Out</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: colors.card }]}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.mutedText }]}>Version 1.0.0</Text>
      </View>
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
  footer: { padding: 24, alignItems: "center" },
  footerText: { fontSize: 14 },
});
