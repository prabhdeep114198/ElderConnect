import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Load API URL centrally from .env (fallback directly to Azure)
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://elderconnect-api-esfdawb8drara7ge.centralindia-01.azurewebsites.net/api';

export const API_TIMEOUT = 10000; // 10 seconds

export const DEVICE_API_KEY = process.env.EXPO_PUBLIC_DEVICE_API_KEY || 'dev-device-key-123';