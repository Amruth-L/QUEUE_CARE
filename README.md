# QueueCare

QueueCare is a clinic queue management application built with **React, JavaScript, and Tailwind CSS**. Patients can join a clinic's queue from a QR code or shared link and follow their token's progress on their phone. Doctors can manage the queue from a dashboard, while a Node.js server keeps connected screens synchronized through WebSockets.

## Website

Deployment is being prepared for Render. A verified live website URL has not been assigned yet.

## What the application does

- Patients can join using a mobile number and see their token, queue position, and estimated waiting time.
- Doctors can call the next patient, skip a token, recall a skipped patient, stop new registrations, and end the session.
- The application generates clinic-specific QR codes and join links.
- Queue changes appear on connected patient and doctor screens without a page refresh.
- Public queue responses omit patient names and phone numbers. Authorized doctor sessions can access the details required to manage the queue.
- A family can hold up to two active tokens on one phone number, with a five-minute interval before requesting the second token.
- The notification engine supports WhatsApp alerts as a patient's turn approaches and when their token is called. Actual delivery requires Meta credentials and approved templates.

## Current project status

This is a working local demonstration with deployment configuration. It uses an in-memory queue, so a server restart or redeployment clears queue entries, login sessions, and notification history. Run a single server instance until shared persistent storage is implemented.

Doctor login uses a demonstration OTP during local development. **A production OTP delivery provider has not been implemented.** With `NODE_ENV=production`, the server disables demo reset and rejects OTP requests instead of exposing the development code. A hosted production instance therefore cannot complete doctor sign-in until that integration is added. Setting `DOCTOR_PHONES` alone does not enable OTP delivery.

Without WhatsApp credentials, notifications are recorded by a mock provider and no WhatsApp messages are sent. Use sample data when evaluating the project.

## Technology

| Area | Tools |
| --- | --- |
| User interface | React, JavaScript and JSX |
| Styling | Tailwind CSS v4 |
| Development and build | Vite |
| Server | Node.js HTTP server |
| Live updates | WebSockets through `ws` |
| QR codes and icons | `qrcode` and Lucide React |
| Tests | Node.js built-in test runner |
| Hosting configuration | Render Node web service |

The application does not require TypeScript. Tailwind theme settings and shared styles are defined in `src/index.css`.

## Run locally

Install Node.js 22.12 or later, then run:

```bash
npm ci
cp .env.example .env
npm run dev
```

The optional `.env` file is loaded automatically. Existing environment variables take precedence over values in that file.

| Page or service | Local address |
| --- | --- |
| Application | http://localhost:5173 |
| Patient registration | http://localhost:5173/?join=clinic-demo |
| Doctor dashboard | http://localhost:5173/?doctor=1 |
| API server | http://localhost:8787 |

For local doctor login, use `+919999000000` and OTP `123456` with the example configuration. These demonstration credentials are unavailable in production.

To serve the compiled application through the Node server:

```bash
npm run build
npm run server
```

Open http://localhost:8787. The `npm start` command also builds and starts the application. `npm run preview` previews the frontend through Vite and requires the API server to be running separately.

## Deploy on Render

Use a **Node web service** so that the frontend, API, and WebSocket connection share one origin. The included [`render.yaml`](render.yaml) defines the service configuration.

1. Push this project, including `package-lock.json` and `render.yaml`, to the `QUEUE_CARE` GitHub repository.
2. In the [Render dashboard](https://dashboard.render.com/), create a Blueprint and select that repository. Alternatively, create a Web Service with the settings below.
3. Review the free instance configuration and deploy the service.
4. Wait for a successful deployment, then open the HTTPS address shown by Render. Confirm that the home page and `/api/config` respond successfully before sharing the URL.
5. Add the verified address to the Website section of this README. For a custom domain, configure it in Render and set `PUBLIC_APP_URL` to that domain's HTTPS origin.

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Node version | 22 |
| Build command | `npm ci --include=dev && npm run build` |
| Start command | `node src/server.js` |
| Health check | `/api/config` |
| Instance plan | Free |
| Environment | `NODE_ENV=production` |

Render supplies `PORT` and `RENDER_EXTERNAL_URL`. The server uses the assigned port and automatically uses the external HTTPS URL for QR links. A non-empty `PUBLIC_APP_URL` takes precedence when a custom domain is configured. Development dependencies are included during the build because Vite and Tailwind are required to compile the frontend.

Render's free service can spin down after inactivity. Because this application stores state in memory, a restart also resets the queue. See Render's [web service documentation](https://render.com/docs/web-services) and [free service limitations](https://render.com/docs/free).

## Environment variables

Store local values in `.env` and hosted values in Render's environment settings. Do not commit access tokens or other secrets.

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP listening port. Defaults to `8787` locally; Render assigns its own value. |
| `NODE_ENV` | Use `production` when hosted. Disables demonstration authentication and reset. |
| `CLINIC_ID` | Clinic identifier used by patient join links. Defaults to `clinic-demo`. |
| `CLINIC_NAME` | Display name. Defaults to `Aster Lane Clinic`. |
| `DOCTOR_PHONES` | Comma-separated authorized doctor numbers, including country codes. Required for production doctor authorization. |
| `DOCTOR_SESSION_TTL_MS` | Doctor session lifetime in milliseconds. Defaults to `43200000` (12 hours). |
| `PUBLIC_APP_URL` | Optional public origin override for QR codes and links. |
| `RENDER_EXTERNAL_URL` | Public service URL supplied automatically by Render. |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta WhatsApp Business phone number ID. |
| `WHATSAPP_ACCESS_TOKEN` | Meta access token used for WhatsApp delivery. |

## WhatsApp integration

`src/meta-whatsapp.js` implements the Meta WhatsApp Cloud API adapter. Configure both WhatsApp environment variables and approved templates in your Meta account to send real notifications.

The adapter uses language code `en_US` and sends two body parameters in this order: token number and patient name. Approved templates must match that parameter structure.

| Notification | Template name |
| --- | --- |
| At or below ten patients ahead | `queue_ten_ahead` |
| At or below five patients ahead | `queue_five_ahead` |
| At or below three patients ahead | `queue_three_ahead` |
| Patient is next | `queue_you_are_next` |
| Token is called | `queue_token_called` |

The queue checks notification thresholds during queue actions. The outbox tracks sent events and retries failures. Its delivery records are held in memory, so they do not survive server restarts. WhatsApp queue notifications and doctor OTP delivery are separate integrations.

## Checks

```bash
npm test
npm run build
```

Tests cover queue progression, family token rules, notification retries, API authorization and privacy, session expiry, demo reset restrictions, client error handling, and Render URL selection. A successful build generates the frontend in `dist/`.

## Project structure

```text
src/
  App.jsx             Patient and doctor screens
  main.jsx            React entry point
  index.css           Tailwind theme and shared styling
  store.js            Client state, API calls, and WebSocket connection
  server.js           HTTP API, authentication, WebSockets, and static files
  queue.js            Queue rules and token lifecycle
  whatsapp.js         Notification outbox and mock provider
  meta-whatsapp.js    Meta WhatsApp Cloud API adapter
test/                 Automated tests
public/               Public assets
docs/                 Project handover document
.env.example          Local environment example
render.yaml           Render deployment configuration
vite.config.js        Frontend build and development proxy settings
```

The [JavaScript handover document](docs/QueueCare-JavaScript-Handover.docx) explains the conversion, setup, and validation performed for this project.
