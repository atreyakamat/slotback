import { expect, test } from "@playwright/test";

const randomMobile = () => `98${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`;

test("a patient books online, confirms, then cancels from their link", async ({ page }) => {
  // Make sure the demo workspaces exist.
  await page.goto("/login");
  await page.getByRole("button", { name: /dental clinic demo/i }).click();
  await page.waitForURL(/\/app$/);

  await page.goto("/book/smile-studio-demo");
  await expect(page.getByRole("heading", { name: /smile studio dental/i })).toBeVisible();
  await page.getByRole("link", { name: /consultation/i }).click();

  // Tomorrow or the next open day always has free times.
  await page.getByRole("list", { name: "Days" }).getByRole("listitem").nth(1).click();
  await page.locator("section[aria-label] a").first().click();

  await page.getByLabel("Full name").fill("Test Patient");
  await page.getByLabel("WhatsApp number").fill(randomMobile());
  await page.getByRole("button", { name: "Book appointment" }).click();

  await expect(page).toHaveURL(/\/a\/[A-Za-z0-9_-]+\?booked=1$/);
  await expect(page.getByText(/you're booked/i)).toBeVisible();

  await page.getByRole("button", { name: /i'll be there/i }).click();
  await expect(page.getByText(/you've confirmed/i)).toBeVisible();

  await page.getByRole("link", { name: "Cancel" }).click();
  await page.getByRole("button", { name: "Yes, cancel" }).click();
  await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /book another time/i })).toBeVisible();
});

test("an unknown booking link shows not found", async ({ page }) => {
  // The page shell streams first (partial prerendering), so check the rendered not-found UI, not the status code.
  await page.goto("/book/does-not-exist");
  await expect(page.getByText(/could not be found/i)).toBeVisible();
  await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
});

test("clinic staff see reminders, confirmations and the message log", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /dental clinic demo/i }).click();
  await page.waitForURL(/\/app$/);
  await expect(page.getByText("No-show rate, 30 days")).toBeVisible();

  await page.goto("/app/appointments");
  await expect(page.getByRole("heading", { name: "Appointments" })).toBeVisible();
  await expect(page.getByText(/reminder scheduled|reminded|confirmed/i).first()).toBeVisible();

  await page.goto("/app/messages");
  await expect(page.getByText(/whatsapp is in test mode/i)).toBeVisible();
  await expect(page.getByText("Reminder", { exact: false }).first()).toBeVisible();

  await page.goto("/app/settings");
  await expect(page.getByRole("img", { name: /qr code/i })).toBeVisible();
});

test("the cron endpoint refuses requests without the secret", async ({ request }) => {
  const res = await request.post("/api/cron/deliver");
  expect([401, 503]).toContain(res.status());
});
