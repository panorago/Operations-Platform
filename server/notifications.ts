import type { AppState, DeliveryOutcome, ProviderConfig } from "../src/types";
export async function deliver(
  channel: "email" | "sms",
  subject: string,
  message: string,
  id: string,
  config: ProviderConfig,
  request: typeof fetch = fetch,
): Promise<DeliveryOutcome> {
  try {
    if (channel === "email") {
      if (!config.resendKey || !config.emailFrom || !config.emailTo)
        return {
          status: "Blocked",
          detail: "Email provider or finance recipient is not configured",
        };
      const response = await request("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.resendKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": id,
        },
        body: JSON.stringify({
          from: config.emailFrom,
          to: [config.emailTo],
          subject,
          text: message,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok)
        return {
          status: "Failed",
          detail: `Email provider returned HTTP ${response.status}`,
        };
      const result = (await response.json()) as { id?: string };
      return {
        status: "Accepted",
        detail: "Accepted by email provider",
        providerId: result.id,
      };
    }
    if (
      !config.twilioSid ||
      (!config.twilioToken && !config.twilioAuthorization) ||
      !config.smsFrom ||
      !config.smsTo
    )
      return {
        status: "Blocked",
        detail: "SMS provider or finance recipient is not configured",
      };
    const response = await request(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(config.twilioSid)}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization:
            config.twilioAuthorization ||
            `Basic ${Buffer.from(`${config.twilioSid}:${config.twilioToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: config.smsFrom,
          To: config.smsTo,
          Body: message,
        }),
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!response.ok)
      return {
        status: "Failed",
        detail: `SMS provider returned HTTP ${response.status}`,
      };
    const result = (await response.json()) as { sid?: string };
    return {
      status: "Accepted",
      detail: "Accepted by SMS provider",
      providerId: result.sid,
    };
  } catch {
    return {
      status: "Failed",
      detail:
        "Delivery outcome uncertain. Check provider logs before retrying.",
    };
  }
}
// Persistent, deterministic delivery IDs prevent repeating a reminder on every poll.
// A failed/ambiguous send is retained for review rather than silently retried.
export async function processNotifications(
  read: () => AppState,
  write: (s: AppState) => void,
  config: ProviderConfig,
) {
  const snapshot = read();
  for (const invoice of snapshot.invoices.filter((i) => !i.paid))
    for (const reminder of invoice.reminders.filter((r) => r.sent))
      for (const channel of reminder.channels.filter(
        (c): c is "email" | "sms" => c !== "inapp",
      )) {
        const current = read();
        const live = current.invoices.find((i) => i.id === invoice.id);
        const r = live?.reminders.find((r) => r.days === reminder.days);
        if (
          !live ||
          live.paid ||
          !r ||
          !current.settings.notifications.Credit?.[channel]
        )
          continue;
        const prior = r.channelDelivery?.[channel];
        if (prior && prior.status !== "Blocked") continue;
        const supplier =
          current.suppliers.find((s) => s.id === live.supplierId)?.name ||
          "Supplier";
        const outcome = await deliver(
          channel,
          `FreshMark: ${live.id} payment reminder`,
          `${supplier}: USD ${live.amount.toFixed(2)} is due on ${live.dueDate}. Invoice ${live.id}. Please arrange payment with Finance.`,
          `${live.id}-${r.days}-${channel}`,
          config,
        );
        const fresh = read();
        const target = fresh.invoices.find((i) => i.id === invoice.id);
        const targetReminder = target?.reminders.find(
          (r) => r.days === reminder.days,
        );
        if (!target || target.paid || !targetReminder) continue;
        targetReminder.channelDelivery = {
          ...targetReminder.channelDelivery,
          [channel]: { ...outcome, at: new Date().toISOString() },
        };
        write(fresh);
      }
}
export const notificationConfig = () => ({
  resendKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM,
  emailTo: process.env.FINANCE_EMAIL,
  twilioSid: process.env.TWILIO_ACCOUNT_SID,
  twilioToken: process.env.TWILIO_AUTH_TOKEN,
  twilioAuthorization: process.env.TWILIO_AUTHORIZATION,
  smsFrom: process.env.SMS_FROM,
  smsTo: process.env.FINANCE_PHONE,
});
