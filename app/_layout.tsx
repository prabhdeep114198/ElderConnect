import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { Ionicons } from "@expo/vector-icons";
import { PaperProvider } from "react-native-paper";

import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { useRouter, useSegments } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useEffect } from "react";
import { ActivityIndicator, Platform, StyleSheet, Switch, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import flagsmith from "react-native-flagsmith";
import { FlagsmithProvider } from "react-native-flagsmith/react";
import { Colors } from "../constants/colors";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";

import * as Notifications from "expo-notifications";
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { VoiceAssistant } from "../components/VoiceAssistant";
import "../i18n";
import { fallDetectionEngine } from "../services/fallDetection/FallDetectionEngine";

// NOTIFICATION HANDLER CONFIG
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function InitialLayout() {
  const { user, loading, logout, updateProfile } = useAuth();
  const { theme, colors, toggleTheme, uiMode } = useTheme();
  const segments = useSegments();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = Platform.OS === 'web' && windowWidth > 1024;

  useEffect(() => {
    const setupNotifications = async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: colors.primary,
        });
      }
    };

    setupNotifications();

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log("Notification Received:", notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const { notification } = response;
      console.log("Notification Tapped:", notification.request.content.title);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const flagsmithEnvId = process.env.EXPO_PUBLIC_FLAGSMITH_ENV_ID;
    if (!flagsmithEnvId) {
      flagsmith.logout();
      return;
    }

    const hasValidSubscription = user?.isSubscribed === true ||
      (user?.plan_level && user.plan_level !== "free");

    if (user && hasValidSubscription) {
      flagsmith.identify(user.id, {
        plan_level: user.plan_level ?? "premium",
        is_subscribed: true,
      });
    } else {
      flagsmith.logout();
    }
  }, [user, loading]);

  useEffect(() => {
    if (loading) return;

    const segment = segments[0];
    const inAuthGroup = segment === "auth";
    const inOnboarding = segment === "onboarding";

    if (!user) {
      if (!inAuthGroup) {
        router.replace("/auth/login");
      }
      return;
    }

    if (!user.isOnboarded) {
      if (!inOnboarding) {
        router.replace("/onboarding");
      }
      return;
    }

    if (inAuthGroup || inOnboarding) {
      router.replace("/(tabs)/home");
    }
  }, [user, loading, segments, router]);

  useEffect(() => {
    if (!user) {
      fallDetectionEngine.stop();
      return;
    }

    const onFallDetected = () => {
      router.push("/fall-detected");
    };

    fallDetectionEngine.start(onFallDetected);

    return () => {
      fallDetectionEngine.stop();
    };
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const CustomDrawerContent = (props: any) => {
    const pickImage = async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0].uri) {
        await updateProfile(user?.name || "User", result.assets[0].uri);
      }
    };

    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
          <View style={[styles.drawerHeader, { backgroundColor: colors.primary }]}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
              {user?.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={styles.avatarImage}
                />
              ) : (
                <Ionicons name="person-circle" size={64} color="#FFF" />
              )}
              <View style={styles.editIconContainer}>
                <Ionicons name="camera" size={12} color="#FFF" />
              </View>
              {user?.plan_level === 'premium' && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'Sign in for full access'}</Text>
            <View style={styles.uiModeBadge}>
              <Text style={styles.uiModeText}>
                {uiMode === 'senior' ? '🧓 Senior Mode' : '👩‍⚕️ Caregiver Mode'}
              </Text>
            </View>
          </View>

          <View style={{ paddingVertical: 10 }}>
            <DrawerItemList {...props} />
          </View>
        </DrawerContentScrollView>

        <View style={[styles.drawerFooter, { borderTopColor: colors.border }]}>
          <View style={styles.footerItem}>
            <View style={styles.footerItemLeft}>
              <Ionicons
                name={theme === 'dark' ? "moon" : "sunny"}
                size={22}
                color={colors.text}
              />
              <Text style={[styles.footerItemText, { color: colors.text }]}>
                {theme === 'dark' ? "Dark Mode" : "Light Mode"}
              </Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>

          {user && (
            <TouchableOpacity
              style={[styles.footerItem, { marginTop: 10 }]}
              onPress={async () => {
                await logout();
                router.replace("/auth/login");
              }}
            >
              <View style={styles.footerItemLeft}>
                <Ionicons name="log-out-outline" size={22} color={colors.error} />
                <Text style={[styles.footerItemText, { color: colors.error }]}>Log Out</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          drawerType: isLargeScreen ? 'permanent' : 'front',
          headerShown: !isLargeScreen,
          headerStyle: {
            backgroundColor: colors.background,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
          drawerActiveTintColor: colors.primary,
          drawerInactiveTintColor: colors.mutedText,
          drawerActiveBackgroundColor: colors.primary + '10',
          drawerLabelStyle: {
            marginLeft: -10,
            fontWeight: '600',
            fontSize: 16,
          },
          drawerStyle: {
            width: 280,
            backgroundColor: colors.background,
            borderRightWidth: isLargeScreen ? 1 : 0,
            borderRightColor: colors.border,
          }
        }}
      >
        <Drawer.Screen
          name="(tabs)"
          options={{
            title: "Home",
            drawerIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />
          }}
        />

        <Drawer.Screen
          name="events"
          options={{
            title: "Events",
            headerShown: false,
            drawerIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />
          }}
        />

        <Drawer.Screen
          name="MagnifierScreen"
          options={{
            title: "Magnifier",
            drawerIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />
          }}
        />

        <Drawer.Screen
          name="reminders"
          options={{
            title: "Reminders",
            drawerIcon: ({ color, size }) => <Ionicons name="notifications" size={size} color={color} />
          }}
        />

        <Drawer.Screen
          name="music"
          options={{
            title: "Music",
            drawerIcon: ({ color, size }) => <Ionicons name="musical-notes" size={size} color={color} />,
          }}
        />

        <Drawer.Screen
          name="chatbot"
          options={{
            title: "Chatbot",
            drawerIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
          }}
        />

        {/* SINGLE VIDEO CALL ENTRY */}
        <Drawer.Screen
          name="videocall/index"
          options={{
            title: "Video Call",
            drawerIcon: ({ color, size }) => <Ionicons name="videocam" size={size} color={color} />,
          }}
        />

        <Drawer.Screen
          name="settings"
          options={{
            title: "Settings",
            drawerIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
          }}
        />

        {/* HIDDEN ROUTES */}
        <Drawer.Screen name="_index" options={{ drawerItemStyle: { display: "none" }, headerShown: false }} />
        <Drawer.Screen name="auth/login" options={{ drawerItemStyle: { display: "none" }, headerShown: false }} />
        <Drawer.Screen name="onboarding/index" options={{ drawerItemStyle: { display: "none" }, headerShown: false }} />
        <Drawer.Screen name="fall-detected" options={{ drawerItemStyle: { display: "none" }, headerShown: false }} />
        <Drawer.Screen name="onboarding" options={{ drawerItemStyle: { display: "none" }, headerShown: false }} />

        {/* HIDE THE ROOM SCREEN FROM SIDEBAR */}
        <Drawer.Screen
          name="videocall/room"
          options={{
            drawerItemStyle: { display: "none" },
            headerShown: true,
            title: "Video Room"
          }}
        />

        {/* Ensure the group folder doesn't create a second entry */}
        <Drawer.Screen name="videocall" options={{ drawerItemStyle: { display: "none" } }} />

      </Drawer>
      <VoiceAssistant />
    </>
  );
}

