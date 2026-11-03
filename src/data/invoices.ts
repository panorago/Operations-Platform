import type { Invoice, Reminder } from "../types";
export const reminderSchedule = (thresholds = [15, 10, 5]): Reminder[] =>
  thresholds.map((days, i) => ({
    days,
    sent: false,
    sentAt: null,
    channels: i === 0 ? ["email", "inapp"] : ["email", "sms", "inapp"],
    delivery: "Pending",
  }));
const rows: [string, string, number, string, boolean][] = [
  ["INV-0419", "sup-3", 3200, "2026-10-28", false],
  ["INV-0421", "sup-4", 1800, "2026-11-01", false],
  ["INV-0422", "sup-5", 4200, "2026-11-24", false],
  ["INV-0423", "sup-5", 800, "2026-12-15", false],
  ["INV-0424", "sup-1", 2800, "2026-12-18", false],
  ["INV-0425", "sup-2", 1200, "2026-12-22", false],
  ["INV-0416", "sup-3", 400, "2026-10-15", true],
  ["INV-0410", "sup-6", 1100, "2026-10-01", true],
];
export const invoices: Invoice[] = rows.map(
  ([id, supplierId, amount, dueDate, paid]) => ({
    id,
    supplierId,
    amount,
    dueDate,
    paid,
    reminders: reminderSchedule(),
    overduePing: false,
    ...(paid ? { paidAt: dueDate, paymentMethod: "Bank Transfer" } : {}),
  }),
);
