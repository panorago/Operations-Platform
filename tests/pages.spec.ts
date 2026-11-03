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
    page.getByRole("heading", { name: "Good day, Tariro ." }),
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
  await page
    .getByRole("button", { name: "Refresh AI suggestions", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Live AI is not connected",
  );
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await page.screenshot({
    path: ".runtime/pages-dashboard.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
  expect(apiRequests).toEqual([]);
});
