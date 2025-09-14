// app/index.tsx
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import LoginModal from "../components/LoginModal";
import { Colors } from "../constants/colors";

export default function LandingScreen() {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);

  const handleRestrictedFeature = () => {
    setShowLogin(true); // show login popup
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to ElderConnect</Text>
      <Text style={styles.subtitle}>Enjoy free features below 👇</Text>

      {/* Free Feature → Navigate straight to /home */}
      <TouchableOpacity style={styles.button} onPress={() => router.push("/home")}>
        <Text style={styles.buttonText}>Free Feature</Text>
      </TouchableOpacity>

      {/* Restricted Feature → Show login modal */}
      <TouchableOpacity style={styles.button} onPress={handleRestrictedFeature}>
        <Text style={styles.buttonText}>Restricted Feature (Login required)</Text>
      </TouchableOpacity>

      {/* Login modal only shows when restricted feature is clicked */}
      <Modal visible={showLogin} animationType="slide" transparent>
        <LoginModal onClose={() => setShowLogin(false)} />
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.primary,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.mutedText,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  buttonText: {
    color: Colors.buttonText,
    fontWeight: "bold",
    textAlign: "center",
  },
});
