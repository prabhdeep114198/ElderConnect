import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useCallback } from 'react';

// ── Route map: destination keyword → expo-router path ────────────────────────
const ROUTE_MAP: Record<string, string> = {
    'home': '/(tabs)/home',
    'dashboard': '/(tabs)/home',
    'main': '/(tabs)/home',
    'profile': '/(tabs)/profile',
    'my profile': '/(tabs)/profile',
    'health': '/(tabs)/health',
    'analytics': '/(tabs)/analytics',
    'settings': '/settings',
    'fall risk': '/fall-risk',
    'fall-risk': '/fall-risk',
    'fall risk dashboard': '/fall-risk',
    'my risk': '/fall-risk',
    'reminders': '/reminders',
    'my reminders': '/reminders',
    'events': '/events',
    'social events': '/events',
    'music': '/music',
    'play music': '/music',
    'chatbot': '/chatbot',
    'chat': '/chatbot',
    'ai assistant': '/chatbot',
    'video call': '/videocall',
    'call family': '/videocall',
    'call': '/videocall',
};

// ── Emergency keywords ────────────────────────────────────────────────────────
const EMERGENCY_KEYWORDS = [
    'help me', 'emergency', 'i fell', 'i have fallen', 'call for help',
    'call 911', 'call ambulance', 'sos', 'send help', 'i need help', 'i am hurt',
];

// ── Navigation trigger phrases ────────────────────────────────────────────────
const NAV_TRIGGERS = [
    'go to', 'open', 'show me', 'take me to', 'navigate to',
    'switch to', 'launch', 'bring up',
];

/**
 * detectLocalIntent
 * Fast, offline keyword-based intent detection.
 * Runs BEFORE sending to the AI backend — catches navigation & SOS instantly.
 * Returns null if no local intent detected (→ fall through to AI).
 */
export function detectLocalIntent(transcript: string): { action: string; destination?: string; message?: string } | null {
    const text = transcript.toLowerCase().trim();

    // 1. Emergency keywords (highest priority)
    if (EMERGENCY_KEYWORDS.some(kw => text.includes(kw))) {
        return { action: 'EMERGENCY_SOS', message: 'Initiating emergency SOS. Stay calm, help is on the way.' };
    }

    // 2. Direct destination match (e.g. "fall risk" said alone)
    for (const [dest] of Object.entries(ROUTE_MAP)) {
        if (text === dest || text === `go to ${dest}` || text === `open ${dest}`) {
            return { action: 'NAVIGATE', destination: dest };
        }
    }

    // 3. Navigation trigger + destination
    for (const trigger of NAV_TRIGGERS) {
        if (text.startsWith(trigger) || text.includes(` ${trigger} `)) {
            const afterTrigger = text.replace(new RegExp(`.*${trigger}\\s*`), '').trim();
            for (const [dest] of Object.entries(ROUTE_MAP)) {
                if (afterTrigger === dest || afterTrigger.includes(dest)) {
                    return { action: 'NAVIGATE', destination: dest };
                }
            }
        }
    }

    // 4. Partial destination match (e.g. "fall risk" anywhere in text)
    for (const [dest] of Object.entries(ROUTE_MAP)) {
        if (text.includes(dest) && dest.length > 4) { // avoid short false positives
            const hasNavContext = NAV_TRIGGERS.some(t => text.includes(t)) || text.includes('show') || text.includes('see');
            if (hasNavContext) {
                return { action: 'NAVIGATE', destination: dest };
            }
        }
    }

    return null; // No local intent → let AI handle it
}

/**
 * useVoiceNavigation
 * Handles the "last mile" of voice commands — turning parsed AI intents
 * into real app navigation, SOS alerts, or spoken confirmations.
 */
export function useVoiceNavigation() {
    const router = useRouter();

    const speak = useCallback((text: string) => {
        Speech.stop();
        Speech.speak(text, {
            language: 'en-US',
            pitch: 1.0,
            rate: 0.9,
        });
    }, []);

    /**
     * Execute a local detected intent immediately (no backend needed).
     * Returns message string or null if no route found.
     */
    const executeLocalIntent = useCallback((intent: { action: string; destination?: string; message?: string }): string => {
        if (intent.action === 'EMERGENCY_SOS') {
            setTimeout(() => router.push('/fall-detected' as any), 200);
            const msg = intent.message || 'Initiating emergency SOS. Help is on the way.';
            speak(msg);
            return msg;
        }

        if (intent.action === 'NAVIGATE' && intent.destination) {
            const route = ROUTE_MAP[intent.destination];
            if (route) {
                const msg = `Opening ${intent.destination}.`;
                setTimeout(() => router.push(route as any), 200);
                speak(msg);
                return msg;
            }
        }

        return '';
    }, [router, speak]);

    /**
     * Handle a fully processed voice assistant response from the backend.
     * Returns a string to display in the UI bubble.
     */
    const handleVoiceResponse = useCallback((response: any): string => {
        if (!response) return "Sorry, I didn't catch that.";

        const action = (response.action || response.typeOfRequest || '').toUpperCase();
        const message = response.message || '';

        console.log(`[VoiceNav] Handling response action: ${action}`, response.data);

        // ── Navigation intents ──────────────────────────────────────────
        if (action === 'NAVIGATE') {
            const dest = (response.data?.destination || '').toLowerCase();
            const route = ROUTE_MAP[dest];
            if (route) {
                setTimeout(() => router.push(route as any), 300);
                const msg = message || `Opening ${dest}.`;
                speak(msg);
                return msg;
            }
            // Try partial match
            for (const [key, path] of Object.entries(ROUTE_MAP)) {
                if (dest.includes(key) || key.includes(dest)) {
                    setTimeout(() => router.push(path as any), 300);
                    const msg = message || `Opening ${key}.`;
                    speak(msg);
                    return msg;
                }
            }
            speak("I'm not sure which screen to open. Try saying 'open fall risk' or 'open profile'.");
            return "I'm not sure which screen to open.";
        }

        // ── SOS / Emergency ──────────────────────────────────────────────
        if (action === 'EMERGENCY_SOS') {
            setTimeout(() => router.push('/fall-detected' as any), 300);
            const msg = message || "Initiating emergency SOS. Stay calm, help is on the way.";
            speak(msg);
            return msg;
        }

        // ── All other handled intents (backend confirmed these) ──────────
        if (message) speak(message);
        return message || "Done.";
    }, [router, speak]);

    return { handleVoiceResponse, executeLocalIntent, speak };
}

