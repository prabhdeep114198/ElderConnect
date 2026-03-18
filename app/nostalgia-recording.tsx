import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { nostalgiaService } from '../services/api/nostalgia';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// In a real device, we would use expo-av for recording and an STT library.
// For the Technovation pitch, we will simulate the transcript generation.
export default function NostalgiaRecordingScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const [prompt, setPrompt] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [recording, setRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadPrompt();
    }, []);

    const loadPrompt = async () => {
        try {
            setLoading(true);
            const data = await nostalgiaService.getPrompt();
            setPrompt(data.prompt);
        } catch (error) {
            console.error('Failed to load nostalgia prompt', error);
            setPrompt("What is a piece of advice your parents gave you that you never forgot?");
        } finally {
            setLoading(false);
        }
    };

    const toggleRecording = () => {
        if (recording) {
            setRecording(false);
            // Simulate STT completion
        } else {
            setRecording(true);
            setTranscript('');
            // Mocking Speech-to-Text for the demo
            let mockText = "Well... when I was young, my father always told me to...";
            let index = 0;
            const interval = setInterval(() => {
                if (index < mockText.length) {
                    setTranscript((prev) => prev + mockText.charAt(index));
                    index++;
                } else {
                    clearInterval(interval);
                }
            }, 50);
        }
    };

    const handleSave = async () => {
        if (!transcript) {
            Alert.alert("Nothing to save", "Please record your memory first.");
            return;
        }

        try {
            setSaving(true);
            // Assuming no audio file for the mock, just sending transcript
            await nostalgiaService.saveMemory(prompt, transcript + " (Always be kind to your neighbors. That advice stayed with me forever.)");
            Alert.alert(
                "Memory Saved! ❤️",
                "Your story has been safely stored in your family's Digital Legacy Timeline.",
                [{ text: "OK", onPress: () => router.back() }]
            );
        } catch (error) {
            console.error("Failed to save memory", error);
            Alert.alert("Error", "Could not save your memory. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Memory Journal</Text>
            </View>

            <View style={[styles.promptCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                <Ionicons name="sparkles" size={24} color={colors.primary} style={styles.sparkleIcon} />
                <Text style={[styles.promptText, { color: colors.text }]}>"{prompt}"</Text>
            </View>

            <View style={styles.recordingSection}>
                <TouchableOpacity 
                    style={[
                        styles.recordButton, 
                        { backgroundColor: recording ? '#EF4444' : colors.primary },
                        recording && styles.recordingActive
                    ]}
                    onPress={toggleRecording}
                >
                    <Ionicons name={recording ? "stop" : "mic"} size={40} color="#FFF" />
                </TouchableOpacity>
                <Text style={[styles.recordingStatus, { color: recording ? '#EF4444' : colors.mutedText }]}>
                    {recording ? 'Listening...' : 'Tap to Start Telling Your Story'}
                </Text>
            </View>

            {transcript.length > 0 && (
                <View style={[styles.transcriptBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.transcriptLabel, { color: colors.primary }]}>Transcript (Auto-Generated):</Text>
                    <Text style={[styles.transcriptText, { color: colors.text }]}>
                        {transcript}
                        {recording && <Text style={{color: colors.primary}}> |</Text>}
                    </Text>
                </View>
            )}

            {!recording && transcript.length > 0 && (
                <TouchableOpacity 
                    style={[styles.saveButton, { backgroundColor: colors.primary }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="heart" size={20} color="#FFF" />
                            <Text style={styles.saveButtonText}>Save to Family Timeline</Text>
                        </>
                    )}
                </TouchableOpacity>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, paddingTop: 40 },
    backButton: { marginRight: 15 },
    title: { fontSize: 24, fontWeight: 'bold' },
    promptCard: {
        padding: 30,
        borderRadius: 20,
        borderWidth: 2,
        alignItems: 'center',
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    sparkleIcon: { marginBottom: 15 },
    promptText: { fontSize: 22, fontWeight: '600', textAlign: 'center', lineHeight: 32 },
    recordingSection: { alignItems: 'center', marginBottom: 30 },
    recordButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    recordingActive: {
        transform: [{ scale: 1.1 }],
    },
    recordingStatus: { marginTop: 15, fontSize: 16, fontWeight: '500' },
    transcriptBox: {
        padding: 20,
        borderRadius: 15,
        borderWidth: 1,
        marginBottom: 30,
    },
    transcriptLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
    transcriptText: { fontSize: 16, lineHeight: 24, fontStyle: 'italic' },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 15,
        gap: 10,
        marginBottom: 40,
    },
    saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
