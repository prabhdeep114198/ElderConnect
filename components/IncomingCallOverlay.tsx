import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Platform,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import type { IncomingCallPayload, CallType } from '../services/api/videoCallTypes';

interface IncomingCallOverlayProps {
  visible: boolean;
  incomingCall: IncomingCallPayload | null;
  onAccept: (callId: string) => void;
  onReject: (callId: string) => void;
  /** Theme colours passed down from ThemeContext */
  colors: {
    background: string;
    text: string;
    primary: string;
  };
}

const PULSE_DURATION = 1200;

export default function IncomingCallOverlay({
  visible,
  incomingCall,
  onAccept,
  onReject,
  colors,
}: IncomingCallOverlayProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── Pulse loop while overlay is visible ─────────────────────────────────
  useEffect(() => {
    if (!visible) {
      pulseAnim.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: PULSE_DURATION / 2,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: PULSE_DURATION / 2,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, pulseAnim]);

  if (!incomingCall) return null;

  const isVideo = incomingCall.call_type === 'video';
  const callerLabel = incomingCall.caller_name ?? `User ${incomingCall.caller_id.slice(-6)}`;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      presentationStyle="pageSheet"
      onRequestClose={() => onReject(incomingCall.call_id)}   // Android back button
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.background }]}>
          {/* Pulsing avatar ring */}
          <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulseAnim }] }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarInitial}>
                {callerLabel.charAt(0).toUpperCase()}
              </Text>
            </View>
          </Animated.View>

          {/* Caller info */}
          <Text style={[styles.callerName, { color: colors.text }]}>{callerLabel}</Text>
          <Text style={[styles.callTypeLabel, { color: colors.text + '99' }]}>
            {isVideo ? 'Incoming Video Call' : 'Incoming Voice Call'}
          </Text>

          {/* Call-type icon */}
          <View style={styles.iconRow}>
            {isVideo ? (
              <MaterialIcons name="videocam" size={28} color={colors.primary} />
            ) : (
              <Ionicons name="call" size={28} color={colors.primary} />
            )}
          </View>

          {/* Action buttons – deliberately oversized for elderly users */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnReject]}
              onPress={() => onReject(incomingCall.call_id)}
              activeOpacity={0.7}
              accessibilityLabel="Reject call"
            >
              <Ionicons name="close" size={32} color="#fff" />
              <Text style={styles.btnLabel}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnAccept]}
              onPress={() => onAccept(incomingCall.call_id)}
              activeOpacity={0.7}
              accessibilityLabel="Accept call"
            >
              {isVideo ? (
                <MaterialIcons name="videocam" size={32} color="#fff" />
              ) : (
                <Ionicons name="call" size={32} color="#fff" />
              )}
              <Text style={styles.btnLabel}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '85%',
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },

  // Avatar
  avatarRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Labels
  callerName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  callTypeLabel: {
    fontSize: 16,
    marginBottom: 12,
  },
  iconRow: {
    marginBottom: 28,
  },

  // Buttons
  buttonsRow: {
    flexDirection: 'row',
    gap: 32,
  },
  btn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnReject: {
    backgroundColor: '#E53935',
  },
  btnAccept: {
    backgroundColor: '#43A047',
  },
  btnLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});