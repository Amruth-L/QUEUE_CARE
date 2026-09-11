export class MetaWhatsAppProvider {
  constructor({ phoneNumberId, accessToken, graphApiVersion = "v21.0", fetchImpl = globalThis.fetch } = {}) {
    if (!phoneNumberId) throw new TypeError("phoneNumberId is required");
    if (!accessToken) throw new TypeError("accessToken is required");
    if (typeof fetchImpl !== "function") throw new TypeError("fetch implementation is required");
    this.url = `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}/messages`;
    this.accessToken = accessToken;
    this.fetch = fetchImpl;
  }

  async sendTemplate({ to, template, parameters = {}, idempotencyKey }) {
    const bodyParameters = [];
    if (parameters.tokenNumber !== undefined) bodyParameters.push({ type: "text", text: String(parameters.tokenNumber) });
    if (parameters.patientName !== undefined) bodyParameters.push({ type: "text", text: String(parameters.patientName) });

    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: template,
        language: { code: "en_US" },
        ...(bodyParameters.length > 0 ? { components: [{ type: "body", parameters: bodyParameters }] } : {})
      }
    };
    const response = await this.fetch(this.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`WhatsApp API ${response.status}: ${detail}`);
    }
    const result = await response.json();
    return { providerMessageId: result.messages?.[0]?.id ?? null };
  }
}
