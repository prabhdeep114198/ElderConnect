import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";

import {
    ActivityIndicator,
    Animated,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    Platform,
    PermissionsAndroid,
    ScrollView,
    StatusBar
} from "react-native";
import { BleManager, Device, State } from "react-native-ble-plx";
import * as Location from "expo-location";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import { authService } from "../../../services/api/auth";

// Initialize BleManager lazily
let bleManager: BleManager | null = null;

export default function DevicesScreen() {
    const router = useRouter();
    const { colors, theme } = useTheme();
    const { user } = useAuth();
    const [connecting, setConnecting] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [connectedDevices, setConnectedDevices] = useState<any[]>([]);
    const [discoveredDevices, setDiscoveredDevices] = useState<any[]>([]);

    const scanAnim = useRef(new Animated.Value(0)).current;

    const requestPermissions = async () => {
        if (Platform.OS === 'android') {
            if (Platform.Version >= 31) {
                const result = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                ]);
                return Object.values(result).every(res => res === 'granted');
            }
            const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
            return result === PermissionsAndroid.RESULTS.GRANTED;
        }
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === 'granted';
    };

    const loadConnectedDevices = async () => {
        try {
            const response: any = await authService.getDevices();
            if (response?.data?.devices) setConnectedDevices(response.data.devices);
        } catch (error) {
            console.error("Failed to load devices", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConnectedDevices();
        return () => {
            if (bleManager) bleManager.stopDeviceScan();
        };
    }, []);

    useEffect(() => {
       useEffect(() => {
    // Do NOT initialize BLE inside Expo Go
    if (Constants.appOwnership === "expo") {
        Alert.alert(
            "Bluetooth Not Supported",
            "Device connection works only in a development build. Expo Go does not support Bluetooth."
        );
        return;
    }

    if (!bleManager) {
        bleManager = new BleManager();
    }
}, []);


        if (isScanning && bleManager) {
            startScan();
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scanAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
                    Animated.timing(scanAnim, { toValue: 0, duration: 1500, useNativeDriver: true })
                ])
            ).start();
        } else {
            if (bleManager) bleManager.stopDeviceScan();
            scanAnim.setValue(0);
        }
    }, [isScanning]);

    const startScan = async () => {
    if (Constants.appOwnership === "expo") return;
    if (!bleManager) return;

        const hasPermission = await requestPermissions();
        if (!hasPermission) {
            Alert.alert("Permissions Required", "This app needs Bluetooth and Location access to find health devices.");
            setIsScanning(false);
            return;
        }

        const state = await bleManager.state();
        if (state !== State.PoweredOn) {
            Alert.alert("Bluetooth is Off", "Please enable Bluetooth in your settings.");
            setIsScanning(false);
            return;
        }

        setDiscoveredDevices([]);
        bleManager.startDeviceScan(null, null, (error, device) => {
            if (error) { setIsScanning(false); return; }
            if (device && device.name) {
                setDiscoveredDevices(prev => {
                    if (prev.find(d => d.id === device.id)) return prev;
                    return [...prev, { id: device.id, name: device.name, rssi: device.rssi }];
                });
            }
        });

        setTimeout(() => setIsScanning(false), 15000);
    };

    const handleConnect = async (device: any) => {
        if (!bleManager) return;
        setConnecting(device.id);
        try {
            const connected = await bleManager.connectToDevice(device.id);
            await connected.discoverAllServicesAndCharacteristics();
            await authService.registerDevice({
                deviceId: device.id,
                name: device.name,
                type: 'wearable',
                manufacturer: 'BLE Device',
                capabilities: ['health_metrics']
            });
            Alert.alert("Connected", `${device.name} is now paired with your account.`);
            setIsScanning(false);
            loadConnectedDevices();
        } catch (error) {
            Alert.alert("Connection Failed", "Make sure the device is in pairing mode and try again.");
        } finally {
            setConnecting(null);
        }
    };

    const ListItem = ({ title, subtitle, icon, color, onPress, rightElement, isLast }: any) => (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            style={[
                styles.listItem,
                { borderBottomWidth: isLast ? 0 : 0.5, borderBottomColor: colors.border }
            ]}
        >
            <View style={[styles.listIcon, { backgroundColor: color }]}>
                <Ionicons name={icon} size={20} color="#FFF" />
            </View>
            <View style={styles.listContent}>
                <Text style={[styles.listTitle, { color: colors.text }]}>{title}</Text>
                {subtitle && <Text style={[styles.listSubtitle, { color: colors.mutedText }]}>{subtitle}</Text>}
            </View>
            {rightElement || <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#000' : '#F2F2F7' }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                        <Text style={{ color: colors.primary, fontSize: 17, fontWeight: '400' }}>Done</Text>
                    </TouchableOpacity>
                    <Text style={[styles.largeTitle, { color: colors.text }]}>My Devices</Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.mutedText }]}>CONNECTED DEVICES</Text>
                    <View style={[styles.card, { backgroundColor: colors.card }]}>
                        {loading ? (
                            <ActivityIndicator style={{ padding: 20 }} color={colors.primary} />
                        ) : connectedDevices.length > 0 ? (
                            connectedDevices.map((dev, idx) => (
                                <ListItem
                                    key={dev.id}
                                    title={dev.name}
                                    subtitle={dev.isOnline ? "Active now" : "Last seen recently"}
                                    icon="watch"
                                    color={colors.success}
                                    isLast={idx === connectedDevices.length - 1}
                                    onPress={() => { }}
                                    rightElement={
                                        <View style={styles.batteryRow}>
                                            <Text style={{ color: colors.mutedText, marginRight: 4 }}>{dev.batteryLevel || 85}%</Text>
                                            <Ionicons name="battery-full" size={18} color={colors.success} />
                                        </View>
                                    }
                                />
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No devices connected</Text>
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={[styles.sectionHeader, { color: colors.mutedText }]}>NEARBY DEVICES</Text>
                        {isScanning && <ActivityIndicator size="small" color={colors.mutedText} />}
                    </View>
                    <View style={[styles.card, { backgroundColor: colors.card }]}>
                        {discoveredDevices.length > 0 ? (
                            discoveredDevices.map((dev, idx) => (
                                <ListItem
                                    key={dev.id}
                                    title={dev.name}
                                    subtitle={`Signal strength: ${dev.rssi} dBm`}
                                    icon="bluetooth"
                                    color={colors.primary}
                                    isLast={idx === discoveredDevices.length - 1}
                                    onPress={() => handleConnect(dev)}
                                    rightElement={
                                        connecting === dev.id ?
                                            <ActivityIndicator size="small" color={colors.primary} /> :
                                            <Text style={{ color: colors.primary, fontWeight: '600' }}>Pair</Text>
                                    }
                                />
                            ))
                        ) : (
                            <TouchableOpacity style={styles.scanButton} onPress={() => setIsScanning(true)} disabled={isScanning}>
                                <Ionicons name="search" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                                <Text style={{ color: colors.primary, fontSize: 17, fontWeight: '500' }}>
                                    {isScanning ? "Scanning..." : "Scan for Devices"}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={styles.footerText}>
                        Ensure your device is turned on and in pairing mode. ElderConnect uses Bluetooth Low Energy for privacy and battery efficiency.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
    closeButton: { alignSelf: 'flex-end', paddingBottom: 10 },
    largeTitle: { fontSize: 34, fontWeight: 'bold', letterSpacing: -0.5 },
    section: { marginTop: 25, paddingHorizontal: 20 },
    sectionHeader: { fontSize: 13, fontWeight: '400', marginBottom: 8, marginLeft: 16 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16 },
    card: { borderRadius: 12, overflow: 'hidden' },
    listItem: { flexDirection: 'row', alignItems: 'center', padding: 12, marginLeft: 16, paddingLeft: 0 },
    listIcon: { width: 30, height: 30, borderRadius: 7, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    listContent: { flex: 1 },
    listTitle: { fontSize: 17, fontWeight: '400' },
    listSubtitle: { fontSize: 13, marginTop: 1 },
    batteryRow: { flexDirection: 'row', alignItems: 'center' },
    emptyText: { padding: 20, textAlign: 'center', color: '#8E8E93', fontSize: 15 },
    scanButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15 },
    footerText: { color: '#8E8E93', fontSize: 13, paddingHorizontal: 16, marginTop: 10, lineHeight: 18 },
});
