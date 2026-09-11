# Clinic Virtual Queue Notification Engine

This workspace contains the queue domain and WhatsApp notification layer for the clinic MVP.

## Run tests

```sh
npm test
```

## Run the full local system

```sh
npm run start
```

Open the printed server URL with `?doctor=1` for the doctor dashboard. The dashboard generates the permanent clinic QR. Scan that QR from a phone to open the patient join form and receive a real server-generated token. Open the doctor page and patient page in separate devices or browser windows to see WebSocket updates.

For phone testing on the same Wi-Fi, open the server using the computer's LAN address, for example `http://192.168.1.20:8787`, then print or display the generated QR from that address. Do not use `localhost` in the QR when scanning from another device.

## Queue behavior

`ClinicQueue` keeps queue state independent from message delivery. The doctor transitions the queue with `next()`, `skip()`, and `recall(entryId)`. Waiting patients are evaluated after each transition and receive one WhatsApp alert at each threshold: 10, 5, 3, 1 ("You are next"), and finally "called".

Each notification has an idempotency key in the form `sessionId:tokenId:notificationType`. Failed deliveries remain in the outbox and can be retried without changing queue state.

## WhatsApp production adapter

Use `MetaWhatsAppProvider` with a WhatsApp Business phone-number ID and access token. Create these approved templates in Meta before enabling production delivery:

- `queue_ten_ahead`
- `queue_five_ahead`
- `queue_three_ahead`
- `queue_you_are_next`
- `queue_token_called`

The adapter sends the idempotency key as `X-Idempotency-Key` and throws on non-2xx responses so the outbox records a failed delivery for retry.

Without WhatsApp credentials, the local server uses an in-memory provider so queue behavior can be tested safely. For production delivery, set `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN` and create the approved templates in Meta first.
