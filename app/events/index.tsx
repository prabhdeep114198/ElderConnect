import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";

import { useTheme } from "../../context/ThemeContext";

export default function EventsHomePage() {
  const { colors } = useTheme();
  const router = useRouter();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:3000/api/events/external"
      );
      const data = await response.json();

      if (data.success && Array.isArray(data.events)) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error("Event fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      
      {/* Custom Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.push("/")}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.text}
            style={{ marginRight: 12 }}
          />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Events
        </Text>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Category Badge */}
            <View
              style={[styles.badge, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.badgeText}>
                {item.category || "General"}
              </Text>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text }]}>
              {item.title}
            </Text>

            {/* Date */}
            <View style={styles.row}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {item.start
                  ? new Date(item.start).toDateString()
                  : "Date TBD"}
              </Text>
            </View>

            {/* Location */}
            <View style={styles.row}>
              <Ionicons
                name="location-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {item.location}
              </Text>
            </View>

            {/* Description */}
            <Text
              style={[styles.description, { color: colors.mutedText }]}
            >
              {item.description ||
                "No detailed description available."}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
  },
  description: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
  },
});