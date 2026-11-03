import { test, expect } from "@playwright/test";
test("GitHub Pages preview renders all eight routes without a server and persists local changes", async ({
  page,
}) => {
  const errors: string[] = [];
  const apiRequests: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (new URL(r.url()).pathname.startsWith("/api/"))
      apiRequests.push(r.url());
  });
  await page.goto("/Operations-Platform/");
  await expect(
    page.getByRole("heading", { name: "Good day, Dylan ." }),
  ).toBeVisible();
  await expect(page.getByText("VENDA PREVIEW", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create workspace" }),
  ).toHaveCount(0);
  for (const [link, heading] of [
    ["Live tracking", "Live truck tracking"],
    ["Supplier catalogue", "Supplier catalogue"],
    ["Orders", "Orders"],
    ["Inventory", "Inventory"],
    ["Credit & payments", "Credit & payments"],
    ["Alerts & reminders", "Alerts & reminders"],
    ["Settings", "Settings"],
  ] as const) {
    await page.getByRole("link", { name: link, exact: true }).click();
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
  }
  await page
    .getByLabel("Company phone", { exact: true })
    .fill("+263 242 123 456");
  await page.getByRole("button", { name: "Save company details" }).click();
  await page.reload();
  await expect(page.getByLabel("Company phone", { exact: true })).toHaveValue(
    "+263 242 123 456",
  );
  await page
    .getByRole("link", { name: "Supplier catalogue", exact: true })
    .click();
  await page.getByLabel("Search products", { exact: true }).fill("Fresh Milk");
  await page
    .getByRole("button", { name: "Add Fresh Milk 2L to order", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Shop on credit", exact: true })
    .click();
  await expect(
    page.getByText("Reminder schedule preview", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Place $2.07 order", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("link", { name: "Orders", exact: true }).click();
  await expect(page.locator("tbody tr").first()).toContainText("$2.07");
  await page.reload();
  await expect(page.locator("tbody tr").first()).toContainText("$2.07");
  await page.getByRole("link", { name: "Live tracking", exact: true }).click();
  await page.getByRole("button", { name: "Track ZW-01", exact: true }).click();
  await expect(page.getByText("Order ORD-1040", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Toggle full manifest" }).click();
  await expect(
    page.getByText("Cream Cheese 180g", { exact: false }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Inventory", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Operations monitor", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Live stock & credit checks · AI not connected", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Inventory intelligence" }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await page.screenshot({
    path: ".runtime/pages-dashboard.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test("bulk quantities, input price bounds, interest consent and moving truck controls work", async ({
  page,
}) => {
  await page.goto("/Operations-Platform/");
  await expect(
    page.getByRole("heading", { name: "Good day, Dylan ." }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Supplier catalogue", exact: true })
    .click();
  await expect(page.getByRole("slider")).toHaveCount(0);
  await page.getByLabel("Minimum unit price", { exact: true }).fill("1.80");
  await page.getByLabel("Maximum unit price", { exact: true }).fill("1.80");
  await page.getByLabel("Search products", { exact: true }).fill("Fresh Milk");
  await expect(
    page.getByRole("img", {
      name: "Fresh Milk 2L — illustrative product photograph",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Order quantity Fresh Milk 2L", { exact: true })
    .fill("250");
  await page
    .getByRole("button", { name: "Add Fresh Milk 2L to order", exact: true })
    .click();
  await expect(
    page.getByLabel("Cart quantity Fresh Milk 2L", { exact: true }),
  ).toHaveValue("250");
  await page
    .getByLabel("Cart quantity Fresh Milk 2L", { exact: true })
    .fill("100");
  await expect(
    page.getByLabel("Order quantity Fresh Milk 2L", { exact: true }),
  ).toHaveValue("100");
  await page.screenshot({
    path: ".runtime/catalogue-updated.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Credits settings" }).click();
  await page.getByLabel("Enable credit interest", { exact: true }).check();
  await page
    .getByLabel("Annual credit interest rate", { exact: true })
    .fill("36.5");
  await page
    .getByRole("button", { name: "Save credit policy", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Supplier catalogue", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Shop on credit", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Place $213.21 order", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("Accept credit interest terms", { exact: true })
    .check();
  await page
    .getByRole("button", { name: "Place $213.21 order", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("link", { name: "Live tracking", exact: true }).click();
  await page
    .getByRole("button", { name: "Pause fleet simulation", exact: true })
    .click();
  const marker = page.locator('.fleet-marker[title^="ZW-01 "]');
  await page.waitForTimeout(1100);
  const position = await marker.getAttribute("style");
  await page.waitForTimeout(1200);
  expect(await marker.getAttribute("style")).toBe(position);
  await page
    .getByRole("button", { name: "Play fleet simulation", exact: true })
    .click();
  await expect.poll(() => marker.getAttribute("style")).not.toBe(position);
  await page
    .getByLabel("Fleet simulation speed", { exact: true })
    .selectOption("4");
  await page
    .getByRole("button", { name: "Fit all trucks on map", exact: true })
    .click();
  await page.screenshot({
    path: ".runtime/tracking-updated.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await page
    .getByRole("button", { name: "Run transaction demo", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Stop transaction demo", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/24 units · Cash settlement/).first(),
  ).toBeVisible({ timeout: 11000 });
  await page
    .getByRole("button", { name: "Stop transaction demo", exact: true })
    .click();
});
