import { choose, completeOrder } from "./ui-helpers";
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
  await expect(
    page.getByText("DEVICE WORKSPACE", { exact: true }),
  ).toBeVisible();
  await expect(page.locator('a[href*="render.com"]')).toHaveCount(0);
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
  await page.getByRole("button", { name: "Users settings" }).click();
  await page.getByRole("button", { name: "Add member", exact: true }).click();
  await expect(
    page.getByLabel("New user password", { exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("New user name", { exact: true }).fill("Chipo Moyo");
  await page
    .getByLabel("New user email", { exact: true })
    .fill("chipo@example.test");
  await page.getByRole("button", { name: "Save member", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("tbody")).toContainText("Chipo Moyo");
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
  await choose(page, "Credit terms", "Net 15 days");
  await completeOrder(page, "$2.07");
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
  await page.getByRole("button", { name: "Review order", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Accept the interest terms",
  );
  await page
    .getByLabel("Accept credit interest terms", { exact: true })
    .check();
  await completeOrder(page, "$213.21");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("link", { name: "Live tracking", exact: true }).click();
  await page
    .getByRole("button", { name: "Pause fleet updates", exact: true })
    .click();
  const marker = page.locator('.fleet-marker[title^="ZW-01 "]');
  await page.waitForTimeout(1100);
  const position = await marker.getAttribute("style");
  await page.waitForTimeout(1200);
  expect(await marker.getAttribute("style")).toBe(position);
  await page
    .getByRole("button", { name: "Resume fleet updates", exact: true })
    .click();
  await expect.poll(() => marker.getAttribute("style")).not.toBe(position);
  await page
    .getByRole("button", { name: "Fit all trucks on map", exact: true })
    .click();
  await page.screenshot({
    path: ".runtime/tracking-updated.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Run transaction demo", exact: true }),
  ).toHaveCount(0);
});

test("dropdowns remain usable during fleet updates and payment records produce receipts", async ({
  page,
}) => {
  await page.goto("/Operations-Platform/");
  await expect(
    page.getByRole("heading", { name: "Good day, Dylan ." }),
  ).toBeVisible();
  await expect(page.getByText("SIMULATION", { exact: true })).toHaveCount(0);
  await expect(
    page.getByText("One connected operation.", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("link", { name: "Supplier catalogue", exact: true })
    .click();
  await choose(page, "Sort products", "Price: high to low");
  await expect(page.locator("article").first()).toContainText(
    "Roller Meal 10kg",
  );
  await choose(page, "Sort products", "Price: low to high");
  await expect(page.locator("article").first()).toContainText(
    "Iodated Salt 500g",
  );
  await page.getByRole("link", { name: "Inventory", exact: true }).click();
  await choose(page, "Inventory supplier", "Dairiboard Foods Ltd");
  await expect(page.locator("tbody tr")).toHaveCount(6);
  await choose(page, "Inventory category", "Beverages");
  await expect(page.locator("tbody tr")).toHaveCount(0);
  await choose(page, "Inventory supplier", "All suppliers");
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await page.getByRole("link", { name: "Orders", exact: true }).click();
  await choose(page, "Order supplier", "National Foods Ltd");
  await choose(page, "Order status", "Delivered");
  await expect(page.locator("tbody tr")).toHaveCount(0);
  await choose(page, "Order supplier", "All suppliers");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page
    .getByRole("link", { name: "Credit & payments", exact: true })
    .click();
  await choose(page, "Invoice filter", "Paid");
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await choose(page, "Invoice filter", "All invoices");
  await expect(page.locator("tbody tr")).toHaveCount(8);
  await choose(page, "Invoice filter", "Outstanding");
  await page
    .locator("tbody tr")
    .first()
    .getByRole("button", { name: "Pay now", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Payment bank", exact: true })
    .click();
  await page.waitForTimeout(2200);
  await expect(
    page.getByRole("option", { name: "CBZ Bank", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await choose(page, "Payment bank", "CBZ Bank");
  await page
    .getByLabel("Payment reference", { exact: true })
    .fill("CBZ-2026-0419");
  await page.getByLabel("Confirm payment received", { exact: true }).check();
  await page.screenshot({
    path: ".runtime/payment-details.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Review payment", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("CBZ-2026-0419");
  await page
    .getByRole("button", { name: "Record $3,200.00 payment", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Payment recorded", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: ".runtime/payment-receipt.png",
    fullPage: true,
  });
  const ready = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download receipt", exact: true })
    .click();
  const receipt = await ready;
  expect(receipt.suggestedFilename()).toMatch(/^PAY-.+-receipt\.txt$/);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(5);
  await page.reload();
  await expect(page.locator("tbody tr")).toHaveCount(5);
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await choose(page, "Dashboard chart metric", "Purchase value");
  await expect(
    page.getByRole("combobox", { name: "Dashboard chart metric", exact: true }),
  ).toContainText("Purchase value");
});

test("payment method choices validate EcoCash references and keep cash orders due on delivery", async ({
  page,
}) => {
  await page.goto("/Operations-Platform/");
  await page
    .getByRole("link", { name: "Supplier catalogue", exact: true })
    .click();
  await page.getByLabel("Search products", { exact: true }).fill("Fresh Milk");
  await page
    .getByRole("button", { name: "Add Fresh Milk 2L to order", exact: true })
    .click();
  await page.getByRole("button", { name: "Pay now", exact: true }).click();
  await page
    .getByRole("radio", { name: "Cash on Delivery", exact: true })
    .check();
  await completeOrder(page, "$2.07");
  await page.getByRole("link", { name: "Orders", exact: true }).click();
  await expect(page.locator("tbody tr").first()).toContainText(
    "Cash on Delivery",
  );
  await page
    .getByRole("link", { name: "Credit & payments", exact: true })
    .click();
  await page
    .locator("tbody tr")
    .first()
    .getByRole("button", { name: "Pay now", exact: true })
    .click();
  await page.getByRole("radio", { name: "EcoCash", exact: true }).check();
  await expect(
    page.getByRole("combobox", { name: "Payment bank", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Review payment", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Enter the reference");
  await page
    .getByLabel("Payment reference", { exact: true })
    .fill("ECO-0419-CHECK");
  await page.getByLabel("Confirm payment received", { exact: true }).check();
  await page
    .getByRole("button", { name: "Review payment", exact: true })
    .click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(
    page.getByLabel("Payment reference", { exact: true }),
  ).toHaveValue("ECO-0419-CHECK");
  await page
    .getByRole("button", { name: "Review payment", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Record $3,200.00 payment", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Payment recorded", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("ECO-0419-CHECK");
});
