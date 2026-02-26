import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Detect host for local n8n development
const getHostIP = () => {
    const debuggerHost = Constants.expoConfig?.hostUri;
    return debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
};

const host = getHostIP();

// Helper to replace localhost with dynamic host IP for mobile devices
const getUrl = (envUrl: string | undefined) => {
    if (!envUrl) return '';
    return envUrl.replace('localhost', host).replace('127.0.0.1', host);
};

const N8N_VOICE_WEBHOOK = getUrl(process.env.EXPO_PUBLIC_N8N_VOICE_WEBHOOK);
const N8N_REPORT_WEBHOOK = getUrl(process.env.EXPO_PUBLIC_N8N_REPORT_WEBHOOK);

export const N8NService = {

    /**
     * Sends the full health report data to n8n for processing and WhatsApp delivery
     * @param userData User profile data containing contacts
     * @param scores Current health scores (Physical, Mental, etc.)
     * @param vitals Array of recent vital signs
     * @param dailyTip A generated tip string based on health data
     */
    async sendHealthReport(userData: any, scores: any, vitals: any[], dailyTip: string) {
        try {
            if (!userData || !userData.emergencyContacts || userData.emergencyContacts.length === 0) {
                throw new Error("No contact information available");
            }

            const payload = {
                timestamp: new Date().toISOString(),
                user: {
                    name: userData.name,
                    age: userData.age,
                    phone: userData.phone || "Not specified"
                },
                caregiver: {
                    name: userData.emergencyContacts[0].name,
                    phone: userData.emergencyContacts[0].phone,
                    relation: userData.emergencyContacts[0].relation
                },
                health_summary: {
                    overall_score: calculateOverallScore(scores),
                    scores: scores,
                    latest_vitals: vitals.length > 0 ? vitals[0] : null
                },
                daily_advice: dailyTip || "Stay active and hydrated!",
                meta: {
                    app_version: "1.0.0",
                    source: "ElderConnect_App"
                },
                action: "SEND_WHATSAPP_REPORT"
            };

            console.log("[N8N Service] Sending payload:", JSON.stringify(payload, null, 2));

            if (N8N_REPORT_WEBHOOK.includes("your-n8n-instance")) {
                console.log("[N8N Service] Simulation Mode: No real URL configured.");
                await new Promise(r => setTimeout(r, 1000));
                return { success: true, message: "Simulation: Report Sent Successfully" };
            }

            const internalKey = process.env.EXPO_PUBLIC_INTERNAL_API_KEY || "";

            const response = await fetch(N8N_REPORT_WEBHOOK, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': internalKey
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`n8n Webhook failed with status: ${response.status}`);
            }

            const result = await response.text();
            return { success: true, message: result };

        } catch (error) {
            console.error("[N8N Service] Error:", error);
            return { success: false, error: error };
        }
    },

    /**
     * Sends a reminder alert to n8n.
     * n8n can then schedule a secondary notification (e.g., WhatsApp to family)
     * @param userData User profile
     * @param reminder Reminder details
     */
    async sendReminderAlert(userData: any, reminder: any) {
        try {
            const payload = {
                action: "SCHEDULE_EXTERNAL_REMINDER",
                timestamp: new Date().toISOString(),
                user: {
                    name: userData?.name || "Elder",
                    email: userData?.email
                },
                reminder: {
                    title: reminder.title,
                    type: reminder.type,
                    scheduledTime: reminder.date,
                    message: `Reminder for ${userData?.name}: ${reminder.title} at ${new Date(reminder.date).toLocaleTimeString()}`
                },
                contacts: userData?.emergencyContacts || []
            };

            const internalKey = process.env.EXPO_PUBLIC_INTERNAL_API_KEY || "";

            const response = await fetch(N8N_REPORT_WEBHOOK, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': internalKey
                },
                body: JSON.stringify(payload)
            });

            return response.ok;
        } catch (error) {
            console.error("[N8N Service] Reminder Error:", error);
            return false;
        }
    },

    /**
     * Sends a text transcript to the backend for intent parsing.
     * Moved to VoiceAssistantService for cleaner architecture, but kept here for backward compatibility if needed.
     */
    async sendTextCommand(transcript: string, userContext: any) {
        // Redirection to the new service or original n8n code handling
        try {
            const jwt = await AsyncStorage.getItem("auth_token");

            const payload = {
                action: 'PROCESS_TEXT_COMMAND',
                text: transcript,
                jwt: jwt,
                userContext: {
                    userId: userContext.userId,
                    name: userContext.name,
                    timestamp: new Date().toISOString()
                },
                meta: {
                    source: "ElderConnect_App",
                    platform: Platform.OS
                }
            };

            const internalKey = process.env.EXPO_PUBLIC_INTERNAL_API_KEY || "";

            const response = await fetch(N8N_VOICE_WEBHOOK, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'x-api-key': internalKey
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`n8n text command failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("[N8N Service] Text Command Error:", error);
            return { success: false, error: "Failed to reach n8n/backend" };
        }
    }
};

const calculateOverallScore = (scores: any) => {
    const values = Object.values(scores) as number[];
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return Math.round(sum / values.length);
};
