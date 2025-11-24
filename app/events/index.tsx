import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Event {
  id: string;
  name: string;
  start: string;
  end: string;
  category: string;
  description?: string;
}

const PREDICTHQ_TOKEN = "q9HswX58SlSCUx4TMHKkORZ-G1q2UjybXf3WtNy-"; // Replace with your token

export default function EventsHomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const lat = 28.6139; // Delhi coordinates
      const lon = 77.2090;
      const radiusKm = 20;

      const params = new URLSearchParams({
        within: `${radiusKm}km@${lat},${lon}`,
        "active.gte": new Date().toISOString().split("T")[0],
        limit: "20",
        sort: "rank",
      });

      const res = await fetch(`https://api.predicthq.com/v1/events/?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${PREDICTHQ_TOKEN}`,
          Accept: "application/json",
        },
      });

      const data = await res.json();

      const formatted = data.results.map((e: any) => ({
        id: e.id,
        name: e.title,
        start: e.start,
        end: e.end,
        category: e.category,
        description: e.description,
      }));

      setEvents(formatted);
    } catch (err) {
      console.error("PredictHQ error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} size="large" />;

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#f5f5f5" }}>
      <Text style={styles.header}>Social Gatherings Near You</Text>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
  style={styles.card}
  onPress={() =>
    router.push({
      pathname: "/events/[id]",
      params: {
        id: item.id,                 // required by Expo Router
        event: JSON.stringify(item), // the full event object
      },
    })
  }
>

            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.date}>
              {new Date(item.start).toLocaleDateString()} –{" "}
              {new Date(item.end).toLocaleDateString()}
            </Text>
            <Text style={styles.venue}>{item.category}</Text>
            {item.description && (
              <Text style={{ marginTop: 4, color: "#555" }}>{item.description}</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  date: {
    marginTop: 4,
    color: "#555",
  },
  venue: {
    color: "#777",
  },
});
