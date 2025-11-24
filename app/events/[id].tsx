import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";

interface Event {
  id: string;
  name: string;
  start: string;
  end: string;
  category: string;
  description?: string;
}

export default function EventDetailsPage() {
  const [event, setEvent] = useState<Event | null>(null);
  const { id, event: eventParam } = useLocalSearchParams();

useEffect(() => {
  if (eventParam) {
    setEvent(JSON.parse(eventParam as string));
  }
}, [eventParam]);


  const handleRegister = async () => {
    if (!event) return;

    try {
      const stored = await AsyncStorage.getItem("registeredEvents");
      const registered = stored ? JSON.parse(stored) : [];

      if (!registered.find((e: Event) => e.id === event.id)) {
        registered.push(event);
        await AsyncStorage.setItem("registeredEvents", JSON.stringify(registered));
        Alert.alert("Success", "You are registered for this event!");
      } else {
        Alert.alert("Info", "You have already registered for this event.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to register for the event.");
    }
  };

  if (!event) return <ActivityIndicator style={{ marginTop: 40 }} size="large" />;

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: "bold" }}>{event.name}</Text>
      <Text style={{ marginTop: 12, fontSize: 16 }}>📅 {new Date(event.start).toLocaleString()} – {new Date(event.end).toLocaleString()}</Text>
      <Text style={{ fontSize: 16 }}>📍 {event.category}</Text>
      {event.description && (
        <Text style={{ marginTop: 20, fontSize: 16, color: "#555" }}>{event.description}</Text>
      )}

      <TouchableOpacity
        style={{
          backgroundColor: "#007AFF",
          padding: 16,
          borderRadius: 10,
          marginTop: 30,
        }}
        onPress={handleRegister}
      >
        <Text style={{ color: "white", textAlign: "center", fontSize: 18 }}>
          Register
        </Text>
      </TouchableOpacity>
    </View>
  );
}
