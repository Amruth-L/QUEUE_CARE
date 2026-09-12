export const NOTIFICATION_TYPES = Object.freeze({
  TEN_AHEAD: "ten_ahead",
  FIVE_AHEAD: "five_ahead",
  THREE_AHEAD: "three_ahead",
  NEXT: "next",
  CALLED: "called"
});

const TEMPLATES = Object.freeze({
  [NOTIFICATION_TYPES.TEN_AHEAD]: {
    name: "queue_ten_ahead",
    body: "Approximately 10 people are ahead of you."
  },
  [NOTIFICATION_TYPES.FIVE_AHEAD]: {
    name: "queue_five_ahead",
    body: "Your turn is approaching. There are approximately 5 patients ahead of you. Please be ready."
  },
  [NOTIFICATION_TYPES.THREE_AHEAD]: {
    name: "queue_three_ahead",
    body: "Approximately 3 people are ahead of you."
  },
  [NOTIFICATION_TYPES.NEXT]: {
    name: "queue_you_are_next",
    body: "You are next. Please be ready."
  },
  [NOTIFICATION_TYPES.CALLED]: {
    name: "queue_token_called",
    body: "Your token is called. Please proceed to the doctor."
  }
});

export class InMemoryWhatsAppProvider {
  constructor({ send } = {}) {
    this.messages = [];
    this.send = send ?? (async message => {
      this.messages.push(message);
      return { providerMessageId: `wamid-${this.messages.length}` };
    });
  }

  async sendTemplate({ to, template, parameters, idempotencyKey }) {
    const result = await this.send({ to, template, parameters, idempotencyKey });
    return result ?? {};
  }
}

export class NotificationOutbox {
  constructor({ provider, clock = () => new Date() }) {
    if (!provider || typeof provider.sendTemplate !== "function") {
      throw new TypeError("A WhatsApp provider with sendTemplate is required");
    }
    this.provider = provider;
    this.clock = clock;
    this.records = new Map();
  }

  get(key) {
    return this.records.get(key);
  }

  list() {
    return [...this.records.values()];
  }

  async enqueue({ sessionId, tokenId, phone, type, tokenNumber, patientName }) {
    const template = TEMPLATES[type];
    if (!template) throw new Error(`Unknown notification type: ${type}`);
    if (!phone) throw new Error("WhatsApp phone number is required");

    const idempotencyKey = `${sessionId}:${tokenId}:${type}`;
    const existing = this.records.get(idempotencyKey);
    if (existing?.status === "sent" || existing?.status === "delivered") {
      return existing;
    }

    const record = existing ?? {
      idempotencyKey,
      sessionId,
      tokenId,
      phone,
      type,
      template: template.name,
      tokenNumber,
      patientName,
      status: "pending",
      attempts: 0,
      createdAt: this.clock().toISOString(),
      updatedAt: null,
      providerMessageId: null,
      error: null
    };
    record.status = "pending";
    record.attempts += 1;
    record.updatedAt = this.clock().toISOString();
    record.error = null;
    this.records.set(idempotencyKey, record);

    try {
      const response = await this.provider.sendTemplate({
        to: phone,
        template: template.name,
        parameters: { tokenNumber, patientName },
        idempotencyKey
      });
      record.status = "sent";
      record.providerMessageId = response.providerMessageId ?? null;
      record.updatedAt = this.clock().toISOString();
    } catch (error) {
      record.status = "failed";
      record.error = error instanceof Error ? error.message : String(error);
      record.updatedAt = this.clock().toISOString();
    }
    return record;
  }

  async retryFailed() {
    const failed = [...this.records.values()].filter(record => record.status === "failed");
    const results = [];
    for (const record of failed) {
      results.push(await this.enqueue(record));
    }
    return results;
  }
}
