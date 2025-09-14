// app/signup.tsx
import { ID } from "appwrite";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { account } from "../appwriteConfig";
import { Colors } from "../constants/colors";

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSignup = async () => {
    try {
      await account.create(ID.unique(), email, password, name);
      Alert.alert("Success", "Account created! Please log in.");
      router.replace("/");
    } catch (err: any) {
      Alert.alert("Signup Failed", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor={Colors.mutedText}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={Colors.mutedText}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={Colors.mutedText}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => router.replace("/")}>
        <Text style={[styles.buttonText, { color: Colors.primary }]}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: Colors.background },
  title: { fontSize: 26, fontWeight: "bold", color: Colors.primary, textAlign: "center", marginBottom: 32 },
  input: { backgroundColor: Colors.card, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  button: { backgroundColor: Colors.primary, padding: 16, borderRadius: 10, marginBottom: 12 },
  secondaryButton: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.primary },
  buttonText: { color: Colors.buttonText, fontWeight: "bold", textAlign: "center" },
});
