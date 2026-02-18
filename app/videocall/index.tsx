import React, { useEffect, useState } from "react";
import { 
    View, 
    Text, 
    TouchableOpacity, 
    TextInput, 
    StyleSheet, 
    StatusBar, 
    Platform 
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getSocket } from "../../services/socket";
import { useTheme } from "../../context/ThemeContext";

export default function LobbyScreen() {
    const router = useRouter();
    const { colors, theme } = useTheme(); // Use global theme state
    const [connected, setConnected] = useState(false);
    const [roomNo, setRoomNo] = useState("");

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;
        const handleConnect = () => setConnected(true);
        socket.on("connect", handleConnect);
        
        // Check initial state
        if (socket.connected) setConnected(true);

        return () => {
            socket.off("connect", handleConnect);
        };
    }, []);

    const joinRoom = () => {
        if (!roomNo) return alert("Please enter a room number");
        router.push(`/videocall/room?roomId=${roomNo}`);
    };

    const isDark = theme === 'dark';

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#F2F2F7' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.largeTitle, { color: colors.text }]}>Video Call</Text>
            </View>

            <View style={styles.section}>
                {/* Theme toggle removed from here as it is controlled by the sidebar */}
                
                <Text style={[styles.sectionHeader, { color: colors.mutedText }]}>JOIN MEETING</Text>
                <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : colors.card }]}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Enter Room Number"
                            placeholderTextColor={colors.mutedText}
                            value={roomNo}
                            onChangeText={setRoomNo}
                            keyboardType="number-pad"
                        />
                    </View>
                    
                    <View style={[styles.statusRow, { borderTopWidth: 0.5, borderTopColor: colors.border }]}>
                        <Text style={[styles.statusText, { color: colors.mutedText }]}>Status</Text>
                        <View style={styles.statusIndicator}>
                            <Text style={[styles.statusLabel, { color: colors.text }]}>
                                {connected ? "Connected" : "Connecting..."}
                            </Text>
                            <View style={[styles.dot, { backgroundColor: connected ? '#4CD964' : '#FF9500' }]} />
                        </View>
                    </View>
                </View>

                <TouchableOpacity 
                    style={[styles.joinBtn, { backgroundColor: colors.primary }]} 
                    onPress={joinRoom}
                >
                    <Text style={styles.joinBtnText}>Join Room</Text>
                </TouchableOpacity>
                
                <Text style={[styles.footerText, { color: colors.mutedText }]}>
                    Enter the unique room ID to start a secure encrypted video session.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 10 },
    backButton: { marginBottom: 10 },
    largeTitle: { fontSize: 34, fontWeight: 'bold', letterSpacing: -0.5 },
    section: { marginTop: 20, paddingHorizontal: 20 },
    sectionHeader: { fontSize: 13, fontWeight: '400', marginBottom: 8, marginLeft: 16 },
    card: { borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
    inputContainer: { padding: 16 },
    input: { fontSize: 17, height: 24 },
    statusRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 12, 
        paddingHorizontal: 16 
    },
    statusText: { fontSize: 15 },
    statusIndicator: { flexDirection: 'row', alignItems: 'center' },
    statusLabel: { fontSize: 15, marginRight: 8 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    joinBtn: { 
        marginTop: 10, 
        height: 50, 
        borderRadius: 12, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    joinBtnText: { color: '#FFF', fontSize: 17, fontWeight: '600' },
    footerText: { fontSize: 13, textAlign: 'center', marginTop: 15, paddingHorizontal: 20, lineHeight: 18 }
});