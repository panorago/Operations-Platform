import { test } from "node:test";
import assert from "node:assert/strict";
import { applyCommand } from "../server/domain";
import { seed } from "../src/data";
import { daysLeft } from "../src/lib/utils";
const item = { productId: "prod-1-1", qty: 10, credit: true };
test("seeds contain complete supplier, product and truck sets", () => {
  assert.equal(seed.suppliers.length, 6);
  assert.equal(seed.products.length, 29);
  assert.equal(seed.trucks.length, 8);
  assert.equal(seed.invoices.length, 8);
});
test("checkout calculates VAT on the server, creates invoice and debits credit", () => {
  const s = applyCommand(
    seed,
    {
      type: "checkout",
      items: [item],
      mode: "credit",
      method: "Bank Transfer",
      terms: 30,
    },
    "Admin",
  );
  assert.equal(s.orders[0].total, 20.7);
  assert.equal(s.invoices[0].amount, 20.7);
  assert.equal(s.suppliers[0].creditUsed, 2820.7);
  assert.equal(seed.suppliers[0].creditUsed, 2800);
});
test("mixed supplier order is split and transactional on insufficient credit", () => {
  assert.throws(
    () =>
      applyCommand(
        seed,
        {
          type: "checkout",
          items: [item, { productId: "prod-3-1", qty: 10, credit: true }],
          mode: "credit",
          method: "Bank Transfer",
          terms: 30,
        },
        "Admin",
      ),
    /suspended|insufficient/,
  );
  assert.equal(seed.orders.length, 14);
});
test("credit limits cannot be bypassed with oversized or duplicate items", () => {
  assert.throws(
    () =>
      applyCommand(
        seed,
        {
          type: "checkout",
          items: [{ ...item, qty: 10000 }],
          mode: "credit",
          method: "EcoCash",
          terms: 7,
        },
        "Admin",
      ),
    /insufficient/,
  );
  assert.throws(
    () =>
      applyCommand(
        seed,
        {
          type: "checkout",
          items: [item, item],
          mode: "pay",
          method: "EcoCash",
          terms: 30,
        },
        "Admin",
      ),
    /Invalid order item/,
  );
});
test("payment clears reminders and reduces balance once", () => {
  const s = applyCommand(
    seed,
    { type: "payInvoice", id: "INV-0419", method: "Bank Transfer" },
    "Finance",
  );
  const i = s.invoices.find((i) => i.id === "INV-0419")!;
  assert.equal(i.paid, true);
  assert.equal(i.overduePing, false);
  assert.equal(
    i.reminders.every((r) => r.delivery === "Cancelled"),
    true,
  );
  assert.equal(s.suppliers[2].creditUsed, 0);
  assert.throws(
    () =>
      applyCommand(
        s,
        { type: "payInvoice", id: i.id, method: "Bank Transfer" },
        "Finance",
      ),
    /already paid/,
  );
});
test("roles are enforced by domain operations", () => {
  assert.throws(
    () =>
      applyCommand(
        seed,
        {
          type: "checkout",
          items: [item],
          mode: "pay",
          method: "EcoCash",
          terms: 30,
        },
        "Finance",
      ),
    /Operations/,
  );
  assert.throws(
    () =>
      applyCommand(
        seed,
        { type: "payInvoice", id: "INV-0419", method: "Bank Transfer" },
        "Operations",
      ),
    /Finance/,
  );
  assert.throws(
    () =>
      applyCommand(
        seed,
        { type: "saveSettings", settings: seed.settings },
        "Operations",
      ),
    /Administrator/,
  );
});
test("only valid delivery transitions update stock; repeat delivery is rejected", () => {
  let s = applyCommand(
    seed,
    {
      type: "checkout",
      items: [item],
      mode: "pay",
      method: "Cash on Delivery",
      terms: 30,
    },
    "Operations",
  );
  const id = s.orders[0].id;
  for (const status of ["Processing", "Dispatched", "Delivered"] as const)
    s = applyCommand(s, { type: "orderStatus", id, status }, "Operations");
  assert.equal(s.products[0].stock, 94);
  assert.throws(
    () =>
      applyCommand(
        s,
        { type: "orderStatus", id, status: "Delivered" },
        "Operations",
      ),
    /transition/,
  );
});
test("cancellation voids credit invoice and releases credit", () => {
  let s = applyCommand(
    seed,
    {
      type: "checkout",
      items: [item],
      mode: "credit",
      method: "Bank Transfer",
      terms: 30,
    },
    "Admin",
  );
  s = applyCommand(
    s,
    { type: "orderStatus", id: s.orders[0].id, status: "Cancelled" },
    "Admin",
  );
  assert.equal(s.suppliers[0].creditUsed, 2800);
  assert.equal(s.invoices[0].paid, true);
  assert.equal(s.invoices[0].paymentMethod, "Cancelled order — void");
});
test("reminder job is idempotent for a day and never touches paid invoices", () => {
  const first = applyCommand(seed, { type: "triggerReminders" }, "Admin"),
    second = applyCommand(first, { type: "triggerReminders" }, "Admin");
  assert.equal(first.alerts.length, second.alerts.length);
  assert.equal(
    second.invoices
      .find((i) => i.id === "INV-0416")!
      .reminders.some((r) => r.sent),
    false,
  );
  assert.equal(
    second.invoices.find((i) => i.id === "INV-0419")!.overduePing,
    true,
  );
});
test("invoice date labels follow actual dates instead of inconsistent seed text", () => {
  assert.equal(daysLeft(seed.invoices[2], "2026-11-03"), 21);
  assert.equal(daysLeft(seed.invoices[0], "2026-11-03"), -6);
});

