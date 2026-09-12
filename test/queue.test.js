import test from "node:test";
import assert from "node:assert/strict";
import { ClinicQueue } from "../src/queue.js";
import { InMemoryWhatsAppProvider, NotificationOutbox } from "../src/whatsapp.js";

function createQueue({ send, clock } = {}) {
  const provider = new InMemoryWhatsAppProvider({ send });
  const outbox = new NotificationOutbox({ provider, clock });
  const queue = new ClinicQueue({ sessionId: "session-1", notificationOutbox: outbox, clock });
  queue.open();
  return { queue, provider, outbox };
}

test("queue transitions send minimal threshold alerts once", async () => {
  const { queue, provider, outbox } = createQueue();
  const entries = [];
  for (let i = 0; i < 12; i += 1) {
    entries.push(queue.join({ patientName: `Patient ${i}`, phone: `+919999000${String(i).padStart(2, "0")}` }));
  }

  await queue.next();
  await queue.next();
  const last = entries.at(-1);
  const types = outbox.list().filter(record => record.tokenId === last.id).map(record => record.type);
  assert.deepEqual(types, ["ten_ahead"]);

  for (let i = 0; i < 5; i += 1) await queue.next();
  const afterFive = outbox.list().filter(record => record.tokenId === last.id).map(record => record.type);
  assert.deepEqual(afterFive, ["ten_ahead", "five_ahead"]);

  for (let i = 0; i < 2; i += 1) await queue.next();
  const afterThree = outbox.list().filter(record => record.tokenId === last.id).map(record => record.type);
  assert.deepEqual(afterThree, ["ten_ahead", "five_ahead", "three_ahead"]);

  await queue.next();
  const afterNext = outbox.list().filter(record => record.tokenId === last.id).map(record => record.type);
  assert.deepEqual(afterNext, ["ten_ahead", "five_ahead", "three_ahead", "next"]);

  while (queue.snapshot().current?.id !== last.id) await queue.next();
  const final = outbox.list().filter(record => record.tokenId === last.id).map(record => record.type);
  assert.deepEqual(final, ["ten_ahead", "five_ahead", "three_ahead", "next", "called"]);
  assert.equal(provider.messages.length, outbox.list().filter(record => record.status === "sent").length);
});

test("repeated transitions are idempotent and do not duplicate WhatsApp alerts", async () => {
  const { queue, outbox } = createQueue();
  const entry = queue.join({ patientName: "Elder", phone: "+919800000001" });
  await queue.next();
  await queue.next();
  const records = outbox.list().filter(record => record.tokenId === entry.id);
  assert.deepEqual(records.map(record => record.type), ["called"]);
  assert.equal(new Set(records.map(record => record.idempotencyKey)).size, records.length);
});

test("skipped tokens are excluded and recalled tokens enter the priority line", async () => {
  const { queue, outbox } = createQueue();
  const elder = queue.join({ patientName: "Elder", phone: "+919800000002" });
  queue.join({ patientName: "Other", phone: "+919800000003" });
  await queue.next();
  await queue.skip();
  const recalled = await queue.recall(elder.id);
  assert.equal(recalled.entries[0].id, elder.id);
  await queue.next();
  assert.equal(queue.snapshot().current.id, elder.id);
  assert.equal(outbox.list().some(record => record.tokenId === elder.id && record.type === "called"), true);
});

test("patient queue snapshots do not expose phone numbers or names", () => {
  const { queue } = createQueue();
  const entry = queue.join({ patientName: "Elder Patient", phone: "+919800000004" });
  assert.equal(entry.patientName, undefined);
  assert.equal(entry.phone, undefined);
  assert.equal(entry.tokenNumber, 1);
  assert.equal(entry.status, "waiting");
  assert.equal(queue.doctorSnapshot().entries[0].patientName, "Elder Patient");
});

test("one phone can create a second active family token only after five server minutes", () => {
  let time = new Date("2026-09-12T10:00:00.000Z");
  const clock = () => time;
  const { queue } = createQueue({ clock });
  const first = queue.join({ phone: "+919800000004" });

  time = new Date("2026-09-12T10:04:01.000Z");
  assert.throws(() => queue.join({ phone: "+919800000004" }), /approximately 1 minute/);

  time = new Date("2026-09-12T10:05:00.000Z");
  const second = queue.join({ phone: "+919800000004" });
  assert.equal(second.tokenNumber, first.tokenNumber + 1);
  assert.throws(() => queue.join({ phone: "+919800000004" }), /2 active tokens/);
});

test("a completed first token cannot unlock a later family token", async () => {
  let time = new Date("2026-09-12T10:00:00.000Z");
  const clock = () => time;
  const { queue } = createQueue({ clock });
  queue.join({ phone: "+919800000008" });
  await queue.next();
  await queue.next();
  time = new Date("2026-09-12T10:06:00.000Z");
  assert.throws(() => queue.join({ phone: "+919800000008" }), /no longer active/);
});

test("stop new tokens and end session block new registrations", () => {
  const { queue } = createQueue();
  queue.stopNewTokens();
  assert.throws(() => queue.join({ patientName: "Blocked", phone: "+919800000005" }), /New tokens are stopped/);
  const ended = createQueue().queue;
  ended.endSession();
  assert.throws(() => ended.join({ patientName: "Ended", phone: "+919800000007" }), /session is not open/);
});

test("WhatsApp failure is recorded and can be retried", async () => {
  let attempts = 0;
  const { queue, outbox } = createQueue({
    send: async message => {
      attempts += 1;
      if (attempts === 1) throw new Error("provider unavailable");
      return { providerMessageId: "retry-success" };
    }
  });
  queue.join({ patientName: "Patient", phone: "+919800000006" });
  await queue.next();
  const failed = outbox.list().find(record => record.type === "called");
  assert.equal(failed.status, "failed");
  await outbox.retryFailed();
  assert.equal(failed.status, "sent");
});
