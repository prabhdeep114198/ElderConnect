// app/(tabs)/home.tsx
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../../constants/colors";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to ElderConnect</Text>
      <Text style={styles.subtitle}>
        Your personal health, safety, and wellness companion
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.background },
  title: { fontSize: 24, fontWeight: "bold", color: Colors.primary, marginBottom: 12 },
  subtitle: { fontSize: 16, color: Colors.mutedText, textAlign: "center", paddingHorizontal: 20 },
});
