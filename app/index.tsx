// app/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LoginModal from "../components/LoginModal";
import { Colors } from "../constants/colors";

const { width } = Dimensions.get("window");

// Types for backend response
interface Feature {
  title: string;
  description: string;
  icon: string;
}

interface ButtonItem {
  title: string;
  actionType: "route" | "login"; // login opens modal, route navigates
  route?: `/${string}`; // template literal ensures it's compatible with router.push
}

export default function LandingScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showLogin, setShowLogin] = useState(false);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [buttons, setButtons] = useState<ButtonItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch features & buttons from backend
  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        // Replace with your backend endpoint
        const response = await fetch("https://your-backend.com/api/landing");
        if (!response.ok) throw new Error("Failed to fetch landing data");

        const data = await response.json();
        // Expecting { features: Feature[], buttons: ButtonItem[] }
        setFeatures(data.features || []);
        setButtons(data.buttons || []);
      } catch (err) {
        console.warn("Using fallback landing data", err);
        // Fallback if network fails
        setFeatures([
          { title: "Health Tracker", description: "Track your vitals", icon: "bar-chart" },
          { title: "Appointments", description: "Never miss your doctor's visits", icon: "calendar" },
          { title: "Medications", description: "Manage meds", icon: "medkit" },
          { title: "Magnifier", description: "Zoom small texts", icon: "eye" },
          { title: "Diary Notes", description: "Track moods", icon: "book" },
          { title: "Reports", description: "View medical reports", icon: "document-text" },
        ]);
        setButtons([
          { title: "Get Started", actionType: "route", route: "/(tabs)/home" },
          { title: "Login", actionType: "login" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchLandingData();

    // Animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: Colors.background,
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 10, color: Colors.primary }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
        Welcome to ElderConnect
      </Animated.Text>
      <Text style={styles.subtitle}>Empowering seniors with easy health tracking and care</Text>

      {/* Features */}
      <View style={styles.featuresContainer}>
        {features.map((feature) => (
          <FeatureCard key={feature.title} title={feature.title} description={feature.description} icon={feature.icon} />
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
  {buttons.map((btn) => (
    <TouchableOpacity
      key={btn.title}
      style={styles.button}
      onPress={() => {
        if (btn.actionType === "login") setShowLogin(true);
        else if (btn.actionType === "route" && btn.route)
          router.push(btn.route as any); // cast as any
      }}
    >
      <Text style={styles.buttonText}>{btn.title}</Text>
    </TouchableOpacity>
  ))}
</View>


      {/* Login Modal */}
      <Modal visible={showLogin} animationType="slide" transparent>
        <LoginModal onClose={() => setShowLogin(false)} />
      </Modal>
    </ScrollView>
  );
}

// Feature Card Component
const FeatureCard = ({ title, description, icon }: { title: string; description: string; icon: string }) => (
  <View style={styles.card}>
    <Ionicons name={icon as any} size={36} color={Colors.primary} style={{ marginBottom: 8 }} />
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardDesc}>{description}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: Colors.background,
    alignItems: "center",
  },
  title: {
    marginTop: "5%",
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.primary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.mutedText,
    textAlign: "center",
    marginBottom: 20,
  },
  featuresContainer: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 4,
    textAlign: "center",
  },
  cardDesc: {
    fontSize: 12,
    color: Colors.mutedText,
    textAlign: "center",
  },
  buttonsContainer: {
    width: "100%",
    marginTop: 20,
    alignItems: "center",
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginBottom: 12,
    alignSelf: "center",
  },
  buttonText: {
    color: Colors.buttonText,
    fontWeight: "700",
    fontSize: 16,
    textAlign: "center",
  },
});
