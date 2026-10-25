import { expect, test } from "@playwright/test";

test("a visitor can open the demo workspace from the landing page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Make every opening count." })).toBeVisible();

  await page.getByRole("link", { name: /try the live demo/i }).click();
  await page.getByRole("button", { name: /try the demo workspace/i }).click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: /hello, maya/i })).toBeVisible();
  await expect(page.getByText("Active waitlist")).toBeVisible();
});

test("signed-out visitors are sent to sign in", async ({ page }) => {
  await page.goto("/app/settings");
  await expect(page).toHaveURL(/\/login$/);
});

test("theme choice persists across reloads", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /try the demo workspace/i }).click();
  await page.waitForURL(/\/app$/);

  await page.goto("/app/settings");
  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("radio", { name: "Dark" })).toHaveAttribute("aria-checked", "true");
});
