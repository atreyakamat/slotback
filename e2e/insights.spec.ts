import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /try the demo workspace/i }).click();
  await page.waitForURL(/\/app$/);
});

test("Today leads with recovered revenue and recent recoveries", async ({ page }) => {
  await expect(page.getByText(/recovered by slotback · last 30 days/i)).toBeVisible();
  await expect(page.getByText("Latest recoveries")).toBeVisible();
  await expect(page.getByText(/refilled in \d+ min/).first()).toBeVisible();
});

test("analytics shows the funnel and exports a CSV", async ({ page }) => {
  await page.goto("/app/analytics");
  await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
  await expect(page.getByText("Recovery funnel")).toBeVisible();
  await expect(page.getByText("Fill rate", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Last 7 days" }).click();
  await expect(page).toHaveURL(/days=7/);

  const response = await page.request.get("/app/analytics/export?days=30");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/csv");
  const csv = (await response.text()).replace(/^﻿/, "");
  const [header, first] = csv.split("\r\n");
  expect(header).toBe(
    "Date,Time,Service,Staff,Value (INR),Outcome,Offers sent,Offers opened,Claimed by,Minutes to refill,Visit status",
  );
  expect(first.split(",").length).toBeGreaterThanOrEqual(11);
});

test("the activity log explains who did what", async ({ page }) => {
  await page.goto("/app/settings/activity?type=recovery");
  await expect(page.getByText("Activity log", { exact: true })).toBeVisible();
  await expect(page.getByText(/sent offers for/).first()).toBeVisible();
  await expect(page.getByText(/claimed/).first()).toBeVisible();
});

test("CSV export requires a session", async ({ browser }) => {
  const context = await browser.newContext();
  const response = await context.request.get("/app/analytics/export", { maxRedirects: 0 });
  expect([307, 401]).toContain(response.status());
  await context.close();
});
