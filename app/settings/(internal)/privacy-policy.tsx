import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';

const PrivacyPolicyScreen = () => {
  const router = useRouter();
  const { colors, theme } = useTheme();

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(18);

  const privacySections = [
    {
      id: 'information',
      icon: 'document-text',
      title: 'What Information We Collect',
      content: `We collect information that helps us provide you with the best ElderConnect experience:

• Personal Information: Name, email, phone number, date of birth
• Health Data: Emergency contacts and medical info (with permission)
• Location Data: To assist with emergency services
• Usage Data: App interactions to improve features
• Photos & Videos: Only what you choose to share

We collect only what is necessary.`,
    },
    {
      id: 'usage',
      icon: 'shield-checkmark',
      title: 'How We Use Your Information',
      content: `Your data helps us:

• Connect you with family & caregivers
• Send medication and appointment reminders
• Provide emergency support
• Improve app usability
• Share important feature updates

We NEVER sell your data.`,
    },
    {
      id: 'sharing',
      icon: 'people',
      title: 'Who Can See Your Information',
      content: `Your information is shared only when needed:

• Approved family members
• Healthcare providers (with consent)
• Emergency services (if required)
• Trusted service providers

You control all sharing settings.`,
    },
    {
      id: 'security',
      icon: 'lock-closed',
      title: 'How We Protect Your Information',
      content: `We protect your data using:

• Encrypted communication
• Secure servers
• Regular security audits
• Restricted staff access
• Optional two-factor authentication`,
    },
    {
      id: 'rights',
      icon: 'hand-right',
      title: 'Your Privacy Rights',
      content: `You have the right to:

• View your data
• Update incorrect data
• Delete your account
• Download your information
• Withdraw consent anytime

Access via Settings > Privacy Controls.`,
    },
    {
      id: 'children',
      icon: 'warning',
      title: "Children's Privacy",
      content: `• Not intended for children under 13
• Any discovered child data is deleted immediately
• Parents should monitor device usage`,
    },
    {
      id: 'changes',
      icon: 'refresh',
      title: 'Changes to This Policy',
      content: `• Policy may be updated periodically
• Important changes will be notified
• Continued use implies acceptance`,
    },
    {
      id: 'contact',
      icon: 'mail',
      title: 'Contact Us',
      content: `Email: privacy@elderconnect.com
Phone: 1234567890

We respond within 2 business days.`,
    },
  ];

  const toggleSection = (id: string) => {
    setActiveSection(activeSection === id ? null : id);
  };

  const handleAccept = async () => {
    try {
      await AsyncStorage.setItem("privacyAccepted", "true");
      router.replace("/"); // Go back to landing to unblock
    } catch (error) {
      console.error("Error saving privacy acceptance:", error);
    }
  };

  const adjustFontSize = (value: number) => {
    setFontSize((prev) => Math.max(14, Math.min(24, prev + value)));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Privacy Policy
        </Text>

        <View style={styles.fontControls}>
          <TouchableOpacity
            style={[styles.fontButton, { backgroundColor: colors.primary + '20' }]}
            onPress={() => adjustFontSize(-2)}
          >
            <Text style={[styles.fontButtonText, { color: colors.primary }]}>A-</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fontButton, { backgroundColor: colors.primary + '20' }]}
            onPress={() => adjustFontSize(2)}
          >
            <Text style={[styles.fontButtonText, { color: colors.primary }]}>A+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Last Updated */}
      <View style={[styles.updateBanner, { backgroundColor: colors.card }]}>
        <Ionicons name="calendar" size={16} color={colors.mutedText} />
        <Text style={[styles.updateText, { color: colors.mutedText }]}>
          Last Updated: February 9, 2026
        </Text>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={[styles.introSection, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
          <Text style={[styles.introText, { color: colors.text, fontSize: fontSize - 2 }]}>
            At ElderConnect, your privacy matters. This policy explains how we
            collect, use, and protect your personal information.
          </Text>
        </View>

        {/* Sections */}
        {privacySections.map((section) => (
          <View key={section.id} style={[styles.sectionContainer, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection(section.id)}
            >
              <View style={styles.sectionTitleContainer}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name={section.icon as any} size={22} color={colors.primary} />
                </View>
                <Text style={[styles.sectionTitle, { fontSize, color: colors.text }]}>
                  {section.title}
                </Text>
              </View>

              <Ionicons
                name={activeSection === section.id ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={colors.mutedText}
              />
            </TouchableOpacity>

            {activeSection === section.id && (
              <View style={[styles.sectionContent, { backgroundColor: colors.background }]}>
                <Text
                  style={[
                    styles.contentText,
                    {
                      color: colors.text,
                      fontSize: fontSize - 2,
                      lineHeight: fontSize * 1.6,
                    },
                  ]}
                >
                  {section.content}
                </Text>
              </View>
            )}
          </View>
        ))}

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          <Text style={[styles.footerText, { color: colors.mutedText, fontSize: fontSize - 4 }]}>
            By using ElderConnect, you agree to this Privacy Policy.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.acceptButton, { backgroundColor: colors.primary }]}
          onPress={handleAccept}
        >
          <Text style={styles.acceptButtonText}>Accept & Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyPolicyScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    height: 64,
    justifyContent: 'center',
    borderBottomWidth: 1,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },

  fontControls: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },

  fontButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  fontButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },

  updateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },

  updateText: {
    fontSize: 13,
    fontWeight: '500',
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  introSection: {
    padding: 20,
    borderRadius: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
  },

  introText: {
    fontWeight: '500',
  },

  sectionContainer: {
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },

  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionTitle: {
    fontWeight: '700',
  },

  sectionContent: {
    padding: 16,
  },

  contentText: {},

  footer: {
    marginTop: 24,
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
  },

  footerText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  acceptButton: {
    marginTop: 24,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});