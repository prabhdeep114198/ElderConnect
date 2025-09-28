import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../constants/colors";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    return () => clearInterval(timer);
  }, []);

  const quickActions = [
    {
      title: "Emergency SOS",
      icon: "warning",
      color: Colors.error,
      action: () => Alert.alert("Emergency", "Emergency services contacted!"),
    },
    {
      title: "Call Family",
      icon: "call",
      color: Colors.primary,
      action: () => Alert.alert("Calling", "Calling emergency contact..."),
    },
    {
      title: "Health Check",
      icon: "heart",
      color: Colors.success,
      action: () => Alert.alert("Health Check", "Daily health check initiated"),
    },
    {
      title: "Reminders",
      icon: "alarm",
      color: Colors.warning,
      action: () => Alert.alert("Reminders", "You have 2 pending reminders"),
    },
  ];

  const healthMetrics = [
    { label: "Steps Today", value: "3,247", icon: "walk", trend: "up" },
    { label: "Heart Rate", value: "72 bpm", icon: "heart", trend: "stable" },
    { label: "Sleep Quality", value: "7.5 hrs", icon: "moon", trend: "up" },
    { label: "Hydration", value: "6/8 cups", icon: "water", trend: "down" },
  ];

  const upcomingEvents = [
    { time: "10:00 AM", title: "Take Morning Medication", type: "medication" },
    { time: "2:00 PM", title: "Doctor Appointment", type: "appointment" },
    { time: "6:00 PM", title: "Evening Walk Reminder", type: "activity" },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting}!</Text>
        <Text style={styles.time}>
          {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
        <Text style={styles.date}>
          {currentTime.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.quickActionCard, { backgroundColor: action.color }]}
              onPress={action.action}
            >
              <Ionicons name={action.icon as any} size={24} color={Colors.buttonText} />
              <Text style={styles.quickActionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Health Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Health Summary</Text>
        <View style={styles.metricsGrid}>
          {healthMetrics.map((metric, index) => (
            <View key={index} style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name={metric.icon as any} size={20} color={Colors.primary} />
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
                      ? Colors.success
                      : metric.trend === "down"
                      ? Colors.warning
                      : Colors.mutedText
                  }
                />
              </View>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Upcoming Events */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        {upcomingEvents.map((event, index) => (
          <View key={index} style={styles.eventCard}>
            <View style={styles.eventTime}>
              <Text style={styles.eventTimeText}>{event.time}</Text>
            </View>
            <View style={styles.eventContent}>
              <Text style={styles.eventTitle}>{event.title}</Text>
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
                  color={Colors.primary}
                />
                <Text style={styles.eventTypeText}>{event.type}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* AI Companion Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your AI Companion</Text>
        <View style={styles.companionCard}>
          <Ionicons name="chatbubble-ellipses" size={32} color={Colors.primary} />
          <View style={styles.companionContent}>
            <Text style={styles.companionTitle}>ElderBot is here to help!</Text>
            <Text style={styles.companionMessage}>
              "Remember to take your afternoon medication in 2 hours. Would you like me to set a reminder?"
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.chatButton}>
          <Text style={styles.chatButtonText}>Start Conversation</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  time: {
    fontSize: 36,
    fontWeight: '300',
    color: Colors.text,
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: Colors.mutedText,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 60) / 2,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    color: Colors.buttonText,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: (width - 60) / 2,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.mutedText,
  },
  eventCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eventTime: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 16,
  },
  eventTimeText: {
    color: Colors.buttonText,
    fontWeight: '600',
    fontSize: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  eventType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTypeText: {
    fontSize: 12,
    color: Colors.primary,
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  companionCard: {
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  companionContent: {
    flex: 1,
    marginLeft: 16,
  },
  companionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  companionMessage: {
    fontSize: 14,
    color: Colors.mutedText,
    lineHeight: 20,
  },
  chatButton: {
    backgroundColor: Colors.secondary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  chatButtonText: {
    color: Colors.buttonText,
    fontWeight: '600',
    fontSize: 16,
  },
});

