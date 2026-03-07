import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Animated,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ResponsiveView } from "../../components/ResponsiveView";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

// ─── Config ─────────────────────────────────────────────────
const ACCENT_COLORS = [
  { label: "Ocean Blue", value: "#2E5EAA", gradient: ["#2E5EAA", "#4A7FD4"] },
  { label: "Lavender", value: "#8B5CF6", gradient: ["#8B5CF6", "#A78BFA"] },
  { label: "Emerald", value: "#10B981", gradient: ["#10B981", "#34D399"] },
  { label: "Amber", value: "#F59E0B", gradient: ["#F59E0B", "#FCD34D"] },
  { label: "Rose", value: "#EC4899", gradient: ["#EC4899", "#F9A8D4"] },
  { label: "Graphite", value: "#374151", gradient: ["#374151", "#6B7280"] },
];

const FONT_SIZES = [
  { label: "Small", value: "small", scale: 0.9, desc: "Aa" },
  { label: "Normal", value: "medium", scale: 1.0, desc: "Aa" },
  { label: "Large", value: "large", scale: 1.2, desc: "Aa" },
  { label: "Extra Large", value: "extraLarge", scale: 1.4, desc: "Aa" },
];

const LANGUAGES = [
  { label: "English", value: "en", subtitle: "English (US)", flag: "🇺🇸" },
  { label: "Hindi", value: "hi", subtitle: "हिन्दी", flag: "🇮🇳" },
  { label: "Punjabi", value: "pa", subtitle: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { label: "Spanish", value: "es", subtitle: "Español", flag: "🇪🇸" },
  { label: "French", value: "fr", subtitle: "Français", flag: "🇫🇷" },
  { label: "German", value: "de", subtitle: "Deutsch", flag: "🇩🇪" },
  { label: "Bengali", value: "bn", subtitle: "বাংলা", flag: "🇧🇩" },
  { label: "Tamil", value: "ta", subtitle: "தமிழ்", flag: "🇮🇳" },
  { label: "Telugu", value: "te", subtitle: "తెలుగు", flag: "🇮🇳" },
  { label: "Marathi", value: "mr", subtitle: "मराठी", flag: "🇮🇳" },
];

// ─── Section config ──────────────────────────────────────────
type SettingItem = {
  type: "item" | "toggle";
  title: string;
  subtitle?: string;
  icon: string;
  iconColor: string;
  key?: string;
  action?: string;
};

const getSections = (t: any): { title: string; data: SettingItem[] }[] => [
  {
    title: t("account"),
    data: [
      { type: "item", icon: "person-circle", iconColor: "#007AFF", title: t("profile"), subtitle: t("profileSubtitle"), action: "profile" },
      { type: "item", icon: "watch", iconColor: "#34C759", title: t("devices") || "Devices", subtitle: t("connectDevices") || "Connect your watch or monitor", action: "devices" },
      { type: "item", icon: "lock-closed", iconColor: "#FF9500", title: t("changePassword"), subtitle: t("changePasswordSubtitle"), action: "changePassword" },
      { type: "item", icon: "mail", iconColor: "#5856D6", title: t("emailPreferences"), subtitle: t("emailPreferencesSubtitle"), action: "emailPreferences" },
    ],
  },
  {
    title: t("subscription"),
    data: [
      { type: "item", icon: "diamond", iconColor: "#FFD700", title: t("manageSubscription"), subtitle: t("manageSubscriptionSubtitle"), action: "manageSubscription" },
      { type: "item", icon: "receipt", iconColor: "#30B0C7", title: t("billingHistory"), subtitle: t("billingHistorySubtitle"), action: "billingHistory" },
      { type: "item", icon: "rocket", iconColor: "#FF2D55", title: t("upgradePlan") || "Upgrade Plan", subtitle: t("upgradePlanSubtitle") || "Get premium features", action: "upgradePlan" },
    ],
  },
  {
    title: t("preferences"),
    data: [
      { type: "item", icon: "phone-portrait", iconColor: "#8E8E93", title: t("uiMode") || "Interface Mode", subtitle: t("uiModeSubtitle") || "Senior or Caregiver view", action: "uiMode" },
      { type: "item", icon: "text", iconColor: "#FF6B35", title: t("fontSize") || "Text Size", subtitle: t("fontSizeSubtitle") || "Adjust for readability", action: "fontSize" },
      { type: "item", icon: "color-palette", iconColor: "#AF52DE", title: t("accentColor") || "Theme Color", subtitle: t("accentColorSubtitle") || "Pick your accent color", action: "accentColor" },
      { type: "toggle", icon: "notifications", iconColor: "#FF9500", title: t("notifications"), key: "notifications", subtitle: t("notificationsSubtitle") },
      { type: "toggle", icon: "moon", iconColor: "#5856D6", title: t("darkMode"), key: "darkMode", subtitle: t("darkModeSubtitle") },
      { type: "item", icon: "globe", iconColor: "#34C759", title: t("language"), action: "language" },
    ],
  },
  {
    title: t("support"),
    data: [
      { type: "item", icon: "help-circle", iconColor: "#007AFF", title: t("helpCenter"), subtitle: t("helpCenterSubtitle"), action: "helpCenter" },
      { type: "item", icon: "chatbubble-ellipses", iconColor: "#34C759", title: t("contactUs"), subtitle: t("contactUsSubtitle"), action: "contactUs" },
      { type: "item", icon: "shield-checkmark", iconColor: "#8E8E93", title: t("privacyPolicy"), action: "privacyPolicy" },
      { type: "item", icon: "document-text", iconColor: "#8E8E93", title: t("termsOfService"), action: "termsOfService" },
    ],
  },
];

// ─── Sub-components ──────────────────────────────────────────
function PremiumModal({ visible, onClose, title, children }: any) {
  const { colors } = useTheme();
  const slide = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }).start();
    } else {
      Animated.timing(slide, { toValue: 300, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
        <Animated.View
          style={[styles.modalSheet, { backgroundColor: colors.card, transform: [{ translateY: slide }] }]}
          onStartShouldSetResponder={() => true}
        >
          {/* Handle bar */}
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={[styles.modalCloseBtn, { backgroundColor: colors.background }]}>
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
          {children}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

function IconBadge({ name, color }: { name: string; color: string }) {
  return (
    <View style={[styles.iconBadge, { backgroundColor: color + "18" }]}>
      <Ionicons name={name as any} size={20} color={color} />
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────
export default function SettingsScreen() {
  const router = useRouter();
  const { theme, colors, toggleTheme, uiMode, setUIMode, fontSize, setFontSize, accentColor, setAccentColor } = useTheme();
  const { user, logout, requireAuth } = useAuth();
  const { t, i18n } = useTranslation();

  const [toggles, setToggles] = useState<{ [k: string]: boolean }>({ notifications: true, darkMode: theme === "dark" });
  const [showLang, setShowLang] = useState(false);
  const [showUI, setShowUI] = useState(false);
  const [showFont, setShowFont] = useState(false);
  const [showColor, setShowColor] = useState(false);
  const sections = getSections(t);

  useEffect(() => setToggles((p) => ({ ...p, darkMode: theme === "dark" })), [theme]);

  const handleAction = (action?: string) => {
    switch (action) {
      case "profile": requireAuth(() => router.push("/settings/(internal)/profile")); break;
      case "devices": requireAuth(() => router.push("/settings/(internal)/devices")); break;
      case "changePassword": requireAuth(() => router.push("/settings/(internal)/change-password")); break;
      case "manageSubscription": requireAuth(() => router.push("/settings/(internal)/manage-subscription")); break;
      case "billingHistory": requireAuth(() => router.push("/settings/(internal)/billing-history")); break;
      case "upgradePlan": requireAuth(() => router.push("/settings/(internal)/upgrade-plan")); break;
      case "language": setShowLang(true); break;
      case "uiMode": setShowUI(true); break;
      case "fontSize": setShowFont(true); break;
      case "accentColor": setShowColor(true); break;
      case "privacyPolicy": router.push("/settings/(internal)/privacy-policy"); break;
      case "termsOfService": router.push("/settings/(internal)/terms-condition"); break;
      case "helpCenter": router.push("/settings/(internal)/help-center"); break;
      case "contactUs": router.push("/settings/(internal)/contact-us"); break;
      default: break;
    }
  };

  const currentLang = LANGUAGES.find((l) => l.value === i18n.language);

  const handleLogout = async () => {
    Alert.alert(t("logout"), "Are you sure you want to sign out?", [
      { text: t("cancel"), style: "cancel" },
      { text: t("logout"), style: "destructive", onPress: async () => { try { await logout(); } catch { } } },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(t("deleteAccount"), "This action cannot be undone. All your data will be permanently deleted.", [
      { text: t("cancel"), style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { Alert.alert("Account Deleted"); logout(); } },
    ]);
  };

  return (
    <ResponsiveView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <LinearGradient
          colors={[accentColor + "22", "transparent"]}
          style={styles.headerGradient}
        >
          <Text style={[styles.pageTitle, { color: colors.text }]}>{t("settings")}</Text>

          {/* User Profile Card */}
          {user ? (
            <TouchableOpacity
              style={[styles.profileCard, { backgroundColor: colors.card }]}
              onPress={() => requireAuth(() => router.push("/settings/(internal)/profile"))}
              activeOpacity={0.8}
            >
              <LinearGradient colors={[accentColor, accentColor + "BB"]} style={styles.avatarGradient}>
                <Ionicons name="person" size={32} color="#FFF" />
              </LinearGradient>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>{user.name || "Your Name"}</Text>
                <Text style={[styles.profileEmail, { color: colors.mutedText }]} numberOfLines={1}>{user.email}</Text>
              </View>
              <View style={[styles.profileChevronBadge, { backgroundColor: colors.background }]}>
                <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.signInCard, { backgroundColor: colors.card, borderColor: accentColor + "40" }]}
              onPress={() => router.push("/auth/login")}
              activeOpacity={0.8}
            >
              <View style={[styles.avatarGradient, { backgroundColor: colors.border }]}>
                <Ionicons name="person-outline" size={32} color={colors.mutedText} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>Sign In to ElderConnect</Text>
                <Text style={[styles.profileEmail, { color: colors.mutedText }]}>Access all your settings</Text>
              </View>
              <View style={[styles.profileChevronBadge, { backgroundColor: accentColor + "20" }]}>
                <Ionicons name="chevron-forward" size={16} color={accentColor} />
              </View>
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* ── Sections ── */}
        {sections.map((section, sIdx) => (
          <View key={sIdx} style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>{section.title.toUpperCase()}</Text>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              {section.data.map((item, iIdx) => {
                const isLast = iIdx === section.data.length - 1;

                if (item.type === "toggle") {
                  const val = item.key === "darkMode" ? theme === "dark" : (item.key ? toggles[item.key] : false);
                  return (
                    <View key={iIdx} style={[styles.row, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                      <IconBadge name={item.icon} color={item.iconColor} />
                      <View style={styles.rowText}>
                        <Text style={[styles.rowTitle, { color: colors.text }]}>{item.title}</Text>
                        {item.subtitle && <Text style={[styles.rowSubtitle, { color: colors.mutedText }]}>{item.subtitle}</Text>}
                      </View>
                      <Switch
                        value={val}
                        onValueChange={(v) => {
                          if (item.key === "darkMode") toggleTheme();
                          else setToggles((p) => ({ ...p, [item.key!]: v }));
                        }}
                        trackColor={{ false: colors.border, true: accentColor }}
                        thumbColor="#FFF"
                        ios_backgroundColor={colors.border}
                      />
                    </View>
                  );
                }

                const valueLabel =
                  item.action === "language" ? `${currentLang?.flag} ${currentLang?.subtitle}` :
                    item.action === "uiMode" ? (uiMode === "senior" ? "🧓 Senior" : "👩‍⚕️ Caregiver") :
                      item.action === "fontSize" ? FONT_SIZES.find(f => f.value === fontSize)?.label :
                        item.action === "accentColor" ? undefined : undefined;

                return (
                  <TouchableOpacity
                    key={iIdx}
                    style={[styles.row, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                    onPress={() => handleAction(item.action)}
                    activeOpacity={0.6}
                  >
                    <IconBadge name={item.icon} color={item.iconColor} />
                    <View style={styles.rowText}>
                      <Text style={[styles.rowTitle, { color: colors.text }]}>{item.title}</Text>
                      {item.subtitle && <Text style={[styles.rowSubtitle, { color: colors.mutedText }]} numberOfLines={1}>{item.subtitle}</Text>}
                    </View>
                    {valueLabel ? (
                      <View style={[styles.valueBadge, { backgroundColor: colors.background }]}>
                        <Text style={[styles.valueLabel, { color: accentColor }]}>{valueLabel}</Text>
                      </View>
                    ) : (
                      item.action === "accentColor" ? (
                        <View style={[styles.colorDot, { backgroundColor: accentColor }]} />
                      ) : (
                        <Ionicons name="chevron-forward" size={16} color={colors.border} style={{ marginLeft: 8 }} />
                      )
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* ── Account Actions ── */}
        {user && (
          <View style={styles.section}>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <TouchableOpacity style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]} onPress={handleLogout} activeOpacity={0.6}>
                <IconBadge name="log-out-outline" color="#FF9500" />
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: "#FF9500" }]}>{t("logout")}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.border} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.row} onPress={handleDeleteAccount} activeOpacity={0.6}>
                <IconBadge name="trash-outline" color="#FF3B30" />
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: "#FF3B30" }]}>{t("deleteAccount")}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.border} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Ionicons name="heart" size={14} color={accentColor} />
          <Text style={[styles.footerText, { color: colors.mutedText }]}>  ElderConnect • {t("version")} 1.0.0</Text>
        </View>
      </ScrollView>

      {/* ── LANGUAGE MODAL ── */}
      <PremiumModal visible={showLang} onClose={() => setShowLang(false)} title={t("selectLanguage") || "Select Language"}>
        <FlatList
          data={LANGUAGES}
          keyExtractor={(item) => item.value}
          style={styles.flatListMaxHeight}
          renderItem={({ item }) => {
            const selected = i18n.language === item.value;
            return (
              <TouchableOpacity
                style={[styles.langRow, { borderBottomColor: colors.border, backgroundColor: selected ? accentColor + "12" : "transparent" }]}
                onPress={() => { i18n.changeLanguage(item.value); setShowLang(false); }}
              >
                <Text style={styles.langFlag}>{item.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.langLabel, { color: colors.text }]}>{item.label}</Text>
                  <Text style={[styles.langSub, { color: colors.mutedText }]}>{item.subtitle}</Text>
                </View>
                {selected && (
                  <View style={[styles.checkBadge, { backgroundColor: accentColor }]}>
                    <Ionicons name="checkmark" size={14} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </PremiumModal>

      {/* ── UI MODE MODAL ── */}
      <PremiumModal visible={showUI} onClose={() => setShowUI(false)} title={t("uiMode") || "Interface Mode"}>
        {[
          { value: "senior", label: "🧓 Senior Mode", desc: "Large text, simple layout, easy navigation", color: "#34C759" },
          { value: "caregiver", label: "👩‍⚕️ Caregiver Mode", desc: "Advanced controls, detailed data, patient view", color: "#007AFF" },
        ].map(mode => {
          const selected = uiMode === mode.value;
          return (
            <TouchableOpacity
              key={mode.value}
              style={[styles.modeOption, { borderColor: selected ? mode.color : colors.border, backgroundColor: selected ? mode.color + "12" : colors.background }]}
              onPress={() => { setUIMode(mode.value as any); setShowUI(false); }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.modeLabel, { color: colors.text }]}>{mode.label}</Text>
                <Text style={[styles.modeSub, { color: colors.mutedText }]}>{mode.desc}</Text>
              </View>
              {selected && (
                <View style={[styles.checkBadge, { backgroundColor: mode.color }]}>
                  <Ionicons name="checkmark" size={14} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </PremiumModal>

      {/* ── FONT SIZE MODAL ── */}
      <PremiumModal visible={showFont} onClose={() => setShowFont(false)} title={t("fontSize") || "Text Size"}>
        {FONT_SIZES.map(size => {
          const selected = fontSize === size.value;
          return (
            <TouchableOpacity
              key={size.value}
              style={[styles.fontOption, { borderColor: selected ? accentColor : colors.border, backgroundColor: selected ? accentColor + "12" : colors.background }]}
              onPress={() => { setFontSize(size.value as any); setShowFont(false); }}
            >
              <Text style={[styles.fontPreview, { fontSize: 18 * size.scale, color: selected ? accentColor : colors.text }]}>{size.desc}</Text>
              <Text style={[styles.fontLabel, { color: selected ? accentColor : colors.text }]}>{size.label}</Text>
              {selected && <View style={[styles.checkBadge, { backgroundColor: accentColor }]}><Ionicons name="checkmark" size={14} color="#FFF" /></View>}
            </TouchableOpacity>
          );
        })}
      </PremiumModal>

      {/* ── ACCENT COLOR MODAL ── */}
      <PremiumModal visible={showColor} onClose={() => setShowColor(false)} title={t("accentColor") || "Theme Color"}>
        <View style={styles.colorGrid}>
          {ACCENT_COLORS.map(color => {
            const selected = accentColor === color.value;
            return (
              <TouchableOpacity
                key={color.value}
                style={[styles.colorOption, selected && { transform: [{ scale: 1.1 }] }]}
                onPress={() => { setAccentColor(color.value); setShowColor(false); }}
              >
                <LinearGradient colors={color.gradient as any} style={[styles.colorCircle, selected && styles.colorCircleSelected]}>
                  {selected && <Ionicons name="checkmark" size={22} color="#FFF" />}
                </LinearGradient>
                <Text style={[styles.colorLabel, { color: colors.text }]}>{color.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </PremiumModal>
    </ResponsiveView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  headerGradient: { paddingTop: Platform.OS === "web" ? 24 : 60, paddingHorizontal: 20, paddingBottom: 16 },
  pageTitle: { fontSize: 34, fontWeight: "800", letterSpacing: -0.5, marginBottom: 20 },
  profileCard: {
    flexDirection: "row", alignItems: "center", borderRadius: 18,
    padding: 16, marginBottom: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  signInCard: { flexDirection: "row", alignItems: "center", borderRadius: 18, padding: 16, marginBottom: 4, borderWidth: 1 },
  avatarGradient: { width: 54, height: 54, borderRadius: 27, justifyContent: "center", alignItems: "center", marginRight: 14 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: "700", marginBottom: 2 },
  profileEmail: { fontSize: 13 },
  profileChevronBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },

  // Sections
  section: { marginHorizontal: 20, marginBottom: 24 },
  sectionLabel: { fontSize: 12, fontWeight: "600", letterSpacing: 0.8, marginBottom: 10, marginLeft: 4 },
  card: { borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 16 },
  iconBadge: { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 14 },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: "500" },
  rowSubtitle: { fontSize: 12, marginTop: 1 },
  valueBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
  valueLabel: { fontSize: 13, fontWeight: "600" },
  colorDot: { width: 22, height: 22, borderRadius: 11, marginLeft: 8, borderWidth: 2, borderColor: "rgba(255,255,255,0.5)" },

  // Footer
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 32, paddingBottom: 52 },
  footerText: { fontSize: 13 },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 48, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 20 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 4 },
  modalTitle: { fontSize: 19, fontWeight: "700" },
  modalCloseBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  flatListMaxHeight: { maxHeight: 420 },

  // Language
  langRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  langFlag: { fontSize: 24, marginRight: 14 },
  langLabel: { fontSize: 16, fontWeight: "600" },
  langSub: { fontSize: 13, marginTop: 1 },
  checkBadge: { width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center" },

  // Mode
  modeOption: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginVertical: 8, padding: 16, borderRadius: 14, borderWidth: 1.5 },
  modeLabel: { fontSize: 17, fontWeight: "600", marginBottom: 4 },
  modeSub: { fontSize: 13, lineHeight: 18 },

  // Font
  fontOption: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginVertical: 8, padding: 16, borderRadius: 14, borderWidth: 1.5 },
  fontPreview: { fontWeight: "800", marginRight: 12 },
  fontLabel: { flex: 1, fontSize: 16, fontWeight: "500" },

  // Color
  colorGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, justifyContent: "space-between" },
  colorOption: { width: "30%", alignItems: "center", marginBottom: 20 },
  colorCircle: { width: 58, height: 58, borderRadius: 29, marginBottom: 8, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  colorCircleSelected: { borderWidth: 3, borderColor: "#FFF" },
  colorLabel: { fontSize: 11, textAlign: "center", fontWeight: "600" },
});