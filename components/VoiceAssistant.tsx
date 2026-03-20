import { Ionicons } from '@expo/vector-icons';
import {
    RecordingPresets,
    requestRecordingPermissionsAsync,
    setAudioModeAsync,
    useAudioRecorder
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    PanResponder,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useVoiceNavigation, detectLocalIntent } from '../hooks/useVoiceNavigation';
import { SpeechToTextService } from '../services/SpeechToTextService';
import { VoiceAssistantService } from '../services/VoiceAssistantService';

const { width } = Dimensions.get('window');

// Intents that need user confirmation before executing
const CONFIRMATION_INTENTS = ['CREATE_EVENT', 'LOG_VITAL', 'REMINDER'];

export const VoiceAssistant = () => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const { handleVoiceResponse, executeLocalIntent, speak } = useVoiceNavigation();

    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [pendingIntent, setPendingIntent] = useState<any>(null);
    const [isCancelZone, setIsCancelZone] = useState(false);

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const expandAnim = useRef(new Animated.Value(0)).current;
    const pan = useRef(new Animated.ValueXY()).current;

    const [duration, setDuration] = useState(0);
    const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const isCancelledRef = useRef(false);
    const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY, () => { });
    const isRecording = recorder.isRecording;

    const showMessage = (text: string, autoDismiss = true) => {
        setMessage(text);
        if (autoDismiss) {
            setTimeout(() => setMessage(null), 5000);
        }
    };

    const startTimer = () => {
        setDuration(0);
        if (timerInterval.current) clearInterval(timerInterval.current);
        timerInterval.current = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerInterval.current) {
            clearInterval(timerInterval.current);
            timerInterval.current = null;
        }
    };

    const resetAnimations = () => {
        pulseLoop.current?.stop();
        pulseAnim.setValue(1);
        Animated.parallel([
            Animated.spring(expandAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: false }),
            Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: false })
        ]).start();
    };

    async function startRecording() {
        try {
            Speech.stop();

            const { status } = await requestRecordingPermissionsAsync();
            if (status !== 'granted') {
                showMessage("Microphone permission denied. Please enable it in Settings.");
                return;
            }

            await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            await recorder.prepareToRecordAsync();
            recorder.record();
            startTimer();

            pulseLoop.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.25, duration: 350, useNativeDriver: false }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 350, useNativeDriver: false }),
                ])
            );
            pulseLoop.current.start();

            Animated.spring(expandAnim, { toValue: 1, friction: 7, tension: 40, useNativeDriver: false }).start();
        } catch (err) {
            console.error('Failed to start recording', err);
            showMessage("Failed to start recording. Please try again.");
            resetAnimations();
            stopTimer();
        }
    }

    async function cancelRecording() {
        stopTimer();
        resetAnimations();
        setIsCancelZone(false);
        try {
            if (recorder.isRecording) await recorder.stop();
        } catch (e) { /* ignore */ }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        showMessage("Recording cancelled.");
    }

    async function stopAndProcessRecording() {
        stopTimer();
        resetAnimations();
        setIsCancelZone(false);

        if (!recorder.isRecording && !isProcessing) return;

        setIsProcessing(true);
        setMessage("Listening... 🎤");

        try {
            const uri = recorder.uri;
            await recorder.stop();

            if (!uri) {
                showMessage("No audio captured. Please try again.");
                setIsProcessing(false);
                return;
            }

            setMessage("Converting speech to text... ⏳");
            const sttResult = await SpeechToTextService.transcribe(uri);

            if (!sttResult.success || !sttResult.text) {
                const errMsg = sttResult.error || "Could not understand audio. Please try again.";
                speak(errMsg);
                showMessage(errMsg);
                setIsProcessing(false);
                return;
            }

            const heard = sttResult.text;
            setMessage(`Heard: "${heard}"`);

            // ── FAST PATH: local keyword detection (instant, no AI needed) ──
            const localIntent = detectLocalIntent(heard);
            if (localIntent) {
                console.log('[VoiceAssistant] Local intent detected:', localIntent.action, localIntent.destination);
                const result = executeLocalIntent(localIntent);
                if (result) {
                    showMessage(result);
                    setIsProcessing(false);
                    setDuration(0);
                    return;
                }
            }

            // ── SLOW PATH: send to AI backend for complex intents ──
            await new Promise(r => setTimeout(r, 800));
            setMessage("Processing with AI... 🤖");

            const response = await VoiceAssistantService.processCommand(heard, {
                userId: user?.id || "unknown-user",
                name: user?.name,
            });

            if (response?.requiresConfirmation) {
                const confirmMsg = response.message;
                setMessage(confirmMsg);
                setPendingIntent(response.pendingIntent);
                speak(confirmMsg);
                setIsProcessing(false);
                return;
            }

            const displayMessage = handleVoiceResponse(response);
            showMessage(displayMessage);

        } catch (err) {
            console.error('[VoiceAssistant] Error:', err);
            const errMsg = "Error processing voice command. Please try again.";
            speak(errMsg);
            showMessage(errMsg);
        } finally {
            setIsProcessing(false);
            setDuration(0);
        }
    }

    const maxSlide = -130;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: async () => {
                isCancelledRef.current = false;
                await startRecording();
            },
            onPanResponderMove: (e, gestureState) => {
                if (gestureState.dx < 0) {
                    pan.setValue({ x: Math.max(gestureState.dx, maxSlide - 20), y: 0 });
                }
                if (gestureState.dx < maxSlide && !isCancelledRef.current) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    isCancelledRef.current = true;
                    setIsCancelZone(true);
                } else if (gestureState.dx >= maxSlide && isCancelledRef.current) {
                    isCancelledRef.current = false;
                    setIsCancelZone(false);
                }
            },
            onPanResponderRelease: async (e, gestureState) => {
                if (isCancelledRef.current || gestureState.dx < maxSlide) {
                    await cancelRecording();
                } else {
                    await stopAndProcessRecording();
                }
            },
            onPanResponderTerminate: async () => {
                await cancelRecording();
            }
        })
    ).current;

    const acceptConfirmation = async () => {
        setIsProcessing(true);
        setMessage("Saving...");
        try {
            const response = await VoiceAssistantService.processCommand(
                "",
                { userId: user?.id || "unknown-user", name: user?.name },
                true,
                pendingIntent
            );
            const displayMsg = handleVoiceResponse(response);
            showMessage(displayMsg);
        } catch (error) {
            speak("Failed to save. Please try again.");
            showMessage("Failed to save.");
        } finally {
            setPendingIntent(null);
            setIsProcessing(false);
        }
    };

    const cancelConfirmation = () => {
        setPendingIntent(null);
        speak("Action cancelled.");
        showMessage("Action cancelled.");
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (!user) return null;

    const micBgColor = isRecording
        ? (isCancelZone ? colors.error : '#FF3B30')
        : colors.primary;

    return (
        <View style={[styles.container, { right: 20 }]}>
            {message && (
                <View style={[styles.messageBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.messageText, { color: colors.text }]}>{message}</Text>
                    {pendingIntent && (
                        <View style={styles.confirmationActions}>
                            <TouchableOpacity
                                style={[styles.confirmButton, { backgroundColor: colors.error }]}
                                onPress={cancelConfirmation}
                            >
                                <Ionicons name="close" size={14} color="#FFF" />
                                <Text style={styles.confirmButtonText}>No</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, { backgroundColor: colors.success }]}
                                onPress={acceptConfirmation}
                            >
                                <Ionicons name="checkmark" size={14} color="#FFF" />
                                <Text style={styles.confirmButtonText}>Yes, Save</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            <View style={styles.recordWrapper}>
                {/* Expanded recording bar */}
                <Animated.View style={[
                    styles.expandedContainer,
                    {
                        backgroundColor: colors.card,
                        borderColor: isCancelZone ? colors.error : colors.border,
                        width: expandAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, width * 0.75]
                        }),
                        opacity: expandAnim
                    }
                ]}>
                    <View style={styles.expandedContent}>
                        <View style={styles.timerContainer}>
                            <View style={[styles.redDot, { backgroundColor: isCancelZone ? colors.error : '#FF3B30' }]} />
                            <Text style={[styles.timerText, { color: colors.text }]}>
                                {formatTime(duration)}
                            </Text>
                        </View>

                        <Animated.View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            opacity: pan.x.interpolate({
                                inputRange: [maxSlide, 0],
                                outputRange: [0, 1],
                                extrapolate: 'clamp'
                            })
                        }}>
                            <Ionicons name="chevron-back" size={18} color={colors.mutedText} />
                            <Text style={[styles.slideText, { color: isCancelZone ? colors.error : colors.mutedText }]}>
                                {isCancelZone ? "Release to cancel" : "Slide to cancel"}
                            </Text>
                        </Animated.View>
                    </View>
                </Animated.View>

                {/* Mic Button */}
                <Animated.View
                    {...(!isProcessing ? panResponder.panHandlers : {})}
                    style={[
                        styles.micButtonContainer,
                        {
                            transform: [{ translateX: pan.x }, { scale: pulseAnim }],
                            backgroundColor: micBgColor,
                            shadowColor: micBgColor,
                        }
                    ]}
                >
                    {isProcessing ? (
                        <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                        <Ionicons
                            name={isRecording ? "mic" : "mic-outline"}
                            size={30}
                            color="#FFF"
                        />
                    )}
                </Animated.View>
            </View>

            {/* Tooltip hint (only when idle) */}
            {!isRecording && !isProcessing && !message && (
                <Text style={[styles.hintText, { color: colors.mutedText }]}>
                    Hold to speak
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 100,
        alignItems: 'flex-end',
        zIndex: 9999,
    },
    recordWrapper: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    expandedContainer: {
        height: 56,
        borderRadius: 28,
        position: 'absolute',
        right: 4,
        borderWidth: 1,
        justifyContent: 'center',
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
    },
    expandedContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: 72,
        paddingLeft: 18,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    redDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    timerText: {
        fontSize: 16,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    slideText: {
        fontSize: 13,
        marginLeft: 4,
    },
    micButtonContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
    },
    messageBubble: {
        padding: 14,
        borderRadius: 18,
        borderWidth: 1,
        marginBottom: 12,
        maxWidth: width * 0.75,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
    },
    messageText: {
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
    },
    confirmationActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 12,
    },
    confirmButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    confirmButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 13,
    },
    hintText: {
        fontSize: 11,
        marginTop: 4,
        marginRight: 4,
        textAlign: 'right',
    },
});