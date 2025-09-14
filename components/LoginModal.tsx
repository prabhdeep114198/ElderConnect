// components/LoginModal.tsx
import React, { useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { account } from "../appwriteConfig";
import { Colors } from "../constants/colors";

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await account.createEmailPasswordSession(email, password);
      Alert.alert("Success", "You are logged in!");
      onClose();
    } catch (err: any) {
      Alert.alert("Login Failed", err?.message || "Something went wrong");
    }
  };

  return (
    <View style={styles.modalBackground}>
      <View style={styles.modalContent}>
        <Text style={styles.title}>Login Required</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.mutedText}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.mutedText}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Log in</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose}>
          <Text style={{ color: Colors.primary, textAlign: "center" }}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: Colors.card,
    padding: 24,
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.primary,
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    backgroundColor: Colors.background,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: Colors.buttonText,
    textAlign: "center",
    fontWeight: "bold",
  },
});
