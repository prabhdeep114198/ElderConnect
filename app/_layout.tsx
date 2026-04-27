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
import { useNotificationScheduler } from "../hooks/useNotificationScheduler";
import { getSocket } from "../services/socket";

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
  const { theme, colors, toggleTheme, uiMode, presentationMode } = useTheme();
  const segments = useSegments();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = Platform.OS === 'web' && windowWidth > 1024;
  
  // Activate Notification Engine mapped to user existance logic 
  const { triggerSafetyAlert, triggerDeviceBattery } = useNotificationScheduler({
     enabled: !!user,
     maxDaily: 5
  });

  // ── Feature Flags ────────────────────────────────────────────────────────
  const { useFeatureFlag } = require("../hooks/useFeatureFlags");
  const showChatbot = useFeatureFlag('show_chatbot');
  const showVideoCalls = useFeatureFlag('video_calls');
  const showAiCoaching = useFeatureFlag('ai_coaching');
  const showMusicNostalgia = useFeatureFlag('nostalgia_service');
  const showMentalWellness = useFeatureFlag('mental_wellness');
  const showSdgDashboard = useFeatureFlag('show_sdg_dashboard');
  const showVoiceAssistant = useFeatureFlag('voice_assistant_enabled');
  const { usePremiumFeature } = require("../hooks/useFeatureFlags");
  const hasValidSubscription = usePremiumFeature();

  const PresentationOverlay = () => {
    if (!presentationMode || !showSdgDashboard) return null;
    return (
      <View style={{position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 0, right: 0, alignItems: 'center', pointerEvents: 'none', zIndex: 9999}}>
        <View style={{backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5}}>
          <Text style={{color: '#FFF', fontWeight: 'bold', fontSize: 13}}>Aligned with UN SDG 3, 10, 11, and 12</Text>
        </View>
      </View>
    );
  };

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

    if (user) {
      flagsmith.identify(user.id, {
        plan_level: user.plan_level || "core",
        is_subscribed: user.isSubscribed || false,
        role: user.roles?.[0] || "elder"
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
    const inPublicRoute = segment === "reset-password" || segment === "verify-email";

    if (!user) {
      if (!inAuthGroup && !inPublicRoute) {
        router.replace("/auth/login");
      }
      return;
    }

    if (!user.isOnboarded) {
      if (!inOnboarding && !inPublicRoute) {
        router.replace("/onboarding");
      }
      return;
    }

    if (inAuthGroup || inOnboarding) {
      router.replace("/(tabs)/home");
    }
  }, [user, loading, segments, router]);

  useEffect(() => {
    if (!user || !hasValidSubscription) {
      fallDetectionEngine.stop();
      return;
    }

    const onFallDetected = () => {
      router.push("/fall-detected");
    };

    fallDetectionEngine.start(onFallDetected);

    // Also connect to WebSockets to listen for HARDWARE fall detections globally!
    const socket = getSocket();
    if (socket) {
      socket.emit('room:join_user', { userId: user.id });
      
      const onHardwareFall = (data: any) => {
        console.log("Hardware SOS alert received via WebSockets:", data);
        router.push(`/fall-detected?mode=hardware&alertId=${data.alertId}`);
      };
      
      socket.on('hardware:sos_alert', onHardwareFall);
      
      return () => {
        fallDetectionEngine.stop();
        socket.off('hardware:sos_alert', onHardwareFall);
      };
    }

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
          name="fall-risk"
          options={{
            drawerItemStyle: { display: showAiCoaching ? "flex" : "none" },
            title: "Fall Risk",
            drawerIcon: ({ color, size }) => <Ionicons name="analytics" size={size} color={color} />,
          }}
        />

        <Drawer.Screen
          name="music"
          options={{
            drawerItemStyle: { display: showMusicNostalgia ? "flex" : "none" },
            title: "Music",
            drawerIcon: ({ color, size }) => <Ionicons name="musical-notes" size={size} color={color} />,
          }}
        />

        <Drawer.Screen
          name="chatbot"
          options={{
            drawerItemStyle: { display: showChatbot ? "flex" : "none" },
            title: "Chatbot",
            drawerIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
          }}
        />

        {/* SINGLE VIDEO CALL ENTRY */}
        <Drawer.Screen
          name="videocall/index"
          options={{
            drawerItemStyle: { display: showVideoCalls ? "flex" : "none" },
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
        <Drawer.Screen name="index" options={{ drawerItemStyle: { display: "none" }, headerShown: false }} />
        <Drawer.Screen name="auth/login" options={{ drawerItemStyle: { display: "none" }, headerShown: false }} />
        <Drawer.Screen name="onboarding/index" options={{ drawerItemStyle: { display: "none" }, headerShown: false }} />
        <Drawer.Screen name="fall-detected" options={{ drawerItemStyle: { display: "none" }, headerShown: false }} />
        <Drawer.Screen name="sdg-dashboard" options={{ drawerItemStyle: { display: "none" }, headerShown: false }} />
        <Drawer.Screen name="reset-password" options={{ drawerItemStyle: { display: "none" }, headerShown: false }} />
        <Drawer.Screen name="verify-email" options={{ drawerItemStyle: { display: "none" }, headerShown: false }} />

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

      </Drawer>
      {showVoiceAssistant && <VoiceAssistant />}
      <PresentationOverlay />
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