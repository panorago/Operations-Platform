import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
test("all routes and purchasing, payment, stock and settings workflows", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  expect((await page.request.get("/api/state")).status()).toBe(401);
  expect((await page.request.get("/api/health")).status()).toBe(200);
  const blocked = await page.request.post("/api/setup", {
    data: {
      name: "Wrong key",
      email: "blocked@example.test",
      password: randomUUID(),
      setupToken: "incorrect",
    },
  });
  expect(blocked.status()).toBe(403);
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Welcome to VENDA" }),
  ).toBeVisible();
  await page
    .getByLabel("Workspace setup key", { exact: true })
    .fill("venda-e2e-only-setup-token");
  await page.getByLabel("Full name", { exact: true }).fill("Tariro Moyo");
  await page.getByLabel("Work email").fill("admin@freshmark.test");
  await page.getByLabel("Password", { exact: true }).fill(randomUUID());
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Good day, Tariro ." }),
  ).toBeVisible();
  await page.screenshot({ path: ".runtime/dashboard.png", fullPage: true });
  expect((await page.request.post("/api/ai")).status()).toBe(503);
  const monitor = await page.request.get("/api/monitor");
  expect(monitor.ok()).toBeTruthy();
  expect((await monitor.json()).providerReady).toBe(false);
  expect((await page.request.post("/api/monitor/analyze")).status()).toBe(503);
  await page
    .getByRole("link", { name: "Supplier catalogue", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Supplier catalogue", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search products", { exact: true }).fill("Fresh Milk");
  await page
    .getByRole("button", { name: "Add Fresh Milk 2L to order", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Shop on credit", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Place $2.07 order", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("link", { name: "Orders", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Orders", exact: true }),
  ).toBeVisible();
  await page
    .locator("tbody tr")
    .first()
    .getByRole("button", { name: "View →" })
    .click();
  for (const status of ["Process", "Dispatch", "Receive"])
    await page.getByRole("button", { name: status, exact: true }).click();
  await expect(
    page.getByRole("dialog").getByText("Delivered", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("link", { name: "Inventory", exact: true }).click();
  await page.getByLabel("Search inventory", { exact: true }).fill("Fresh Milk");
  await expect(page.locator("tbody")).toContainText("85");
  await page
    .getByRole("link", { name: "Credit & payments", exact: true })
    .click();
  await page
    .locator("tbody tr")
    .first()
    .getByRole("button", { name: "Pay now", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Record $2.07 payment", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("link", { name: "Live tracking", exact: true }).click();
  await page.getByRole("button", { name: "Track ZW-06", exact: true }).click();
  await expect(page.getByText("K. Sibanda", { exact: true })).toBeVisible();
  const manifest = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download manifest", exact: true })
    .click();
  expect((await manifest).suggestedFilename()).toBe("ZW-06-manifest.csv");
  await page.getByRole("link", { name: /Alerts & reminders/ }).click();
  await page
    .getByRole("button", { name: "Mark all read", exact: true })
    .click();
  await expect(page.getByText("0 unread", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page
    .getByLabel("Company phone", { exact: true })
    .fill("+263 242 700 200");
  await page.getByRole("button", { name: "Save company details" }).click();
  await page.reload();
  await expect(page.getByLabel("Company phone", { exact: true })).toHaveValue(
    "+263 242 700 200",
  );
  await page.getByRole("button", { name: "Notifications settings" }).click();
  await page
    .getByRole("switch", { name: "Stock sms notifications", exact: true })
    .click();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await page.getByRole("button", { name: "Users settings" }).click();
  await page.getByRole("button", { name: "Invite user", exact: true }).click();
  await page.getByLabel("New user name", { exact: true }).fill("Finance User");
  await page
    .getByLabel("New user email", { exact: true })
    .fill("finance@freshmark.test");
  const pw = randomUUID();
  await page.getByLabel("New user password", { exact: true }).fill(pw);
  await page.getByLabel("Role", { exact: true }).selectOption("Finance");
  await page.getByRole("button", { name: "Create user account" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const finance = await page.context().request.post("/api/login", {
    data: { email: "finance@freshmark.test", password: pw },
  });
  expect(finance.ok()).toBeTruthy();
  const denied = await page.request.post("/api/commands", {
    data: {
      type: "checkout",
      items: [{ productId: "prod-1-1", qty: 1, credit: false }],
      mode: "pay",
      method: "EcoCash",
      terms: 30,
    },
  });
  expect(denied.status()).toBe(400);
  expect(await denied.json()).toMatchObject({
    error: "Operations access required",
  });
  expect(errors).toEqual([]);
  await page.screenshot({
    path: ".runtime/browser-settings.png",
    fullPage: true,
  });
});
