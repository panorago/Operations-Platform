import { test } from "node:test";
import assert from "node:assert/strict";
import { deliver, processNotifications } from "../server/notifications";
import { seed } from "../src/data";
import { applyCommand } from "../server/domain";
test("missing provider configuration is blocked, never reported as sent", async () => {
  const result = await deliver(
    "email",
    "Invoice",
    "Payment due",
    "invoice-key",
    {},
    async () => {
      throw Error("Must not call provider");
    },
  );
  assert.equal(result.status, "Blocked");
});
test("email uses idempotency and requires a successful provider response", async () => {
  let requestSeen = false;
  const result = await deliver(
    "email",
    "Invoice",
    "Payment due",
    "invoice-key",
    {
      resendKey: "test-key",
      emailFrom: "finance@example.test",
      emailTo: "team@example.test",
    },
    async (url, init) => {
      requestSeen = true;
      assert.equal(url, "https://api.resend.com/emails");
      assert.equal(
        (init?.headers as Record<string, string>)["Idempotency-Key"],
        "invoice-key",
      );
      return new Response(JSON.stringify({ id: "provider-1" }), {
        status: 200,
      });
    },
  );
  assert.equal(requestSeen, true);
  assert.equal(result.providerId, "provider-1");
});
test("provider rejection is preserved as failed", async () => {
  const result = await deliver(
    "sms",
    "Invoice",
    "Payment due",
    "key",
    {
      twilioSid: "test",
      twilioToken: "test",
      smsFrom: "+10000000000",
      smsTo: "+10000000001",
    },
    async () => new Response("{}", { status: 403 }),
  );
  assert.equal(result.status, "Failed");
});
test("paid invoices never enqueue external reminders", async () => {
  let state = applyCommand(
    seed,
    { type: "triggerReminders" },
    "Admin",
    new Date("2026-11-03T08:00:00Z"),
  );
  state.invoices.forEach((i) => (i.paid = true));
  await processNotifications(
    () => state,
    (s) => {
      state = s;
    },
    {},
  );
  assert.equal(
    state.invoices.some((i) => i.reminders.some((r) => r.channelDelivery)),
    false,
  );
});
