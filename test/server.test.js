import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { WebSocket } from "ws";

async function startServer(t, extra = {}) {
  const child = spawn(process.execPath, ["src/server.js"], {
    cwd: new URL("..", import.meta.url),
    env: {
      ...process.env,
      PORT: "0",
      NODE_ENV: "test",
      CLINIC_ID: "test-clinic",
      DOCTOR_PHONES: "+919999000000",
      WHATSAPP_PHONE_NUMBER_ID: "",
      WHATSAPP_ACCESS_TOKEN: "",
      ...extra,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(async () => {
    const exited = once(child, "exit");
    child.kill();
    await exited;
  });
  const base = await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Server startup timeout")),
      10000,
    );
    child.on("error", reject);
    child.stdout.on("data", (chunk) => {
      const match = String(chunk).match(/http:\/\/localhost:\d+/);
      if (match) {
        clearTimeout(timer);
        resolve(match[0]);
      }
    });
  });
  const api = async (route, input, token) => {
    const response = await fetch(base + route, {
      method: input === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(input === undefined ? {} : { body: JSON.stringify(input) }),
    });
    return { status: response.status, body: await response.json() };
  };
  return { base, api };
}
async function login(api) {
  const challenge = await api("/api/auth/request", { phone: "+919999000000" });
  assert.equal(challenge.status, 200);
  const verified = await api("/api/auth/verify", {
    challengeId: challenge.body.challengeId,
    code: "123456",
  });
  return verified.body.token;
}

test("API workflow preserves privacy, clinic routing, resets and session controls", async (t) => {
  const { base, api } = await startServer(t);
  assert.equal((await api("/api/demo/reset", {})).status, 401);
  assert.equal((await api("/api/action/end", {})).status, 401);
  assert.equal(
    (await api("/api/join", { clinicId: "wrong", phone: "+919800000021" }))
      .status,
    404,
  );
  const token = await login(api);
  const first = await api("/api/join", {
    clinicId: "test-clinic",
    phone: "+919800000021",
  });
  assert.equal(first.status, 201);
  assert.equal(first.body.phone, undefined);
  assert.equal((await api("/api/state")).body.clinicId, "test-clinic");
  assert.equal((await api("/api/state")).body.entries[0].phone, undefined);
  assert.equal(
    (await api("/api/state", undefined, token)).body.entries[0].phone,
    "+919800000021",
  );
  await api("/api/action/next", {}, token);
  assert.equal((await api("/api/state")).body.entries[0].status, "called");
  await api("/api/action/skip", {}, token);
  await api("/api/action/recall", { entryId: first.body.id }, token);
  assert.equal((await api("/api/state")).body.entries[0].priority, true);
  await api("/api/action/stop", {}, token);
  assert.equal(
    (await api("/api/join", { phone: "+919800000022" })).status,
    400,
  );
  const oldSession = (await api("/api/state")).body.sessionId;
  const reset = await api("/api/demo/reset", {}, token);
  assert.equal(reset.status, 200);
  assert.notEqual(reset.body.sessionId, oldSession);
  assert.equal(reset.body.notifications.length, 0);
  const second = await api("/api/join", { phone: "+919800000021" });
  assert.notEqual(second.body.id, first.body.id);
  const called = await api("/api/action/next", {}, token);
  assert.equal(called.body.notifications.length, 1);
  await api("/api/action/end", {}, token);
  assert.equal((await api("/api/state")).body.status, "ended");
  assert.equal(
    (await api("/api/join", { phone: "+919800000022" })).status,
    400,
  );
  assert.equal((await fetch(base + "/missing.js")).status, 404);
  assert.equal(
    (await fetch(base + "/favicon.svg")).headers.get("content-type"),
    "image/svg+xml",
  );
});

test("production disables demo reset and unconfigured OTP delivery", async (t) => {
  const { api } = await startServer(t, { NODE_ENV: "production" });
  assert.equal((await api("/api/demo/reset", {})).status, 404);
  assert.equal(
    (await api("/api/auth/request", { phone: "+919999000000" })).status,
    503,
  );
});

test("public QR origin uses Render's URL and permits a custom domain override", async (t) => {
  const rendered = await startServer(t, {
    PUBLIC_APP_URL: "",
    RENDER_EXTERNAL_URL: "https://queue-care-example.onrender.com/",
  });
  assert.equal(
    (await rendered.api("/api/config")).body.publicUrl,
    "https://queue-care-example.onrender.com",
  );
  const custom = await startServer(t, {
    PUBLIC_APP_URL: "https://queue.example.com/",
    RENDER_EXTERNAL_URL: "https://queue-care-example.onrender.com",
  });
  assert.equal(
    (await custom.api("/api/config")).body.publicUrl,
    "https://queue.example.com",
  );
});

test("WebSocket no longer exposes doctor details after session expiry", async (t) => {
  const { base, api } = await startServer(t, { DOCTOR_SESSION_TTL_MS: "500" });
  const token = await login(api);
  await api("/api/join", { phone: "+919800000031" });
  const socket = new WebSocket(
    base.replace("http:", "ws:") + "/ws?token=" + token,
  );
  t.after(() => socket.terminate());
  const [first] = await once(socket, "message");
  assert.equal(JSON.parse(first).state.entries[0].phone, "+919800000031");
  await new Promise((resolve) => setTimeout(resolve, 550));
  const next = once(socket, "message");
  await api("/api/join", { phone: "+919800000032" });
  const [updated] = await next;
  assert.equal(JSON.parse(updated).state.entries[0].phone, undefined);
});
