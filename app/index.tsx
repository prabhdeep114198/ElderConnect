// app/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
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

export default function LandingScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showLogin, setShowLogin] = useState(false);

  // Fade-in animation for title
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Animated Welcome Title */}
      <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
        Welcome to ElderConnect
      </Animated.Text>
      <Text style={styles.subtitle}>
        Empowering seniors with easy health tracking and care
      </Text>

      {/* Features */}
      <View style={styles.featuresContainer}>
        <FeatureCard
          title="Health Tracker"
          description="Track your vitals and daily activity"
          icon="bar-chart"
        />
        <FeatureCard
          title="Appointments"
          description="Never miss your doctor's visits"
          icon="calendar"
        />
        <FeatureCard
          title="Medications"
          description="Manage and get reminders for meds"
          icon="medkit"
        />
        <FeatureCard
          title="Magnifier"
          description="Zoom and read small texts easily"
          icon="eye"
        />
        <FeatureCard
          title="Diary Notes"
          description="Keep track of daily thoughts & moods"
          icon="book"
        />
        <FeatureCard
          title="Reports"
          description="Access all your medical reports in one place"
          icon="document-text"
        />
      </View>

      {/* CTA Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/(tabs)/home")}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>

        {/* Login Option */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowLogin(true)}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>

      {/* Login Modal */}
      <Modal visible={showLogin} animationType="slide" transparent>
        <LoginModal onClose={() => setShowLogin(false)} />
      </Modal>
    </ScrollView>
  );
}

// Feature Card Component
const FeatureCard = ({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) => (
  <View style={styles.card}>
    <Ionicons
      name={icon as any}
      size={36}
      color={Colors.primary}
      style={{ marginBottom: 8 }}
    />
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
  loginButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  buttonText: {
    color: Colors.buttonText,
    fontWeight: "700",
    fontSize: 16,
    textAlign: "center",
  },
});
