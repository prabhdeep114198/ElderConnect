import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Drawer } from 'expo-router/drawer';
import { Colors } from "../../constants/colors";

export default function RootLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: Colors.primary,
        drawerInactiveTintColor: Colors.mutedText,
      }}
    >
      {/* Tabs folder — your bottom tabs */}
      <Drawer.Screen
        name="(tabs)"
        options={{ title: 'Main' }}
      />

      {/* Extra pages */}
      <Drawer.Screen
        name="MagnifierScreen"
        options={{ title: 'Magnifier' }}
      />
      <Drawer.Screen
        name="Profile"
        options={{ title: 'Profile' }}
      />
      <Drawer.Screen
        name="Settings"
        options={{ title: 'Settings' }}
      />
    </Drawer>
  );
}
