import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface Ticket {
  ticketId: string;
  eventId: string;
  eventName: string;
  attendeeName: string;
  date: string;
  location: string;
  category: string;
}

export default function MyTicketsPage() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTickets = async () => {
    try {
      const stored = await AsyncStorage.getItem("user_tickets");
      const userTickets = stored ? JSON.parse(stored) : [];
      setTickets(userTickets.reverse()); // Show newest first
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTickets();
    }, [])
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Tickets</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={tickets}
        keyExtractor={(item) => item.ticketId}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="ticket-outline" size={64} color={colors.mutedText} />
            <Text style={[styles.emptyStateText, { color: colors.mutedText }]}>No tickets yet.</Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.mutedText }]}>
              Explore events and register to see your tickets here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.ticketContainer, { backgroundColor: colors.card }]}>
            {/* Left Side (Main Info) */}
            <View style={styles.ticketMain}>
              <Text style={[styles.eventName, { color: colors.text }]}>{item.eventName}</Text>

              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                <Text style={[styles.detailText, { color: colors.mutedText }]}>
                  {new Date(item.date).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={14} color={colors.primary} />
                <Text style={[styles.detailText, { color: colors.mutedText }]}>
                  {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>

              <View style={[styles.badge, { backgroundColor: colors.background }]}>
                <Text style={[styles.badgeText, { color: colors.text }]}>{item.category}</Text>
              </View>
            </View>

            {/* Divider Line */}
            <View style={styles.dividerContainer}>
              <View style={[styles.circle, { backgroundColor: colors.background, marginTop: -10 }]} />
              <View style={[styles.dashedLine, { borderColor: colors.border }]} />
              <View style={[styles.circle, { backgroundColor: colors.background, marginBottom: -10 }]} />
            </View>

            {/* Right Side (Stub) */}
            <View style={styles.ticketStub}>
              <Text style={[styles.stubLabel, { color: colors.mutedText }]}>Attendee</Text>
              <Text style={[styles.stubValue, { color: colors.text }]} numberOfLines={1}>
                {item.attendeeName}
              </Text>

              <Text style={[styles.stubLabel, { color: colors.mutedText, marginTop: 8 }]}>Ticket ID</Text>
              <Text style={[styles.stubValue, { color: colors.primary, fontSize: 10 }]} numberOfLines={1}>
                {item.ticketId}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  backButton: {
    padding: 4
  },
  listContent: {
    padding: 16,
    paddingBottom: 40
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40
  },
  // Ticket Styles
  ticketContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 16,
    height: 140,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ticketMain: {
    flex: 2,
    padding: 16,
    justifyContent: 'center'
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  detailText: {
    marginLeft: 6,
    fontSize: 12
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  dividerContainer: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10
  },
  dashedLine: {
    flex: 1,
    width: 1,
    borderStyle: 'dashed',
    borderWidth: 1
  },
  ticketStub: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 0
  },
  stubLabel: {
    fontSize: 10,
    textTransform: 'uppercase'
  },
  stubValue: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4
  }
});
