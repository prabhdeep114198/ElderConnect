import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useTheme } from "../../context/ThemeContext";

// ... imports ...

import { fetchMockEvents, Event as MockEvent } from "../../services/MockEventService";
import { InteractionType, personalizationService } from "../../services/api/personalization";

export default function EventsHomePage() {
  const { colors, theme } = useTheme();
  const [events, setEvents] = useState<MockEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const lat = 28.6139; // Delhi coordinates
      const lon = 77.2090;

      // Use mocked service "Simulated Live Events" 
      const mockData = await fetchMockEvents(lat, lon);
      setEvents(mockData);
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
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Social Gatherings Near You</Text>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              personalizationService.trackInteraction(InteractionType.EVENT_VIEW, {
                id: item.id,
                name: item.name,
                category: item.category
              });
              router.push({
                pathname: "/events/[id]",
                params: {
                  id: item.id,
                  event: JSON.stringify(item),
                },
              });
            }}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedText} />
            </View>

            <Text style={[styles.title, { color: colors.text }]}>{item.name}</Text>

            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={[styles.date, { color: colors.mutedText }]}>
                {new Date(item.start).toLocaleDateString()}
              </Text>
            </View>

            {item.description && (
              <Text style={[styles.description, { color: colors.mutedText }]} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            <View style={styles.cardFooter}>
              <Text style={[styles.detailsLink, { color: colors.primary }]}>View Details & Register</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 10,
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  categoryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  date: {
    marginLeft: 6,
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4
  },
  detailsLink: {
    fontSize: 14,
    fontWeight: '600'
  }
});
