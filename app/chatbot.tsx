import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    SafeAreaView
} from "react-native";

import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { chatService } from "../services/api/chat";

interface Message {
    id: string;
    text: string;
    sender: "user" | "bot";
    timestamp: number;
    actionLink?: string;
    actionLabel?: string;
}

interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    timestamp: number;
}

export default function ChatbotScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { colors, theme } = useTheme();
    const { t } = useTranslation();

    const [messages, setMessages] = useState<Message[]>([]);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const STORAGE_KEY = user ? `elder_connect_chats_${user.id}` : null;

    useEffect(() => {
        if (user) {
            loadSessions();
        }
    }, [user]);

    // Save when messages change
    useEffect(() => {
        if (currentSessionId && messages.length > 0) {
            saveCurrentSession();
        }
    }, [messages]);

    const loadSessions = async () => {
        if (!STORAGE_KEY) return;
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsedSessions: ChatSession[] = JSON.parse(stored);
                setSessions(parsedSessions);

                // Load most recent session by default
                if (parsedSessions.length > 0) {
                    const latest = parsedSessions[0];
                    setCurrentSessionId(latest.id);
                    setMessages(latest.messages);
                } else {
                    createNewChat();
                }
            } else {
                createNewChat();
            }
        } catch (error) {
            console.error("Failed to load sessions", error);
        }
    };

    const createNewChat = () => {
        const newId = Date.now().toString();
        const initialMsg: Message = {
            id: `init-${newId}`,
            text: t("botHello") || "Hello! How can I help you today?",
            sender: "bot",
            timestamp: Date.now(),
        };

        const newSession: ChatSession = {
            id: newId,
            title: "New Conversation",
            messages: [initialMsg],
            timestamp: Date.now(),
        };

        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newId);
        setMessages([initialMsg]);
        setShowHistory(false);
    };

    const switchSession = (sessionId: string) => {
        const target = sessions.find(s => s.id === sessionId);
        if (target) {
            setCurrentSessionId(sessionId);
            setMessages(target.messages);
            setShowHistory(false);
        }
    };

    const deleteSession = async (sessionId: string) => {
        const updated = sessions.filter(s => s.id !== sessionId);
        setSessions(updated);
        if (STORAGE_KEY) {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
        if (currentSessionId === sessionId) {
            if (updated.length > 0) {
                switchSession(updated[0].id);
            } else {
                createNewChat();
            }
        }
    };

    const saveCurrentSession = async () => {
        if (!STORAGE_KEY || !currentSessionId) return;

        const updatedSessions = sessions.map(s => {
            if (s.id === currentSessionId) {
                // Update title from first user message if it's still "New Conversation"
                let title = s.title;
                if (title === "New Conversation") {
                    const firstUserMsg = messages.find(m => m.sender === 'user');
                    if (firstUserMsg) {
                        title = firstUserMsg.text.substring(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '');
                    }
                }
                return { ...s, messages, title, timestamp: Date.now() };
            }
            return s;
        });

        // Keep them sorted by most recent
        const sorted = updatedSessions.sort((a, b) => b.timestamp - a.timestamp);

        setSessions(sorted);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    };

    const quickReplies = [
        { label: "Medications", text: "Go to medications", route: "/(tabs)/medications" },
        { label: "Health Tracker", text: "Show my health tracker", route: "/(tabs)/tracker" },
        { label: "Relaxing Music", text: "I want to relax with music", route: "/music" },
        { label: "My Profile", text: "Go to profile", route: "/profile" },
        { label: "Help", text: "How can you help me?" },
        { label: "Settings", text: "Open settings", route: "/SettingsScreen" },
    ];

    const handleQuickReply = (reply: { label: string, text: string, route?: string }) => {
        handleSend(reply.text, reply.route);
    };

    const handleSend = async (textOverride?: string, routeOverride?: string) => {
        const userMessage = textOverride || inputText;
        if (!userMessage.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: userMessage.trim(),
            sender: "user",
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMsg]);
        if (!textOverride) setInputText("");
        setIsTyping(true);

        if (routeOverride) {
            setTimeout(() => {
                const botMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    text: `I can help you with that. Click the button below to open ${textOverride?.toLowerCase()}.`,
                    sender: "bot",
                    timestamp: Date.now(),
                    actionLink: routeOverride,
                    actionLabel: `Open ${textOverride?.split(' ').pop() || ''}`,
                };
                setMessages(prev => [...prev, botMsg]);
                setIsTyping(false);
            }, 600);
            return;
        }

        try {
            const response = await chatService.sendMessage(userMessage);
            const botMsg: Message = {
                id: Date.now().toString(),
                text: response.reply || "I'm listening. Tell me more.",
                sender: "bot",
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMsg: Message = {
                id: Date.now().toString(),
                text: "Sorry, I couldn’t respond right now. Please try again.",
                sender: "bot",
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const renderChatList = () => (
        <Modal visible={showHistory} animationType="slide" transparent={false}>
            <SafeAreaView style={[styles.historyModal, { backgroundColor: colors.background }]}>
                <View style={[styles.historyHeader, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.historyTitle, { color: colors.text }]}>Chat History</Text>
                    <TouchableOpacity onPress={() => setShowHistory(false)}>
                        <Ionicons name="close" size={28} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={sessions}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16 }}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.mutedText, marginTop: 40 }}>No previous chats</Text>}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.sessionItem, { backgroundColor: colors.card, borderColor: item.id === currentSessionId ? colors.primary : colors.border }]}
                            onPress={() => switchSession(item.id)}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.sessionTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                                <Text style={{ color: colors.mutedText, fontSize: 12 }}>{new Date(item.timestamp).toLocaleDateString()}</Text>
                            </View>
                            <TouchableOpacity onPress={() => deleteSession(item.id)} style={{ padding: 5 }}>
                                <Ionicons name="trash-outline" size={20} color={colors.error || '#FF4444'} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}
                />

                <TouchableOpacity
                    style={[styles.newChatFab, { backgroundColor: colors.primary }]}
                    onPress={createNewChat}
                >
                    <Ionicons name="add" size={30} color="#FFF" />
                    <Text style={{ color: '#FFF', fontWeight: 'bold', marginLeft: 8 }}>New Chat</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </Modal>
    );

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            {renderChatList()}

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{t("elderBot")}</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.success }]}>• {t("online")}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowHistory(true)} style={{ padding: 8 }}>
                    <Ionicons name="time-outline" size={24} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={createNewChat} style={{ padding: 8 }}>
                    <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Main Chat Interface continues... */}

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

                        {/* Navigation Button */}
                        {item.actionLink && (
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    { backgroundColor: item.sender === "user" ? 'rgba(255,255,255,0.2)' : colors.primary }
                                ]}
                                onPress={() => router.push(item.actionLink as any)}
                            >
                                <Text style={[styles.actionButtonText, { color: colors.buttonText }]}>
                                    {item.actionLabel || "Go Now"}
                                </Text>
                                <Ionicons name="arrow-forward" size={16} color={colors.buttonText} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            />

            {/* Typing Indicator */}
            {isTyping && (
                <View style={styles.typingContainer}>
                    <Text style={[styles.typingText, { color: colors.mutedText }]}>{t("typingIndicator")}</Text>
                </View>
            )}

            {/* Quick Replies */}
            <View style={styles.quickRepliesContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {quickReplies.map((reply, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.quickReplyChip,
                                { backgroundColor: colors.card, borderColor: colors.primary }
                            ]}
                            onPress={() => handleQuickReply(reply)}
                        >
                            <Text style={[styles.quickReplyText, { color: colors.primary }]}>
                                {reply.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Input Area */}
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Platform.OS === 'ios' ? 20 : 10 }]}>
                <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                    placeholder={t("chatPlaceholder")}
                    placeholderTextColor={colors.mutedText}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline={false}
                />
                <TouchableOpacity
                    style={[styles.sendButton, { backgroundColor: colors.primary, opacity: inputText.trim() ? 1 : 0.5 }]}
                    onPress={() => handleSend()}
                    disabled={!inputText.trim()}
                >
                    <Ionicons name="send" size={20} color={colors.buttonText} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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
    quickRepliesContainer: {
        paddingHorizontal: 10,
        paddingBottom: 10,
    },
    quickReplyChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    quickReplyText: {
        fontWeight: "600",
        fontSize: 14,
    },
    actionButton: {
        marginTop: 10,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6
    },
    actionButtonText: {
        fontWeight: 'bold',
        fontSize: 14
    },
    historyModal: {
        flex: 1,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 60,
        borderBottomWidth: 1,
    },
    historyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    sessionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
    },
    sessionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    newChatFab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
});