import { Platform } from 'react-native';

export interface TranscriptionResult {
    success: boolean;
    text?: string;
    error?: string;
}

export const SpeechToTextService = {
    /**
     * Transcribes audio from a URI.
     * We now route all transcriptions through our backend Whisper bridge (via Hugging Face or OpenAI).
     * This is more reliable than the browser-native Web Speech API for processing recorded files.
     */
    async transcribe(audioUri: string): Promise<TranscriptionResult> {
        console.log(`[STT Service] Starting transcription for URI: ${audioUri}`);
        return SpeechToTextService.transcribeViaBackend(audioUri);
    },

    /**
     * Sends audio to the backend Whisper endpoint.
     * Target Architecture: "Whisper via your backend"
     */
    async transcribeViaBackend(audioUri: string): Promise<TranscriptionResult> {
        try {
            const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
            if (!baseUrl) {
                return { success: false, error: "API_BASE_URL not configured" };
            }

            const backendUrl = `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}/voice/transcribe`;
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
                let errorMessage = `Speech processing error (${response.status})`;
                try {
                    const errorBody = JSON.parse(errorText);
                    if (typeof errorBody?.message === 'string') {
                        errorMessage = errorBody.message;
                    } else if (Array.isArray(errorBody?.message)) {
                        errorMessage = errorBody.message[0] ?? errorMessage;
                    } else if (typeof errorBody?.error === 'string') {
                        errorMessage = errorBody.error;
                    }
                } catch {
                    if (errorText && errorText.length < 200 && !errorText.startsWith('<!')) {
                        errorMessage = errorText;
                    }
                }
                console.error(`[STT Service] Backend failed (${response.status}):`, errorMessage);
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log(`[STT Service] Transcription success: "${data.text}"`);
            return { success: true, text: data.text };
        } catch (error) {
            console.error('[STT Service] Backend Error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Voice processing failed."
            };
        }
    }
};
