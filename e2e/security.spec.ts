import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

/**
 * Black-box attacks against the running app. Each test plays an outsider or a rival business
 * and checks the attempt fails safely: refused, not found, or rendered harmlessly.
 */

async function demoLogin(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /try the demo workspace/i }).click();
  await page.waitForURL(/\/app$/);
}

/** A fresh visitor IP, as Netlify's edge would report it, so rate-limit tests don't share buckets. */
function visitorIp() {
  const n = () => Math.floor(Math.random() * 250) + 1;
  return `198.18.${n()}.${n()}`;
}

test.describe("attack: missing browser protections", () => {
  for (const path of ["/", "/login", "/api/health", "/join/notarealcode"]) {
    test(`security headers are sent on ${path}`, async ({ request }) => {
      const res = await request.get(path);
      const h = res.headers();
      expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
      expect(h["content-security-policy"]).toContain("object-src 'none'");
      expect(h["content-security-policy"]).toContain("base-uri 'self'");
      expect(h["content-security-policy"]).toContain("form-action 'self'");
      expect(h["strict-transport-security"]).toMatch(/max-age=\d{8}/);
      expect(h["x-frame-options"]).toBe("DENY");
      expect(h["x-content-type-options"]).toBe("nosniff");
      expect(h["referrer-policy"]).toBeTruthy();
      expect(h["cross-origin-opener-policy"]).toBe("same-origin");
      expect(h["x-powered-by"]).toBeUndefined();
    });
  }

  test("claim and invite links are never cached or leaked as referrers", async ({ request }) => {
    for (const path of ["/c/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "/invite/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"]) {
      const h = (await request.get(path)).headers();
      expect(h["cache-control"]).toContain("no-store");
      expect(h["referrer-policy"]).toBe("no-referrer");
      expect(h["x-robots-tag"]).toContain("noindex");
    }
  });

  test("the session cookie can't be read by scripts or sent cross-site", async ({ page, context }) => {
    await demoLogin(page);
    const cookie = (await context.cookies()).find((c) => c.name.endsWith("slotback_session"));
    expect(cookie).toBeTruthy();
    expect(cookie!.name).toBe("__Host-slotback_session");
    expect(cookie!.httpOnly).toBe(true);
    expect(cookie!.secure).toBe(true);
    expect(cookie!.sameSite).toBe("Lax");
    expect(cookie!.path).toBe("/");
    expect(await page.evaluate(() => document.cookie)).not.toContain("slotback_session");
  });

  test("the app can't be framed (clickjacking)", async ({ page }) => {
    await page.setContent(`<iframe id="f" src="${test.info().project.use.baseURL}/login"></iframe>`);
    await page.waitForTimeout(1000);
    const frame = page.frames().find((f) => f.url().includes("/login"));
    const framedContent = frame ? await frame.locator("body").innerText().catch(() => "") : "";
    expect(framedContent).not.toContain("Email me a sign-in link");
  });
});

test.describe("attack: getting in without signing in", () => {
  test("forged, unsigned and tampered session cookies are refused", async ({ context, page, baseURL }) => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(JSON.stringify({ userId: "x", organizationId: "x", locationId: "x", sv: 0 })).toString("base64url");
    for (const value of [`${header}.${body}.`, "garbage", `${header}.${body}.c2lnbmF0dXJl`]) {
      await context.clearCookies();
      await context.addCookies([{ name: "__Host-slotback_session", value, url: baseURL!.replace("http://", "https://"), secure: true, httpOnly: true }]);
      await page.goto("/app");
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test("signing out of a real business kills copies of the cookie", async ({ page, context, baseURL }) => {
    const email = `sec-${randomUUID().slice(0, 8)}@example.com`;
    await page.goto("/signup");
    await page.getByLabel("Your name").fill("Rival Owner");
    await page.getByLabel("Business name").fill("Rival Clinic");
    await page.getByLabel("Type of business").selectOption("skin");
    await page.getByLabel("Work email").fill(email);
    await page.getByRole("button", { name: "Create my account" }).click();
    await page.getByRole("link", { name: "Open sign-in link" }).click();
    await expect(page.getByRole("heading", { name: "When are you open?" })).toBeVisible();
    const stolen = (await context.cookies()).find((c) => c.name === "__Host-slotback_session")!;

    await page.goto("/app/settings");
    // Keyboard, so the phone layout's sticky header can't get in the way of a pointer click.
    await page.locator('button[aria-label="Sign out"]:visible').first().press("Enter");
    await page.waitForURL(/\/login/);

    await context.addCookies([{ name: stolen.name, value: stolen.value, url: baseURL!.replace("http://", "https://"), secure: true, httpOnly: true }]);
    await page.goto("/app");
    await expect(page).toHaveURL(/\/login/);
  });

  test("every signed-in API refuses anonymous and junk tokens", async ({ request }) => {
    const paths = ["/api/mobile/me", "/api/mobile/today", "/api/mobile/schedule", "/api/mobile/waitlist", "/api/mobile/campaigns/x"];
    for (const auth of [undefined, "Bearer ", "Bearer x", `Bearer ${"a".repeat(43)}`, "Basic YWRtaW46YWRtaW4=", `Bearer ' OR 1=1 --`]) {
      for (const path of paths) {
        const res = await request.get(path, { headers: auth ? { Authorization: auth } : {} });
        expect(res.status(), `${path} with ${auth}`).toBe(401);
      }
    }
    const exported = await request.get("/app/analytics/export", { maxRedirects: 0 });
    expect(exported.status()).toBe(307);
    expect(exported.headers()["location"]).toContain("/login");
  });

  test("the scheduler endpoint needs its secret", async ({ request }) => {
    expect((await request.post("/api/cron/tick")).status()).toBe(401);
    expect((await request.post("/api/cron/tick", { headers: { Authorization: "Bearer wrong" } })).status()).toBe(401);
    expect((await request.get("/api/cron/tick")).status()).toBe(405);
  });

  test("the WhatsApp webhook refuses unsigned and mis-signed calls", async ({ request }) => {
    const body = JSON.stringify({ entry: [{ changes: [{ value: { messages: [{ from: "919000000000", type: "text", text: { body: "STOP" } }] } }] }] });
    expect((await request.post("/api/webhooks/whatsapp", { data: body, headers: { "content-type": "application/json" } })).status()).toBe(403);
    expect(
      (
        await request.post("/api/webhooks/whatsapp", {
          data: body,
          headers: { "content-type": "application/json", "x-hub-signature-256": `sha256=${"0".repeat(64)}` },
        })
      ).status(),
    ).toBe(403);
    expect((await request.get("/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=guess&hub.challenge=pwned")).status()).toBe(403);
  });
});

test.describe("attack: one business reading another's data", () => {
  test("a rival business gets 404s for the demo salon's bookings and refills", async ({ page, browser, request }) => {
    // Collect real ids from the demo salon through its phone API.
    const { token } = await (await request.post("/api/mobile/demo")).json();
    const auth = { Authorization: `Bearer ${token}` };
    const tomorrow = new Date(Date.now() + 5.5 * 3600_000 + 86_400_000).toISOString().slice(0, 10);
    const schedule = await (await request.get(`/api/mobile/schedule?date=${tomorrow}`, { headers: auth })).json();
    const appointment = schedule.staff.flatMap((s: { appointments: { id: string }[] }) => s.appointments)[0];
    expect(appointment, "the demo seed books appointments tomorrow").toBeTruthy();
    const waitlist = await (await request.get("/api/mobile/waitlist", { headers: auth })).json();

    // Sign up a separate business.
    const rival = await (await browser.newContext()).newPage();
    await rival.goto("/signup");
    await rival.getByLabel("Your name").fill("Rival Owner");
    await rival.getByLabel("Business name").fill("Rival Spa");
    await rival.getByLabel("Type of business").selectOption("skin");
    await rival.getByLabel("Work email").fill(`rival-${randomUUID().slice(0, 8)}@example.com`);
    await rival.getByRole("button", { name: "Create my account" }).click();
    await rival.getByRole("link", { name: "Open sign-in link" }).click();
    await expect(rival.getByRole("heading", { name: "When are you open?" })).toBeVisible();

    for (const path of [`/app/appointments/${appointment.id}`, `/app/campaigns/${appointment.id}`]) {
      await rival.goto(path);
      // Streamed pages can't change the status code once sent, so check what's on screen.
      await expect(rival.getByText(/could not be found|not found/i).first()).toBeVisible();
      await expect(rival.getByText(appointment.customer, { exact: true })).toHaveCount(0);
      await expect(rival.getByText(appointment.service, { exact: true })).toHaveCount(0);
    }
    await rival.goto("/app/waitlist");
    for (const entry of (waitlist.entries ?? []).slice(0, 5)) {
      await expect(rival.getByText(entry.name, { exact: true })).toHaveCount(0);
    }
    void page;
  });
});

test.describe("attack: injection", () => {
  test("script in a client's name is shown as text, never run", async ({ page, browser }) => {
    await demoLogin(page);
    await page.goto("/app/waitlist/share");
    const url = (await page.locator("p.font-mono").innerText()).trim();

    const payload = `<img src=x onerror="window.__pwned=1">${Date.now().toString().slice(-5)}`;
    const client = await (await browser.newContext()).newPage();
    await client.goto(new URL(url).pathname);
    await client.getByLabel("Your name").fill(payload);
    await client.getByLabel("Mobile number").fill(`9${String(Date.now()).slice(-9)}`);
    await client.getByLabel("Message me on WhatsApp").check();
    await client.getByRole("button", { name: "Join the waitlist" }).click();
    await expect(client.getByRole("heading", { name: "You're on the list" })).toBeVisible();

    let dialog = false;
    page.on("dialog", () => (dialog = true));
    await page.goto("/app/waitlist");
    await expect(page.getByText(payload)).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
    expect(await page.locator('img[src="x"]').count()).toBe(0);
    expect(dialog).toBe(false);
  });

  test("SQL and path tricks in URLs fail cleanly, never with a server error", async ({ request }) => {
    const { token } = await (await request.post("/api/mobile/demo")).json();
    const auth = { Authorization: `Bearer ${token}` };
    const probes = [
      "/api/mobile/schedule?date=' OR '1'='1",
      "/api/mobile/schedule?date=2026-13-45",
      "/api/mobile/schedule?date=../../etc/passwd",
      `/api/mobile/campaigns/${encodeURIComponent("' OR 1=1 --")}`,
      `/api/mobile/campaigns/${encodeURIComponent("1; DROP TABLE users")}`,
      "/api/mobile/campaigns/%00",
    ];
    for (const path of probes) {
      const res = await request.get(path, { headers: auth });
      expect(res.status(), path).toBeGreaterThanOrEqual(400);
      expect(res.status(), path).toBeLessThan(500);
    }
    for (const path of ["/c/' OR 1=1 --", "/c/<script>alert(1)</script>", "/join/..%2F..%2Fetc%2Fpasswd", "/invite/%27%3B--"]) {
      const res = await request.get(path);
      expect(res.status(), path).toBeLessThan(500);
      expect(await res.text()).not.toContain("<script>alert(1)</script>");
    }
  });

  test("oversized and malformed API bodies are refused", async ({ request }) => {
    const { token } = await (await request.post("/api/mobile/demo")).json();
    const auth = { Authorization: `Bearer ${token}`, "content-type": "application/json" };
    const huge = await request.post("/api/mobile/waitlist", { headers: auth, data: JSON.stringify({ name: "x".repeat(100_000) }) });
    expect(huge.status()).toBe(422);
    for (const data of ["not json", "[]", "null", '{"name": {"$gt": ""}}']) {
      const res = await request.post("/api/mobile/waitlist", { headers: auth, data });
      expect(res.status(), data).toBe(422);
    }
  });
});

test.describe("attack: brute force", () => {
  test("guessing phone pairing codes gets locked out", async ({ request }) => {
    const ip = visitorIp();
    const statuses: number[] = [];
    for (let i = 0; i < 14; i++) {
      const res = await request.post("/api/mobile/pair", {
        headers: { "x-nf-client-connection-ip": ip },
        data: { code: randomUUID().replace(/-/g, "").padEnd(43, "a") },
      });
      statuses.push(res.status());
    }
    expect(statuses.slice(0, 10).every((s) => s === 422)).toBe(true);
    expect(statuses.slice(10).every((s) => s === 429)).toBe(true);
  });

  test("hammering sign-in for one email gets locked out", async ({ page }) => {
    const email = `flood-${randomUUID().slice(0, 8)}@example.com`;
    for (let i = 0; i < 6; i++) {
      await page.goto("/login");
      await page.getByLabel("Work email").fill(email);
      await page.getByRole("button", { name: "Email me a sign-in link" }).click();
      if (i < 5) await expect(page.getByRole("link", { name: "Open sign-in link" })).toBeVisible();
    }
    await expect(page.getByText("Too many sign-in requests")).toBeVisible();
  });
});
