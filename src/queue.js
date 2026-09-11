import { EventEmitter } from "node:events";
import { NOTIFICATION_TYPES } from "./whatsapp.js";

const THRESHOLDS = Object.freeze([
  { ahead: 10, type: NOTIFICATION_TYPES.TEN_AHEAD },
  { ahead: 5, type: NOTIFICATION_TYPES.FIVE_AHEAD },
  { ahead: 3, type: NOTIFICATION_TYPES.THREE_AHEAD },
  { ahead: 1, type: NOTIFICATION_TYPES.NEXT }
]);

const ACTIVE_STATUSES = new Set(["waiting", "called", "skipped"]);

function normalizePhone(phone) {
  return String(phone ?? "").replace(/[^\d+]/g, "");
}

export class ClinicQueue extends EventEmitter {
  constructor({ sessionId, notificationOutbox, clock = () => new Date() } = {}) {
    super();
    if (!sessionId) throw new TypeError("sessionId is required");
    if (!notificationOutbox) throw new TypeError("notificationOutbox is required");
    this.sessionId = sessionId;
    this.notificationOutbox = notificationOutbox;
    this.clock = clock;
    this.status = "closed";
    this.acceptingTokens = false;
    this.nextTokenNumber = 1;
    this.nextEntryId = 1;
    this.entries = [];
  }

  open() {
    if (this.status === "open") return this.snapshot();
    if (this.status === "ended") throw new Error("A session cannot be reopened");
    this.status = "open";
    this.acceptingTokens = true;
    return this.#publish("session.opened");
  }

  stopNewTokens() {
    this.#requireOpen();
    this.acceptingTokens = false;
    return this.#publish("session.stopped_accepting");
  }

  endSession() {
    this.#requireOpen();
    this.status = "ended";
    this.acceptingTokens = false;
    return this.#publish("session.ended");
  }

  join({ patientName, phone, isWhatsAppOptedIn = true }) {
    this.#requireOpen();
    if (!this.acceptingTokens) throw new Error("New tokens are stopped");
    if (!patientName?.trim()) throw new Error("Patient name is required");
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) throw new Error("A WhatsApp phone number is required");
    if (!isWhatsAppOptedIn) throw new Error("WhatsApp notification opt-in is required");

    const activeSamePhone = this.entries.some(entry =>
      ACTIVE_STATUSES.has(entry.status) && entry.phone === normalizedPhone
    );
    if (activeSamePhone) throw new Error("This phone already has an active token");

    const entry = {
      id: `entry-${this.nextEntryId++}`,
      sessionId: this.sessionId,
      tokenNumber: this.nextTokenNumber++,
      patientName: patientName.trim(),
      phone: normalizedPhone,
      status: "waiting",
      priority: false,
      createdAt: this.clock().toISOString(),
      updatedAt: this.clock().toISOString()
    };
    this.entries.push(entry);
    this.#publish("token.joined");
    return this.#publicEntry(entry);
  }

  async next() {
    this.#requireOpen();
    const current = this.entries.find(entry => entry.status === "called");
    if (current) {
      current.status = "completed";
      current.updatedAt = this.clock().toISOString();
    }
    const next = this.#orderedEntries().find(entry => entry.status === "waiting");
    if (!next) return this.#publish("queue.idle");
    next.status = "called";
    next.updatedAt = this.clock().toISOString();
    await this.#send(next, NOTIFICATION_TYPES.CALLED);
    await this.#notifyWaitingEntries();
    return this.#publish("token.called");
  }

  announceCurrent() {
    this.#requireOpen();
    const current = this.entries.find(entry => entry.status === "called");
    if (!current) throw new Error("There is no called token to announce");
    return this.#publish("token.announced");
  }

  async skip() {
    this.#requireOpen();
    const current = this.entries.find(entry => entry.status === "called");
    if (!current) throw new Error("There is no called token to skip");
    current.status = "skipped";
    current.updatedAt = this.clock().toISOString();
    await this.#notifyWaitingEntries();
    return this.#publish("token.skipped");
  }

  async recall(entryId) {
    this.#requireOpen();
    const entry = this.entries.find(candidate => candidate.id === entryId);
    if (!entry || entry.status !== "skipped") throw new Error("Only skipped tokens can be recalled");
    entry.status = "waiting";
    entry.priority = true;
    entry.updatedAt = this.clock().toISOString();
    await this.#notifyWaitingEntries();
    return this.#publish("token.recalled");
  }

  getEntry(entryId) {
    const entry = this.entries.find(candidate => candidate.id === entryId);
    return entry ? this.#publicEntry(entry) : null;
  }

  snapshot() {
    return {
      sessionId: this.sessionId,
      status: this.status,
      acceptingTokens: this.acceptingTokens,
      current: this.#publicEntry(this.entries.find(entry => entry.status === "called") ?? null),
      entries: this.#orderedEntries().map(entry => this.#publicEntry(entry))
    };
  }

  async #notifyWaitingEntries() {
    for (const entry of this.#orderedEntries().filter(candidate => candidate.status === "waiting")) {
      const ahead = this.#peopleAhead(entry);
      for (const threshold of THRESHOLDS) {
        if (ahead <= threshold.ahead) await this.#send(entry, threshold.type);
      }
    }
  }

  #peopleAhead(entry) {
    return this.#orderedEntries()
      .filter(candidate => candidate.status === "waiting")
      .findIndex(candidate => candidate.id === entry.id);
  }

  #orderedEntries() {
    return [...this.entries].sort((a, b) => {
      if (a.priority !== b.priority) return Number(b.priority) - Number(a.priority);
      return a.tokenNumber - b.tokenNumber;
    });
  }

  async #send(entry, type) {
    return this.notificationOutbox.enqueue({
      sessionId: this.sessionId,
      tokenId: entry.id,
      phone: entry.phone,
      type,
      tokenNumber: entry.tokenNumber,
      patientName: entry.patientName
    });
  }

  #requireOpen() {
    if (this.status !== "open") throw new Error("The clinic session is not open");
  }

  #publish(event) {
    const snapshot = this.snapshot();
    this.emit("update", { event, snapshot });
    return snapshot;
  }

  #publicEntry(entry) {
    if (!entry) return null;
    const ahead = entry.status === "waiting" ? this.#peopleAhead(entry) : null;
    return { ...entry, peopleAhead: ahead };
  }
}
