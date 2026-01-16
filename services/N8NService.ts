// services/N8NService.ts

// 🟢 CONFIGURATION: Replace this with your actual n8n Webhook URL
// If you are testing on Android Emulator, use 'http://10.0.2.2:5678/webhook/...' 
// If specific IP, use 'http://192.168.x.x:5678/webhook/...'
// For Cloud n8n, use your https link.
const N8N_WEBHOOK_URL = "https://your-n8n-instance.com/webhook/elder-connect-report";

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

            // 1. Prepare the payload
            // This is the JSON structure that will arrive in your n8n Webhook node
            const payload = {
                timestamp: new Date().toISOString(),
                user: {
                    name: userData.name,
                    age: userData.age,
                    // In a real app, ensure phone number is stored in standard E.164 format (e.g., +1234567890)
                    phone: userData.phone || "Not specified"
                },
                caregiver: {
                    name: userData.emergencyContacts[0].name,
                    phone: userData.emergencyContacts[0].phone, // Target WhatsApp number
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
                // Action flag helps n8n 'Switch' node decide which path to take
                action: "SEND_WHATSAPP_REPORT"
            };

            console.log("🚀 [N8N Service] Sending payload:", JSON.stringify(payload, null, 2));

            // 2. Mock Request for Demo (Remove this block when you have a real URL)
            if (N8N_WEBHOOK_URL.includes("your-n8n-instance")) {
                console.log("⚠️ [N8N Service] Simulation Mode: No real URL configured.");
                await new Promise(r => setTimeout(r, 1000)); // Fake network delay
                return { success: true, message: "Simulation: Report Sent Successfully" };
            }

            // 3. Real Request to n8n Webhook
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'X-API-KEY': 'your-secure-token' // Good practice to secure webhooks
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`n8n Webhook failed with status: ${response.status}`);
            }

            const result = await response.text();
            return { success: true, message: result };

        } catch (error) {
            console.error("❌ [N8N Service] Error:", error);
            return { success: false, error: error };
        }
    }
};

// Helper: Calculate average health score
const calculateOverallScore = (scores: any) => {
    const values = Object.values(scores) as number[];
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return Math.round(sum / values.length);
};
