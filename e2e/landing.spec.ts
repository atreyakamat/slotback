import { expect, test } from "@playwright/test";

test("a business owner can book a demo from the landing page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Book a demo" }).first().click();
  await expect(page).toHaveURL(/#demo$/);

  // Submitting empty explains what's missing.
  await page.getByRole("button", { name: "Book a demo" }).click();
  await expect(page.getByText("Tell us your name.")).toBeVisible();

  await page.getByLabel("Your name").fill("Asha Kamat");
  await page.getByLabel("Business name").fill(`E2E Studio ${Date.now()}`);
  await page.getByLabel("Email").fill("asha@example.com");
  await page.getByLabel("Type of business").selectOption("Salon");
  await page.getByRole("button", { name: "Book a demo" }).click();
  await expect(page.getByText(/we'll reach out within one working day/i)).toBeVisible();
});

test("FAQ answers open in place", async ({ page }) => {
  await page.goto("/");
  await page.getByText("How do you count recovered revenue?").click();
  await expect(page.getByText(/we never count a message sent as money earned/i)).toBeVisible();
});
