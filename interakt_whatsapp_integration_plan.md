# Interakt WhatsApp Integration Project Plan (Hybrid Approach)

## 1. Project Overview and Objectives
**Goal:** Build a hybrid WhatsApp integration using the Interakt API. Your SaaS will programmatically trigger outbound notifications and campaigns, while human agents will use the native Interakt UI to handle inbound replies and complex customer support. 
**Note:** Any message sent programmatically via your SaaS API will be fully visible within the Interakt Shared Inbox, ensuring full context for your agents.

**Key Objectives:**
- Abstract Interakt APIs into a reusable backend service/SDK for programmatic outbound messaging.
- Build a modular, embeddable frontend widget for triggering these messages from your SaaS.
- Rely on Interakt's robust native UI for the inbound chat inbox, saving massive development time.

---

## 2. System Architecture

### 2.1 High-Level Architecture
- **Frontend (Embeddable SaaS Interface):** React/Vue components that expose UI for campaign management and triggering template messages (Outbound only).
- **Backend (Integration Layer):** Node.js server that acts as a secure proxy between the frontend and Interakt APIs.
- **Interakt Dashboard:** Used by agents for reading and replying to incoming user messages.
- **Database:** Stores SaaS tenant configurations (API keys, webhook URLs) and logs of outbound messages sent.

### 2.2 Security & Compliance
- **API Key Management:** Store Interakt API keys securely in the backend.
- **Opt-in Management:** Maintain an opt-in log in your database before triggering messages.

---

## 3. Core Features & Capabilities

### Phase 1: Foundational API & Backend Setup (Current Focus)
*Goal: Establish secure programmatic communication with Interakt.*
- **Authentication:** Setup API key management in the backend.
- **Contact Management API:** Endpoints to add users to Interakt (`/v1/public/track/users/`) to sync your SaaS users.
- **Message Sending API:** Wrapper for the `/v1/public/message/` endpoint to send templates programmatically.

### Phase 2: Notification & Campaign Engine (The "Outbound" Flow)
*Goal: Enable SaaS users to send transactional and promotional messages.*
- **Event-Driven Triggers:** (e.g., Order Placed, Abandoned Cart) tied to specific WhatsApp templates.
- **Variable Mapping:** UI component allowing SaaS users to map data fields (e.g., `{{customer_name}}`, `{{order_id}}`) to Interakt template variables.

### Phase 3: Webhooks & Delivery Status (Light Inbound)
*Goal: Keep your SaaS database updated on message status.*
- **Webhook Endpoint:** Receive delivery status (Sent, Delivered, Read) to update the status in your SaaS UI.
- *(Note: Actual chatting and reading of inbound messages will happen in the Interakt UI).*

### Phase 4: Embeddable Widget/SDK Packaging
*Goal: Make the integration easily portable to new SaaS projects.*
- **NPM Package:** Package the frontend views so they can be imported into future projects.

---

## 4. Execution Roadmap

| Milestone | Tasks | Est. Time |
| :--- | :--- | :--- |
| **M1: Backend Proxy & Auth** | Setup Node.js repo, secure API keys, create wrappers for Contacts & Message APIs. | Week 1 |
| **M2: Outbound UI Components** | Build Template Trigger UI and Variable Mapping tools for your SaaS. | Week 2 |
| **M3: Delivery Status Webhooks**| Setup webhook endpoint to log message delivery statuses. | Week 3 |
| **M4: Packaging & Docs** | Package as reusable modules and write documentation. | Week 4 |
