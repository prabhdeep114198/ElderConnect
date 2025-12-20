import { useRouter, useSegments } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Colors } from "../constants/colors";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";

function InitialLayout() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "auth";
    const inOnboarding = segments[0] === "onboarding";
    const isLandingPage = !segments[0];

    if (!user) {
      // Redirect to login if not authenticated AND not on landing page
      if (!inAuthGroup && !isLandingPage) {
        router.replace("/auth/login");
      }
    } else {
      // User is authenticated
      if (inAuthGroup || (!user.isOnboarded && !inOnboarding)) {
        // If in auth screens or not onboarded, redirect accordingly
        if (user.isOnboarded) {
          router.replace("/(tabs)/home");
        } else {
          router.replace("/onboarding");
        }
      }
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

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

      {/* HIDE AUTH SCREENS FROM DRAWER */}
      <Drawer.Screen
        name="auth/login"
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false,
          swipeEnabled: false
        }}
      />
      <Drawer.Screen
        name="onboarding/index"
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false,
          swipeEnabled: false
        }}
      />
    </Drawer>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <InitialLayout />
      </ThemeProvider>
    </AuthProvider>
  );
}
