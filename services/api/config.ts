import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Detect the environment and set the appropriate base URL
 * - iOS Simulator: localhost
 * - Android Emulator: 10.0.2.2
 * - Physical Device: Detected from Expo hostUri or fallback to your local IP
 */
const getDevUrl = () => {
    // 1. Priority: Explicit Environment Variable
    if (process.env.EXPO_PUBLIC_API_BASE_URL) {
        return process.env.EXPO_PUBLIC_API_BASE_URL;
    }

    // 2. Discover the host IP from Expo's Metro server
    // This is the most reliable way to connect a physical phone to your Mac
    const debuggerHost = Constants.expoConfig?.hostUri;
    const hostIP = debuggerHost ? debuggerHost.split(':')[0] : null;

    if (hostIP) {
        return `http://${hostIP}:3000/api`;
    }

    // 3. Fallbacks for simulators when hostIP detection fails
    return Platform.select({
        ios: 'http://localhost:3000/api',
        android: 'http://10.0.2.2:3000/api',
        default: 'http://localhost:3000/api',
    });
};

const DEV_API_URL = getDevUrl();

// You can replace this with your production URL when ready
const PROD_API_URL = 'http://192.168.1.6:3000/api';

export const API_BASE_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

export const API_TIMEOUT = 10000; // 10 seconds

export const DEVICE_API_KEY = 'dev-device-key-123';