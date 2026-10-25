import { expect, test } from "@playwright/test";

test("a client joins from the shared link, and the owner imports a list", async ({ page, browser }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /try the demo workspace/i }).click();
  await page.waitForURL(/\/app$/);
  await page.goto("/app/waitlist");
  await page.getByRole("link", { name: "Share join link" }).click();
  await expect(page.getByRole("heading", { name: "Grow your waitlist" })).toBeVisible();
  const url = (await page.locator("p.font-mono").innerText()).trim();
  expect(url).toMatch(/\/join\/[a-z0-9]+$/);

  // A client on their own phone, signed out.
  const client = await (await browser.newContext()).newPage();
  await client.goto(new URL(url).pathname);
  await expect(client.getByRole("heading", { name: /Want an earlier slot at Casa Verde Salon/ })).toBeVisible();
  const phone = `9${String(Date.now()).slice(-9)}`;
  const wendy = `Walk-in Wendy ${phone.slice(-4)}`;
  await client.getByLabel("Your name").fill(wendy);
  await client.getByLabel("Mobile number").fill(phone);
  await client.getByText("Sat", { exact: true }).click();
  await client.getByText("Evenings").click();
  await client.getByRole("button", { name: "Join the waitlist" }).click();
  await expect(client.getByText("Tick WhatsApp or SMS")).toBeVisible();
  await client.getByLabel("Message me on WhatsApp").check();
  await client.getByRole("button", { name: "Join the waitlist" }).click();
  await expect(client.getByRole("heading", { name: "You're on the list" })).toBeVisible();

  await page.goto("/app/waitlist");
  await expect(page.getByText(wendy)).toBeVisible();

  await page.getByRole("link", { name: "Import" }).click();
  const importPhone = `8${String(Date.now()).slice(-9)}`;
  const ian = `Imported Ian ${importPhone.slice(-4)}`;
  await page.getByLabel("Or paste your list").fill(`Name,Phone\n${ian},${importPhone}\nNo Number,`);
  await page.getByRole("button", { name: "Import clients" }).click();
  await expect(page.getByText("Import finished: 1 added, 1 skipped.")).toBeVisible();
  await expect(page.getByText("Row 3: Missing phone")).toBeVisible();
  await page.getByRole("link", { name: "See your waitlist" }).click();
  await expect(page.getByText(ian)).toBeVisible();
});

test("an unknown join link explains itself", async ({ page }) => {
  await page.goto("/join/notarealcode");
  await expect(page.getByRole("heading", { name: "This link isn't active" })).toBeVisible();
});
