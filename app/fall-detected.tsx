import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { deviceService } from '../services/api/device';

export default function FallDetectedScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [countdown, setCountdown] = useState(30);
    const [isProcessing, setIsProcessing] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const player = useAudioPlayer(require('../assets/sounds/alarm.wav'));

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
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleConfirmedFall();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(timer);
            Vibration.cancel();
            player.pause();
        };
    }, []);

    const handleIAmOk = async () => {
        setIsProcessing(true);
        player.pause();
        Vibration.cancel();
        router.back();
    };

    const handleConfirmedFall = async () => {
        if (isProcessing) return;
        setIsProcessing(true);

        console.log('EMERGENCY: Fall Confirmed. Notifying backend...');

        try {
            if (user) {
                await deviceService.createSOS(user.id, {
                    type: 'fall_detected',
                    location: 'Automated Detection',
                    status: 'pending',
                    severity: 'critical'
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
                <Ionicons name="warning" size={120} color="#FFF" />
                <Text style={styles.title}>Fall Detected!</Text>
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
    footerText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
    },
});
