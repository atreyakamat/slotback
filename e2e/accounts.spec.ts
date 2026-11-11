import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

test("a new business signs up, confirms by email link and finishes setup", async ({ page }) => {
  const email = `e2e-${randomUUID().slice(0, 8)}@example.com`;
  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Priya Desai");
  await page.getByLabel("Business name").fill("Glow Skin Clinic");
  await page.getByLabel("Type of business").selectOption("skin");
  await page.getByLabel("City").fill("Margao");
  await page.getByLabel("Work email").fill(email);
  await page.getByRole("button", { name: "Create my account" }).click();

  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  // Locally, links are shown instead of emailed.
  await page.getByRole("link", { name: "Open sign-in link" }).click();

  await expect(page.getByRole("heading", { name: "When are you open?" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "What do you offer?" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Service name" }).first()).toHaveValue("Consultation");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "Who takes appointments?" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Staff member 1" })).toHaveValue("Priya");
  await page.getByRole("button", { name: "Add someone" }).click();
  await page.getByRole("textbox", { name: "Staff member 2" }).fill("Treatment room 1");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "How should openings be offered?" })).toBeVisible();
  await page.getByRole("button", { name: "Finish setup" }).click();

  await expect(page.getByRole("heading", { name: "Hello, Priya" })).toBeVisible();
  await expect(page.getByText("Three steps to your first refill")).toBeVisible();

  // Signing in again later goes straight to the app.
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel("Work email").fill(email);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await page.getByRole("link", { name: "Open sign-in link" }).click();
  await expect(page.getByRole("heading", { name: "Hello, Priya" })).toBeVisible();
});

test("an email without an account is sent to sign up", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Work email").fill(`stranger-${randomUUID().slice(0, 8)}@example.com`);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await page.getByRole("link", { name: "Open sign-in link" }).click();
  await expect(page.getByText("There's no SlotBack account for that email yet")).toBeVisible();
});

test("a tampered sign-in link is refused", async ({ page }) => {
  await page.goto("/auth/callback?dev_token=not-a-real-token");
  await expect(page.getByText("That sign-in link has expired or was already used")).toBeVisible();
});
