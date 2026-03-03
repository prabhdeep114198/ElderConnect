import { Ionicons } from '@expo/vector-icons';
import {
    RecordingPresets,
    requestRecordingPermissionsAsync,
    setAudioModeAsync,
    useAudioRecorder
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
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
import { useFeatureFlag } from '../hooks/useFeatureFlags';
import { SpeechToTextService } from '../services/SpeechToTextService';
import { VoiceAssistantService } from '../services/VoiceAssistantService';

const { width } = Dimensions.get('window');

export const VoiceAssistant = () => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const isVoiceEnabled = useFeatureFlag('voice_assistant');

    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [pendingIntent, setPendingIntent] = useState<any>(null);

    // Track whether user has slid into the cancel zone (replaces pan.x._value access)
    const [isCancelZone, setIsCancelZone] = useState(false);

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const expandAnim = useRef(new Animated.Value(0)).current; // 0 to 1
    const pan = useRef(new Animated.ValueXY()).current;

    // Timer state
    const [duration, setDuration] = useState(0);
    const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const isCancelledRef = useRef(false);

    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY, (status) => {
        // Handle status changes if needed
    });

    const isRecording = recorder.isRecording;

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
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);

        Animated.parallel([
            Animated.spring(expandAnim, {
                toValue: 0,
                friction: 8,
                tension: 50,
                useNativeDriver: false,
            }),
            Animated.spring(pan, {
                toValue: { x: 0, y: 0 },
                friction: 5,
                useNativeDriver: false,
            })
        ]).start();
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
            startTimer();

            // Start animations
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 400, useNativeDriver: false }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
                ])
            ).start();

            Animated.spring(expandAnim, {
                toValue: 1,
                friction: 7,
                tension: 40,
                useNativeDriver: false,
            }).start();

        } catch (err) {
            console.error('Failed to start recording', err);
            setMessage("Failed to start recording");
            resetAnimations();
            stopTimer();
        }
    }

    async function cancelRecording() {
        stopTimer();
        resetAnimations();
        setIsCancelZone(false);
        try {
            if (recorder.isRecording) {
                await recorder.stop();
            }
        } catch (e) {
            console.error("Cancel err", e);
        }
    }

    async function stopAndProcessRecording() {
        stopTimer();
        resetAnimations();
        setIsCancelZone(false);

        if (!recorder.isRecording && !isProcessing) return;

        setIsProcessing(true);
        setMessage("Processing...");

        try {
            const uri = recorder.uri;
            await recorder.stop();

            if (uri) {
                console.log("[VoiceAssistant] Audio recorded at:", uri);
                const sttResult = await SpeechToTextService.transcribe(uri);
                console.log("[VoiceAssistant] STT Result:", sttResult);

                if (sttResult.success && sttResult.text) {
                    setMessage(`Heard: "${sttResult.text}"`);

                    await new Promise(r => setTimeout(r, 1200));
                    setMessage("Connecting to AI Assistant...");

                    const response = await VoiceAssistantService.processCommand(sttResult.text, {
                        userId: user?.id || "unknown-user",
                        name: user?.name,
                    });
                    console.log("[VoiceAssistant] Backend Response:", response);

                    if (response && response.requiresConfirmation) {
                        setMessage(response.message);
                        setPendingIntent(response.pendingIntent);
                        setIsProcessing(false);
                        return;
                    } else if (response && response.message) {
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
            console.error('[VoiceAssistant] Error during stop or processing:', err);
            setMessage("Error processing voice.");
        } finally {
            setIsProcessing(false);
            setDuration(0);
            setTimeout(() => setMessage(null), 4000);
        }
    }

    // Determine Pan Responder bounds
    const maxSlide = -130; // pixels to slide left for cancel

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: async () => {
                isCancelledRef.current = false;
                await startRecording();
            },
            onPanResponderMove: (e, gestureState) => {
                // Allow sliding left only
                if (gestureState.dx < 0) {
                    pan.setValue({ x: Math.max(gestureState.dx, maxSlide - 20), y: 0 });
                }

                if (gestureState.dx < maxSlide && !isCancelledRef.current) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    isCancelledRef.current = true;
                    setIsCancelZone(true);
                } else if (gestureState.dx >= maxSlide && isCancelledRef.current) {
                    // User moved back to right — un-cancel
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
            if (response?.message) {
                setMessage(response.message);
            } else {
                setMessage("Successfully saved.");
            }
        } catch (error) {
            console.error("Error confirming action:", error);
            setMessage("Failed to save.");
        } finally {
            setPendingIntent(null);
            setIsProcessing(false);
            setTimeout(() => setMessage(null), 4000);
        }
    };

    const cancelConfirmation = () => {
        setPendingIntent(null);
        setMessage("Action cancelled.");
        setTimeout(() => setMessage(null), 2000);
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const hasSubscription = user?.isSubscribed || (user?.plan_level && user.plan_level !== "free");
    if (!user || !hasSubscription) return null;

    // Mic button background color — uses isCancelZone state instead of pan.x._value
    const micButtonColor = isRecording
        ? (isCancelZone ? colors.error : '#ff3b30')
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
                                <Text style={styles.confirmButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                                onPress={acceptConfirmation}
                            >
                                <Text style={styles.confirmButtonText}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            <View style={styles.recordWrapper}>
                {/* Expandable background container */}
                <Animated.View style={[
                    styles.expandedContainer,
                    {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        width: expandAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [64, width * 0.75]
                        }),
                        opacity: expandAnim
                    }
                ]}>
                    <View style={styles.expandedContent}>
                        <View style={styles.timerContainer}>
                            <View style={styles.redDot} />
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
                            <Ionicons name="chevron-back" size={20} color={colors.text} style={{ opacity: 0.5 }} />
                            <Text style={[styles.slideText, { color: colors.text }]}>
                                Slide to cancel
                            </Text>
                        </Animated.View>
                    </View>
                </Animated.View>

                {/* Draggable Mic Button */}
                <Animated.View
                    {...(!isProcessing ? panResponder.panHandlers : {})}
                    style={[
                        styles.micButtonContainer,
                        {
                            transform: [
                                { translateX: pan.x },
                                { scale: pulseAnim }
                            ],
                            backgroundColor: micButtonColor
                        }
                    ]}
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
                </Animated.View>
            </View>
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
        paddingRight: 70,
        paddingLeft: 20,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    redDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ff3b30',
        marginRight: 6,
    },
    timerText: {
        fontSize: 16,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    slideText: {
        fontSize: 14,
        opacity: 0.6,
        marginLeft: 4,
    },
    micButtonContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
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
    },
    confirmationActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingHorizontal: 8,
    },
    confirmButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
        minWidth: 80,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    }
});