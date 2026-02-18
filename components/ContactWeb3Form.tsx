import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ContactWeb3Form() {
    const { colors } = useTheme();
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        message: ""
    });

    const onSubmit = async () => {
        if (!form.name || !form.email || !form.message) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setLoading(true);
        setResult("Sending....");

        const formData = new FormData();
        formData.append("access_key", "9505151e-b184-4fca-bbaf-a715273d7d37");
        formData.append("name", form.name);
        formData.append("email", form.email);
        formData.append("message", form.message);

        try {
            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                setResult("Form Submitted Successfully");
                setForm({ name: "", email: "", message: "" });
                Alert.alert("Success", "Your message has been sent successfully!");
            } else {
                setResult("Error");
                Alert.alert("Error", data.message || "Something went wrong. Please try again.");
            }
        } catch (error) {
            console.error(error);
            setResult("Error");
            Alert.alert("Error", "Failed to send message. Please check your internet connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.text }]}>Name</Text>
            <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={form.name}
                onChangeText={(text) => setForm(prev => ({ ...prev, name: text }))}
                placeholder="Your Name"
                placeholderTextColor={colors.mutedText}
            />

            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={form.email}
                onChangeText={(text) => setForm(prev => ({ ...prev, email: text }))}
                placeholder="your.email@example.com"
                placeholderTextColor={colors.mutedText}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <Text style={[styles.label, { color: colors.text }]}>Message</Text>
            <TextInput
                style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={form.message}
                onChangeText={(text) => setForm(prev => ({ ...prev, message: text }))}
                placeholder="How can we help you?"
                placeholderTextColor={colors.mutedText}
                multiline
                numberOfLines={4}
            />

            <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={onSubmit}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={colors.buttonText} />
                ) : (
                    <Text style={[styles.buttonText, { color: colors.buttonText }]}>Submit Form</Text>
                )}
            </TouchableOpacity>

            {result ? <Text style={[styles.resultText, { color: result === "Error" ? colors.error : colors.success }]}>{result}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        borderRadius: 15,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 15,
        marginBottom: 20,
        fontSize: 16,
    },
    textArea: {
        height: 120,
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 15,
        paddingTop: 15,
        marginBottom: 20,
        fontSize: 16,
        textAlignVertical: 'top',
    },
    button: {
        height: 55,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: "bold",
    },
    resultText: {
        marginTop: 15,
        textAlign: "center",
        fontWeight: "500",
    }
});
