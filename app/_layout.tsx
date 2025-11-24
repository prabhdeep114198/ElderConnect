import { Drawer } from "expo-router/drawer";
import { Colors } from "../constants/colors";

export default function RootLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: Colors.primary,
        drawerInactiveTintColor: Colors.mutedText,
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{ title: "Main" }}
      />

      <Drawer.Screen
  name="events"
  options={{ headerShown: false }}
/>

      <Drawer.Screen
        name="MagnifierScreen"
        options={{ title: "Magnifier" }}
      />

      <Drawer.Screen
        name="SettingsScreen"
        options={{ title: "Settings" }}
      />
    </Drawer>
  );
}