const styles = StyleSheet.create({
  drawerHeader: { padding: 24, paddingTop: 60, borderBottomRightRadius: 30, marginBottom: 10 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  premiumBadge: { position: 'absolute', bottom: 0, right: -5, backgroundColor: '#000', borderRadius: 10, padding: 4, borderWidth: 1, borderColor: '#FFD700' },
  userName: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  userEmail: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, marginTop: 2 },
  drawerFooter: { padding: 20, paddingBottom: 40, borderTopWidth: 1 },
  footerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  footerItemLeft: { flexDirection: 'row', alignItems: 'center' },
  footerItemText: { fontSize: 16, marginLeft: 15, fontWeight: '500' },
  uiModeBadge: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.2)', alignSelf: 'flex-start' },
  uiModeText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  avatarImage: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#FFF' },
  editIconContainer: { position: 'absolute', bottom: 0, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: 4, borderWidth: 1, borderColor: '#FFF' },
});

// Initialize Flagsmith before providing it
flagsmith.init({
  environmentID: process.env.EXPO_PUBLIC_FLAGSMITH_ENV_ID!,
});

export default function RootLayout() {
  return (
    <PaperProvider>
      <FlagsmithProvider flagsmith={flagsmith}>
        <AuthProvider>
          <ThemeProvider>
            <ActionSheetProvider>
              <InitialLayout />
            </ActionSheetProvider>
          </ThemeProvider>
        </AuthProvider>
      </FlagsmithProvider>
    </PaperProvider>
  );
}