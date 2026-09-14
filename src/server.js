import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import { ClinicQueue } from "./queue.js";
import { InMemoryWhatsAppProvider, NotificationOutbox } from "./whatsapp.js";
import { MetaWhatsAppProvider } from "./meta-whatsapp.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT ?? 8787);
function networkUrl() {
  const interfaces = os.networkInterfaces();
  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses ?? []) {
      if (address.family === "IPv4" && !address.internal) return `http://${address.address}:${port}`;
    }
  }
  return `http://localhost:${port}`;
}
const publicUrl = process.env.PUBLIC_APP_URL ?? networkUrl();
const clinicId = process.env.CLINIC_ID ?? "clinic-demo";
const clinicName = process.env.CLINIC_NAME ?? "Aster Lane Clinic";
const doctorSessionTtlMs = Number(process.env.DOCTOR_SESSION_TTL_MS ?? 12 * 60 * 60 * 1000);

function normalizePhone(phone) {
  return String(phone ?? "").replace(/[^\d+]/g, "");
}

// Doctor QR codes only identify this clinic's portal. Authorization always
// happens here against the clinic's configured doctor allowlist.
const configuredDoctorPhones = (process.env.DOCTOR_PHONES ?? "")
  .split(",")
  .map(normalizePhone)
  .filter(Boolean);
const authorizedDoctorPhones = new Set(
  configuredDoctorPhones.length > 0
    ? configuredDoctorPhones
    : process.env.NODE_ENV === "production" ? [] : ["+919999000000"]
);
const provider = process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN
  ? new MetaWhatsAppProvider({ phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID, accessToken: process.env.WHATSAPP_ACCESS_TOKEN })
  : new InMemoryWhatsAppProvider();
const outbox = new NotificationOutbox({ provider });
const queue = new ClinicQueue({ sessionId: `clinic-demo-${new Date().toISOString().slice(0, 10)}`, notificationOutbox: outbox });
queue.open();

const clients = new Map();
const otpChallenges = new Map();
const doctorSessions = new Map();
let activity = [{ id: "server-open", label: "Queue opened", detail: "Live server session", time: new Date().toISOString(), tone: "green" }];
queue.on("update", ({ event }) => {
  activity = [{ id: `${Date.now()}-${event}`, label: event.replaceAll(".", " "), detail: "Queue updated in real time", time: new Date().toISOString(), tone: event.includes("skip") ? "amber" : "blue" }, ...activity].slice(0, 12);
  broadcast();
});

function clientState(includePatientDetails = false) {
  const snapshot = includePatientDetails ? queue.doctorSnapshot() : queue.snapshot();
  return {
    sessionId: snapshot.sessionId,
    sessionDate: new Date().toISOString().slice(0, 10),
    clinicId,
    clinicName,
    status: snapshot.status,
    acceptingTokens: snapshot.acceptingTokens,
    nextTokenNumber: queue.nextTokenNumber,
    entries: snapshot.entries,
    notifications: outbox.list().map(record => ({ id: record.idempotencyKey, entryId: record.tokenId, type: record.type, status: record.status, message: record.type, createdAt: record.createdAt })),
    activity
  };
}

function sendJson(response, status, value) {
  response.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  response.end(JSON.stringify(value));
}

function authorized(request) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const session = doctorSessions.get(token);
  if (!session) return false;
  if (session.expiresAt <= Date.now()) {
    doctorSessions.delete(token);
    return false;
  }
  return true;
}

async function body(request) {
  let value = "";
  for await (const chunk of request) value += chunk;
  return value ? JSON.parse(value) : {};
}

