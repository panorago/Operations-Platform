import { test, expect, type Page } from "@playwright/test";
import { choose } from "./ui-helpers";
const routes = [
  ["Overview", "Good day, Dylan ."],
  ["Live tracking", "Live truck tracking"],
  ["Supplier catalogue", "Supplier catalogue"],
  ["Orders", "Orders"],
  ["Inventory", "Inventory"],
  ["Credit & payments", "Credit & payments"],
  ["Alerts & reminders", "Alerts & reminders"],
  ["Settings", "Settings"],
] as const;
async function navigate(page: Page, label: string) {
  await expect(page.getByRole("banner")).toBeVisible();
  const menu = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  if (await menu.isVisible()) {
    await menu.click();
    await page
      .getByRole("dialog", { name: "Navigation", exact: true })
      .getByRole("link", { name: label, exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Navigation", exact: true }),
    ).toHaveCount(0);
  } else await page.getByRole("link", { name: label, exact: true }).click();
}
async function fits(page: Page) {
  const sizes = await page.evaluate(() => {
    const main = document.querySelector("main")!;
    return {
      page: document.documentElement.scrollWidth,
      width: window.innerWidth,
      main: main.scrollWidth,
      mainWidth: main.clientWidth,
    };
  });
  expect(sizes.page, JSON.stringify(sizes)).toBeLessThanOrEqual(
    sizes.width + 1,
  );
  expect(sizes.main, JSON.stringify(sizes)).toBeLessThanOrEqual(
    sizes.mainWidth + 1,
  );
}
for (const [width, height] of [
  [320, 568],
  [375, 812],
  [768, 1024],
  [844, 390],
  [1024, 768],
  [1280, 800],
  [1920, 1080],
]) {
  test(`all routes fit ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/Operations-Platform/");
    for (const [label, heading] of routes) {
      await navigate(page, label);
      await expect(
        page.getByRole("heading", { name: heading, exact: true }),
      ).toBeVisible();
      await fits(page);
      if (label === "Overview" || label === "Live tracking")
        await page.screenshot({
          path: `.runtime/responsive-${label === "Overview" ? "dashboard" : "tracking"}-${width}.png`,
        });
    }
    for (const tab of ["Suppliers", "Users", "Notifications", "Credits"]) {
      await page
        .getByRole("button", { name: `${tab} settings`, exact: true })
        .click();
      await fits(page);
    }
    expect(errors).toEqual([]);
  });
}
test("phone checkout, filters, dropdown and short-screen payment dialog", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/Operations-Platform/");
  await navigate(page, "Supplier catalogue");
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "All suppliers", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await choose(page, "Sort products", "Price: low to high");
  await page.getByLabel("Search products", { exact: true }).fill("Fresh Milk");
  await page
    .getByRole("button", { name: "Add Fresh Milk 2L to order", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Current order (1)", exact: true })
    .click();
  await page.getByRole("button", { name: "Pay now", exact: true }).click();
  await page
    .getByRole("radio", { name: "Cash on Delivery", exact: true })
    .check();
  await page.getByRole("button", { name: "Review order", exact: true }).click();
  await page
    .getByRole("button", { name: "Place $2.07 order", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Order placed", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await navigate(page, "Credit & payments");
  await page
    .locator("tbody tr")
    .first()
    .getByRole("button", { name: "Pay now", exact: true })
    .click();
  await choose(page, "Payment bank", "CBZ Bank");
  await expect(page.getByLabel("Payment reference", { exact: true })).toHaveCSS(
    "font-size",
    "16px",
  );
  await page.screenshot({ path: ".runtime/responsive-payment-375.png" });
  await page.setViewportSize({ width: 667, height: 375 });
  const dialog = page.getByRole("dialog");
  const bounds = await dialog.boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(376);
  await expect(
    page.getByRole("button", { name: "Review payment", exact: true }),
  ).toBeInViewport();
  await page
    .getByLabel("Payment reference", { exact: true })
    .fill("CBZ-MOBILE-0419");
  await page.getByLabel("Confirm payment received", { exact: true }).check();
  await page
    .getByRole("button", { name: "Review payment", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Record $3,200.00 payment", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Payment recorded", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await fits(page);
});

test.describe("touch navigation", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 3,
  });
  test("phone taps open navigation and operate fleet controls", async ({
    page,
  }) => {
    await page.goto("/Operations-Platform/");
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .tap();
    await page
      .getByRole("dialog", { name: "Navigation", exact: true })
      .getByRole("link", { name: "Live tracking", exact: true })
      .tap();
    await expect(
      page.getByRole("heading", { name: "Live truck tracking", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Track ZW-03", exact: true }).tap();
    await expect(
      page.getByRole("heading", { name: "ZW-03", exact: true }),
    ).toBeAttached();
    await page
      .getByRole("button", { name: "Pause fleet updates", exact: true })
      .tap();
    await expect(
      page.getByRole("button", { name: "Resume fleet updates", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Resume fleet updates", exact: true })
      .tap();
    await fits(page);
  });
});
