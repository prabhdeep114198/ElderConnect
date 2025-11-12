import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { Drawer } from 'expo-router/drawer';
import { View, Text, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/colors';

// 🧩 Type for each drawer screen
interface DrawerScreenItem {
  name: string;
  title: string;
}

export default function RootLayout() {
  // ✅ Typed state variables (no 'never' issue)
  const [drawerScreens, setDrawerScreens] = useState<DrawerScreenItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 🧠 Fetch drawer items dynamically
  useEffect(() => {
    const fetchDrawerScreens = async () => {
      try {
        // ⏳ Simulate backend API (replace with your real API later)
        // const response = await fetch('https://your-backend.com/api/navigation');
        // const data: DrawerScreenItem[] = await response.json();

        const data: DrawerScreenItem[] = [
          { name: '(tabs)', title: 'Main' },
          { name: 'MagnifierScreen', title: 'Magnifier' },
          { name: 'Profile', title: 'Profile' },
          { name: 'Settings', title: 'Settings' },
        ];

        await new Promise((resolve) => setTimeout(resolve, 800)); // fake delay
        setDrawerScreens(data);
      } catch (err) {
        console.error('Error loading drawer screens:', err);
        setError('Failed to load navigation menu');
      } finally {
        setLoading(false);
      }
    };

    fetchDrawerScreens();
  }, []);

  // 🌀 Show loader while fetching
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 10, color: Colors.primary }}>Loading menu...</Text>
      </View>
    );
  }

  // ⚠️ Handle error case
  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
        }}
      >
        <Text style={{ color: 'red', fontSize: 16 }}>{error}</Text>
      </View>
    );
  }

  // 🧩 Render Drawer dynamically based on fetched data
  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: Colors.primary,
        drawerInactiveTintColor: Colors.mutedText,
      }}
    >
      {drawerScreens.map((screen: DrawerScreenItem) => (
        <Drawer.Screen
          key={screen.name}
          name={screen.name}
          options={{ title: screen.title }}
        />
      ))}
    </Drawer>
  );
}
