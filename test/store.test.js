import test from "node:test";
import assert from "node:assert/strict";
import { queueStore } from "../src/store.js";

globalThis.sessionStorage = {
  getItem: () => "doctor-test",
  removeItem: () => {},
};
const initial = () => ({
  sessionId: "test",
  status: "open",
  acceptingTokens: true,
  entries: [],
  notifications: [],
  activity: [],
});

test("client store never fabricates a token when the API is offline", async (t) => {
  const before = queueStore.getState();
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("offline");
  });
  await assert.rejects(
    queueStore.join({ phone: "+919800000011" }),
    /Cannot reach/,
  );
  assert.equal(queueStore.getState(), before);
});

test("end and stop controls await the server and propagate failures", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(
        JSON.stringify({ error: "Doctor authentication required" }),
        { status: 401 },
      ),
  );
  await assert.rejects(queueStore.endSession(), /authentication required/);
  await assert.rejects(queueStore.stopNewTokens(), /authentication required/);
  await assert.rejects(queueStore.resetDemo(), /authentication required/);
});

test("successful actions and joins update React state without waiting for WebSocket", async (t) => {
  const responses = [
    initial(),
    { id: "entry-123", tokenNumber: 123, status: "waiting" },
  ];
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response(JSON.stringify(responses.shift())),
  );
  await queueStore.next();
  const entry = await queueStore.join({ phone: "+919800000012" });
  assert.equal(queueStore.getState().entries[0].id, entry.id);
});

test("invalid server response produces a recoverable client error", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("<html>Missing backend</html>"),
  );
  await assert.rejects(
    queueStore.join({ phone: "+919800000013" }),
    /invalid response/,
  );
});
