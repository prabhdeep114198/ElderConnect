// app/settings.tsx
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { account } from "../appwriteConfig";
import { Colors } from "../constants/colors";

export default function SettingsScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      Alert.alert("Success", "Logged out successfully");
      router.replace("/");
    } catch (err: any) {
      Alert.alert("Logout Failed", err.message);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Add your account deletion logic here
              Alert.alert("Success", "Account deleted");
              router.replace("/");
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ]
    );
  };

  const SettingItem = ({ title, subtitle, onPress, showArrow = true }: any) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {showArrow && <Text style={styles.arrow}>›</Text>}
    </TouchableOpacity>
  );

  const SettingToggle = ({ title, subtitle, value, onValueChange }: any) => (
    <View style={styles.settingItem}>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.border, true: Colors.primary }}
        thumbColor={Colors.card}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <SettingItem
          title="Profile"
          subtitle="Update your personal information"
          onPress={() => Alert.alert("Profile", "Navigate to profile editing")}
        />
        
        <SettingItem
          title="Change Password"
          subtitle="Update your account password"
          onPress={() => Alert.alert("Change Password", "Navigate to password change")}
        />
        
        <SettingItem
          title="Email Preferences"
          subtitle="Manage your email settings"
          onPress={() => Alert.alert("Email", "Navigate to email preferences")}
        />
      </View>

      {/* Subscription Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        
        <SettingItem
          title="Manage Subscription"
          subtitle="View and manage your plan"
          onPress={() => Alert.alert("Subscription", "Navigate to subscription management")}
        />
        
        <SettingItem
          title="Billing History"
          subtitle="View past transactions"
          onPress={() => Alert.alert("Billing", "Navigate to billing history")}
        />
        
        <SettingItem
          title="Upgrade Plan"
          subtitle="Explore premium features"
          onPress={() => Alert.alert("Upgrade", "Navigate to upgrade options")}
        />
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <SettingToggle
          title="Push Notifications"
          subtitle="Receive app notifications"
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
        />
        
        <SettingToggle
          title="Dark Mode"
          subtitle="Switch to dark theme"
          value={darkModeEnabled}
          onValueChange={setDarkModeEnabled}
        />
        
        <SettingItem
          title="Language"
          subtitle="English (US)"
          onPress={() => Alert.alert("Language", "Navigate to language selection")}
        />
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <SettingItem
          title="Help Center"
          subtitle="Get help and support"
          onPress={() => Alert.alert("Help", "Navigate to help center")}
        />
        
        <SettingItem
          title="Contact Us"
          subtitle="Reach out to our team"
          onPress={() => Alert.alert("Contact", "Navigate to contact form")}
        />
        
        <SettingItem
          title="Privacy Policy"
          onPress={() => Alert.alert("Privacy", "Navigate to privacy policy")}
        />
        
        <SettingItem
          title="Terms of Service"
          onPress={() => Alert.alert("Terms", "Navigate to terms")}
        />
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.primary,
    padding: 24,
    paddingTop: 60,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.mutedText,
    textTransform: "uppercase",
    paddingHorizontal: 24,
    paddingVertical: 12,
    letterSpacing: 0.5,
  },
  settingItem: {
    backgroundColor: Colors.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.mutedText,
  },
  arrow: {
    fontSize: 24,
    color: Colors.mutedText,
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: Colors.card,
    padding: 16,
    marginHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginBottom: 12,
  },
  logoutButtonText: {
    color: Colors.primary,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: Colors.card,
    padding: 16,
    marginHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EF4444",
    marginBottom: 12,
  },
  deleteButtonText: {
    color: "#EF4444",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  footer: {
    padding: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: Colors.mutedText,
  },
});