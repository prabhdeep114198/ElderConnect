import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { deviceService } from '../services/api/device';

export default function FallDetectedScreen() {
    const router = useRouter();
    const { type = 'fall', mode = 'local', alertId } = useLocalSearchParams<{ type: 'fall' | 'manual', mode?: string, alertId?: string }>();
    const { user } = useAuth();
    const [countdown, setCountdown] = useState(30);
    const isProcessingRef = useRef(false);
    const timerRef = useRef<any>(null);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const player = useAudioPlayer(require('../assets/sounds/alarm.wav'));

    const isManual = type === 'manual';

    useEffect(() => {
        // Start Alarm Sound
        player.loop = true;
        player.play();

        // Start Vibration
        Vibration.vibrate([1000, 1000, 1000], true);

        // Pulse animation for the button
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            ])
        ).start();

        // Countdown logic
        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    handleConfirmedSOS();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            Vibration.cancel();
            try {
                player.pause();
            } catch (e: any) {
                console.log('Audio player cleanup skipped:', e.message);
            }
        };
    }, []);

    const handleIAmOk = async () => {
        // IMPORTANT: Mark as processing/handled so the timer doesn't trigger SOS
        isProcessingRef.current = true;
        if (timerRef.current) clearInterval(timerRef.current);

        player.pause();
        Vibration.cancel();

        // If this is a hardware fall, we need to cancel it on the backend
        if (mode === 'hardware' && alertId && user) {
            try {
                // Just use the API directly without modifying deviceService if it lacks this method
                const token = await AsyncStorage.getItem('auth_token');
                await fetch(`https://elderconnect-api-esfdawb8drara7ge.centralindia-01.azurewebsites.net/api/v1/users/${user.id}/sos/${alertId}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'false_alarm', resolution: 'Cancelled by user on phone' })
                });
            } catch (error) {
                console.error("Failed to cancel hardware SOS", error);
            }
        }

        // Go back without notifying
        console.log('User confirmed they are OK. No notification sent.');
        router.back();
    };

    const handleConfirmedSOS = async () => {
        // Check ref to see if user already clicked "I AM OK"
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        const alertType = isManual ? 'manual' : 'fall_detection';
        console.log(`EMERGENCY: ${alertType} Confirmed.`);

        // If it's a hardware fall, the backend automatically sends it after 30s! We just notify the user.
        if (mode === 'hardware') {
            Alert.alert(
                "Emergency Alert Sent",
                "Your hardware device's SOS alert has been broadcast to your emergency contacts.",
                [{ text: "OK", onPress: () => router.back() }]
            );
            return;
        }

        try {
            if (user) {
                await deviceService.createSOS(user.id, {
                    type: alertType,
                    description: isManual ? 'User Triggered SOS' : 'Automated Fall Detection',
                    priority: 'critical'
                });
                console.log('SOS Alert created successfully');
            }
        } catch (error) {
            console.error('Failed to create SOS alert:', error);
        }

        Alert.alert(
            "Emergency Alert Sent",
            "Emergency contacts and services have been notified.",
            [{ text: "OK", onPress: () => router.back() }]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors.error }]}>
            <View style={styles.header}>
                <Ionicons name={isManual ? "alert-circle" : "warning"} size={120} color="#FFF" />
                <Text style={styles.title}>{isManual ? "SOS Triggered!" : "Fall Detected!"}</Text>
                <Text style={styles.subtitle}>Are you okay?</Text>
            </View>

            <View style={styles.countdownContainer}>
                <Text style={styles.countdownText}>{countdown}</Text>
                <Text style={styles.secondsText}>seconds until emergency alert</Text>
            </View>

            <View style={styles.buttonContainer}>
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <TouchableOpacity style={styles.okButton} onPress={handleIAmOk} activeOpacity={0.8}>
                        <Text style={styles.okButtonText}>I AM OK</Text>
                    </TouchableOpacity>
                </Animated.View>

                <TouchableOpacity
                    style={styles.cancelLink}
                    onPress={handleIAmOk}
                >
                    <Text style={styles.cancelLinkText}>Cancel & Go Back</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.footerText}>
                Emergency contacts will be notified automatically if you don't respond.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 80,
        paddingHorizontal: 30,
    },
    header: {
        alignItems: 'center',
    },
    title: {
        fontSize: 48,
        fontWeight: '900',
        color: '#FFF',
        marginTop: 20,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 28,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 10,
        fontWeight: '600',
    },
    countdownContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 8,
        borderColor: '#FFF',
    },
    countdownText: {
        fontSize: 84,
        fontWeight: '900',
        color: '#FFF',
    },
    secondsText: {
        fontSize: 16,
        color: '#FFF',
        textAlign: 'center',
        paddingHorizontal: 20,
        fontWeight: '600',
    },
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
    },
    okButton: {
        backgroundColor: '#FFF',
        paddingVertical: 25,
        paddingHorizontal: 80,
        borderRadius: 50,
        elevation: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    okButtonText: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.error,
    },
    cancelLink: {
        marginTop: 20,
        padding: 10,
    },
    cancelLinkText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        textDecorationLine: 'underline',
        opacity: 0.8,
    },
    footerText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
    },
});