test("disabled credit notifications do not generate scheduled reminders", () => {
  const state = structuredClone(seed);
  state.settings.notifications.Credit = {
    email: false,
    sms: false,
    inapp: false,
  };
  const result = applyCommand(
    state,
    { type: "triggerReminders" },
    "Admin",
    new Date("2026-11-03T08:00:00Z"),
  );
  assert.equal(result.alerts.length, state.alerts.length);
  assert.equal(
    result.invoices.some((i) => i.reminders.some((r) => r.sent)),
    false,
  );
});

test("cart totals match supplier-level VAT rounding across a mixed order", async () => {
  const { orderTotals } = await import("../src/lib/utils");
  const items = [
    { productId: "prod-1-2", qty: 1, credit: false },
    { productId: "prod-3-2", qty: 1, credit: false },
  ];
  const totals = orderTotals(items, seed.products);
  const state = applyCommand(
    seed,
    {
      type: "checkout",
      items,
      mode: "pay",
      method: "Bank Transfer",
      terms: 30,
    },
    "Admin",
  );
  assert.equal(totals.total, 2.54);
  assert.equal(
    state.orders
      .slice(0, 2)
      .reduce((sum, o) => sum + Math.round(o.total * 100), 0),
    Math.round(totals.total * 100),
  );
});
test("timestamps display in Africa/Harare", async () => {
  const { date } = await import("../src/lib/utils");
  assert.equal(
    date("2026-11-03T22:30:00Z", "dd MMM yyyy HH:mm"),
    "04 Nov 2026 00:30",
  );
});

test("each seeded truck has an associated dispatched order and manifest quantities", () => {
  for (const truck of seed.trucks) {
    const order = seed.orders.find((o) => o.truckId === truck.id);
    assert.ok(order);
    assert.equal(order.status, "Dispatched");
    assert.equal(order.supplierId, truck.supplierId);
    assert.ok(order.items.length >= 4);
    assert.ok(
      order.items.every((i) => Number.isSafeInteger(i.qty) && i.qty > 0),
    );
  }
});
test("credit due date starts from the Harare calendar day near UTC midnight", () => {
  const state = applyCommand(
    seed,
    {
      type: "checkout",
      items: [item],
      mode: "credit",
      method: "Bank Transfer",
      terms: 7,
    },
    "Admin",
    new Date("2026-11-03T23:30:00Z"),
  );
  assert.equal(state.invoices[0].dueDate, "2026-11-11");
});
