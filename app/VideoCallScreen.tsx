import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { CameraType, CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import React, { useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function VideoCallScreen() {
  const [isMuted, setIsMuted] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraType>("front");
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const navigation = useNavigation();

  const cameraRef = useRef<CameraView>(null);

  const requestPermissions = async () => {
    await requestCameraPermission();
    await requestMicPermission();
  };

  const switchCamera = () => {
    setCameraFacing((current) => (current === "back" ? "front" : "back"));
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
    // Note: Expo Camera doesn't provide direct audio track control like WebRTC
    // You'd need to implement audio recording separately if needed
  };

  const handleEndCall = () => {
    navigation.goBack();
  };

  // Check if permissions are still loading
  if (!cameraPermission || !micPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.infoText}>Loading...</Text>
      </View>
    );
  }

  // Check if permissions are denied
  if (!cameraPermission.granted || !micPermission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.infoText}>Camera & Microphone permissions needed</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraFacing}
        mode="video"
      />

      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleMute}>
          <Ionicons
            name={isMuted ? "mic-off-circle" : "mic-circle"}
            size={48}
            color={isMuted ? "#f87171" : "white"}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={switchCamera}>
          <Ionicons name="camera-reverse-outline" size={44} color="white" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleEndCall}>
          <Ionicons name="call" size={48} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  infoText: { color: "white", marginBottom: 12, fontSize: 16 },
  permissionButton: {
    backgroundColor: "#1f2937",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permissionButtonText: { color: "white", fontWeight: "600" },
  controls: {
    position: "absolute",
    bottom: 30,
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 24,
    alignItems: "center",
  },
});