import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";

interface Event {
  id: string;
  name: string;
  start: string;
  end: string;
  category: string;
  description?: string;
}

export default function MyEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRegisteredEvents = async () => {
      try {
        const stored = await AsyncStorage.getItem("registeredEvents");
        const registered = stored ? JSON.parse(stored) : [];
        setEvents(registered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadRegisteredEvents();
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} size="large" />;

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 26, fontWeight: "bold", marginBottom: 16 }}>
        Your Events
      </Text>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "white",
              padding: 14,
              marginBottom: 12,
              borderRadius: 10,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600" }}>{item.name}</Text>
            <Text style={{ marginTop: 4, color: "#666" }}>
              {new Date(item.start).toLocaleString()} – {new Date(item.end).toLocaleString()}
            </Text>
            <Text style={{ color: "#666" }}>{item.category}</Text>
            {item.description && <Text style={{ color: "#666" }}>{item.description}</Text>}
          </View>
        )}
      />
    </View>
  );
}
