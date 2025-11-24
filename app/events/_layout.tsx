import { DrawerToggleButton } from "@react-navigation/drawer";
import { Stack } from "expo-router";

export default function EventsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerLeft: () => <DrawerToggleButton />, // 👈 shows drawer menu
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ title: "Events" }} 
      />
      <Stack.Screen 
        name="my-events" 
        options={{
          title: "My Events",
          headerLeft: () => null, // remove drawer button
          headerBackVisible: true, // show back
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{
          title: "Event Details",
          headerLeft: () => null,
          headerBackVisible: true,
        }} 
      />
    </Stack>
  );
}
