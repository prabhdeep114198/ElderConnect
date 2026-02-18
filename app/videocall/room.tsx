import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getSocket } from "../../services/socket";
import peer from "../../services/peer";
import { useTheme } from "../../context/ThemeContext";

export default function RoomScreen() {
  const { roomId } = useLocalSearchParams();
  const socket = getSocket();
  const router = useRouter();
  const { colors, theme } = useTheme();

  const myVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState("Initializing...");
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const candidatesQueue = useRef<RTCIceCandidateInit[]>([]);

  const isDark = theme === 'dark';

  const toggleMute = () => {
    const audioTrack = streamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleCamera = () => {
    const videoTrack = streamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOff(!videoTrack.enabled);
    }
  };

  const handleEndCall = useCallback(() => {
    socket?.emit("peer:leave", { to: roomId });
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    peer.recreatePeer();
    router.replace("/videocall");
  }, [socket, roomId, router]);

  // Signaling logic remains the same...
  const handleUserJoined = useCallback(async ({ id }: { id: string }) => {
    if (!socket) return;
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: id, offer });
  }, [socket]);

  const handleIncomingCall = useCallback(async ({ from, offer }: any) => {
    if (!socket) return;
    const ans = await peer.getAnswer(offer);
    socket.emit("call:accepted", { to: from, ans });
  }, [socket]);

  const handleCallAccepted = useCallback(async ({ ans }: any) => {
    await peer.setRemoteDescription(ans);
    while (candidatesQueue.current.length > 0) {
      const c = candidatesQueue.current.shift();
      if (c && peer.peer) await peer.peer.addIceCandidate(new RTCIceCandidate(c));
    }
  }, []);

  const handlePeerLeft = useCallback(() => {
    setStatus("Peer disconnected");
    setIsRemoteConnected(false);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    if (!socket || !roomId) return;
    const setup = async () => {
      const pc = peer.recreatePeer();
      if (!pc) return;
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        streamRef.current = localStream;
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
        if (myVideoRef.current) myVideoRef.current.srcObject = localStream;
        setStatus("Waiting for peer...");
        pc.ontrack = (e) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = e.streams[0];
            setIsRemoteConnected(true);
            setStatus("✅ CONNECTED");
          }
        };
        pc.onicecandidate = (e) => {
          if (e.candidate) socket.emit("peer:ice:candidate", { to: roomId, candidate: e.candidate });
        };
        socket.emit("room:join", { email: `user-${Math.random()}`, room: roomId });
      } catch (err) { setStatus("Camera Error"); }
    };
    setup();
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:left", handlePeerLeft);
    socket.on("peer:ice:candidate", async ({ candidate }) => {
      if (peer.peer?.remoteDescription) await peer.peer.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
      else candidatesQueue.current.push(candidate);
    });
    return () => {
      socket.off("user:joined"); socket.off("incomming:call"); socket.off("call:accepted");
      socket.off("peer:left"); socket.off("peer:ice:candidate");
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [socket, roomId, handleUserJoined, handleIncomingCall, handleCallAccepted, handlePeerLeft]);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.topInfo}>
        <Text style={[styles.header, { color: colors.text }]}>Room: {roomId}</Text>
        <Text style={[styles.status, { color: isRemoteConnected ? '#4caf50' : colors.mutedText }]}>{status}</Text>
      </View>

      <View style={styles.videoGrid}>
        {/* Local Video - Reverted to your exact sizing */}
        <View style={[styles.videoBox, { backgroundColor: isDark ? '#111' : '#E5E5EA', borderColor: colors.border }]}>
          <video ref={myVideoRef} autoPlay playsInline muted style={styles.videoElement} />
          {isCameraOff && (
            <View style={styles.overlay}><Text style={[styles.overlayText, { color: colors.mutedText }]}>Camera Off</Text></View>
          )}
          <Text style={styles.label}>You {isMuted ? "(Muted)" : ""}</Text>
        </View>

        {/* Remote Video - Reverted to your exact sizing */}
        <View style={[styles.videoBox, { backgroundColor: isDark ? '#111' : '#E5E5EA', borderColor: colors.border }]}>
          <video
            ref={remoteVideoRef}
            autoPlay playsInline
            style={{
              ...styles.videoElement,
              display: isRemoteConnected ? 'block' : 'none'
            }} />
          {!isRemoteConnected && (
            <View style={styles.placeholder}>
              <Text style={{ color: colors.mutedText }}>Connecting...</Text>
            </View>
          )}
          <Text style={styles.label}>Remote</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: isMuted ? '#ff9800' : (isDark ? '#222' : '#FFF') }]}
          onPress={toggleMute}
        >
          <Ionicons name={isMuted ? "mic-off" : "mic"} size={24} color={isMuted ? "#FFF" : colors.text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnEnd} onPress={handleEndCall}>
          <Text style={styles.btnText}>End Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: isCameraOff ? '#ff9800' : (isDark ? '#222' : '#FFF') }]}
          onPress={toggleCamera}
        >
          <Ionicons name={isCameraOff ? "videocam-off" : "videocam"} size={24} color={isCameraOff ? "#FFF" : colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'space-between' },
  topInfo: { alignItems: 'center', marginTop: 20 },
  header: { fontSize: 20, fontWeight: 'bold' },
  status: { fontSize: 14, marginTop: 5 },

  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    flex: 1,
    alignItems: 'center'
  },
  videoBox: {
    width: '48%',
    minWidth: 280,
    aspectRatio: 1.3,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
  },
  videoElement: { width: '100%', height: '100%', objectFit: 'cover' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  overlayText: { fontSize: 14 },

  label: { position: 'absolute', bottom: 8, left: 8, color: '#fff', fontSize: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: 4 },
  placeholder: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },

  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: 30 },
  iconBtn: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  btnEnd: { backgroundColor: '#ff3b30', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 30 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});