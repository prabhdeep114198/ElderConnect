import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Colors } from "../constants/colors";
import React, { useEffect, useState } from "react";

// Define a type for each tab
interface TabScreen {
  name: string;
  title: string;
  icon: string;
}

export default function TabsLayout() {
  const [tabScreens, setTabScreens] = useState<TabScreen[]>([]);

  useEffect(() => {
    const fetchTabs = async () => {
      try {
        // TODO: Replace with your backend API call
        // Example: const res = await fetch("https://your-backend.com/tabs");
        // const data = await res.json();

        // Placeholder data (used until backend is connected)
        const data: TabScreen[] = [
          { name: "home", title: "Home", icon: "home" },
          { name: "medications", title: "Medications", icon: "medkit" },
          { name: "tracker", title: "Tracker", icon: "bar-chart" },
          { name: "appointments", title: "Appointments", icon: "calendar" },
          { name: "diary", title: "Diary", icon: "book" },
          { name: "reports", title: "Reports", icon: "document-text" },
          { name: "MagnifierScreen", title: "Magnifier", icon: "eye" },
        ];

        setTabScreens(data);
      } catch (err) {
        console.error("Failed to fetch tabs", err);
      }
    };

    fetchTabs();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.mutedText,
        tabBarStyle: { backgroundColor: Colors.card, paddingBottom: 6, height: 60 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      {tabScreens.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => <Ionicons name={tab.icon as any} size={size} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
