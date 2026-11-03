import { expect, type Page } from "@playwright/test";
export async function choose(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}
export async function completeOrder(page: Page, amount: string) {
  await page.getByRole("button", { name: "Review order", exact: true }).click();
  await page
    .getByRole("button", { name: `Place ${amount} order`, exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /^(Order placed|Credit order placed)$/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Done", exact: true }).click();
}
