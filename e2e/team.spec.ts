import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

test("an owner invites a staff member, who joins with their own email", async ({ page, browser }) => {
  const id = randomUUID().slice(0, 8);
  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Olivia Dias");
  await page.getByLabel("Business name").fill(`Team Salon ${id}`);
  await page.getByLabel("Type of business").selectOption("salon");
  await page.getByLabel("Work email").fill(`owner-${id}@example.com`);
  await page.getByRole("button", { name: "Create my account" }).click();
  await page.getByRole("link", { name: "Open sign-in link" }).click();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Finish setup" }).click();
  await expect(page.getByRole("heading", { name: "Hello, Olivia" })).toBeVisible();

  await page.goto("/app/settings/team");
  await page.getByRole("button", { name: "Invite someone" }).click();
  await page.getByLabel("Name").fill("Riya Naik");
  await page.getByLabel("Email").fill(`riya-${id}@example.com`);
  await page.getByRole("button", { name: "Create invite link" }).click();
  const link = (await page.locator("p.font-mono").innerText()).trim();
  expect(link).toMatch(/\/invite\/[A-Za-z0-9_-]{43}$/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "Waiting to join" })).toBeVisible();

  // Riya, on her own phone.
  const riya = await (await browser.newContext()).newPage();
  await riya.goto(new URL(link).pathname);
  await expect(riya.getByRole("heading", { name: `Join Team Salon ${id}` })).toBeVisible();
  await expect(riya.getByLabel("Work email")).toHaveValue(`riya-${id}@example.com`);
  await riya.getByRole("button", { name: "Email me a link to join" }).click();
  await riya.getByRole("link", { name: "Open sign-in link" }).click();
  await expect(riya.getByRole("heading", { name: "Hello, Riya" })).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Role for Riya Naik")).toHaveValue("STAFF");
  await expect(page.getByRole("heading", { name: "Waiting to join" })).toHaveCount(0);
});
