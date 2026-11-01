# QueueCare — Clinic Virtual Queue System

A real-time, receptionist-free virtual waiting room for clinics. Patients scan a QR code to join the queue from their phone, receive live WhatsApp updates as their turn approaches, and see their live queue position on a mobile-friendly dashboard. Doctors manage the queue from a secure, OTP-protected dashboard.

---

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Local Development](#local-development)
4. [Environment Variables](#environment-variables)
5. [WhatsApp API Setup (Meta Business)](#whatsapp-api-setup-meta-business)
6. [WhatsApp Message Templates](#whatsapp-message-templates)
7. [Doctor Access Setup](#doctor-access-setup)
8. [Deployment](#deployment)
9. [Queue Behavior and Business Rules](#queue-behavior-and-business-rules)
10. [Tech Stack](#tech-stack)
11. [Project Structure](#project-structure)

---

## Features

- **Patient QR Code** — Patients scan and join the queue by entering their mobile number only. No app required.
- **Live Queue Position** — Patients see their token, current serving number, patients ahead/behind, and estimated wait — updated live via WebSocket.
- **WhatsApp Notifications** — Automatic alerts sent at 10, 5, 3, 1 patient ahead and when called.
- **Doctor Dashboard** — OTP-protected, shows live queue, call/skip/recall controls, QR codes, and activity feed.
- **Real-time Updates** — Doctor and patient dashboards stay in sync via WebSocket broadcast.
- **Privacy-first** — Patient phone numbers and names are never exposed to other patients.
- **Family Tokens** — One phone can hold up to 2 active tokens, with a 5-minute server-enforced cooldown.

---

## Architecture

```
Node.js Server  (src/server.js — port 8787)
  REST API   /api/join
             /api/auth/request
             /api/auth/verify
             /api/action/next|skip|recall|stop|end
             /api/state  /api/config  /api/demo/reset
  WebSocket  /ws  (real-time broadcast to all clients)
  Static     /dist (built React app)
        |
        | WhatsApp Cloud API (graph.facebook.com)
        v
   Meta Business — approved message templates
```

- **Frontend** — React + JavaScript (JSX), built by Vite, served as static files from `/dist` by the same Node server.
- **Backend** — Plain Node.js HTTP server (no framework). Queue state is held in memory for the session.
- **Real-time** — WebSocket server pushes state updates to all connected clients on every queue change.

---

## Local Development

### Prerequisites

- Node.js 22.12+
- npm 10+

### Setup

```bash
# 1. Install dependencies
npm ci

# 2. Copy environment file
cp .env.example .env
# Edit .env as needed (see Environment Variables section)

# 3. Start dev server (API + Vite HMR together)
npm run dev
```

The server loads the optional `.env` automatically. Exported environment variables take precedence. The frontend build uses JavaScript directly; there is no TypeScript compilation step. Tailwind v4 theme tokens live in `src/index.css`; the unused legacy Tailwind configuration was removed.

The dev server starts at:

| Service | URL |
|---------|-----|
| UI (Vite) | http://localhost:5173 |
| API | http://localhost:8787 |

### Key URLs

| URL | Description |
|-----|-------------|
| `http://localhost:5173` | Home page |
| `http://localhost:5173/?join=clinic-demo` | Patient join page |
| `http://localhost:5173/?doctor=1` | Doctor login |

### Doctor login (dev)

| Field | Value |
|-------|-------|
| Mobile number | `+919999000000` |
| OTP | `123456` (also printed in API terminal) |

### Build and serve

```bash
npm run build
npm run server
```

Open `http://localhost:8787`. `npm start` runs both commands. `npm run preview` previews the built UI through Vite; the API server must also be running.

### Run tests

```bash
npm test
```

All 15 tests cover queue logic, notification retries, family token rules, API authentication and privacy, session expiry, demo reset, and client error handling.

---

## Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

| Variable | Default | Required in prod | Description |
|----------|---------|-----------------|-------------|
| `PORT` | `8787` | No | HTTP port the server listens on |
| `CLINIC_ID` | `clinic-demo` | No | ID used in patient QR join URL |
| `CLINIC_NAME` | `Aster Lane Clinic` | No | Display name shown to patients |
| `DOCTOR_PHONES` | `+919999000000` (dev only) | **Yes** | Comma-separated authorized doctor phone numbers |
| `DOCTOR_SESSION_TTL_MS` | `43200000` | No | Doctor session lifetime in ms (default = 12 hours) |
| `WHATSAPP_PHONE_NUMBER_ID` | *(empty)* | **Yes** | Meta WhatsApp Business phone number ID |
| `WHATSAPP_ACCESS_TOKEN` | *(empty)* | **Yes** | Meta WhatsApp API permanent access token |
| `PUBLIC_APP_URL` | *(auto-detected LAN IP)* | Recommended | Public HTTPS URL for QR codes (e.g. your Render URL) |

> Without WhatsApp credentials the server uses an in-memory mock — queue logic works fully but no real messages are sent.

---

## WhatsApp API Setup (Meta Business)

### Step 1 — Create a Meta Business Account

1. Go to https://business.facebook.com and create a Business Account.
2. Navigate to Meta for Developers: https://developers.facebook.com
3. Create a new App, choose **Business** type.

### Step 2 — Add WhatsApp Product

1. In your app dashboard click **Add Product** → **WhatsApp** → **Set Up**.
2. You get a **Test Phone Number** to start (free, 1,000 free service conversations/month).
3. Copy your **Phone Number ID** shown in the API setup panel — this is `WHATSAPP_PHONE_NUMBER_ID`.

### Step 3 — Get a Permanent Access Token

> Tokens shown in the "Temporary access token" section expire in 24 hours. Use a System User token for production.

1. In Meta Business Settings go to **System Users**.
2. Create a **System User** with Admin role.
3. Click **Generate Token** → select your app → enable these permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
4. Copy the token — this is `WHATSAPP_ACCESS_TOKEN`.

### Step 4 — Verify Recipient Numbers (Test mode)

In test mode you can only send to verified numbers:
1. Go to **WhatsApp → API Setup** in your app.
2. Under "To", click **Add phone number** and verify the patient's number via OTP.

### Step 5 — Set Environment Variables

```env
WHATSAPP_PHONE_NUMBER_ID=1234567890123456
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxx...
```

---

## WhatsApp Message Templates

You must create **5 message templates** in Meta Business and get them approved before production notifications work.

Go to: **Meta Business Suite → WhatsApp → Message Templates → Create Template**

| Template Name | When sent | Message body |
|---------------|-----------|-------------|
| `queue_ten_ahead` | 10 patients ahead | Approximately 10 people are ahead of you. |
| `queue_five_ahead` | 5 patients ahead | Your turn is approaching. There are approximately 5 patients ahead of you. Please be ready. |
| `queue_three_ahead` | 3 patients ahead | Approximately 3 people are ahead of you. |
| `queue_you_are_next` | 1 patient ahead | You are next. Please be ready. |
| `queue_token_called` | Token called by doctor | Your token is called. Please proceed to the doctor. |

### Template settings for each

1. **Category** → `UTILITY`
2. **Language** → `English (en_US)`
3. **Header** → None (or static clinic name text)
4. **Body** → Message text from table above
5. **Footer** → None
6. Submit for review — approval typically takes a few minutes to a few hours.

> Tip: You can add `{{1}}` as a parameter in the body to include the token number (e.g. "Token A{{1}} is called"). The `meta-whatsapp.js` adapter already sends `tokenNumber` as the first body parameter.

---

## Doctor Access Setup

### Development

- Doctor number: `+919999000000`
- OTP: `123456` (printed in terminal every time a login is requested)

### Production

1. Set `DOCTOR_PHONES` to real phone numbers:
   ```env
   DOCTOR_PHONES=+919876543210,+911234567890
   ```

2. Wire a real OTP delivery provider in `src/server.js` at the marked comment:
   ```js
   // A real OTP sender must be wired here before production use. Never
   // generate a code that is merely logged or returned to the browser.
   ```
   Recommended Indian providers: **MSG91**, **Fast2SMS**, **Twilio**, **AWS SNS**.

3. In production (`NODE_ENV=production`) the server refuses to issue an OTP without a real sender — there is no fake OTP path in production.

---

## Deployment

### Option A — Render (Recommended, free tier available)

1. Push code to a GitHub repository.
2. Go to https://render.com → **New Web Service** → connect your repo.
3. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node src/server.js`
   - **Environment**: `Node`
4. Add all environment variables in the Render dashboard.
5. Set `PUBLIC_APP_URL` to your Render HTTPS URL.
6. Deploy.

### Option B — Railway

1. Push to GitHub.
2. Go to https://railway.app → **New Project** → **Deploy from GitHub**.
3. Add environment variables in the Railway dashboard.
4. Railway auto-detects `npm start` as the start command (`npm run build && node src/server.js`).

### Option C — VPS (DigitalOcean, AWS EC2, etc.)

```bash
# On your server
git clone <your-repo-url>
cd <repo>
npm install
npm run build

# Configure environment
cp .env.example .env
nano .env   # fill in all values

# Run with PM2 for auto-restart
npm install -g pm2
pm2 start src/server.js --name queuecare
pm2 save && pm2 startup
```

**Nginx reverse proxy** (enables port 80/443):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8787;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Add HTTPS with Certbot** (required for QR scanning from phones):

```bash
sudo certbot --nginx -d your-domain.com
```

### Option D — Docker

Create a `Dockerfile`:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 8787
CMD ["node", "src/server.js"]
```

Build and run:

```bash
docker build -t queuecare .

docker run -p 8787:8787 \
  -e CLINIC_NAME="My Clinic" \
  -e DOCTOR_PHONES="+919999000000" \
  -e WHATSAPP_PHONE_NUMBER_ID="123456..." \
  -e WHATSAPP_ACCESS_TOKEN="EAAxx..." \
  -e PUBLIC_APP_URL="https://your-domain.com" \
  queuecare
```

---

## Queue Behavior and Business Rules

### Token lifecycle

```
waiting → called → completed
waiting → called → skipped → waiting (recalled, moves to priority front)
```

### Notification milestones

Each patient receives exactly one WhatsApp message at each threshold (idempotent — deduplicated within the running in-memory session; state and delivery records are lost on restart):

| Milestone | Template used |
|-----------|--------------|
| 10 patients ahead | `queue_ten_ahead` |
| 5 patients ahead | `queue_five_ahead` |
| 3 patients ahead | `queue_three_ahead` |
| 1 patient ahead | `queue_you_are_next` |
| Token called | `queue_token_called` |

### Family token rules

- One phone can hold **max 2 active tokens** (`waiting` or `called`) per session.
- A second token can only be created **5 server minutes** after the first was created.
- Once a token is completed or skipped it is no longer active — a new one cannot be generated for this session.

### Doctor controls

| Action | Effect |
|--------|--------|
| **Next patient** | Current → `completed`, next waiting → `called` |
| **Call current** | Re-announces current token via browser text-to-speech |
| **Skip current** | Current → `skipped` (stays in list for recall) |
| **Recall skipped** | Skipped → `waiting` with **priority flag** (goes to front of queue) |
| **Stop new tokens** | Closes intake; existing patients remain |
| **Reset demo queue** | Authenticated doctor only; unavailable in production; starts a fresh demo session |
| **End session** | Closes session entirely |

### Security

- Patient API responses never include phone numbers or patient names.
- Doctor API responses include full details, gated behind a bearer session token.
- Doctor sessions expire after 12 hours (`DOCTOR_SESSION_TTL_MS`).
- OTP challenges expire in 5 minutes and are limited to 5 attempts per challenge.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + JavaScript (JSX) |
| Styling | Tailwind CSS v4 |
| Bundler | Vite 8 |
| Backend | Node.js ESM (no framework) |
| Real-time | `ws` WebSocket library |
| QR Codes | `qrcode` library |
| WhatsApp | Meta WhatsApp Business Cloud API v21 |
| Tests | Node.js built-in `node:test` |

---

## Project Structure

```
.
├── src/
│   ├── server.js          # HTTP + WebSocket server, all API routes
│   ├── queue.js           # Core queue state machine (ClinicQueue)
│   ├── whatsapp.js        # Notification outbox + InMemoryWhatsAppProvider
│   ├── meta-whatsapp.js   # Meta WhatsApp Cloud API adapter
│   ├── store.js           # Client-side state store (React/browser)
│   ├── App.jsx            # Full React app — Patient and Doctor UI
│   └── index.css          # Tailwind + custom design tokens
├── test/
│   ├── queue.test.js      # 8 queue and notification tests
│   ├── server.test.js     # 3 HTTP and WebSocket integration tests
│   └── store.test.js      # 4 client store regression tests
├── index.html
├── .env.example           # Environment variable template
├── package.json
├── vite.config.js
└── postcss.config.cjs     # Tailwind CSS v4 integration
```

---

## Runtime behavior and limitations

- The API is the source of truth. A disconnected browser shows a status message and never creates a local token. Live updates reconnect automatically.
- Patient join links and QR codes use the configured `CLINIC_ID`.
- Closing a token view does not cancel the server token. There is no patient cancellation endpoint.
- State, sessions, and notification records remain in memory. Restarting the server clears them; this is not persistent storage.
- Local demo OTP is `123456`; production login requires implementing a real OTP sender.
- Real WhatsApp delivery requires credentials and approved templates. Automated tests use the mock provider.

## Production Checklist

- [ ] Set `CLINIC_NAME` to your clinic name
- [ ] Set `DOCTOR_PHONES` to the doctor's real phone number
- [ ] Wire a real OTP provider in `src/server.js`
- [ ] Set `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN`
- [ ] Create and get all 5 WhatsApp message templates approved in Meta
- [ ] Set `PUBLIC_APP_URL` to your deployed HTTPS URL
- [ ] Enable HTTPS on your domain (Certbot or Render/Railway automatic SSL)
- [ ] Test full flow: patient scans QR → joins → doctor calls next → WhatsApp message received

---

*Built for clinics that deserve better than paper tokens.*
