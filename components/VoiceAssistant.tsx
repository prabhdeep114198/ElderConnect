import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Text,
    Animated,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    useAudioRecorder,
    RecordingPresets,
    requestRecordingPermissionsAsync,
    setAudioModeAsync
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { N8NService } from '../services/N8NService';
import { SpeechToTextService } from '../services/SpeechToTextService';

const { width } = Dimensions.get('window');

export const VoiceAssistant = () => {
    const { colors } = useTheme();
    const { user } = useAuth();

    const [isProcessing, setIsProcessing] = useState(false);
    const [pulseAnim] = useState(new Animated.Value(1));
    const [message, setMessage] = useState<string | null>(null);

    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY, (status) => {
        // Handle status changes if needed
    });

    const isRecording = recorder.isRecording;

    useEffect(() => {
        if (isRecording) {
            startPulse();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isRecording]);

    const startPulse = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    async function startRecording() {
        try {
            const { status } = await requestRecordingPermissionsAsync();
            if (status !== 'granted') {
                setMessage("Microphone permission denied");
                return;
            }

            await setAudioModeAsync({
                allowsRecording: true,
                playsInSilentMode: true,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            await recorder.prepareToRecordAsync();
            recorder.record();
            setMessage("Listening...");
        } catch (err) {
            console.error('Failed to start recording', err);
            setMessage("Failed to start recording");
        }
    }

    async function stopRecording() {
        if (!isRecording) return;

        setIsProcessing(true);
        setMessage("Processing...");

        try {
            const uri = recorder.uri;
            await recorder.stop();

            if (uri) {
                console.log("[VoiceAssistant] Audio recorded at:", uri);
                // 1. Convert Audio -> Text (STT)
                // This follows "no Whisper in n8n" requirement
                const sttResult = await SpeechToTextService.transcribe(uri);
                console.log("[VoiceAssistant] STT Result:", sttResult);

                if (sttResult.success && sttResult.text) {
                    setMessage(`Heard: "${sttResult.text}"`);

                    // Small delay so user can read what was heard
                    await new Promise(r => setTimeout(r, 1200));
                    setMessage("Connecting to AI Assistant...");

                    // 2. Send Text -> n8n Webhook
                    const response = await N8NService.sendTextCommand(sttResult.text, {
                        userId: user?.id,
                        name: user?.name,
                        currentTime: new Date().toISOString()
                    });
                    console.log("[VoiceAssistant] n8n Response:", response);

                    if (response && response.message) {
                        setMessage(response.message);
                    } else if (response && response.reply) {
                        setMessage(response.reply);
                    } else {
                        setMessage("Action processed successfully.");
                    }
                } else {
                    console.error("[VoiceAssistant] STT Failed:", sttResult.error);
                    setMessage(sttResult.error || "Could not understand audio.");
                }
            }
        } catch (err) {
            console.error('Failed to stop recording', err);
            setMessage("Error processing voice.");
        } finally {
            setIsProcessing(false);
            // Clear message after 4 seconds
            setTimeout(() => setMessage(null), 4000);
        }
    }

    if (!user) return null;

    return (
        <View style={styles.container}>
            {message && (
                <View style={[styles.messageBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.messageText, { color: colors.text }]}>{message}</Text>
                </View>
            )}

            <Animated.View style={[
                styles.buttonContainer,
                { transform: [{ scale: pulseAnim }] }
            ]}>
                <TouchableOpacity
                    onPressIn={startRecording}
                    onPressOut={stopRecording}
                    style={[
                        styles.button,
                        { backgroundColor: isRecording ? colors.error : colors.primary }
                    ]}
                    activeOpacity={0.8}
                >
                    {isProcessing ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Ionicons
                            name={isRecording ? "mic" : "mic-outline"}
                            size={32}
                            color="#FFF"
                        />
                    )}
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 100, // Above tab bar
        right: 20,
        alignItems: 'flex-end',
        zIndex: 9999,
    },
    buttonContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    button: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageBubble: {
        padding: 12,
        borderRadius: 15,
        borderWidth: 1,
        marginBottom: 10,
        maxWidth: width * 0.7,
        elevation: 2,
    },
    messageText: {
        fontSize: 14,
        fontWeight: '500',
    }
});
