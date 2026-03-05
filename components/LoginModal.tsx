import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

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
  const { t } = useTranslation();
  const { colors, theme } = useTheme();

  // Dynamic form fields
  const formFields: FormField[] = [
    {
      key: "email",
      placeholder: t("email"),
      keyboardType: "email-address",
      autoCapitalize: "none",
    },
    {
      key: "password",
      placeholder: t("password"),
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
        Alert.alert(t("error"), t("pleaseFillFields"));
      }
    } catch (err: any) {
      Alert.alert(t("loginFailed"), err.message || t("botDefault"));
    }
  };

  // Dynamic buttons
  const buttons: ButtonConfig[] = [
    { text: t("login"), onPress: handleLogin, primary: true },
    {
      text: t("createAccount"),
      onPress: () => {
        onClose();
        router.push("/auth/login");
      },
      primary: false,
      textColor: colors.primary,
    },
    {
      text: t("close"),
      onPress: onClose,
      primary: false,
      textColor: colors.mutedText,
    },
  ];

  return (
    <View style={[styles.overlay, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0, 0, 0, 0.5)' }]}>
      <View style={[styles.modal, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.primary }]}>{t("loginToElderConnect")}</Text>

        {formFields.map((field) => (
          <TextInput
            key={field.key}
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            placeholder={field.placeholder}
            placeholderTextColor={colors.mutedText}
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
              !btn.primary && [styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.primary }],
              btn.primary && { backgroundColor: colors.primary },
            ]}
            onPress={btn.onPress}
          >
            <Text
              style={[
                styles.buttonText,
                !btn.primary && { color: btn.textColor || colors.primary },
                btn.primary && { color: colors.buttonText }
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
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    padding: 24,
    borderRadius: 12,
    width: "90%",
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
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
    borderWidth: 1,
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  titleText: {},
});
