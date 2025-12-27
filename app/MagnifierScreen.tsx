import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// Type definition for dynamic controls
interface ControlConfig {
  type: 'zoom' | 'torch';
  icon?: keyof typeof Ionicons.glyphMap;
  iconOn?: keyof typeof Ionicons.glyphMap;
  iconOff?: keyof typeof Ionicons.glyphMap;
  delta?: number;
}

// Mock: Dynamic controls fetched from backend (replace this with API call)
const fetchControlsFromBackend = async (): Promise<ControlConfig[]> => {
  return [
    { type: 'zoom', icon: 'remove-circle-outline', delta: -0.1 },
    { type: 'torch', iconOn: 'flash', iconOff: 'flash-outline' },
    { type: 'zoom', icon: 'add-circle-outline', delta: 0.1 },
  ];
};

export default function MagnifierScreen() {
  const { colors, theme } = useTheme();
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [controls, setControls] = useState<ControlConfig[]>([]);

  const cameraRef = useRef<CameraView>(null);

  // Fetch dynamic controls from backend
  useEffect(() => {
    const getControls = async () => {
      const backendControls = await fetchControlsFromBackend();
      setControls(backendControls);
    };
    getControls();
  }, []);

  const changeZoom = (delta: number) => {
    setZoom(prev => Math.min(1, Math.max(0, +(prev + delta).toFixed(2))));
  };

  if (!permission) return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  if (!permission.granted)
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.infoText, { color: colors.text }]}>{t("noCameraAccess")}</Text>
        <TouchableOpacity style={[styles.permissionButton, { backgroundColor: colors.primary }]} onPress={requestPermission}>
          <Text style={[styles.permissionButtonText, { color: colors.buttonText }]}>{t("requestPermission")}</Text>
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

      {/* Dynamic Controls */}
      <View style={styles.controls}>
        {controls.map((ctrl, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              if (ctrl.type === 'zoom' && ctrl.delta !== undefined) changeZoom(ctrl.delta);
              if (ctrl.type === 'torch') setTorchOn(v => !v);
            }}
          >
            <Ionicons
              name={
                ctrl.type === 'torch'
                  ? torchOn
                    ? ctrl.iconOn!
                    : ctrl.iconOff!
                  : ctrl.icon!
              }
              size={ctrl.type === 'torch' ? 36 : 40}
              color="white"
            />
          </TouchableOpacity>
        ))}
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
  infoText: { marginBottom: 12, fontSize: 16 },
  permissionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permissionButtonText: { fontWeight: '600' },
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
