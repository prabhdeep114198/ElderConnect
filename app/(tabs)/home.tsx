import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { Pedometer } from "expo-sensors";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Dimensions,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { PlatformDateTimePicker } from "../../components/PlatformDateTimePicker";
import { ResponsiveView } from "../../components/ResponsiveView";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

import { usePersonalization } from "../../hooks/usePersonalization";
import { deviceService } from "../../services/api/device";
import { InteractionType, personalizationService } from "../../services/api/personalization";
import { profileService } from "../../services/api/profile";
import { getRemindersKey } from "../../utils/userStorageKeys";

// NOTIFICATION HANDLER
Notifications.setNotificationHandler({
  handleNotification: async () =>
  ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ANDROID CHANNEL
if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "alarm.wav",
  });
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const router = useRouter();
  const { colors, theme, uiMode, fontSize } = useTheme();
  const { t, i18n } = useTranslation();
  const { user, requireAuth } = useAuth();

  const isSenior = uiMode === "senior";
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && windowWidth > 900;

  const getFontSize = (base: number) => {
    const scales: any = { small: 0.9, medium: 1, large: 1.2, extraLarge: 1.5 };
    return base * (scales[fontSize] || 1);
  };

  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState("");

  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mode, setMode] = useState<"date" | "time">("date");

  const [savedReminders, setSavedReminders] = useState<any[]>([]);

  // Health tracking states
  const [steps, setSteps] = useState(0);
  const [heartRate, setHeartRate] = useState(72);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [waterIntake, setWaterIntake] = useState(6);

  const [healthMetrics, setHealthMetrics] = useState<any[]>([]);

  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  const [aiMessage, setAiMessage] = useState<string>(t("aiGreeting") || "Select a feature to get started.");

  const { data: personalizationData, loading: personalizationLoading, refetch: refetchPersonalization } = usePersonalization();

  // ============================================
  // API FUNCTIONS
  // ============================================
  const fetchHealthMetrics = async () => {
    if (!user) return;
    try {
      const response: any = await profileService.getDailyMetrics(user.id);
      if (response && response.data && response.data.metrics) {
        setHealthMetrics(response.data.metrics);
        const raw = response.data.raw;
        if (raw) {
          if (raw.heartRate) setHeartRate(raw.heartRate);
          if (raw.sleepHours) setSleepHours(raw.sleepHours);
          if (raw.waterIntake) setWaterIntake(raw.waterIntake);
        }
      }
    } catch (error) {
      console.log("Failed to fetch health metrics:", error);
    }
  };

  const fetchSchedule = async () => {
    if (!user) return;
    try {
      // Get medications and appointments and merge them for the schedule
      const [medsRes, apptsRes]: any = await Promise.all([
        profileService.getMedicationReminders(user.id),
        profileService.getAppointments(user.id)
      ]);

      const events: any[] = [];
      const now = new Date();

      if (medsRes && medsRes.data && medsRes.data.reminders) {
        medsRes.data.reminders.forEach((r: any) => {
          const scheduledTime = new Date(r.scheduledTime);
          // Only show if it's today or in the future
          if (scheduledTime >= now || scheduledTime.toDateString() === now.toDateString()) {
            events.push({
              time: scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              title: r.medicationName,
              type: 'medication',
              timestamp: scheduledTime.getTime()
            });
          }
        });
      }

      if (apptsRes && apptsRes.data && apptsRes.data.appointments) {
        apptsRes.data.appointments.forEach((a: any) => {
          const scheduledAt = new Date(a.scheduledAt);
          // Only show if it's today or in the future
          if (scheduledAt >= now || scheduledAt.toDateString() === now.toDateString()) {
            events.push({
              time: scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              title: a.title,
              type: 'appointment',
              timestamp: scheduledAt.getTime()
            });
          }
        });
      }

      setUpcomingEvents(events.sort((a, b) => a.timestamp - b.timestamp));
    } catch (error) {
      console.log("Failed to fetch schedule:", error);
    }
  };


  const updateHealthData = async (type: string, value: any) => {
    if (!user || !user.id) return;
    try {
      await profileService.updateHealthMetric(user.id, { type, value });
    } catch (error) {
      console.log("Failed to update health metric:", error);
    }
  };

  const fetchAIMessage = async () => {
    if (personalizationData?.dailyBriefing) {
      setAiMessage(personalizationData.dailyBriefing);
    } else {
      setAiMessage(t("aiDefaultTip") || "Staying active is the key to longevity. Have you taken your steps today?");
    }
  };

  // Smart Notifications based on personalization
  useEffect(() => {
    if (personalizationData?.recommendations) {
      // Track views
      personalizationData.recommendations.forEach(rec => {
        personalizationService.trackInteraction(InteractionType.CONTENT_VIEW, {
          title: rec.title,
          type: rec.type,
        });
      });

      const highPriority = personalizationData.recommendations.filter(r => r.priority === 'high');
      highPriority.forEach(rec => {
        Notifications.scheduleNotificationAsync({
          content: {
            title: `🎯 Personal Goal: ${rec.title}`,
            body: rec.description,
            data: { url: rec.actionUrl || '/(tabs)/home' },
          },
          trigger: null, // Immediate
        });
      });
    }
  }, [personalizationData]);

  const handleRecommendationPress = async (rec: any) => {
    if (user) {
      await personalizationService.trackInteraction(InteractionType.FEATURE_USE, {
        feature: 'recommendation_click',
        title: rec.title,
        type: rec.type,
      });
    }

    if (rec.actionUrl) {
      router.push(rec.actionUrl as any);
    } else {
      Alert.alert(rec.title, rec.description);
    }
  };

  const handleDismissRecommendation = async (rec: any) => {
    if (user) {
      await personalizationService.trackInteraction(InteractionType.CONTENT_DISMISS, {
        title: rec.title,
        type: rec.type,
      });
      // In a real app, we would also update local state to hide it until next refresh
      refetchPersonalization();
    }
  };

  // ============================================
  // STEP TRACKING
  // ============================================
  const startStepTracking = async () => {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (isAvailable) {
      const end = new Date();
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      try {
        const result = await Pedometer.getStepCountAsync(start, end);
        if (result) {
          setSteps(result.steps);
          updateHealthMetrics();
        }
      } catch (e) {
        console.log("Pedometer search not supported on this device/range", e);
      }

      // Subscribe to updates
      interface StepCountResult {
        steps: number;
      }

      const pedometerSubscription = Pedometer.watchStepCount((result: StepCountResult) => {
        setSteps(result.steps);
        updateHealthMetrics();
      });
    }
  };

  const updateHealthMetrics = () => {
    setHealthMetrics([
      { label: t("stepsToday"), value: steps.toLocaleString(), icon: "walk", trend: steps > 5000 ? "up" : "down" },
      { label: t("heartRate"), value: `${heartRate} ${t("bpm")}`, icon: "heart", trend: "stable" },
      { label: t("sleepQuality"), value: `${sleepHours} ${t("hrs")}`, icon: "moon", trend: sleepHours >= 7 ? "up" : "down" },
      { label: t("hydration"), value: `${waterIntake}/8 ${t("cups")}`, icon: "water", trend: waterIntake >= 6 ? "up" : "down" },
    ]);
  };

  // ============================================
  // REMINDER FUNCTIONS
  // ============================================
  const loadReminders = async () => {
    if (!user) return;
    try {
      const response: any = await profileService.getMedicationReminders(user.id);
      if (response && response.data && response.data.reminders) {
        setSavedReminders(response.data.reminders);
      }
    } catch (error) {
      console.log("Failed to load reminders:", error);
      // Fallback to local storage
      const localData = await AsyncStorage.getItem(getRemindersKey(user.id));
      if (localData) setSavedReminders(JSON.parse(localData));
    }
  };

  const saveReminder = async (reminder: any) => {
    // Reminders are managed via medications or system-wide alerts now
    // This is a local helper for the temporary manual reminder

    // Save locally as backup
    const updated = [...savedReminders, reminder];
    await AsyncStorage.setItem(getRemindersKey(user?.id || ''), JSON.stringify(updated));
    setSavedReminders(updated);
  };

  const scheduleReminder = async () => {
    try {
      if (selectedDate <= new Date()) {
        Alert.alert("Invalid Time", "Please select a future time.");
        return;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "⏰ Reminder",
          body: "It's time! Your reminder is here.",
          sound: "alarm.wav",
        },
        trigger: {
          date: selectedDate,
        } as Notifications.DateTriggerInput,
      });

      await saveReminder({
        id: notificationId,
        date: selectedDate,
      });

      setShowReminderModal(false);

      Alert.alert(
        "Reminder Set",
        `Reminder will ring at ${selectedDate.toLocaleString()}`
      );
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not set reminder.");
    }
  };

  const onChange = (event: any, date?: Date) => {
    if (Platform.OS === "android" && event.type === "dismissed") return;

    if (date) {
      setSelectedDate(date);

      if (Platform.OS === "android" && mode === "date") {
        setMode("time");
      }
    }
  };

  // ============================================
  // ACTION HANDLERS
  // ============================================
  const handleEmergencySOS = async () => {
    // Navigate to the countdown screen instead of triggering immediately
    // This allows the user to cancel if it was accidental (User is OK)
    router.push({
      pathname: "/fall-detected" as any,
      params: { type: 'manual' }
    });
  };

  const handleFamilyCall = async () => {
    requireAuth(async () => {
      // Typically would notify family/system of the call
      if (user) {
        // Optional: record call event
      }

      // Navigate to video call screen
      router.push("/videocall" as any);
    });
  };

  const handleHealthCheck = async () => {
    Alert.alert("Health Check", "Refreshing your health data...");

    // Update health metrics
    await updateHealthData('steps', steps);
    await updateHealthData('heartRate', heartRate);
    await updateHealthData('sleep', sleepHours);
    await updateHealthData('water', waterIntake);

    // Fetch latest from API
    await fetchHealthMetrics();

    Alert.alert("Health Check Complete", "All health metrics updated!");
  };

  const handleReminders = () => {
    requireAuth(() => {
      router.push("/reminders" as any);
    });
  };

  const handleAIChat = async () => {
    requireAuth(() => {
      // await fetchAIMessage(); // Optional: Refresh message before entering
      router.push("/chatbot");
    });
  };

  // ============================================
  // INITIALIZATION
  // ============================================
  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please enable notifications.");
      }
    };

    requestPermissions();
    if (user) {
      loadReminders();
      fetchHealthMetrics();
      fetchSchedule();
    }
    startStepTracking();
    fetchAIMessage();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t("goodMorning"));
    else if (hour < 18) setGreeting(t("goodAfternoon"));
    else setGreeting(t("goodEvening"));

    // Auto-refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      if (user) {
        fetchHealthMetrics();
        fetchSchedule();
      }
      fetchAIMessage();
      refetchPersonalization();
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(timer);
      clearInterval(refreshInterval);
    };
  }, [user]);

  useEffect(() => {
    fetchAIMessage();
  }, [personalizationData]);

  useEffect(() => {
    updateHealthMetrics();

    // Sync to backend periodically or on change (debounced)
    const timeoutId = setTimeout(() => {
      if (user && user.id) {
        updateHealthData('steps', steps);
        updateHealthData('heartRate', heartRate);
        updateHealthData('sleep', sleepHours);
        updateHealthData('water', waterIntake);
      }
    }, 5000); // 5 second debounce to avoid spamming API on every step

    return () => clearTimeout(timeoutId);
  }, [steps, heartRate, sleepHours, waterIntake]);

  // ============================================
  // UI CONFIGURATION
  // ============================================
  const quickActions = [
    {
      title: t("emergencySOS"),
      icon: "warning",
      color: colors.error,
      action: handleEmergencySOS,
    },
    {
      title: t("callFamily"),
      icon: "call",
      color: colors.primary,
      action: handleFamilyCall,
    },
    {
      title: t("healthCheck"),
      icon: "heart",
      color: colors.success,
      action: handleHealthCheck,
    },
    {
      title: t("reminders"),
      icon: "alarm",
      color: colors.warning,
      action: handleReminders,
    },
  ];

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'event': return 'calendar';
      case 'activity': return 'fitness';
      case 'music': return 'musical-notes';
      case 'medication': return 'medkit';
      case 'social': return 'people';
      default: return 'star';
    }
  };

  return (
    <ResponsiveView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={isDesktop ? styles.desktopMainLayout : null}>
          <View style={isDesktop ? styles.desktopLeftColumn : null}>
            <View style={styles.header}>
              <Text style={[styles.greeting, { color: colors.primary, fontSize: getFontSize(isSenior ? 34 : 28) }]}>{greeting}!</Text>
              <Text style={[styles.time, { color: colors.text, fontSize: getFontSize(isSenior ? 48 : 36) }]}>
                {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
              {!isSenior && (
                <Text style={[styles.date, { color: colors.mutedText, fontSize: getFontSize(16) }]}>
                  {currentTime.toLocaleDateString(i18n.language, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              )}
            </View>

            {/* SAFETY STATUS */}
            {user && (
              <View style={styles.section}>
                <View style={[styles.safetyCard, { backgroundColor: colors.success + '10', borderColor: colors.success }]}>
                  <View style={styles.safetyHeader}>
                    <Ionicons name="shield-checkmark" size={24} color={colors.success} />
                    <Text style={[styles.safetyTitle, { color: colors.success, fontSize: getFontSize(20) }]}>Safety Status</Text>
                  </View>
                  <View style={styles.safetyBody}>
                    <View style={styles.safetyItem}>
                      <Ionicons name="radio-button-on" size={16} color={colors.success} />
                      <Text style={[styles.safetyText, { color: colors.text, fontSize: getFontSize(16) }]}>Fall Detection Active</Text>
                    </View>
                    <Text style={[styles.safetySubtitle, { color: colors.mutedText, fontSize: getFontSize(14) }]}>Monitoring movement for emergency assistance.</Text>

                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 12,
                        paddingVertical: 8,
                        paddingHorizontal: 15,
                        borderRadius: 20,
                        alignSelf: 'flex-start',
                        backgroundColor: colors.success
                      }}
                      onPress={() => router.push("/fall-detected" as any)}
                    >
                      <Ionicons name="play" size={16} color="#FFF" />
                      <Text style={{
                        color: '#FFF',
                        fontWeight: 'bold',
                        marginLeft: 6,
                        fontSize: 14,
                      }}>Simulate Fall Alert (Test)</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {!user && (
              <TouchableOpacity
                style={[styles.guestCta, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
                onPress={() => router.push("/auth/login" as any)}
              >
                <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
                <View style={styles.guestCtaContent}>
                  <Text style={[styles.guestCtaTitle, { color: colors.primary }]}>{t("signInToUnlock") || "Sign in to unlock full access"}</Text>
                  <Text style={[styles.guestCtaSubtitle, { color: colors.mutedText }]}>
                    {t("guestModeMessage") || "Enjoy personalized health tracking and stay connected with your family."}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}

            {/* QUICK ACTIONS */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: getFontSize(20) }]}>{t("quickActions")}</Text>
              <View style={styles.quickActionsGrid}>
                {quickActions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.quickActionCard,
                      { backgroundColor: action.color },
                      isSenior && { width: '100%', flexDirection: 'row', justifyContent: 'center', height: 80 },
                      isDesktop && { width: '48%' }
                    ]}
                    onPress={action.action}
                  >
                    <Ionicons name={action.icon as any} size={isSenior ? 32 : 24} color={colors.buttonText} />
                    <Text style={[
                      styles.quickActionText,
                      { color: colors.buttonText, fontSize: getFontSize(isSenior ? 20 : 16) },
                      isSenior && { marginLeft: 15, marginTop: 0 }
                    ]}>
                      {action.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* PERSONALIZED RECOMMENDATIONS */}
            {personalizationData?.recommendations && personalizationData.recommendations.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontSize: getFontSize(20) }]}>🎯 Personalized for You</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recsScroll}>
                  {personalizationData.recommendations.map((rec: any, index: number) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.recCard, { backgroundColor: colors.card, borderColor: rec.priority === 'high' ? colors.warning : colors.border }]}
                      onPress={() => handleRecommendationPress(rec)}
                    >
                      <View style={styles.recCardHeader}>
                        <View style={[styles.recIconBadge, { backgroundColor: colors.primary + '15' }]}>
                          <Ionicons name={getRecommendationIcon(rec.type) as any} size={24} color={colors.primary} />
                        </View>
                        <TouchableOpacity
                          style={styles.dismissButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDismissRecommendation(rec);
                          }}
                        >
                          <Ionicons name="close-circle" size={20} color={colors.mutedText} />
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.recTitle, { color: colors.text }]} numberOfLines={1}>{rec.title}</Text>
                      <Text style={[styles.recDesc, { color: colors.mutedText }]} numberOfLines={2}>{rec.description}</Text>
                      {rec.reason && (
                        <View style={styles.recReasonRow}>
                          <Ionicons name="sparkles" size={12} color={colors.warning} />
                          <Text style={[styles.recReason, { color: colors.warning }]}>AI Tip</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* WELLNESS & MIND */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: getFontSize(20) }]}>Wellness & Mind</Text>
              <TouchableOpacity
                style={[styles.wellnessCard, { backgroundColor: colors.info + '15', borderColor: colors.info }]}
                onPress={() => router.push("/music" as any)}
              >
                <LinearGradient
                  colors={[colors.primary + '20', 'transparent']}
                  style={styles.wellnessGradient}
                />
                <View style={styles.wellnessIcon}>
                  <Ionicons name="musical-notes" size={32} color={colors.primary} />
                </View>
                <View style={styles.wellnessContent}>
                  <Text style={[styles.wellnessTitle, { color: colors.text, fontSize: getFontSize(18) }]}>Relaxing Music</Text>
                  <Text style={[styles.wellnessSubtitle, { color: colors.mutedText, fontSize: getFontSize(14) }]}>
                    Calm sounds for meditation and better sleep.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* HEALTH METRICS */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: getFontSize(20) }]}>{t("todaysHealthSummary")}</Text>
              <View style={styles.metricsGrid}>
                {healthMetrics.map((metric, index) => (
                  <View key={index} style={[
                    styles.metricCard,
                    { backgroundColor: colors.card },
                    isSenior && { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
                    isDesktop && { width: '48%' }
                  ]}>
                    <View style={[styles.metricHeader, isSenior && { marginBottom: 0, marginRight: 15 }]}>
                      <Ionicons name={metric.icon as any} size={isSenior ? 28 : 20} color={colors.primary} />
                      {!isSenior && (
                        <Ionicons
                          name={
                            metric.trend === "up"
                              ? "trending-up"
                              : metric.trend === "down"
                                ? "trending-down"
                                : "remove"
                          }
                          size={16}
                          color={
                            metric.trend === "up"
                              ? colors.success
                              : metric.trend === "down"
                                ? colors.warning
                                : colors.mutedText
                          }
                        />
                      )}
                    </View>
                    <View style={isSenior && { flex: 1 }}>
                      <Text style={[styles.metricValue, { color: colors.text, fontSize: getFontSize(isSenior ? 24 : 20) }]}>{metric.value}</Text>
                      <Text style={[styles.metricLabel, { color: colors.mutedText, fontSize: getFontSize(14) }]}>{metric.label}</Text>
                    </View>
                    {isSenior && (
                      <Ionicons
                        name={
                          metric.trend === "up" ? "arrow-up-circle" : metric.trend === "down" ? "arrow-down-circle" : "remove-circle"
                        }
                        size={24}
                        color={metric.trend === "up" ? colors.success : metric.trend === "down" ? colors.warning : colors.mutedText}
                      />
                    )}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: getFontSize(20) }]}>{t("todaysSchedule")}</Text>
              {upcomingEvents.map((event, index) => (
                <View key={index} style={[styles.eventCard, { backgroundColor: colors.card }, isSenior && { padding: 20 }]}>
                  <View style={[styles.eventTime, { borderRightColor: colors.primary }, isSenior && { minWidth: 80 }]}>
                    <Text style={[styles.eventTimeText, { color: colors.primary, fontSize: getFontSize(16) }]}>{event.time}</Text>
                  </View>
                  <View style={styles.eventContent}>
                    <Text style={[styles.eventTitle, { color: colors.text, fontSize: getFontSize(18) }]}>{event.title}</Text>
                    <View style={styles.eventType}>
                      <Ionicons
                        name={
                          event.type === "medication"
                            ? "medkit"
                            : event.type === "appointment"
                              ? "calendar"
                              : "walk"
                        }
                        size={14}
                        color={colors.primary}
                      />
                      <Text style={[styles.eventTypeText, { color: colors.mutedText }]}>{event.type}</Text>
                    </View>
                  </View>
                </View>
              ))}
              {upcomingEvents.length === 0 && (
                <View style={[styles.eventCard, { backgroundColor: colors.card, justifyContent: 'center', padding: 30 }]}>
                  <Text style={{ color: colors.mutedText, textAlign: 'center' }}>No events scheduled for today.</Text>
                </View>
              )}
            </View>
          </View>

          <View style={isDesktop ? styles.desktopRightColumn : null}>
            {/* AI COMPANION */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: getFontSize(20) }]}>{t("yourAICompanion")}</Text>
              <View style={[styles.companionCard, { backgroundColor: colors.card }, isSenior && { padding: 25 }]}>
                <Ionicons name="chatbubble-ellipses" size={isSenior ? 48 : 32} color={colors.primary} />
                <View style={styles.companionContent}>
                  <Text style={[styles.companionTitle, { color: colors.text, fontSize: getFontSize(18) }]}>{t("elderBotHelp")}</Text>
                  <Text style={[styles.companionMessage, { color: colors.mutedText, fontSize: getFontSize(16) }]}>"{aiMessage}"</Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.chatButton, { backgroundColor: colors.primary, height: isSenior ? 70 : 56, justifyContent: 'center' }]} onPress={handleAIChat}>
                <Text style={[styles.chatButtonText, { color: colors.buttonText, fontSize: getFontSize(18), fontWeight: 'bold' }]}>{t("startConversation")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* REMINDER MODAL remains full width logic, but centered */}
        <Modal visible={showReminderModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.appleModalBox, { backgroundColor: theme === 'dark' ? colors.card : "#F2F2F7" }]}>
              <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity
                  onPress={() => {
                    setShowReminderModal(false);
                    setMode("date");
                  }}
                >
                  <Text style={styles.cancelText}>{t("cancel")}</Text>
                </TouchableOpacity>
                <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>{t("addReminder")}</Text>
                <TouchableOpacity onPress={scheduleReminder}>
                  <Text style={styles.saveText}>{t("saveChanges")}</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.timeDisplayContainer, { backgroundColor: colors.card }]}>
                <Text style={[styles.selectedTimeLabel, { color: colors.mutedText }]}>{t("remindMeAt")}</Text>
                <Text style={[styles.selectedTime, { color: colors.text }]}>
                  {selectedDate.toLocaleString()}
                </Text>
              </View>

              <View style={[styles.pickerContainer, { backgroundColor: colors.card, paddingVertical: 20 }]}>
                <PlatformDateTimePicker
                  value={selectedDate}
                  mode="datetime"
                  display="spinner"
                  onChange={onChange}
                  themeVariant={theme}
                  minimumDate={new Date()}
                />
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </ResponsiveView>
  );
}

