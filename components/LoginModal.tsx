import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Colors } from "../constants/colors";
import { useAuth } from "../context/AuthContext";

interface LoginModalProps {
  onClose: () => void;
}

interface FormField {
  key: string;
  placeholder: string;
  secure?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}

interface ButtonConfig {
  text: string;
  onPress: () => void;
  primary?: boolean;
  textColor?: string;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const router = useRouter();

  // Dynamic form fields
  const formFields: FormField[] = [
    {
      key: "email",
      placeholder: "Email",
      keyboardType: "email-address",
      autoCapitalize: "none",
    },
    {
      key: "password",
      placeholder: "Password",
      secure: true,
    },
  ];

  const { login } = useAuth();

  const [formValues, setFormValues] = useState<Record<string, string>>(
    formFields.reduce((acc, field) => ({ ...acc, [field.key]: "" }), {})
  );

  const handleChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogin = async () => {
    try {
      const { email, password } = formValues;
      if (email.trim() && password.trim()) {
        await login(email, password);
        onClose();
        // Redirection will be handled by the global layout effect
      } else {
        Alert.alert("Error", "Please fill in all fields");
      }
    } catch (err: any) {
      Alert.alert("Login Failed", err.message || "An error occurred");
    }
  };

  // Dynamic buttons
  const buttons: ButtonConfig[] = [
    { text: "Login", onPress: handleLogin, primary: true },
    {
      text: "Create Account",
      onPress: () => {
        onClose();
        router.push("/auth/login");
      },
      primary: false,
      textColor: Colors.primary,
    },
    {
      text: "Close",
      onPress: onClose,
      primary: false,
      textColor: Colors.mutedText,
    },
  ];

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <Text style={styles.title}>Login to ElderConnect</Text>

        {formFields.map((field) => (
          <TextInput
            key={field.key}
            style={styles.input}
            placeholder={field.placeholder}
            placeholderTextColor={Colors.mutedText}
            value={formValues[field.key]}
            onChangeText={(val) => handleChange(field.key, val)}
            secureTextEntry={field.secure}
            keyboardType={field.keyboardType}
            autoCapitalize={field.autoCapitalize}
          />
        ))}

        {buttons.map((btn, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.button,
              !btn.primary && styles.secondaryButton,
              btn.primary && { backgroundColor: Colors.primary },
            ]}
            onPress={btn.onPress}
          >
            <Text
              style={[
                styles.buttonText,
                !btn.primary && { color: btn.textColor || Colors.primary },
              ]}
            >
              {btn.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: Colors.card,
    padding: 24,
    borderRadius: 12,
    width: "90%",
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.primary,
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    backgroundColor: Colors.background,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  titleText: {},
});
