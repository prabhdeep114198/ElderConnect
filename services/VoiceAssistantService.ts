import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_BASE_URL, DEVICE_API_KEY } from './api/config';

export const VoiceAssistantService = {
    /**
     * Sends a text transcript to the NestJS backend for intent parsing and action triggering.
     * This replaces the previous n8n workflow.
     * @param transcript The transcribed text from the voice command
     * @param userContext Information about the current user
     * @param isConfirmation Whether this is confirming a pending action
     * @param pendingIntent The intent state to execute if confirming
     */
    async processCommand(transcript: string, userContext: { userId: string; name?: string }, isConfirmation?: boolean, pendingIntent?: any) {
        try {
            // Get the JWT to include in the payload so the backend can call protected endpoints
            const jwt = await AsyncStorage.getItem("auth_token");

            const payload = {
                text: transcript,
                jwt: jwt || "no-token-available",
                isConfirmation: isConfirmation || false,
                pendingIntent: pendingIntent || null,
                userContext: {
                    userId: userContext.userId,
                    name: userContext.name,
                    timestamp: new Date().toISOString()
                }
            };

            const backendUrl = `${API_BASE_URL}/v1/voice-assistant/process-public`;
            console.log(`[VoiceAssistantService] Sending to backend: ${backendUrl}`);

            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'x-api-key': DEVICE_API_KEY
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData?.message || `Backend request failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("[VoiceAssistantService] Error:", error);
            throw error;
        }
    }
};
