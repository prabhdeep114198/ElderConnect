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
import { useTheme } from '../../../context/ThemeContext';

const TermsConditionsScreen = () => {
  const { colors, theme } = useTheme();

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(18);

  const termsSections = [
    {
      id: 'acceptance',
      icon: 'checkmark-circle',
      title: 'Acceptance of Terms',
      content: `By using ElderConnect, you agree to these Terms and Conditions.

• These terms apply to all users
• If you don’t agree, please don’t use the app
• Terms may be updated periodically
• Continued use means acceptance`,
    },
    {
      id: 'services',
      icon: 'apps',
      title: 'Our Services',
      content: `ElderConnect provides:

• Family communication tools
• Medication reminders
• Emergency alerts
• Photo and memory sharing
• Video calling and messaging`,
    },
    {
      id: 'account',
      icon: 'person',
      title: 'Your Account',
      content: `Account responsibilities:

• Provide accurate information
• Keep credentials secure
• One person, one account
• Report misuse immediately`,
    },
    {
      id: 'usage',
      icon: 'shield-checkmark',
      title: 'Acceptable Use',
      content: `You agree NOT to:

• Harass or harm others
• Share illegal content
• Hack or exploit the system
• Misuse platform features`,
    },
    {
      id: 'emergency',
      icon: 'medical',
      title: 'Emergency Disclaimer',
      content: `• ElderConnect is NOT a replacement for emergency services
• Always call emergency services first
• Alerts are supplementary only`,
    },
    {
      id: 'liability',
      icon: 'alert-circle',
      title: 'Limitation of Liability',
      content: `• Service provided “as is”
• Use at your own risk
• Liability limited by law`,
    },
    {
      id: 'contact',
      icon: 'mail',
      title: 'Contact Us',
      content: `Email: legal@elderconnect.com
Phone: 1234567890`,
    },
  ];

  const toggleSection = (id: string) => {
    setActiveSection(activeSection === id ? null : id);
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
          Terms & Conditions
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
        <View style={[styles.introSection, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
          <Text style={[styles.introText, { color: colors.text, fontSize: fontSize - 2 }]}>
            Welcome to ElderConnect. Please read these Terms and Conditions carefully before using the app.
          </Text>
        </View>

        {termsSections.map((section) => (
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
      </ScrollView>
    </SafeAreaView>
  );
};

export default TermsConditionsScreen;

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
});