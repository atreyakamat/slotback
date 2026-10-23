# SlotBack staff app

The phone app for salon and clinic staff. It shows today's money recovered, the schedule, live slot offers and the waitlist. Customers never need it: they get WhatsApp or SMS and claim on the web.

Built with Expo SDK 58 and expo-router. It talks to the web app's `/api/mobile/*` routes.

## Try it on your phone (Expo Go)

1. Install **Expo Go** from the App Store or Play Store.
2. On your computer:
   ```sh
   cd mobile
   npm install
   npx expo start
   ```
3. Scan the QR code in the terminal with your phone camera (iOS) or Expo Go (Android).
4. In the app, either:
   - tap **Try the demo salon** (needs a server with `DEMO_MODE=true`), or
   - tap **Scan to connect**, then on the website open **Settings → Phone app → Connect a phone** and scan that QR code.

The app talks to `https://slotback.atreyakamat.dev` by default. To test against another server (a Netlify preview, or your laptop on the same Wi-Fi such as `http://192.168.1.20:3000`), tap **Testing? Change server** on the connect screen.

## Sign-in

Staff pair the phone from the website, so there is no password in the app. The QR code works once and expires after 10 minutes. The phone keeps a device token in the secure keychain, and you can sign a phone out from **Settings → Phone app** on the web at any time.

## Checks

```sh
npm run typecheck
npm run lint
```

## Store builds

Store builds use EAS (`npx eas build`), which needs an Expo account. Apple's developer program costs $99 a year and Google Play is a one-time $25, so neither is set up yet.