async function handleApi(request, response, pathname) {
  if (request.method === "GET" && pathname === "/api/state") return sendJson(response, 200, clientState(authorized(request)));
  if (request.method === "GET" && pathname === "/api/config") return sendJson(response, 200, { publicUrl, clinicId, clinicName, sessionStart: "6:00 PM" });
  try {
    const input = await body(request);
    if (request.method === "POST" && pathname === "/api/auth/request") {
      const phone = normalizePhone(input.phone);
      if (!/^\+?\d{10,15}$/.test(phone)) return sendJson(response, 400, { error: "Enter a valid mobile number" });
      if (!authorizedDoctorPhones.has(phone)) {
        return sendJson(response, 403, { error: "This number is not authorized to access the doctor dashboard." });
      }
      // A real OTP sender must be wired here before production use. Never
      // generate a code that is merely logged or returned to the browser.
      if (process.env.NODE_ENV === "production") {
        return sendJson(response, 503, { error: "Doctor OTP delivery is not configured for this clinic." });
      }
      const challengeId = `challenge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const code = "123456";
      otpChallenges.set(challengeId, { phone, code, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0 });
      if (process.env.NODE_ENV !== "production") console.log(`Doctor OTP for ${phone}: ${code}`);
      return sendJson(response, 200, { challengeId, maskedPhone: `${phone.slice(0, 3)}••••${phone.slice(-2)}`, demoCode: process.env.NODE_ENV === "production" ? undefined : code });
    }
    if (request.method === "POST" && pathname === "/api/auth/verify") {
      const challenge = otpChallenges.get(input.challengeId);
      if (!challenge || challenge.expiresAt < Date.now() || challenge.attempts >= 5) return sendJson(response, 400, { error: "That code has expired. Request a new one." });
      challenge.attempts += 1;
      if (String(input.code) !== challenge.code) return sendJson(response, 400, { error: "Incorrect OTP. Please try again." });
      const token = `doctor-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      doctorSessions.set(token, { phone: challenge.phone, createdAt: Date.now(), expiresAt: Date.now() + doctorSessionTtlMs });
      otpChallenges.delete(input.challengeId);
      return sendJson(response, 200, { token, doctor: { phone: challenge.phone, name: "Doctor" } });
    }
    if (request.method === "POST" && pathname === "/api/demo/reset") {
      queue.entries = [];
      queue.nextTokenNumber = 1;
      queue.nextEntryId = 1;
      queue.status = "open";
      queue.acceptingTokens = true;
      activity = [{ id: `reset-${Date.now()}`, label: "Queue reset", detail: "Demo session restarted", time: new Date().toISOString(), tone: "green" }];
      broadcast();
      return sendJson(response, 200, clientState(authorized(request)));
    }
    if (pathname.startsWith("/api/action/") && !authorized(request)) return sendJson(response, 401, { error: "Doctor authentication required" });
    if (request.method === "POST" && pathname === "/api/join") {
      if (input.clinicId && input.clinicId !== clinicId) return sendJson(response, 404, { error: "This clinic queue is not available." });
      // join() performs validation and all family-token checks synchronously,
      // before the next request can run, so duplicate scans cannot consume two
      // tokens in this single-process queue.
      return sendJson(response, 201, queue.join(input));
    }
    if (request.method === "POST" && pathname === "/api/action/call") { queue.announceCurrent(); return sendJson(response, 200, clientState(true)); }
    if (request.method === "POST" && pathname === "/api/action/next") { await queue.next(); return sendJson(response, 200, clientState(true)); }
    if (request.method === "POST" && pathname === "/api/action/skip") { await queue.skip(); return sendJson(response, 200, clientState(true)); }
    if (request.method === "POST" && pathname === "/api/action/recall") { await queue.recall(input.entryId); return sendJson(response, 200, clientState(true)); }
    if (request.method === "POST" && pathname === "/api/action/stop") { queue.stopNewTokens(); return sendJson(response, 200, clientState(true)); }
    if (request.method === "POST" && pathname === "/api/action/end") { queue.endSession(); return sendJson(response, 200, clientState(true)); }
    return sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    return sendJson(response, 400, { error: error instanceof Error ? error.message : String(error) });
  }
}

function serveAsset(request, response, pathname) {
  const filePath = pathname === "/" ? path.join(root, "dist", "index.html") : path.join(root, "dist", pathname);
  if (!filePath.startsWith(path.join(root, "dist"))) return sendJson(response, 403, { error: "Forbidden" });
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return serveAsset(request, response, "/");
  const contentType = filePath.endsWith(".js") ? "text/javascript" : filePath.endsWith(".css") ? "text/css" : filePath.endsWith(".html") ? "text/html" : "image/png";
  response.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`).pathname;
  if (pathname.startsWith("/api/")) return handleApi(request, response, pathname);
  return serveAsset(request, response, pathname);
});
const wss = new WebSocketServer({ server, path: "/ws" });
wss.on("connection", (socket, request) => {
  const url = new URL(request.url ?? "/ws", `http://${request.headers.host ?? "localhost"}`);
  const token = url.searchParams.get("token");
  const session = token ? doctorSessions.get(token) : null;
  const isDoctor = Boolean(session && session.expiresAt > Date.now());
  clients.set(socket, isDoctor);
  socket.send(JSON.stringify({ type: "state", state: clientState(isDoctor) }));
  socket.on("close", () => clients.delete(socket));
});
function broadcast() {
  for (const [client, isDoctor] of clients) {
    if (client.readyState === 1) client.send(JSON.stringify({ type: "state", state: clientState(isDoctor) }));
  }
}

server.listen(port, () => console.log(`QueueCare server running at http://localhost:${port}`));
