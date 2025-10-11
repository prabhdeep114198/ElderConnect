import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MagnifierScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [zoom, setZoom] = useState(0);

  const cameraRef = useRef<CameraView>(null);

  const changeZoom = (delta: number) => {
    setZoom((prev) => Math.min(1, Math.max(0, +(prev + delta).toFixed(2))));
  };

  if (!permission) return <View />;
  
  if (!permission.granted)
    return (
      <View style={styles.center}>
        <Text style={styles.infoText}>No camera access</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Request Permission</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        enableTorch={torchOn}
        zoom={zoom}
      />

      {/* Zoom badge */}
      <View style={styles.zoomBadge}>
        <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => changeZoom(-0.1)}>
          <Ionicons name="remove-circle-outline" size={40} color="white" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setTorchOn((v) => !v)}>
          <Ionicons name={torchOn ? 'flash' : 'flash-outline'} size={36} color="white" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => changeZoom(0.1)}>
          <Ionicons name="add-circle-outline" size={40} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  controls: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 24,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoText: { color: 'white', marginBottom: 12 },
  permissionButton: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permissionButtonText: { color: 'white', fontWeight: '600' },
  zoomBadge: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  zoomText: { color: 'white', fontWeight: '600' },
});