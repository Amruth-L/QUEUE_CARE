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
const provider = process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN
  ? new MetaWhatsAppProvider({ phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID, accessToken: process.env.WHATSAPP_ACCESS_TOKEN })
  : new InMemoryWhatsAppProvider();
const outbox = new NotificationOutbox({ provider });
const queue = new ClinicQueue({ sessionId: `clinic-demo-${new Date().toISOString().slice(0, 10)}`, notificationOutbox: outbox });
queue.open();

const clients = new Set();
const otpChallenges = new Map();
const doctorSessions = new Map();
let activity = [{ id: "server-open", label: "Queue opened", detail: "Live server session", time: new Date().toISOString(), tone: "green" }];
queue.on("update", ({ event }) => {
  activity = [{ id: `${Date.now()}-${event}`, label: event.replaceAll(".", " "), detail: "Queue updated in real time", time: new Date().toISOString(), tone: event.includes("skip") ? "amber" : "blue" }, ...activity].slice(0, 12);
  broadcast();
});

function clientState() {
  const snapshot = queue.snapshot();
  return {
    sessionId: snapshot.sessionId,
    sessionDate: new Date().toISOString().slice(0, 10),
    clinicName: "Aster Lane Clinic",
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
  return Boolean(token && doctorSessions.has(token));
}

async function body(request) {
  let value = "";
  for await (const chunk of request) value += chunk;
  return value ? JSON.parse(value) : {};
}

async function handleApi(request, response, pathname) {
  if (request.method === "GET" && pathname === "/api/state") return sendJson(response, 200, clientState());
  if (request.method === "GET" && pathname === "/api/config") return sendJson(response, 200, { publicUrl, clinicName: "Aster Lane Clinic", sessionStart: "6:00 PM" });
  try {
    const input = await body(request);
    if (request.method === "POST" && pathname === "/api/auth/request") {
      const phone = String(input.phone ?? "").replace(/[^\d+]/g, "");
      if (phone.length < 8) return sendJson(response, 400, { error: "Enter a valid mobile number" });
      const challengeId = `challenge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const code = process.env.NODE_ENV === "production" ? String(Math.floor(100000 + Math.random() * 900000)) : "123456";
      otpChallenges.set(challengeId, { phone, code, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0 });
      console.log(`Doctor OTP for ${phone}: ${code}`);
      return sendJson(response, 200, { challengeId, maskedPhone: `${phone.slice(0, 3)}••••${phone.slice(-2)}`, demoCode: process.env.NODE_ENV === "production" ? undefined : code });
    }
    if (request.method === "POST" && pathname === "/api/auth/verify") {
      const challenge = otpChallenges.get(input.challengeId);
      if (!challenge || challenge.expiresAt < Date.now() || challenge.attempts >= 5) return sendJson(response, 400, { error: "That code has expired. Request a new one." });
      challenge.attempts += 1;
      if (String(input.code) !== challenge.code) return sendJson(response, 400, { error: "Incorrect OTP. Please try again." });
      const token = `doctor-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      doctorSessions.set(token, { phone: challenge.phone, createdAt: Date.now() });
      otpChallenges.delete(input.challengeId);
      return sendJson(response, 200, { token, doctor: { phone: challenge.phone, name: "Doctor" } });
    }
    if (pathname.startsWith("/api/action/") && !authorized(request)) return sendJson(response, 401, { error: "Doctor authentication required" });
    if (request.method === "POST" && pathname === "/api/join") return sendJson(response, 201, queue.join(input));
    if (request.method === "POST" && pathname === "/api/action/call") { queue.announceCurrent(); return sendJson(response, 200, clientState()); }
    if (request.method === "POST" && pathname === "/api/action/next") { await queue.next(); return sendJson(response, 200, clientState()); }
    if (request.method === "POST" && pathname === "/api/action/skip") { await queue.skip(); return sendJson(response, 200, clientState()); }
    if (request.method === "POST" && pathname === "/api/action/recall") { await queue.recall(input.entryId); return sendJson(response, 200, clientState()); }
    if (request.method === "POST" && pathname === "/api/action/stop") { queue.stopNewTokens(); return sendJson(response, 200, clientState()); }
    if (request.method === "POST" && pathname === "/api/action/end") { queue.endSession(); return sendJson(response, 200, clientState()); }
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
wss.on("connection", socket => { clients.add(socket); socket.send(JSON.stringify({ type: "state", state: clientState() })); socket.on("close", () => clients.delete(socket)); });
function broadcast() { const message = JSON.stringify({ type: "state", state: clientState() }); for (const client of clients) if (client.readyState === 1) client.send(message); }

server.listen(port, () => console.log(`QueueCare server running at http://localhost:${port}`));
