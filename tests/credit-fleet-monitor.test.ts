import { test } from "node:test";
import assert from "node:assert/strict";
import { creditCharge, invoiceBalance } from "../src/lib/credit";
import { applyCommand } from "../src/lib/domain";
import { seed } from "../src/data";
import { advanceFleet, kilometres } from "../src/lib/fleet";
import { HQ } from "../src/data/trucks";
import { scanOperations } from "../src/lib/monitoring";
import {
  monitorSnapshot,
  analyseOperations,
  monitorFingerprint,
} from "../server/monitor";
test("daily interest reflects settlement date and grace days with integer-cent rounding", () => {
  const policy = { enabled: true, annualRate: 36.5, graceDays: 3 };
  assert.equal(
    creditCharge(1000, "2026-11-01", "2026-11-11", policy).interest,
    7,
  );
  assert.equal(
    creditCharge(1000, "2026-11-01", "2026-11-04", policy).interest,
    0,
  );
  assert.equal(
    creditCharge(1000, "2026-11-01", "2026-11-12", policy).interest,
    8,
  );
  assert.throws(
    () => creditCharge(1000, "2026-11-02", "2026-11-01", policy),
    /before/,
  );
});
test("credit checkout requires acceptance and freezes its agreed rate at purchase", () => {
  const state = structuredClone(seed);
  state.settings.creditPolicy = {
    enabled: true,
    annualRate: 36.5,
    graceDays: 0,
  };
  const command = {
    type: "checkout" as const,
    items: [{ productId: "prod-1-1", qty: 10, credit: true }],
    mode: "credit" as const,
    method: "Bank Transfer",
    terms: 30,
  };
  assert.throws(() => applyCommand(state, command, "Admin"), /accept/);
  let purchased = applyCommand(
    state,
    { ...command, quotedAnnualRate: 36.5, quotedGraceDays: 0 },
    "Admin",
    new Date("2026-11-03T08:00:00Z"),
  );
  const invoice = purchased.invoices[0];
  assert.equal(invoice.credit?.annualRate, 36.5);
  assert.equal(invoiceBalance(invoice, "2026-11-13").total, 20.91);
  purchased.settings.creditPolicy!.annualRate = 99;
  purchased = applyCommand(
    purchased,
    {
      type: "payInvoice",
      id: invoice.id,
      method: "Bank Transfer",
      paymentDate: "2026-11-13",
    },
    "Finance",
    new Date("2026-11-15T08:00:00Z"),
  );
  assert.equal(purchased.invoices[0].paidAmount, 20.91);
  assert.equal(purchased.suppliers[0].creditUsed, 2800);
  assert.equal(purchased.activity?.[0].type, "payment");
});
test("invalid and future settlement dates are rejected", () => {
  for (const paymentDate of ["2026-02-31", "2027-01-01"])
    assert.throws(
      () =>
        applyCommand(
          seed,
          {
            type: "payInvoice",
            id: "INV-0419",
            method: "Bank Transfer",
            paymentDate,
          },
          "Finance",
          new Date("2026-11-03T08:00:00Z"),
        ),
      /Payment date/,
    );
});
test("historical invoices are not retroactively charged interest", () => {
  const state = structuredClone(seed);
  state.settings.creditPolicy = { enabled: true, annualRate: 99, graceDays: 0 };
  assert.equal(invoiceBalance(state.invoices[0], "2026-11-03").interest, 0);
});
test("fleet moves towards HQ continuously and clamps arrival without overshooting", () => {
  const before = seed.trucks[0];
  const moved = advanceFleet([before], 1, 1)[0];
  assert.ok(
    kilometres(moved.lat, moved.lng) < kilometres(before.lat, before.lng),
  );
  assert.ok(moved.progress > before.progress);
  const arrived = advanceFleet([before], 100000, 12)[0];
  assert.equal(arrived.progress, 100);
  assert.equal(arrived.lat, HQ[0]);
  assert.equal(arrived.lng, HQ[1]);
  assert.equal(arrived.speed, 0);
});
test("monitor signals track actual stock, credit and delivery state", () => {
  const issues = scanOperations(seed);
  assert.ok(
    issues.some((i) => i.entityId === "prod-2-1" && i.severity === "critical"),
  );
  const updated = structuredClone(seed);
  updated.products.find((p) => p.id === "prod-2-1")!.stock = 100;
  assert.equal(
    scanOperations(updated).some((i) => i.entityId === "prod-2-1"),
    false,
  );
  assert.notEqual(monitorFingerprint(seed), monitorFingerprint(updated));
});
test("AI configuration is not claimed verified before a provider response", async () => {
  const previous = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = "test-only-not-a-real-key";
  try {
    assert.equal(monitorSnapshot(seed).providerReady, false);
    const result = await analyseOperations(seed, async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as {
        model: string;
        messages: { content: string }[];
      };
      assert.equal(body.model, "claude-sonnet-4-6");
      assert.match(body.messages[0].content, /Roller Meal/);
      return new Response(
        JSON.stringify({
          content: [
            {
              type: "text",
              text: "Reorder Roller Meal and review the overdue Olivine invoice.",
            },
          ],
        }),
        { status: 200 },
      );
    });
    assert.equal(result.providerReady, true);
    assert.ok(result.analyzedAt);
    assert.match(result.summary || "", /Roller Meal/);
  } finally {
    if (previous === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = previous;
  }
});
