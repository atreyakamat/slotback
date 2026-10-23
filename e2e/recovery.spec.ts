import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("cancel → refill → customer claims on their phone → slot is refilled", async ({ page, browser }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Drives a desktop staff session plus a separate phone context.");

  await page.goto("/login");
  await page.getByRole("button", { name: /try the demo workspace/i }).click();
  await page.waitForURL(/\/app$/);

  // Fresh demo so the slot and waitlist are predictable.
  await page.goto("/app/settings");
  await page.getByRole("button", { name: "Reset demo data" }).click();
  await page.waitForURL(/\/app\?reset=1$/);

  // Open tomorrow's schedule and pick a booked appointment in the afternoon.
  const tomorrow = new Date(Date.now() + 24 * 3600_000).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  await page.goto(`/app/schedule?date=${tomorrow}`);
  const appointment = page.locator('a[href^="/app/appointments/"]', { hasText: /(1|2|3|4):\d\d pm/ }).first();
  await appointment.click();
  await expect(page.getByRole("button", { name: "Cancel appointment" })).toBeVisible();

  // Staff action 1 and 2: cancel and refill.
  await page.getByRole("button", { name: "Cancel appointment" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Cancel and refill" }).click();
  await page.waitForURL(/\/app\/campaigns\//);
  await expect(page.getByText("Ready to launch")).toBeVisible();
  await expect(page.getByText("WhatsApp / SMS preview")).toBeVisible();

  // The demo always has flexible waitlisters, so there is someone to offer it to.
  const launch = page.getByRole("button", { name: /^Launch: offer to/ });
  await expect(launch).toBeVisible();

  // Staff action 3: launch.
  await launch.click();
  await expect(page.getByText("Offering", { exact: true })).toBeVisible();
  await expect(page.getByText("Demo inbox")).toBeVisible();

  const href = await page.getByRole("link", { name: /Open claim link as/ }).first().getAttribute("href");
  expect(href).toMatch(/^\/c\/[A-Za-z0-9_-]{43}$/);

  // The customer opens the link on a phone, with no account.
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const customer = await phone.newPage();
  await customer.goto(`${testInfo.project.use.baseURL}${href}`);
  await expect(customer.getByText("First to confirm gets it.")).toBeVisible();
  await customer.getByRole("button", { name: "Claim this slot" }).click();
  await expect(customer.getByRole("heading", { name: "You're booked." })).toBeVisible();
  await phone.close();

  // Staff see the outcome without reloading.
  await expect(page.getByText("Refilled", { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/claimed this opening/)).toBeVisible();
});

test("invalid claim links explain themselves", async ({ page }) => {
  await page.goto(`/c/${"x".repeat(43)}`);
  await expect(page.getByRole("heading", { name: "This link isn't valid" })).toBeVisible();
});
