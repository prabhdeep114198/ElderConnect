import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { CameraType, CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Control type from backend
interface BackendControl {
  id: string; // unique identifier
  type: "mute" | "switchCamera" | "endCall" | "custom";
  icon: string;
  color?: string;
  size?: number;
}

export default function VideoCallScreen() {
  const [isMuted, setIsMuted] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraType>("front");
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [controls, setControls] = useState<BackendControl[]>([]);
  const navigation = useNavigation();
  const cameraRef = useRef<CameraView>(null);

  // Request permissions
  const requestPermissions = async () => {
    await requestCameraPermission();
    await requestMicPermission();
  };

  // Backend actions mapping
  const actionMap: { [key: string]: () => void } = {
    mute: () => setIsMuted(prev => !prev),
    switchCamera: () => setCameraFacing(prev => (prev === "back" ? "front" : "back")),
    endCall: () => navigation.goBack(),
    // Add custom actions here
  };

  // Fetch dynamic controls from backend
  useEffect(() => {
    const fetchControls = async () => {
      try {
        // Replace with your backend API call
        const response = await fetch("https://your-backend.com/api/video-call-controls");
        const data: BackendControl[] = await response.json();

        // Map backend mute icon based on state
        const mappedData = data.map(ctrl => {
          if (ctrl.type === "mute") {
            return {
              ...ctrl,
              icon: isMuted ? "mic-off-circle" : "mic-circle",
              color: isMuted ? "#f87171" : ctrl.color || "white",
            };
          }
          return ctrl;
        });

        setControls(mappedData);
      } catch (err) {
        console.log("Failed to fetch controls:", err);
      }
    };

    fetchControls();
  }, [isMuted]); // Re-run if mute state changes

  if (!cameraPermission || !micPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.infoText}>Loading...</Text>
      </View>
    );
  }

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

      {/* Dynamic Controls from backend */}
      <View style={styles.controls}>
        {controls.map(ctrl => (
          <TouchableOpacity
            key={ctrl.id}
            onPress={() => actionMap[ctrl.type]?.()}
          >
            <Ionicons
              name={ctrl.icon as any}
              size={ctrl.size || 44}
              color={ctrl.color || "white"}
            />
          </TouchableOpacity>
        ))}
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
