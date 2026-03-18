/**
 * app/videocall/room.tsx
 *
 * Instagram-style video call UI.
 * - Full-screen remote video as background
 * - Floating Picture-in-Picture local camera (top-right)
 * - Frosted glass bottom control bar
 * - Top gradient with caller name + status
 * - All WebRTC/socket logic preserved unchanged
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSocket } from '../../services/socket';
import { peerService } from '../../services/peer';

const { width: W, height: H } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────
interface WebRtcOfferPayload     { call_id: string; sdp: RTCSessionDescriptionInit }
interface WebRtcAnswerPayload    { call_id: string; sdp: RTCSessionDescriptionInit }
interface WebRtcCandidatePayload { call_id: string; candidate: RTCIceCandidateInit }
interface CallEndedPayload       { call_id: string; duration_seconds: number }
interface CallRejectedPayload    { call_id: string; reason: string }

// ─── Component ────────────────────────────────────────────────────────────────
export default function RoomScreen() {
  const { callId, isCaller: isCallerParam, userId } = useLocalSearchParams<{
    callId: string;
    isCaller: string;
    userId: string;
  }>();

  const isCaller = isCallerParam === 'true';
  const router   = useRouter();
  const socket   = getSocket();

  // ── Refs ────────────────────────────────────────────────────────────────────
  const localVideoRef    = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef   = useRef<HTMLVideoElement | null>(null);
  const localStreamRef   = useRef<MediaStream | null>(null);
  const iceCandidateBuf  = useRef<RTCIceCandidateInit[]>([]);
  const remoteReadyRef   = useRef(false);

  // ── State ───────────────────────────────────────────────────────────────────
  const [status, setStatus]              = useState<string>('Connecting…');
  const [isRemoteConnected, setIsRemote] = useState(false);
  const [isMuted, setIsMuted]            = useState(false);
  const [isCameraOff, setIsCameraOff]    = useState(false);
  const [isSpeakerOn, setIsSpeakerOn]    = useState(true);
  const [callDuration, setCallDuration]  = useState(0);
  const [showControls, setShowControls]  = useState(true);

  // ── Animations ──────────────────────────────────────────────────────────────
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const pulseAnim       = useRef(new Animated.Value(1)).current;

  // Pulse animation while waiting for remote
  useEffect(() => {
    if (!isRemoteConnected) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isRemoteConnected]);

  // Auto-hide controls after 4 s when connected
  useEffect(() => {
    if (!isRemoteConnected) return;
    const timer = setTimeout(() => {
      Animated.timing(controlsOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setShowControls(false));
    }, 4000);
    return () => clearTimeout(timer);
  }, [isRemoteConnected]);

  const revealControls = () => {
    setShowControls(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  // Call duration timer
  useEffect(() => {
    if (!isRemoteConnected) return;
    const t = setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [isRemoteConnected]);

  const formatDuration = (secs: number) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── WebRTC helpers ──────────────────────────────────────────────────────────
  const flushCandidates = useCallback(async () => {
    while (iceCandidateBuf.current.length > 0) {
      await peerService.addIceCandidate(iceCandidateBuf.current.shift()!);
    }
  }, []);

  const attachLocalStream = useCallback(async (pc: RTCPeerConnection) => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      setStatus('Camera/mic not supported'); return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      localStreamRef.current = stream;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      if (Platform.OS === 'web' && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch {
      setStatus('Camera permission denied'); return null;
    }
  }, []);

  const handleEndCall = useCallback(() => {
    if (socket && callId) socket.emit('call:end', { call_id: callId });
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerService.recreate();
    router.replace('/videocall');
  }, [socket, callId, router]);

  const setupPeer = useCallback((pc: RTCPeerConnection) => {
    pc.onicecandidate = (evt) => {
      if (evt.candidate && socket && callId) {
        socket.emit('webrtc:ice-candidate', {
          call_id: callId, candidate: evt.candidate.toJSON(),
        } satisfies WebRtcCandidatePayload);
      }
    };
    pc.ontrack = (evt) => {
      if (Platform.OS === 'web' && remoteVideoRef.current && evt.streams[0]) {
        remoteVideoRef.current.srcObject = evt.streams[0];
      }
      setIsRemote(true);
      setStatus('Connected');
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setStatus('Peer disconnected'); setIsRemote(false);
      }
    };
  }, [socket, callId]);

  // ── Main effect ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !callId || !userId) return;
    socket.emit('authenticate', { userId });

    const pc = peerService.recreate();
    if (!pc) return;
    setupPeer(pc);

    let cleanedUp = false;
    const init = async () => {
      const stream = await attachLocalStream(pc);
      if (!stream || cleanedUp) return;
      if (isCaller) {
        setStatus('Calling…');
        socket.emit('call:invite', { call_id: callId });
      } else {
        setStatus('Waiting for offer…');
      }
    };
    init();

    const onCallAccepted = async ({ call_id }: { call_id: string; room_id: string }) => {
      if (call_id !== callId) return;
      const sdp = await peerService.createOffer();
      if (sdp) {
        socket.emit('webrtc:offer', { call_id: callId, sdp } satisfies WebRtcOfferPayload);
        setStatus('Offer sent…');
      }
    };
    const onWebRtcOffer = async ({ call_id, sdp }: WebRtcOfferPayload) => {
      if (call_id !== callId) return;
      const answer = await peerService.createAnswer(sdp);
      if (answer) {
        remoteReadyRef.current = true;
        socket.emit('webrtc:answer', { call_id: callId, sdp: answer } satisfies WebRtcAnswerPayload);
        await flushCandidates();
      }
    };
    const onWebRtcAnswer = async ({ call_id, sdp }: WebRtcAnswerPayload) => {
      if (call_id !== callId) return;
      await peerService.applyAnswer(sdp);
      remoteReadyRef.current = true;
      await flushCandidates();
    };
    const onIceCandidate = async ({ call_id, candidate }: WebRtcCandidatePayload) => {
      if (call_id !== callId) return;
      if (remoteReadyRef.current) await peerService.addIceCandidate(candidate);
      else iceCandidateBuf.current.push(candidate);
    };
    const onCallEnded = ({ call_id }: CallEndedPayload) => {
      if (call_id !== callId) return;
      setStatus('Call ended');
      setIsRemote(false);
      setTimeout(() => router.replace('/videocall'), 1500);
    };
    const onCallRejected = ({ call_id, reason }: CallRejectedPayload) => {
      if (call_id !== callId) return;
      setStatus(`Declined: ${reason}`);
      setTimeout(() => router.replace('/videocall'), 2000);
    };

    socket.on('call:accepted', onCallAccepted);
    socket.on('webrtc:offer', onWebRtcOffer);
    socket.on('webrtc:answer', onWebRtcAnswer);
    socket.on('webrtc:ice-candidate', onIceCandidate);
    socket.on('call:ended', onCallEnded);
    socket.on('call:rejected', onCallRejected);

    return () => {
      cleanedUp = true;
      socket.off('call:accepted', onCallAccepted);
      socket.off('webrtc:offer', onWebRtcOffer);
      socket.off('webrtc:answer', onWebRtcAnswer);
      socket.off('webrtc:ice-candidate', onIceCandidate);
      socket.off('call:ended', onCallEnded);
      socket.off('call:rejected', onCallRejected);
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [socket, callId, userId, isCaller, setupPeer, attachLocalStream, flushCandidates, router]);

  // ── Controls ─────────────────────────────────────────────────────────────────
  const toggleMute = () => {
    const t = localStreamRef.current?.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsMuted(!t.enabled); }
  };
  const toggleCamera = () => {
    const t = localStreamRef.current?.getVideoTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsCameraOff(!t.enabled); }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── REMOTE VIDEO (full-screen background) ── */}
      <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={revealControls}>
        {Platform.OS === 'web' && isRemoteConnected ? (
          /* @ts-ignore */
          <video ref={remoteVideoRef} autoPlay playsInline style={styles.remoteVideo} />
        ) : (
          // Waiting screen — dark gradient with pulsing avatar
          <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f3460']}
            style={styles.waitingBg}
          >
            <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={64} color="#fff" />
              </View>
            </Animated.View>
            <Text style={styles.callerName}>
              {isCaller ? 'Calling…' : 'Incoming Call'}
            </Text>
            <Text style={styles.waitingStatus}>{status}</Text>
          </LinearGradient>
        )}
      </TouchableOpacity>

      {/* ── TOP GRADIENT OVERLAY ── */}
      <LinearGradient
        colors={['rgba(0,0,0,0.75)', 'transparent']}
        style={styles.topOverlay}
        pointerEvents="none"
      >
        <View style={styles.topBar}>
          <View>
            <Text style={styles.nameLabel}>Video Call</Text>
            <Text style={styles.statusLabel}>
              {isRemoteConnected ? formatDuration(callDuration) : status}
            </Text>
          </View>
          {isRemoteConnected && (
            <View style={styles.connectedBadge}>
              <View style={styles.connectedDot} />
              <Text style={styles.connectedText}>Live</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* ── LOCAL PIP VIDEO (top-right corner) ── */}
      <View style={styles.pip}>
        {Platform.OS === 'web' ? (
          /* @ts-ignore */
          <video ref={localVideoRef} autoPlay playsInline muted style={styles.pipVideo} />
        ) : (
          <View style={styles.pipPlaceholder}>
            <Ionicons name="person" size={28} color="rgba(255,255,255,0.6)" />
          </View>
        )}
        {isCameraOff && (
          <View style={styles.pipDim}>
            <Ionicons name="videocam-off" size={18} color="#fff" />
          </View>
        )}
      </View>

      {/* ── BOTTOM CONTROL BAR ── */}
      {showControls && (
        <Animated.View style={[styles.bottomBar, { opacity: controlsOpacity }]}>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.88)']}
            style={styles.bottomGradient}
          >
            <View style={styles.controls}>

              {/* Mute */}
              <TouchableOpacity style={[styles.ctrlBtn, isMuted && styles.ctrlBtnActive]} onPress={toggleMute}>
                <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={24} color="#fff" />
                <Text style={styles.ctrlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
              </TouchableOpacity>

              {/* Camera */}
              <TouchableOpacity style={[styles.ctrlBtn, isCameraOff && styles.ctrlBtnActive]} onPress={toggleCamera}>
                <Ionicons name={isCameraOff ? 'videocam-off' : 'videocam'} size={24} color="#fff" />
                <Text style={styles.ctrlLabel}>{isCameraOff ? 'Show' : 'Camera'}</Text>
              </TouchableOpacity>

              {/* End Call — prominent red circle */}
              <TouchableOpacity style={styles.endBtn} onPress={handleEndCall}>
                <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
              </TouchableOpacity>

              {/* Speaker */}
              <TouchableOpacity style={[styles.ctrlBtn, !isSpeakerOn && styles.ctrlBtnActive]} onPress={() => setIsSpeakerOn(v => !v)}>
                <Ionicons name={isSpeakerOn ? 'volume-high' : 'volume-mute'} size={24} color="#fff" />
                <Text style={styles.ctrlLabel}>{isSpeakerOn ? 'Speaker' : 'Earpiece'}</Text>
              </TouchableOpacity>

              {/* Flip camera placeholder */}
              <TouchableOpacity style={styles.ctrlBtn} onPress={() => {}}>
                <Ionicons name="camera-reverse" size={24} color="#fff" />
                <Text style={styles.ctrlLabel}>Flip</Text>
              </TouchableOpacity>

            </View>
          </LinearGradient>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  // Remote full-screen
  remoteVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  } as any,

  // Waiting background
  waitingBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callerName: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  waitingStatus: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '400',
  },

  // Top overlay
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameLabel: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  statusLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 2,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  connectedDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#4CD964',
  },
  connectedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // PiP local camera
  pip: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 90,
    right: 16,
    width: 96,
    height: 136,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: '#111',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
  pipVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  } as any,
  pipPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
  },
  pipDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bottom control bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomGradient: {
    paddingTop: 60,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },

  // Regular control button
  ctrlBtn: {
    flex: 1,
    maxWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    gap: 4,
  },
  ctrlBtnActive: {
    backgroundColor: 'rgba(255,70,70,0.45)',
  },
  ctrlLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'center',
  },

  // End call button — large red circle
  endBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3B30',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    marginHorizontal: 4,
  },
});