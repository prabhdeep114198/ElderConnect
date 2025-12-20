import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from "react-native-reanimated";
import LoginModal from "../components/LoginModal";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

// Types for backend response
interface Feature {
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface ButtonItem {
  title: string;
  actionType: "route" | "login";
  route?: `/${string}`;
  primary?: boolean;
}

// Reusable Animated Card
const AnimatedFeatureCard = ({ feature, index, colors }: { feature: Feature, index: number, colors: any }) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}
    >
      <View style={[styles.iconCircle, { backgroundColor: feature.color + '20' }]}>
        <Ionicons name={feature.icon as any} size={28} color={feature.color} />
      </View>
      <Text style={[styles.cardTitle, { color: colors.text }]}>{feature.title}</Text>
      <Text style={[styles.cardDesc, { color: colors.mutedText }]}>{feature.description}</Text>
    </Animated.View>
  );
};

export default function LandingScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { user } = useAuth(); // Check auth state to adjust buttons if needed
  const [showLogin, setShowLogin] = useState(false);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [buttons, setButtons] = useState<ButtonItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Hero Animation Values
  const heroOpacity = useSharedValue(0);
  const heroTranslateY = useSharedValue(50);

  useEffect(() => {
    // Start Hero Animation
    heroOpacity.value = withTiming(1, { duration: 1000 });
    heroTranslateY.value = withSpring(0);

    const fetchLandingData = async () => {
      try {
        // Simulate API fetch
        await new Promise(resolve => setTimeout(resolve, 800));

        setFeatures([
          { title: "Health Tracker", description: "Monitor vitals & steps", icon: "pulse", color: "#FF5252" },
          { title: "Appointments", description: "Never miss a visit", icon: "calendar", color: "#448AFF" },
          { title: "Medications", description: "Pill reminders", icon: "medkit", color: "#69F0AE" },
          { title: "Magnifier", description: "Read small text", icon: "eye", color: "#FFD740" },
          { title: "Mood Diary", description: "Track wellbeing", icon: "book", color: "#E040FB" },
          { title: "Reports", description: "Visualize health", icon: "pie-chart", color: "#536DFE" },
        ]);

        const btns: ButtonItem[] = [
          {
            title: "Get Started",
            actionType: "route",
            route: user
              ? (user.isOnboarded ? "/(tabs)/home" : "/onboarding")
              : "/auth/login",
            primary: true
          }
        ];

        // Add Login button only if not logged in
        if (!user) {
          btns.push({ title: "Login", actionType: "login", primary: false });
        }

        setButtons(btns);

      } catch (err) {
        console.warn("Error loading data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLandingData();
  }, [user]);

  const heroStyle = useAnimatedStyle(() => {
    return {
      opacity: heroOpacity.value,
      transform: [{ translateY: heroTranslateY.value }]
    };
  });

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <Animated.View style={[styles.heroSection, heroStyle]}>
        <View style={[styles.heroIconContainer, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="heart-circle" size={80} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          Welcome to <Text style={{ color: colors.primary }}>ElderConnect</Text>
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          Empowering your golden years with smart health tracking and effortless care.
        </Text>
      </Animated.View>

      {/* Features Grid */}
      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <AnimatedFeatureCard
            key={feature.title}
            feature={feature}
            index={index}
            colors={colors}
          />
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        {buttons.map((btn, index) => (
          <Animated.View
            key={btn.title}
            entering={FadeInDown.delay(600 + (index * 100)).springify()}
            style={{ width: '100%', alignItems: 'center' }}
          >
            <TouchableOpacity
              style={[
                styles.button,
                btn.primary
                  ? { backgroundColor: colors.primary, shadowColor: colors.primary }
                  : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }
              ]}
              onPress={() => {
                if (btn.actionType === "login") setShowLogin(true);
                else if (btn.actionType === "route" && btn.route)
                  router.push(btn.route as any);
              }}
            >
              <Text style={[
                styles.buttonText,
                btn.primary ? { color: "#fff" } : { color: colors.text }
              ]}>
                {btn.title}
              </Text>
              {btn.primary && <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* Login Modal */}
      <Modal visible={showLogin} animationType="slide" transparent>
        <LoginModal onClose={() => setShowLogin(false)} />
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: "center",
    minHeight: '100%'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%'
  },
  heroIconContainer: {
    padding: 10,
    borderRadius: 50,
    marginBottom: 16
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20
  },
  featuresContainer: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 30
  },
  card: {
    width: "48%",
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    alignItems: "center",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  iconCircle: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
  },
  cardDesc: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16
  },
  buttonsContainer: {
    width: "100%",
    marginTop: 10,
    alignItems: "center",
    gap: 16
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: "90%",
    paddingVertical: 18,
    borderRadius: 16,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: 18,
  },
});
