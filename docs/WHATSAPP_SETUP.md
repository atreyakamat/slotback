# WhatsApp (Meta Cloud API)

SlotBack sends offers and booking confirmations from one WhatsApp Business number, through Meta's Cloud API directly (no reseller). Demo workspaces never use it.

## How it works

- Messages a business starts must use a template Meta has approved. SlotBack sends two: `slot_opening` and `slot_booked`.
- The claim link is a URL button whose last part is the one-time token. After sending, SlotBack deletes the token from the stored message.
- Clients who only agreed to SMS aren't offered slots while WhatsApp is the only provider. Staff see the reason "Only agreed to a channel that isn't set up yet".
- Meta calls `/api/webhooks/whatsapp` with delivery receipts and replies. A reply of STOP (or "unsubscribe", "opt out", "cancel") removes WhatsApp consent for that number at every business, because the client can't tell which business sent it.

## Setup

1. **Meta Business account**: business.facebook.com. Business verification raises the daily sending limit; it can follow later.
2. **App**: developers.facebook.com → Create app → type *Business* → add the **WhatsApp** product.
3. **Phone number**: WhatsApp → API Setup → add a number that is not already on the WhatsApp app. Note the **Phone number ID**.
4. **Permanent token**: Business settings → Users → System users → add one (Admin) → assign the app with full control → Generate token with `whatsapp_business_messaging` and `whatsapp_business_management`. The temporary token on the API Setup page expires in 24 hours.
5. **Templates**: WhatsApp Manager → Message templates → Create. Category **Utility**, language **English** (code `en`; if you choose another, set `WHATSAPP_TEMPLATE_LANGUAGE`). The wording must keep the variables in this order:

   `slot_opening`
   - Body: `Hi {{1}}, an opening just came up at {{2}}: {{3}}, {{4}}. Tap below to claim it before {{5}}. The first person to confirm gets it.`
   - Footer: `Reply STOP to opt out`
   - Button: *Visit website*, text `Claim this slot`, URL type **Dynamic**: `https://slotback.atreyakamat.dev/c/{{1}}` (must match `NEXT_PUBLIC_APP_URL`)
   - Samples: `Asha`, `Casa Verde Salon`, `Haircut with Riya`, `Sat, 24 Oct at 3:00 pm`, `1:30 pm`, button `abc123`

   `slot_booked`
   - Body: `You're booked, {{1}}! {{2}} at {{3}}, {{4}}. Address: {{5}}. To change it, please contact the business directly.`
   - Samples: `Asha`, `Haircut with Riya`, `Casa Verde Salon`, `Sat, 24 Oct at 3:00 pm`, `12 Rua de Ourém, Panaji`

   Meta decides the final category. If it moves a template to Marketing, those messages cost more.
6. **Webhook**: App → WhatsApp → Configuration → Callback URL `https://slotback.atreyakamat.dev/api/webhooks/whatsapp`, Verify token = your `WHATSAPP_VERIFY_TOKEN`. Subscribe to the **messages** field. Deploy with the variables below first, or verification fails.
7. **Netlify variables** (set them yourself; never commit or paste them):

   | Variable | Value |
   | --- | --- |
   | `MESSAGE_PROVIDER` | `whatsapp_cloud` |
   | `WHATSAPP_ACCESS_TOKEN` | the system user token |
   | `WHATSAPP_PHONE_NUMBER_ID` | from API Setup |
   | `WHATSAPP_TEMPLATE_LANGUAGE` | `en` |
   | `WHATSAPP_APP_SECRET` | App → Settings → Basic → App secret |
   | `WHATSAPP_VERIFY_TOKEN` | any random string, e.g. `openssl rand -hex 16` |

8. **Payment method**: WhatsApp Manager → add a card for per-conversation charges. Meta's free test number works without one, for up to 5 recipient numbers you add yourself.

## Testing

Use the free test number first: add your own phone as a recipient, create a real (non-demo) business, add yourself to its waitlist with WhatsApp ticked, and cancel a booking. Check the campaign screen for the delivery status, then reply STOP and confirm the consent is removed.
