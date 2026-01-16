# n8n Integration Guide for ElderConnect

This guide explains how to set up the n8n backend to handle automated health reports sent from the ElderConnect app.

## 🏗️ Architecture Overview

1.  **Mobile App**: Collects health data (scores, vitals, profile) and sends a JSON payload via HTTP POST.
2.  **n8n Webhook**: Receives the data.
3.  **n8n Workflow**:
    *   Formats the message.
    *   Sends a WhatsApp message to the Caregiver.
    *   (Optional) Sends a copy to the User.
    *   (Optional) Logs the report to a Google Sheet or Database.

---

## 🚀 Setting up n8n

### Step 1: Create a New Workflow
1.  Open your n8n dashboard (cloud or self-hosted).
2.  Click **"Add Workflow"**.
3.  Name it: `ElderConnect Reports`.

### Step 2: Add trigger Node (Webhook)
1.  Add a **Webhook** node.
2.  Set **HTTP Method** to `POST`.
3.  Set **Path** to `elder-connect-report`.
4.  Copy the **Production URL** (e.g., `https://your-n8n.com/webhook/elder-connect-report`).
5.  **Important**: Update `services/N8NService.ts` in the app with this URL.

### Step 3: Add Processing Logic (Function Node)
(Optional) You can use a "Code" node to format the message nicely.

**Javascript Code:**
```javascript
const data = items[0].json;
const summary = data.health_summary;
const user = data.user;

const message = `
🏥 *ElderConnect Health Report*
👤 *User:* ${user.name}
📅 *Date:* ${new Date().toLocaleDateString()}

📊 *Overall Score:* ${summary.overall_score}/100

🏃 *Physical:* ${summary.scores.physical}
🧠 *Mental:* ${summary.scores.mental}
😴 *Sleep:* ${summary.scores.sleep}

💡 *Daily Tip:* ${data.daily_advice}

_Sent automatically via ElderConnect Automation_
`;

return [{ json: { message, phone: data.caregiver.phone } }];
```

### Step 4: Add WhatsApp Node
1.  Add a **WhatsApp Business Cloud** node (or Twilio/Telegram).
2.  **Credentials**: Connect your Meta/Facebook developer account.
3.  **Resource**: `Message`.
4.  **Operation**: `Send Template` (recommended) or `Send Text`.
5.  **Phone Number**: Map this from the previous node (`{{json.caregiver.phone}}`).
6.  **Text Body**: Map this from the formatted message (`{{json.message}}`).

---

## 📱 Testing the Integration

1.  Open the ElderConnect App.
2.  Go to the **Reports** tab.
3.  Tap **"Share Summary on WhatsApp"**.
4.  Check your n8n execution log to see the incoming data.
5.  Verify the WhatsApp message is delivered.

## 🔮 Future Automations

Since you now have n8n connected, you can add:

*   **Emergency Alerts**: Trigger a different webhook `elder-connect-alert` when a user falls or presses SOS.
*   **Medication Reminders**: Use n8n "active workflow" (Cron) to push notifications to the app (requires push notification service like Expo Push API).
*   **Doctor Summaries**: Once a month, generate a PDF in n8n and email it to a doctor using the Gmail node.
