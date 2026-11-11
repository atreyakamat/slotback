import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

/** A far-future day, different per run and project, so runs never collide with each other or the seed. */
function testDate(run: number, project: string) {
  const d = new Date(Date.UTC(2027, 0, 4 + (run % 300) * 2 + (project === "mobile" ? 1 : 0)));
  return d.toISOString().slice(0, 10);
}

test("staff can book, open, move and cancel an appointment", async ({ page }, testInfo) => {
  // Unique per run and per project, since all runs share the demo database.
  const run = `${Date.now() % 100000}`.padStart(5, "0");
  const guest = `E2E Guest ${testInfo.project.name} ${run}`;
  const date = testDate(Number(run), testInfo.project.name);
  await page.goto("/login");
  await page.getByRole("button", { name: /try the demo workspace/i }).click();
  await page.waitForURL(/\/app$/);

  await page.goto(`/app/schedule?date=${date}`);
  await page.getByRole("button", { name: "Book Ryan Fernandes at 11 am" }).click();

  const dialog = page.getByRole("dialog", { name: "New appointment" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("radio", { name: "New customer" }).click();
  await dialog.getByLabel("Name").fill(guest);
  await dialog.getByLabel("Mobile").fill(`90000 ${run}`);
  await dialog.getByRole("button", { name: "Book appointment" }).click();
  await expect(dialog).toBeHidden();

  const block = page.getByRole("link", { name: new RegExp(guest) });
  await expect(block).toBeVisible();

  // A second booking on top of it is refused with a clear message.
  await page.getByRole("button", { name: "New appointment" }).click();
  const again = page.getByRole("dialog", { name: "New appointment" });
  await again.getByRole("radio", { name: "Walk-in" }).click();
  await again.getByLabel("Staff").selectOption({ label: "Ryan Fernandes" });
  await again.getByLabel("Date").fill(date);
  await again.getByLabel("Start time").fill("11:15");
  await again.getByRole("button", { name: "Book appointment" }).click();
  await expect(again.getByRole("alert")).toContainText("overlaps another appointment");
  await again.getByRole("button", { name: "Close" }).click();

  await block.click();
  await expect(page.getByRole("heading", { name: guest })).toBeVisible();
  await expect(page.getByText("Booked", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Move" }).click();
  const move = page.getByRole("dialog", { name: "Move appointment" });
  await move.getByLabel("Start time").fill("13:00");
  await move.getByRole("button", { name: "Move appointment" }).click();
  await expect(move).toBeHidden();
  await expect(page.getByText(/, 1:00 pm – 1:45 pm/)).toBeVisible();
  await expect(page.getByText("Moved")).toBeVisible();

  await page.getByRole("button", { name: "Cancel appointment" }).click();
  const cancel = page.getByRole("dialog", { name: /try to refill the opening/ });
  await cancel.getByLabel("Reason (optional)").fill("E2E check");
  await cancel.getByRole("button", { name: "Cancel without refilling" }).click();
  await expect(cancel).toBeHidden();
  await expect(page.getByText("Cancelled", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("E2E check")).toBeVisible();
});
