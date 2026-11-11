# Connecting another booking tool

SlotBack can sit next to the booking tool a business already uses. The tool (or Zapier, Make, n8n) pushes bookings and cancellations to SlotBack; when a booking is cancelled, SlotBack offers the slot to the waitlist; when a client claims it, SlotBack sends a signed webhook so the tool can add the booking to its calendar.

## 1. Create a key

Owners and admins: **Settings → Integrations → Create key**. The key (`sbk_…`) is shown once. Only a hash is stored, so a lost key can't be recovered: remove the connection and create a new one. Removing a connection stops its key immediately.

## 2. Send booking changes

```
POST https://slotback.atreyakamat.dev/api/integrations/v1/bookings
Authorization: Bearer sbk_…
Content-Type: application/json
```

```json
{
  "externalId": "fresha-48213",
  "status": "booked",
  "startAt": "2026-11-02T15:00:00+05:30",
  "service": "Haircut",
  "staff": "Asha",
  "customer": { "name": "Riya Naik", "phone": "98765 43210", "email": "riya@example.com" }
}
```

| Field | Notes |
| --- | --- |
| `externalId` | Your tool's id for the booking. Letters, digits and `. : @ _ -`, up to 100 characters. Bookings are matched on it, so retries are safe. |
| `status` | `booked` (new or moved), `cancelled`, `completed` or `no_show`. |
| `startAt` | ISO 8601 with a timezone offset. |
| `service` | Must match a service name in SlotBack (case doesn't matter). The error lists valid names. |
| `staff` | Optional. Must match a staff member who offers the service. Without it, the first free one is used. |
| `customer` | Optional. Matched by phone number. No messaging consent is recorded from a booking. |
| `cancelReason` | Optional, with `cancelled`. |

Send the whole booking every time. A `booked` event for an id SlotBack already has moves it if the time, staff or service changed.

Responses: `200` with `{ appointmentId, status, created, campaignId? }`; `401` bad or revoked key; `404` cancelling an id never sent; `409` the time clashes with another booking in SlotBack; `422` invalid body; `429` more than 300 requests a minute.

Check a key with `GET /api/integrations/v1/ping`.

## 3. Receive webhooks (optional)

Add an `https://` URL to the connection. SlotBack POSTs:

```json
{
  "id": "delivery id",
  "event": "slot.claimed",
  "createdAt": "2026-11-02T08:41:00.000Z",
  "data": {
    "appointment": { "id": "…", "startAt": "…", "endAt": "…", "service": "Haircut", "staff": "Asha", "valuePaise": 80000,
                     "customer": { "name": "…", "phone": "+91 …", "email": null } },
    "replaces": { "appointmentId": "…", "integrationId": "…", "externalId": "fresha-48213" }
  }
}
```

Headers: `x-slotback-event`, `x-slotback-delivery`, `x-slotback-timestamp` (Unix seconds) and `x-slotback-signature: v1=<hex>`, an HMAC-SHA256 with the connection's signing secret over `"<timestamp>.<raw body>"`. Verify it and reject timestamps more than five minutes old:

```js
import { createHmac, timingSafeEqual } from "node:crypto";

function verify(secret, timestamp, rawBody, signature) {
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = Buffer.from(`v1=${createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex")}`);
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
```

Reply with any 2xx. Failures are retried after 1, 5, 15, 60, 180, 360 and 720 minutes, then marked failed (shown on the connection). Redirects aren't followed.

Webhook URLs must be public `https://` addresses on port 443. Private, loopback, link-local and cloud-metadata addresses are refused when saved and again at connect time, so a host name can't be pointed at an internal address later.
