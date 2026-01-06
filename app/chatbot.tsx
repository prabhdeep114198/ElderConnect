import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { fetchMockEvents, Event as MockEvent } from "../services/MockEventService";

interface Message {
    id: string;
    text: string;
    sender: "user" | "bot";
    timestamp: number;
    actionLink?: string; // Route to navigate to
    actionLabel?: string; // Label for the button
    eventsData?: MockEvent[]; // Optional payload for events
}

const STORAGE_KEY = "elder_connect_chat_history";

export default function ChatbotScreen() {
    const router = useRouter();
    const { colors, theme } = useTheme();
    const { t } = useTranslation();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    // FEATURE: Quick Replies for elderly users to minimize typing
    const quickReplies = [
        { label: "Find Events", text: "Show me events nearby" },
        { label: "My Pills", text: "Go to medications" },
        { label: "My Profile", text: "Go to profile" },
        { label: "Help", text: "What can you do?" },
        { label: "Health Tracker", text: "Show me health tracker" },
    ];

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
                initChat();
            }
        } catch (error) {
            console.error("Failed to load chat history", error);
        }
    };

    const initChat = () => {
        setMessages([
            {
                id: "init-1",
                text: "Hello! I am your ElderConnect assistant. I can help you find your way around.",
                sender: "bot",
                timestamp: Date.now(),
            },
        ]);
    };

    const saveChatHistory = async () => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        } catch (error) {
            console.error("Failed to save chat history", error);
        }
    };

    const handleSend = (text: string = inputText) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: trimmed,
            sender: "user",
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputText("");
        setIsTyping(true);

        // Process logic
        processBotResponse(trimmed);
    };

    const processBotResponse = async (input: string) => {
        const lower = input.toLowerCase();
        let responseMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: "",
            sender: "bot",
            timestamp: Date.now(),
        };

        // 1. Navigation Rules
        if (lower.includes("medication") || lower.includes("pill") || lower.includes("medicine")) {
            responseMsg.text = "Here is your medication schedule.";
            responseMsg.actionLink = "/(tabs)/medications";
            responseMsg.actionLabel = "Open Medications";
        }
        else if (lower.includes("health tracker")) {
            responseMsg.text = "Let's check your health tracker.";
            responseMsg.actionLink = "/(tabs)/tracker";
            responseMsg.actionLabel = "View Tracker";
        }
        else if (lower.includes("appointment") || lower.includes("doctor")) {
            responseMsg.text = "Let's check your upcoming appointments.";
            responseMsg.actionLink = "/(tabs)/appointments";
            responseMsg.actionLabel = "View Appointments";
        }
        else if (lower.includes("diary")) {
            responseMsg.text = "I can open your diary. ";
            responseMsg.actionLink = "/(tabs)/diary";
            responseMsg.actionLabel = "View Diary";
        }
        else if (lower.includes("reports")) {
            responseMsg.text = "Let's check your health reports.";
            responseMsg.actionLink = "/(tabs)/reports";
            responseMsg.actionLabel = "View Reports";
        }
        else if (lower.includes("music") || lower.includes("songs") || lower.includes("relaxing") || lower.includes("relaxing music")) {
            responseMsg.text = "I can open the music list for you.";
            responseMsg.actionLink = "/music";
            responseMsg.actionLabel = "View Music";
        }
        else if (lower.includes("profile") || lower.includes("account")) {
            responseMsg.text = "You can view your personal details here.";
            responseMsg.actionLink = "/profile";
            responseMsg.actionLabel = "Go to Profile";
        }
        else if (lower.includes("setting")) {
            responseMsg.text = "Adjust your preferences in Settings.";
            responseMsg.actionLink = "/SettingsScreen";
            responseMsg.actionLabel = "Open Settings";
        }
        else if (lower.includes("magnify") || lower.includes("read") || lower.includes("glass") || lower.includes("magnifier")) {
            responseMsg.text = "I can open the magnifier for you.";
            responseMsg.actionLink = "/MagnifierScreen";
            responseMsg.actionLabel = "Open Magnifier";
        }
        else if (lower.includes("video") || lower.includes("call")) {
            responseMsg.text = "Connect with your loved ones.";
            responseMsg.actionLink = "/VideoCallScreen";
            responseMsg.actionLabel = "Start Video Call";
        }
        // 2. Data Fetching Rules (Events)
        else if (lower.includes("event") || lower.includes("social") || lower.includes("activity")) {
            responseMsg.text = "Let me look for social gatherings near you...";
            try {
                // Fetch mock events
                const events = await fetchMockEvents(0, 0); // coords don't matter for mock
                responseMsg.text = `I found ${events.length} events nearby. Would you like to see more details?`;
                responseMsg.eventsData = events.slice(0, 2); // Show top 2
                responseMsg.actionLink = "/events";
                responseMsg.actionLabel = "View All Events";
            } catch (e) {
                responseMsg.text = "I'm having trouble finding events right now.";
            }
        }

        // 3. Wellness & Lifestyle Assistant Rules

        // Hydration Tips
        else if (lower.includes("water") || lower.includes("hydration") || lower.includes("drink water") || lower.includes("dehydration")) {
            responseMsg.text = "Hydration Tips:\n\n• Drink water regularly throughout the day\n• Keep a water bottle nearby as a reminder\n• Increase water intake in hot weather\n• Include fluids like coconut water or soups\n\n⚠️ Staying hydrated helps maintain overall health";
        }
        // Sleep Tips
        else if (lower.includes("sleep") || lower.includes("rest") || lower.includes("bedtime") || lower.includes("sleep tips") || lower.includes("can't sleep")) {
            responseMsg.text = "Sleep Tips:\n\n• Maintain a regular sleep schedule\n• Aim for 7–8 hours of sleep each night\n• Avoid screens and heavy meals before bedtime\n• Create a calm and comfortable sleep environment\n\n⚠️ Good sleep supports physical and mental well-being";
        }
        // Entertainment & Relaxation
        else if (lower.includes("entertainment") || lower.includes("music") || lower.includes("songs") || lower.includes("audiobook") || lower.includes("podcast") || lower.includes("relax")) {
            responseMsg.text = "Entertainment & Relaxation:\n\n• Listen to calming music\n• Enjoy audiobooks and podcasts\n• Choose content that reduces stress and improves mood\n• Take short breaks to relax and unwind";
        }
        // Exercise, Games & Mental Health
        else if (lower.includes("exercise") || lower.includes("walk") || lower.includes("yoga") || lower.includes("meditation") || lower.includes("breathing") || lower.includes("games") || lower.includes("puzzles")) {
            responseMsg.text = "Physical & Mental Well-being:\n\n• Go for short daily walks\n• Practice light stretching or yoga\n• Try deep breathing exercises\n• Engage in simple games and puzzles\n• Meditation helps reduce stress and improve focus";
        }
        //What Can Help Manage High Blood Pressure
        else if (lower.includes("advice to manage bp") || lower.includes("control high bp") || lower.includes("how to manage high blood pressure") || lower.includes("how to manage")) {
            responseMsg.text = "Advice:\n\n•Reduce salt intake in daily meals.\n• Stay physically active with light exercises like walking or stretching.\n•Practice relaxation techniques such as deep breathing or meditation.\n•Get enough sleep and try to manage stress.\n•Avoid smoking and limit caffeine intake.\n•Follow the doctor’s advice and take prescribed medicines regularly.\n\n⚠️ Always consult a healthcare professional for proper treatment.";
        }
        else if (
            lower.includes("bp food table") ||
            lower.includes("high bp food chart") ||
            lower.includes("bp friendly table")
        ) {
            responseMsg.text =
                "🩺 BP-Friendly Food Table\n\n" +
                "-----------------------------------------------\n" +
                "Food Item   | Benefit            | Key Nutrient\n" +
                "-----------------------------------------------\n" +
                "Oats        | Lowers BP           | Fiber\n" +
                "Banana     | Controls BP         | Potassium\n" +
                "Spinach    | Heart health        | Iron\n" +
                "Beetroot   | Improves blood flow | Nitrates\n" +
                "Broccoli   | Heart protection    | Fiber\n" +
                "Apple      | Cholesterol control | Fiber\n" +
                "Curd       | Gut & BP support    | Calcium\n" +
                "Almonds    | Healthy fats        | Magnesium\n" +
                "-----------------------------------------------\n\n" +
                "🚫 Avoid excess salt, fried foods, and packaged snacks.";
        }
        //Food Recommendations for High BP
        else if (lower.includes("food for bp") || lower.includes("food for high bp") || lower.includes("diet for bp") || lower.includes("bp diet")) {
            responseMsg.text = "Food Recommendations for High BP:\n\n• Fruits: Banana, apple, orange, berries\n•Vegetables: Spinach, carrot, beetroot, broccoli\n•Whole grains: Oats, brown rice, whole wheat roti\n•Low-fat dairy: Milk, curd, yogurt\n•Healthy fats: Nuts, seeds, olive oil (in moderation)\n•Proteins: Lentils, beans, tofu, fish\n\n🚫Try to limit salty snacks, fried foods, packaged foods, and sugary drinks.";
        }
        else if (lower.includes("protein table")) {
            responseMsg.text =
                "Protein-Rich Food Table\n\n" +
                "----------------------------------\n" +
                "Food Item | Protein (per 100g)\n" +
                "----------------------------------\n" +
                "Eggs      | 13 g\n" +
                "Paneer   | 18 g\n" +
                "Lentils  | 9 g\n" +
                "Chickpeas| 9 g\n" +
                "Milk     | 3.4 g\n" +
                "Curd     | 10 g\n" +
                "Tofu     | 8 g\n" +
                "Almonds  | 21 g\n" +
                "----------------------------------";
        }
        // Protein
        else if (lower.includes("protein")) {
            responseMsg.text = "Protein-rich Foods:\n\n• Lentils (dal)\n• Chickpeas\n• Beans\n• Paneer\n• Eggs\n• Milk\n• Yogurt\n• Tofu\n• Nuts and seeds\n\n⚠️ Protein helps maintain muscle strength.";
        }
        // Fiber
        else if (lower.includes("fiber table") || lower.includes("fibre table")) {
            responseMsg.text =
                `Fiber-Rich Foods (Approx. per 100g)

        ---------------------------------------
        Food Item        | Fiber Content
        ---------------------------------------
        Apple            | 2.4 g
        Banana           | 2.6 g
        Papaya           | 1.7 g
        Oats             | 10 g
        Brown Rice       | 1.8 g
        Whole Wheat Roti | 2.7 g
        Vegetables       | 2–3 g
        Beans & Lentils  | 6–8 g
        ---------------------------------------

        ⚠️ Fiber supports digestion and gut health.`;
        }
        // Fiber
        else if (lower.includes("fiber") || lower.includes("fibre")) {
            responseMsg.text = "Fiber-rich Foods:\n\n• Apples\n• Bananas\n• Papaya\n• Oats\n• Brown rice\n• Whole wheat roti\n• Vegetables\n• Beans and lentils\n\n⚠️ Fiber supports digestion.";
        }
        // Calcium
        else if (lower.includes("calcium table")) {
            responseMsg.text =
                `Calcium-Rich Foods (Approx. per 100g)

        ---------------------------------------
        Food Item        | Calcium Content
        ---------------------------------------
        Milk             | 120 mg
        Curd             | 110 mg
        Buttermilk       | 116 mg
        Paneer           | 208 mg
        Ragi             | 344 mg
        Almonds          | 264 mg
        Green Leafy Veg. | 150 mg
        ---------------------------------------

        ⚠️ Calcium supports strong bones and teeth.`;
        }
        // Calcium
        else if (lower.includes("calcium") || lower.includes("bone")) {
            responseMsg.text = "Calcium-rich Foods:\n\n• Milk\n• Curd\n• Buttermilk\n• Paneer\n• Ragi\n• Almonds\n• Green leafy vegetables\n\n⚠️ Calcium supports bone health.";
        }
        else if (lower.includes("iron table")) {
            responseMsg.text =
                `Iron-Rich Foods (Approx. per 100g)

        ---------------------------------------
        Food Item    | Iron Content
        ---------------------------------------
        Spinach      | 2.7 mg
        Beetroot     | 0.8 mg
        Lentils      | 3.3 mg
        Chickpeas    | 2.9 mg
        Beans        | 2.1–5.0 mg
        Dates        | 0.9 mg
        Raisins      | 1.9 mg
        ---------------------------------------

        ⚠️ Iron supports healthy blood.`;
        }
        // Iron
        else if (lower.includes("iron")) {
            responseMsg.text = "Iron-rich Foods:\n\n• Spinach\n• Beetroot\n• Lentils\n• Chickpeas\n• Beans\n• Dates\n• Raisins\n\n⚠️ Iron supports healthy blood.";
        }
        // Vitamins
        else if (lower.includes("vitamin table") || lower.includes("immunity table")) {
            responseMsg.text =
                `Vitamin-Rich Foods (Approx. per 100g)

        ---------------------------------------
        Food Item        | Key Vitamins
        ---------------------------------------
        Orange           | Vitamin C
        Papaya           | Vitamin A, C
        Carrot           | Vitamin A
        Spinach          | Vitamin A, C, K
        Broccoli         | Vitamin C, K
        Tomato           | Vitamin C
        ---------------------------------------

        ⚠️ Vitamins help boost immunity and overall health.`;
        }
        // Vitamins
        else if (lower.includes("vitamin") || lower.includes("immunity")) {
            responseMsg.text = "Vitamin-rich Foods:\n\n• Oranges\n• Papaya\n• Carrots\n• Spinach\n• Broccoli\n• Tomatoes\n\n⚠️ Vitamins support immunity.";
        }
        else if (
            lower.includes("food table") ||
            lower.includes("nutrition table") ||
            lower.includes("food nutrition chart")
        ) {
            responseMsg.text =
                "🍽️ Food Nutrition Table (Approx. per 100g)\n\n" +
                "--------------------------------------------------\n" +
                "Food Item     | Calories | Protein | Fiber\n" +
                "--------------------------------------------------\n" +
                "Oats          | 389 kcal | 17 g    | 10 g\n" +
                "Brown Rice    | 123 kcal | 2.7 g   | 1.8 g\n" +
                "Ragi          | 336 kcal | 7.3 g   | 3.6 g\n" +
                "Spinach       | 23 kcal  | 2.9 g   | 2.2 g\n" +
                "Carrot        | 41 kcal  | 0.9 g   | 2.8 g\n" +
                "Broccoli      | 34 kcal  | 2.8 g   | 2.6 g\n" +
                "Apple         | 52 kcal  | 0.3 g   | 2.4 g\n" +
                "Banana        | 89 kcal  | 1.1 g   | 2.6 g\n" +
                "Milk          | 42 kcal  | 3.4 g   | 0 g\n" +
                "Curd          | 59 kcal  | 10 g    | 0 g\n" +
                "Paneer        | 265 kcal | 18 g    | 0 g\n" +
                "Lentils (Dal) | 116 kcal | 9 g     | 8 g\n" +
                "Eggs          | 155 kcal | 13 g    | 0 g\n" +
                "Almonds       | 579 kcal | 21 g    | 12 g\n" +
                "--------------------------------------------------\n\n" +
                "⚠️ Nutrition values are approximate and for awareness only.";
        }
        // Blood Pressure Health Awareness
        else if (lower.includes("bp") || lower.includes("blood pressure awareness") || lower.includes("pressure")) {
            responseMsg.text = "Blood Pressure Awareness:\n\n• Normal blood pressure is usually around 120/80 mmHg.\n•Checking blood pressure regularly helps you understand your health better.\n•Both high BP and low BP can affect the heart, brain and overall wellbeing.\n•If BP readings are often unusual, it is important to consult a doctor.\n\n⚠️ This information is for health awareness only and is not medical advice";
        }
        // Nutrition Coach
        else if (lower.includes("nutrition") || lower.includes("balanced diet") || lower.includes("food") || lower.includes("healthy eating") || lower.includes("meal tips")) {
            responseMsg.text = "Nutrition Tips for Seniors:\n\n• Eat fresh fruits and vegetables\n• Choose low-salt and low-sugar foods\n• Avoid processed and fried food\n• Maintain regular meal timings\n• Stay hydrated throughout the day\n\n⚠️ This information is for general guidance only.";
        }
        // Fallback / FAQ
        else if (lower.includes("help") || lower.includes("what can you do")) {
            responseMsg.text = "I can help you navigate the app! Try asking about 'medications', 'events', or 'profile'. I can also give wellness tips for 'hydration', 'sleep', or 'nutrition'.";
        }
        else if (lower.includes("hello") || lower.includes("hi")) {
            responseMsg.text = "Hello there! How can I help you today?";
        }
        else {
            responseMsg.text = "Sorry, I didn’t understand that. Please try one of the suggested topics.";
        }

        // Simulate network delay for natural feel
        setTimeout(() => {
            setMessages((prev) => [...prev, responseMsg]);
            setIsTyping(false);
        }, 1000);
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.sender === "user";
        return (
            <View
                style={[
                    styles.messageBubble,
                    isUser
                        ? [styles.userBubble, { backgroundColor: colors.primary }]
                        : [styles.botBubble, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }],
                ]}
            >
                <Text
                    style={[
                        styles.messageText,
                        { color: isUser ? colors.buttonText : colors.text },
                    ]}
                >
                    {item.text}
                </Text>

                {/* Event Cards inside Chat */}
                {item.eventsData && item.eventsData.map(evt => (
                    <View key={evt.id} style={[styles.miniEventCard, { backgroundColor: colors.background }]}>
                        <Text style={[styles.miniEventTitle, { color: colors.text }]}>{evt.name}</Text>
                        <Text style={{ color: colors.mutedText, fontSize: 12 }}>{new Date(evt.start).toLocaleDateString()}</Text>
                    </View>
                ))}

                {/* Navigation Button */}
                {item.actionLink && (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : colors.primary }]}
                        onPress={() => router.push(item.actionLink as any)}
                    >
                        <Text style={[styles.actionButtonText, { color: colors.buttonText }]}>
                            {item.actionLabel || "Go Now"}
                        </Text>
                        <Ionicons name="arrow-forward" size={16} color={colors.buttonText} />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{t("elderBot")}</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.success }]}>• {t("online")}</Text>
                </View>
                <TouchableOpacity onPress={() => setMessages([])} style={{ marginLeft: 'auto', padding: 8 }}>
                    <Ionicons name="trash-outline" size={20} color={colors.mutedText} />
                </TouchableOpacity>
            </View>

            {/* Chat List */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                renderItem={renderMessage}
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
                            onPress={() => handleSend(reply.text)}
                        >
                            <Text style={[styles.quickReplyText, { color: colors.primary }]}>
                                {reply.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
            >
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <TextInput
                        style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                        placeholder={t("chatPlaceholder")}
                        placeholderTextColor={colors.mutedText}
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={() => handleSend()}
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
        padding: 14,
        borderRadius: 18,
        maxWidth: "85%",
        marginBottom: 12,
    },
    userBubble: {
        alignSelf: "flex-end",
        borderBottomRightRadius: 4,
    },
    botBubble: {
        alignSelf: "flex-start",
        borderBottomLeftRadius: 4,
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
        height: 48,
        borderRadius: 24,
        paddingHorizontal: 20,
        marginRight: 10,
        fontSize: 16,
    },
    sendButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
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
    miniEventCard: {
        marginTop: 8,
        padding: 8,
        borderRadius: 8,
        width: '100%'
    },
    miniEventTitle: {
        fontWeight: 'bold',
        fontSize: 14
    }
});