/* ----------------------------------------------------
   STYLES
---------------------------------------------------- */
const styles = StyleSheet.create({
  recsScroll: {
    paddingRight: 20,
  },
  recCard: {
    width: 200,
    padding: 16,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dismissButton: {
    padding: 2,
  },
  recIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  recTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  recReasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
  },
  recReason: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  container: { flex: 1 },
  contentContainer: { padding: 20 },
  header: { alignItems: "center", marginBottom: 30, paddingVertical: 20 },
  greeting: { fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  time: { fontSize: 36, fontWeight: "300", marginBottom: 4 },
  date: { fontSize: 16 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionCard: {
    width: "48%",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionText: { fontWeight: "700", marginTop: 8 },

  // Desktop Specific
  desktopMainLayout: {
    flexDirection: 'row',
    gap: 30,
    alignItems: 'flex-start',
  },
  desktopLeftColumn: {
    flex: 1.5,
  },
  desktopRightColumn: {
    flex: 1,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center", // Center modal on web
    alignItems: "center",
  },
  appleModalBox: {
    borderRadius: 20,
    paddingBottom: 20,
    width: Platform.OS === 'web' ? 500 : '100%',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  cancelText: {
    fontSize: 17,
    color: "#007AFF",
  },
  saveText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#007AFF",
  },
  timeDisplayContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  selectedTimeLabel: {
    fontSize: 13,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  selectedTime: {
    fontSize: 22,
    fontWeight: "600",
  },
  pickerContainer: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  iosDatePicker: {
    height: 200,
  },
  androidHint: {
    textAlign: "center",
    color: "#8E8E93",
    fontSize: 14,
    marginTop: 12,
  },

  // Health metrics
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricCard: {
    width: "48%",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
  },

  // Upcoming events
  eventCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  eventTime: {
    marginRight: 12,
    paddingRight: 12,
    borderRightWidth: 3,
  },
  eventTimeText: {
    fontSize: 16,
    fontWeight: "700",
  },
  eventContent: { flex: 1 },
  eventTitle: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  eventType: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventTypeText: {
    fontSize: 13,
    marginLeft: 6,
    textTransform: "capitalize",
    fontWeight: '500',
  },

  // Companion
  companionCard: {
    flexDirection: "row",
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 3,
  },
  companionContent: {
    flex: 1,
    marginLeft: 16,
  },
  companionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
  },
  companionMessage: {
    fontSize: 16,
    fontStyle: "italic",
    lineHeight: 22,
  },
  chatButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  guestCta: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: 30,
  },
  guestCtaContent: {
    flex: 1,
    marginHorizontal: 16,
  },
  guestCtaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  guestCtaSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  wellnessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 10,
  },
  wellnessGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  wellnessIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  wellnessContent: {
    flex: 1,
  },
  wellnessTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  wellnessSubtitle: {
    lineHeight: 18,
  },
  chatButtonText: {
    fontSize: 18,
    fontWeight: "700",
  },
  safetyCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  safetyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  safetyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  safetyBody: {
    paddingLeft: 34,
  },
  safetyItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  safetyText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  safetySubtitle: {
    fontSize: 14,
  },
});