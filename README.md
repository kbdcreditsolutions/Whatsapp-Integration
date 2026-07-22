# Interakt WhatsApp SaaS Integration

This repository provides a foundational setup for integrating the Interakt WhatsApp API natively into your SaaS application. It uses a **Hybrid Approach**: 
- **Outbound (Programmatic):** Your SaaS handles triggering template campaigns (e.g., Order Updates, Abandoned Cart).
- **Inbound (Manual):** Human agents use the Interakt Shared Inbox to read and reply to messages.

## Structure

- `/backend`: A Node.js/Express server that acts as a secure proxy for the Interakt API. It hides your API keys and handles incoming webhooks.
- `/frontend`: A React application that provides a reusable, embeddable widget (`WhatsAppCampaignWidget.jsx`) for triggering campaigns from within your SaaS dashboard.

## 1. Backend Setup

1. Navigate to the `backend` directory.
2. Run `npm install`
3. Copy `.env.example` to `.env` and add your Interakt Base64 API Key.
4. Run `node index.js` (Server runs on port 3001)

### API Endpoints
- `POST /api/interakt/track/users`: Sync a user from your SaaS to Interakt.
- `POST /api/interakt/message`: Trigger a WhatsApp template message.
- `POST /api/webhooks/interakt`: Endpoint to receive delivery status (Sent, Read, Delivered) from Interakt.

## 2. Frontend Setup

1. Navigate to the `frontend` directory.
2. Run `npm install`
3. Run `npm run dev` to start the Vite server.

### Reusable Widget
The core UI is located at `frontend/src/components/WhatsAppCampaignWidget.jsx`.
You can copy this component and its Tailwind styling into any React-based SaaS project to instantly give your users the ability to trigger WhatsApp templates.

## Webhooks
To use the webhook functionality, you must expose your backend to the internet (e.g., using `ngrok` for local development) and configure the webhook URL in the Interakt Developer Settings pointing to `https://your-domain.com/api/webhooks/interakt`.
