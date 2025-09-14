import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../../constants/colors";

export default function reportsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>reports Page</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  text: { fontSize: 20, color: Colors.text },
});
