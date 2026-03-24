import { Platform } from 'react-native';
import { API_BASE_URL } from './api/config';

// Groq: blazing fast Whisper inference (~1-2s), completely free tier
// Get your key at: https://console.groq.com
const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';


export interface TranscriptionResult {
    success: boolean;
    text?: string;
    error?: string;
}

export const SpeechToTextService = {
    /**
     * PRIMARY: Groq Whisper (~1-2 seconds, no cold starts, free)
     * FALLBACK: Hugging Face → Backend
     */
    async transcribe(audioUri: string): Promise<TranscriptionResult> {
        console.log(`[STT Service] Transcribing: ${audioUri}`);

        const groqToken = process.env.EXPO_PUBLIC_GROQ_API_KEY;
        if (groqToken && groqToken !== 'YOUR_GROQ_API_KEY_HERE') {
            try {
                const result = await SpeechToTextService.transcribeViaGroq(audioUri, groqToken);
                if (result.success) return result;
                console.warn('[STT Service] Groq failed, trying HF...', result.error);
            } catch (err) {
                console.warn('[STT Service] Groq error, trying HF...', err);
            }
        } else {
            console.warn('[STT Service] No Groq key — add EXPO_PUBLIC_GROQ_API_KEY to .env from console.groq.com');
        }



        // Final fallback: backend
        return SpeechToTextService.transcribeViaBackend(audioUri);
    },

    /**
     * Groq Whisper — uses multipart/form-data (works natively on iOS without blob issues)
     * Typical response time: 1-3 seconds even on first call. Zero cold starts.
     */
    async transcribeViaGroq(audioUri: string, token: string): Promise<TranscriptionResult> {
        console.log('[STT Service] Using Groq Whisper...');

        const formData = new FormData();
        const filePayload: any = Platform.OS === 'web' && audioUri.startsWith('blob:')
            ? await (async () => {
                const r = await fetch(audioUri);
                const blob = await r.blob();
                return new File([blob], 'audio.m4a', { type: 'audio/m4a' });
            })()
            : { uri: audioUri, name: 'audio.m4a', type: 'audio/m4a' };

        // @ts-ignore
        formData.append('file', filePayload);
        formData.append('model', 'whisper-large-v3');
        formData.append('response_format', 'json');
        formData.append('language', 'en');

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                // Do NOT set Content-Type manually — React Native sets it with boundary automatically
            },
            body: formData,
        });

        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            console.error('[STT Service] Groq error:', response.status, errText);
            return { success: false, error: `Groq error ${response.status}` };
        }

        const data = await response.json();
        const text = data?.text?.trim();
        if (text) {
            console.log('[STT Service] Groq result:', text);
            return { success: true, text };
        }

        return { success: false, error: 'No text from Groq' };
    },



    /**
     * Backend fallback — Azure NestJS → Hugging Face
     */
    async transcribeViaBackend(audioUri: string): Promise<TranscriptionResult> {
        try {
            const backendUrl = `${API_BASE_URL}/voice/transcribe`;
            console.log(`[STT Service] Calling backend: ${backendUrl}`);

            const formData = new FormData();
            const fileToUpload: any = Platform.OS === 'web' && audioUri.startsWith('blob:')
                ? await (async () => {
                    const r = await fetch(audioUri);
                    const blob = await r.blob();
                    return new File([blob], 'voice.m4a', { type: 'audio/m4a' });
                })()
                : { uri: audioUri, name: 'voice_command.m4a', type: 'audio/m4a' };

            // @ts-ignore
            formData.append('file', fileToUpload);

            const response = await fetch(backendUrl, {
                method: 'POST',
                body: formData,
                headers: { Accept: 'application/json' },
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
            console.error('[STT Service] Backend Error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Voice processing failed.',
            };
        }
    },
};
