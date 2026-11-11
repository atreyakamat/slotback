import { expect, test } from "@playwright/test";

test("the phone app API pairs from a QR code and refills a cancelled slot", async ({ page, request }) => {
  // Unauthenticated calls are refused.
  expect((await request.get("/api/mobile/today")).status()).toBe(401);

  await page.goto("/login");
  await page.getByRole("button", { name: /try the demo workspace/i }).click();
  await page.waitForURL(/\/app$/);
  await page.goto("/app/settings/app");
  await page.getByRole("button", { name: "Show QR code" }).click();
  await expect(page.getByRole("img", { name: "QR code to connect the SlotBack app" })).toBeVisible();
  await expect(page.getByText(/Works for \d+:\d{2}/)).toBeVisible();

  // The demo endpoint stands in for scanning in this test.
  const { token } = await (await request.post("/api/mobile/demo")).json();
  const auth = { Authorization: `Bearer ${token}` };

  const me = await (await request.get("/api/mobile/me", { headers: auth })).json();
  expect(me.business).toMatchObject({ name: "Casa Verde Salon", isDemo: true });

  const today = await (await request.get("/api/mobile/today", { headers: auth })).json();
  expect(today.week).toHaveProperty("recoveredPaise");

  // Tomorrow in India, so the test doesn't depend on the time of day.
  const tomorrow = new Date(Date.now() + 5.5 * 3600_000 + 86_400_000).toISOString().slice(0, 10);
  const schedule = await (await request.get(`/api/mobile/schedule?date=${tomorrow}`, { headers: auth })).json();
  expect(schedule.date).toBe(tomorrow);
  const booked = schedule.staff
    .flatMap((s: { appointments: { id: string; status: string; startAt: string }[] }) => s.appointments)
    .find((a: { status: string; startAt: string }) => a.status === "BOOKED" && new Date(a.startAt).getTime() > Date.now() + 2 * 3600_000);
  expect(booked, "the demo seed books appointments tomorrow").toBeTruthy();

  const refill = await request.post(`/api/mobile/appointments/${booked.id}/refill`, { headers: auth, data: { reason: "Fever" } });
  expect(refill.ok()).toBe(true);
  const { campaignId } = await refill.json();
  const campaign = await (await request.get(`/api/mobile/campaigns/${campaignId}`, { headers: auth })).json();
  expect(campaign.status).toBe("DRAFT");
  expect(typeof campaign.eligibleCount).toBe("number");
  await request.post(`/api/mobile/campaigns/${campaignId}/stop`, { headers: auth });

  // Signing out kills the token.
  expect((await request.delete("/api/mobile/me", { headers: auth })).ok()).toBe(true);
  expect((await request.get("/api/mobile/me", { headers: auth })).status()).toBe(401);
});
