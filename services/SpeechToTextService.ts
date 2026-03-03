import { Platform } from 'react-native';
import { API_BASE_URL } from './api/config';

const HF_API_URL = `https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3`;
export interface TranscriptionResult {
    success: boolean;
    text?: string;
    error?: string;
}

export const SpeechToTextService = {
    /**
     * Transcribes audio from a URI directly via Hugging Face Inference API.
     * This moves the STT logic to the frontend as requested.
     */
    async transcribe(audioUri: string): Promise<TranscriptionResult> {
        console.log(`[STT Service] Starting frontend transcription for URI: ${audioUri}`);

        try {
            const hfToken = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY;
            if (!hfToken) {
                console.warn("[STT Service] No HF token found, falling back to backend");
                return SpeechToTextService.transcribeViaBackend(audioUri);
            }

            // 1. Get the audio data as a Blob
            // On mobile, fetch(uri) works for local file URIs in many Expo versions
            const response = await fetch(audioUri);
            const audioBlob = await response.blob();

            // 2. Call Hugging Face
            console.log(`[STT Service] Calling Hugging Face: ${HF_API_URL}`);
            const hfResponse = await fetch(HF_API_URL, {
                headers: {
                    Authorization: `Bearer ${hfToken}`,
                    "Content-Type": audioBlob.type || "audio/m4a",
                },
                method: "POST",
                body: audioBlob,
            });

            if (!hfResponse.ok) {
                const errorData = await hfResponse.json().catch(() => ({}));
                console.error("[STT Service] HF API Error:", hfResponse.status, errorData);

                // If HF is warming up (503), we might want to tell the user
                if (hfResponse.status === 503) {
                    return { success: false, error: "AI model is warming up. Please try again in 20 seconds." };
                }

                throw new Error(errorData.error || `HF API Error ${hfResponse.status}`);
            }

            const result = await hfResponse.json();
            console.log("[STT Service] HF Result:", result);

            if (result && result.text) {
                return { success: true, text: result.text };
            }

            return { success: false, error: "No text returned from transcription service." };

        } catch (error) {
            console.error('[STT Service] Frontend STT Error:', error);
            // Fallback to backend if frontend fails
            console.log("[STT Service] Falling back to backend transcription...");
            return SpeechToTextService.transcribeViaBackend(audioUri);
        }
    },

    /**
     * Sends audio to the backend Whisper endpoint (Fallback).
     */
    async transcribeViaBackend(audioUri: string): Promise<TranscriptionResult> {
        try {
            const backendUrl = `${API_BASE_URL}/voice/transcribe`;
            console.log(`[STT Service] Calling backend: ${backendUrl}`);

            const formData = new FormData();

            // Handle Web blob URLs
            let fileToUpload: any;
            if (Platform.OS === 'web' && audioUri.startsWith('blob:')) {
                const response = await fetch(audioUri);
                const blob = await response.blob();
                fileToUpload = new File([blob], 'voice.m4a', { type: 'audio/m4a' });
            } else {
                fileToUpload = {
                    uri: audioUri,
                    name: 'voice_command.m4a',
                    type: 'audio/m4a',
                };
            }

            // @ts-ignore
            formData.append('file', fileToUpload);

            const response = await fetch(backendUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Backend STT error (${response.status})`;
                try {
                    const errorBody = JSON.parse(errorText);
                    errorMessage = errorBody?.message || errorBody?.error || errorMessage;
                } catch { /* ignore */ }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            return { success: true, text: data.text };
        } catch (error) {
            console.error('[STT Service] Backend Fallback Error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Voice processing failed."
            };
        }
    }
};

