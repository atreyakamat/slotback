import { expect, test } from "@playwright/test";

test("the free toolkit is reachable from the landing page and its tools respond", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Free toolkit" }).last().click();
  await expect(page.getByRole("heading", { level: 1, name: /Empty Slot Rescue Kit/ })).toBeVisible();

  // Calculator: 4 cancels, 1 refilled, ₹1,000, 48 weeks = ₹1,44,000 a year.
  await expect(page.getByText("₹1,44,000")).toBeVisible();
  await page.getByLabel("How many of those you refill now").fill("0");
  await expect(page.getByText("₹1,92,000")).toBeVisible();

  // Templates pick up the business name.
  await page.getByLabel("Your business name").fill("Tara Physio");
  await expect(page.getByText(/A slot just opened at Tara Physio/)).toBeVisible();

  // Policy writer changes with the chosen rule.
  await page.getByRole("button", { name: "50% charge" }).click();
  await expect(page.getByText(/charged 50% of the service/)).toBeVisible();
});
