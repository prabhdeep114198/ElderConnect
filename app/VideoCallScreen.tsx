import { Ionicons } from "@expo/vector-icons";
import {
  CameraType,
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFeatureFlags } from "../hooks/useFeatureFlags";

import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");

export default function VideoCallScreen() {
  const { t } = useTranslation();
  const { requireAuth } = useAuth();
  const flags = useFeatureFlags(["unlimited_video"]);
  const isPremium = flags.unlimited_video?.enabled ?? false;
  const [isMuted, setIsMuted] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraType>("front");

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [showContacts, setShowContacts] = useState(false);

  const cameraRef = useRef<CameraView | null>(null);

  const [contacts, setContacts] = useState([
    { id: "1", name: "Sakshi", phone: "+919876543210" },
    { id: "2", name: "Mohan", phone: "+919811223344" },
  ]);

  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [adding, setAdding] = useState(false);

  const [cameraKey, setCameraKey] = useState(Date.now());
  const [isCameraActive, setIsCameraActive] = useState(true);

  // NEW — calling modal
  const [callingUser, setCallingUser] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      setCameraKey(Date.now());
      setShowContacts(false);
      setIsCameraActive(true);
    }, [])
  );

  const switchCamera = () =>
    setCameraFacing((current) => (current === "back" ? "front" : "back"));

  const toggleMute = () => setIsMuted((prev) => !prev);

  const handleEndCall = async () => {
    setShowContacts(false);
    setIsCameraActive(false);

    try {
      // @ts-ignore
      if (cameraRef.current?.pausePreview) await cameraRef.current.pausePreview();
      // @ts-ignore
      if (cameraRef.current?.stopRecording)
        // @ts-ignore
        cameraRef.current.stopRecording();
    } catch (e) {
      console.log("Error stopping camera:", e);
    }

    setCameraKey(Date.now());

    setTimeout(() => {
      router.replace("/");
    }, 300);
  };

  const addContact = () => {
    requireAuth(() => {
      if (!isPremium && contacts.length >= 2) {
        Alert.alert(
          t("premiumFeature"),
          t("contactLimitReached"),
          [
            { text: t("cancel"), style: "cancel" },
            { text: t("upgradeNow"), onPress: () => router.push("/SettingsScreen") }
          ]
        );
        setAdding(false);
        return;
      }

      if (!newName.trim() || !newPhone.trim()) return;

      setContacts((prev) => [
        ...prev,
        { id: Date.now().toString(), name: newName, phone: newPhone },
      ]);

      setNewName("");
      setNewPhone("");
      setAdding(false);
    });
  };

  // NEW — When user taps a contact
  const callContact = (name: string) => {
    setCallingUser(name);
    setShowContacts(false);
    setIsCameraActive(false);

    setTimeout(() => {
      setCallingUser(null);
      setIsCameraActive(true); // return to camera automatically
    }, 3000);
  };

  if (!cameraPermission || !micPermission) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="white" />
        <Text style={styles.infoText}>Preparing camera...</Text>
      </SafeAreaView>
    );
  }

  if (!cameraPermission.granted || !micPermission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.infoText}>Camera & Microphone permissions needed</Text>

        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => {
            requestCameraPermission();
            requestMicPermission();
          }}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {isCameraActive && !showContacts && !callingUser && (
        <CameraView
          key={cameraKey}
          ref={(r) => {
            // @ts-ignore
            cameraRef.current = r;
          }}
          style={styles.camera}
          facing={cameraFacing}
        />
      )}

      {!showContacts && !callingUser && (
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

          <TouchableOpacity onPress={() => setShowContacts(true)}>
            <Ionicons name="people-circle" size={50} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {showContacts && (
        <View style={styles.drawer}>
          <SafeAreaView>
            <Text style={styles.drawerTitle}>Contacts</Text>

            <FlatList
              data={contacts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => callContact(item.name)}
                  style={styles.contactItem}
                >
                  <Ionicons name="person-circle" size={34} color="white" />
                  <View>
                    <Text style={styles.contactName}>{item.name}</Text>
                    <Text style={styles.contactPhone}>{item.phone}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity style={styles.addButton} onPress={() => setAdding(true)}>
              <Ionicons name="add-circle" size={44} color="#22c55e" />
              <Text style={styles.addText}>Add Contact</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowContacts(false);
                setIsCameraActive(true);
                setCameraKey(Date.now());
              }}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      )}

      {/* CALLING MODAL */}
      <Modal visible={!!callingUser} transparent animationType="fade">
        <View style={styles.callingContainer}>
          <View style={styles.callingBox}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.callingText}>Calling {callingUser}...</Text>

            <TouchableOpacity
              style={styles.endCallButton}
              onPress={() => setCallingUser(null)}
            >
              <Ionicons name="call" size={40} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ADD CONTACT MODAL */}
      <Modal visible={adding} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Contact</Text>

            <TextInput
              placeholder="Name"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
            />

            <TextInput
              placeholder="Phone"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={newPhone}
              onChangeText={setNewPhone}
              keyboardType="phone-pad"
            />

            <TouchableOpacity style={styles.modalButton} onPress={addContact}>
              <Text style={styles.modalButtonText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setAdding(false)}>
              <Text style={{ color: "white", marginTop: 10 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  infoText: { color: "white", marginTop: 12, fontSize: 16 },

  permissionButton: {
    backgroundColor: "#1f2937",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permissionButtonText: { color: "white", fontWeight: "600" },

  controls: {
    position: "absolute",
    bottom: 25,
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 24,
    alignItems: "center",
  },

  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "#111",
  },
  drawerTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
  },

  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  contactName: { color: "white", fontSize: 18, fontWeight: "600" },
  contactPhone: { color: "#aaa", fontSize: 14 },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    gap: 10,
  },
  addText: { color: "white", fontSize: 18 },

  closeButton: {
    backgroundColor: "#333",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 30,
  },
  closeButtonText: { color: "white", textAlign: "center", fontSize: 16 },

  callingContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  callingBox: {
    backgroundColor: "#222",
    padding: 30,
    borderRadius: 15,
    alignItems: "center",
  },
  callingText: {
    color: "white",
    fontSize: 22,
    marginTop: 15,
    marginBottom: 20,
  },
  endCallButton: {
    padding: 12,
    borderRadius: 50,
    backgroundColor: "#111",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: width * 0.8,
    backgroundColor: "#222",
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: { color: "white", fontSize: 20, marginBottom: 10 },

  input: {
    backgroundColor: "#333",
    color: "white",
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
  },
  modalButton: {
    backgroundColor: "#22c55e",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  modalButtonText: {
    textAlign: "center",
    color: "white",
    fontWeight: "700",
  },
});
