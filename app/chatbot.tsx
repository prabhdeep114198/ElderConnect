import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useTheme } from "../context/ThemeContext";

interface Message {
    id: string;
    text: string;
    sender: "user" | "bot";
    timestamp: number;
}

const STORAGE_KEY = "elder_connect_chat_history";

export default function ChatbotScreen() {
    const router = useRouter();
    const { colors, theme } = useTheme();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        loadChatHistory();
    }, []);

    useEffect(() => {
        saveChatHistory();
    }, [messages]);

    const loadChatHistory = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                setMessages(JSON.parse(stored));
            } else {
                // Initial greeting if no history
                setMessages([
                    {
                        id: "init-1",
                        text: "Hello! I am ElderBot, your health companion. How can I help you today?",
                        sender: "bot",
                        timestamp: Date.now(),
                    },
                ]);
            }
        } catch (error) {
            console.error("Failed to load chat history", error);
        }
    };

    const saveChatHistory = async () => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        } catch (error) {
            console.error("Failed to save chat history", error);
        }
    };

    const handleSend = () => {
        if (!inputText.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            sender: "user",
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputText("");
        setIsTyping(true);

        // Simulate Bot Response
        setTimeout(() => {
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: getBotResponse(userMsg.text),
                sender: "bot",
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, botMsg]);
            setIsTyping(false);
        }, 1500);
    };

    const getBotResponse = (input: string): string => {
        const lower = input.toLowerCase();
        if (lower.includes("hello") || lower.includes("hi")) return "Hello there! Stay healthy and happy!";
        if (lower.includes("medication")) return "It's important to take your meds on time. Check the Medications tab for your schedule.";
        if (lower.includes("appointment")) return "You can view your upcoming doctor visits in the Appointments tab.";
        if (lower.includes("water")) return "Staying hydrated is key! Have you had a glass of water recently?";
        if (lower.includes("emergency")) return "If this is an emergency, please call 911 immediately.";
        return "That's interesting! Tell me more, or ask me about your daily health routine.";
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>ElderBot</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.success }]}>• Online</Text>
                </View>
            </View>

            {/* Chat List */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                renderItem={({ item }) => (
                    <View
                        style={[
                            styles.messageBubble,
                            item.sender === "user"
                                ? [styles.userBubble, { backgroundColor: colors.primary }]
                                : [styles.botBubble, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }],
                        ]}
                    >
                        <Text
                            style={[
                                styles.messageText,
                                { color: item.sender === "user" ? colors.buttonText : colors.text },
                            ]}
                        >
                            {item.text}
                        </Text>
                    </View>
                )}
            />

            {/* Typing Indicator */}
            {isTyping && (
                <View style={styles.typingContainer}>
                    <Text style={[styles.typingText, { color: colors.mutedText }]}>ElderBot is typing...</Text>
                </View>
            )}

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
            >
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <TextInput
                        style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                        placeholder="Type a message..."
                        placeholderTextColor={colors.mutedText}
                        value={inputText}
                        onChangeText={setInputText}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, { backgroundColor: colors.primary, opacity: inputText.trim() ? 1 : 0.5 }]}
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                    >
                        <Ionicons name="send" size={20} color={colors.buttonText} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        paddingTop: 50,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: "600",
    },
    listContent: {
        padding: 16,
        paddingBottom: 20,
    },
    messageBubble: {
        padding: 12,
        borderRadius: 16,
        maxWidth: "80%",
        marginBottom: 12,
    },
    userBubble: {
        alignSelf: "flex-end",
        borderBottomRightRadius: 2,
    },
    botBubble: {
        alignSelf: "flex-start",
        borderBottomLeftRadius: 2,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    typingContainer: {
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    typingText: {
        fontSize: 12,
        fontStyle: "italic",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderTopWidth: 1,
    },
    input: {
        flex: 1,
        height: 44,
        borderRadius: 22,
        paddingHorizontal: 16,
        marginRight: 10,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
    },
});
