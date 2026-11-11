import { expect, test } from "@playwright/test";

test("an owner connects a booking tool, which syncs a booking and a cancellation", async ({ page, request }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /try the demo workspace/i }).click();
  await page.waitForURL(/\/app$/);
  await page.goto("/app/settings/integrations");
  await page.getByLabel("Name").fill(`Zapier ${Date.now() % 10000}`);
  await page.getByRole("button", { name: "Create key" }).click();
  await expect(page.getByText("Copy the key now")).toBeVisible();
  const key = (await page.locator("code").filter({ hasText: /^sbk_/ }).innerText()).trim();
  expect(key).toMatch(/^sbk_/);

  const auth = { Authorization: `Bearer ${key}` };
  const ping = await (await request.get("/api/integrations/v1/ping", { headers: auth })).json();
  expect(ping).toMatchObject({ ok: true, business: "Casa Verde Salon" });

  // A service that exists in the demo salon.
  const { token } = await (await request.post("/api/mobile/demo")).json();
  const { services } = await (await request.get("/api/mobile/waitlist", { headers: { Authorization: `Bearer ${token}` } })).json();
  const service = services[0].name as string;

  // Far enough ahead that the demo calendar is empty.
  const day = new Date(Date.now() + (40 + Math.floor(Math.random() * 300)) * 86_400_000).toISOString().slice(0, 10);
  const booking = { externalId: `e2e-${Date.now()}`, status: "booked", startAt: `${day}T11:00:00+05:30`, service, customer: { name: "Synced Sana", phone: "9812345678" } };
  const created = await request.post("/api/integrations/v1/bookings", { headers: auth, data: booking });
  expect(created.status()).toBe(200);
  const { appointmentId } = await created.json();

  const cancelled = await request.post("/api/integrations/v1/bookings", { headers: auth, data: { ...booking, status: "cancelled", cancelReason: "Unwell" } });
  expect(cancelled.status()).toBe(200);
  expect((await cancelled.json()).status).toBe("CANCELLED");

  await page.goto(`/app/appointments/${appointmentId}`);
  await expect(page.getByText("Synced Sana").first()).toBeVisible();

  // Attacks on the same API.
  expect((await request.post("/api/integrations/v1/bookings", { data: booking })).status()).toBe(401);
  expect((await request.post("/api/integrations/v1/bookings", { headers: { Authorization: `Bearer ${key}x` }, data: booking })).status()).toBe(401);
  expect((await request.post("/api/integrations/v1/bookings", { headers: { ...auth, "content-type": "application/json" }, data: "{not json" })).status()).toBe(422);
  expect((await request.post("/api/integrations/v1/bookings", { headers: auth, data: { ...booking, externalId: "'; DROP TABLE appointments; --" } })).status()).toBe(422);
  expect((await request.post("/api/integrations/v1/bookings", { headers: auth, data: { ...booking, startAt: "tomorrow" } })).status()).toBe(422);

  // Removing the connection kills the key.
  await page.goto("/app/settings/integrations");
  const card = page.locator("details").last();
  await card.locator("summary").click();
  await card.getByRole("button", { name: "Remove connection" }).click();
  await expect(page.getByText("Its key stops working now")).toBeVisible();
  expect((await request.get("/api/integrations/v1/ping", { headers: auth })).status()).toBe(401);
});
