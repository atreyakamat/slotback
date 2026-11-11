# Run the demo with Docker

One command starts SlotBack on your laptop with its own database. Nothing is sent to anyone: messages are simulated and the data stays on your machine.

## What you need

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (free for personal use), running.
- About 4 GB of free disk. The first build takes 3 to 5 minutes; later starts take seconds.

## Start it

```bash
git clone https://github.com/atreyakamat/slotback.git
cd slotback
docker compose up --build
```

Wait for `✓ Ready` in the logs, then open **http://localhost:3000**.

- **Landing page:** `/`
- **The app:** click **Try the live demo → Try the demo workspace**. The fictional Goa salon is created the first time.
- **Sign-up flow:** `/signup` works too. The "email" link is shown on screen instead of being sent.

Stop it with `Ctrl+C`. Run `docker compose up` again to carry on where you left off.

## Show it on a phone (the claim step)

The best part of the demo is a customer claiming the slot on a real phone. For that, the claim links must point at your laptop instead of `localhost`.

1. Put the phone and laptop on the same Wi-Fi.
2. Find your laptop's local IP address. On a Mac it's in System Settings → Wi-Fi → Details. On Windows, run `ipconfig`. It looks like `192.168.1.23`.
3. Start with that address:

   ```bash
   APP_URL=http://192.168.1.23:3000 docker compose up --build
   ```

   On Windows PowerShell: `$env:APP_URL="http://192.168.1.23:3000"; docker compose up --build`

4. Keep using **http://localhost:3000** on the laptop. QR codes and claim links now open on the phone.

In this mode the on-screen sign-up link is turned off, since it is only allowed on localhost. The demo workspace works as normal.

Then follow [DEMO_RUNBOOK.md](DEMO_RUNBOOK.md) for the 10-minute walkthrough.

## Start fresh

- Inside the app: **Settings → Reset demo data** gives you a clean salon.
- To wipe everything, including sign-ups: `docker compose down -v`, then `docker compose up`.

## What's running

| Service | What it does |
| --- | --- |
| `app` | The SlotBack production build on port 3000. Applies database migrations on start. |
| `db` | Postgres 16, stored in a Docker volume called `db-data`. |
| `ticker` | Calls the every-minute job, like Netlify's scheduled function: expires offers and sends the next round. |

The secrets in `docker-compose.yml` are fixed demo values. They are fine on your laptop and must never be used on a real deployment.

## If something goes wrong

| Symptom | Fix |
| --- | --- |
| `port is already allocated` | Something else uses port 3000. Stop it, or change `"3000:3000"` to `"3001:3000"` in `docker-compose.yml` and open http://localhost:3001. |
| The phone can't open the claim link | Check both devices are on the same Wi-Fi, that `APP_URL` has your current IP, and that you rebuilt with `--build`. Some office or café Wi-Fi blocks devices from reaching each other: use your phone's hotspot instead. |
| Offers stay "Queued" | Quiet hours are on (11 pm to 7 am by default). Change them in **Settings → General**. |
