import { addDays, format, parseISO } from "date-fns";
const randomUUID = () => globalThis.crypto.randomUUID();
import type { AppState, Command, Role } from "../types";
import { reminderSchedule } from "../data/invoices";
import { daysLeft, today } from "./utils";
export function applyCommand(
  input: AppState,
  c: Command,
  role: Role,
  now = new Date(),
): AppState {
  const s = structuredClone(input);
  const stamp = now.toISOString();
  if (["saveSettings", "saveSupplier"].includes(c.type) && role !== "Admin")
    throw Error("Administrator access required");
  if (["checkout", "orderStatus"].includes(c.type) && role === "Finance")
    throw Error("Operations access required");
  if (c.type === "payInvoice" && role === "Operations")
    throw Error("Finance access required");
  if (c.type === "checkout") {
    if (!c.items.length || c.items.length > 100)
      throw Error("Add products to your order");
    if (![7, 15, 30].includes(c.terms)) throw Error("Invalid credit terms");
    if (!["EcoCash", "Bank Transfer", "Cash on Delivery"].includes(c.method))
      throw Error("Invalid payment method");
    const grouped = new Map<
      string,
      { items: typeof c.items; subtotal: number }
    >();
    const seen = new Set<string>();
    for (const item of c.items) {
      const p = s.products.find((p) => p.id === item.productId);
      if (
        !p ||
        !Number.isSafeInteger(item.qty) ||
        item.qty < 1 ||
        item.qty > 10000 ||
        seen.has(item.productId)
      )
        throw Error("Invalid order item");
      seen.add(item.productId);
      const g = grouped.get(p.supplierId) || { items: [], subtotal: 0 };
      g.items.push(item);
      g.subtotal += Math.round(p.price * 100) * item.qty;
      grouped.set(p.supplierId, g);
    }
    for (const [supplierId, g] of grouped) {
      const supplier = s.suppliers.find((p) => p.id === supplierId)!;
      const total = (g.subtotal + Math.round((g.subtotal * 15) / 100)) / 100;
      if (c.mode === "credit") {
        if (
          s.settings.suspendCredit &&
          s.invoices.some(
            (i) => i.supplierId === supplierId && !i.paid && daysLeft(i) < 0,
          )
        )
          throw Error(`${supplier.name}: credit suspended while overdue`);
        if (
          Math.round(supplier.creditUsed * 100) + Math.round(total * 100) >
          Math.round(supplier.creditLimit * 100)
        )
          throw Error(`${supplier.name}: insufficient available credit`);
        supplier.creditUsed =
          Math.round((supplier.creditUsed + total) * 100) / 100;
      }
      const invoiceId =
        c.mode === "credit"
          ? `INV-${randomUUID().slice(0, 8).toUpperCase()}`
          : undefined;
      s.orders.unshift({
        id: `ORD-${randomUUID().slice(0, 8).toUpperCase()}`,
        invoiceId,
        supplierId,
        items: g.items,
        total,
        date: stamp,
        status: "Pending",
        paymentMode: c.mode,
        paymentMethod: c.method,
        terms: c.mode === "credit" ? c.terms : 0,
      });
      if (invoiceId)
        s.invoices.unshift({
          id: invoiceId,
          supplierId,
          amount: total,
          dueDate: format(addDays(parseISO(today(now)), c.terms), "yyyy-MM-dd"),
          paid: false,
          reminders: reminderSchedule(s.settings.thresholds),
          overduePing: false,
        });
    }
  }
  if (c.type === "payInvoice") {
    const i = s.invoices.find((i) => i.id === c.id);
    if (!i) throw Error("Invoice not found");
    if (i.paid) throw Error("Invoice already paid");
    i.paid = true;
    i.paidAt = stamp;
    i.paymentMethod = c.method;
    i.overduePing = false;
    i.reminders.forEach((r) => {
      if (!r.sent) r.delivery = "Cancelled";
    });
    const p = s.suppliers.find((p) => p.id === i.supplierId)!;
    p.creditUsed = Math.max(
      0,
      Math.round((p.creditUsed - i.amount) * 100) / 100,
    );
    s.alerts.filter((a) => a.entityId === i.id).forEach((a) => (a.read = true));
  }
  if (c.type === "readAlert") {
    const a = s.alerts.find((a) => a.id === c.id);
    if (a) a.read = true;
  }
  if (c.type === "readAll") s.alerts.forEach((a) => (a.read = true));
  if (c.type === "saveSettings") s.settings = c.settings;
  if (c.type === "saveSupplier") {
    const existing = s.suppliers.find((p) => p.id === c.supplier.id);
    if (existing)
      Object.assign(existing, {
        ...c.supplier,
        creditUsed: existing.creditUsed,
        trucks: existing.trucks,
      });
    else s.suppliers.push({ ...c.supplier, creditUsed: 0, trucks: [] });
  }
  if (c.type === "orderStatus") {
    const o = s.orders.find((o) => o.id === c.id);
    if (!o) throw Error("Order not found");
    const next: Record<string, string[]> = {
      Pending: ["Processing", "Cancelled"],
      Processing: ["Dispatched", "Cancelled"],
      Dispatched: ["Delivered"],
      Delivered: [],
      Cancelled: [],
    };
    if (!next[o.status].includes(c.status))
      throw Error("Invalid order status transition");
    if (c.status === "Delivered")
      for (const item of o.items) {
        const p = s.products.find((p) => p.id === item.productId)!;
        p.stock += item.qty;
        p.updatedAt = stamp;
      }
    if (c.status === "Cancelled" && o.invoiceId) {
      const i = s.invoices.find((i) => i.id === o.invoiceId);
      if (i && !i.paid) {
        i.paid = true;
        i.paymentMethod = "Cancelled order — void";
        i.paidAt = stamp;
        i.overduePing = false;
        i.reminders.forEach((r) => (r.delivery = "Cancelled"));
        const supplier = s.suppliers.find((x) => x.id === o.supplierId)!;
        supplier.creditUsed = Math.max(0, supplier.creditUsed - i.amount);
      }
    }
    o.status = c.status;
  }
  if (c.type === "triggerReminders")
    for (const i of s.invoices.filter((i) => !i.paid)) {
      const day = today(now);
      const left = daysLeft(i, day);
      for (const r of i.reminders) {
        if (
          !r.sent &&
          left <= r.days &&
          Object.values(s.settings.notifications.Credit || {}).some(Boolean)
        ) {
          r.sent = true;
          r.sentAt = stamp;
          r.delivery = s.settings.notifications.Credit?.inapp
            ? "In-app delivered"
            : "Pending";
          if (s.settings.notifications.Credit?.inapp)
            s.alerts.unshift({
              id: randomUUID(),
              type: "Credit",
              title: `${i.id} — ${r.days}-day reminder`,
              description: `Payment due ${i.dueDate}. Review the invoice and arrange settlement with Finance.`,
              timestamp: stamp,
              read: false,
              route: "/credits",
              entityId: i.id,
            });
        }
      }
      if (
        left < 0 &&
        s.settings.dailyPings &&
        s.settings.notifications.Credit?.inapp &&
        i.lastPing !== day
      ) {
        i.overduePing = true;
        i.lastPing = day;
        s.alerts.unshift({
          id: randomUUID(),
          type: "Credit",
          title: `${i.id} — ${Math.abs(left)} days overdue`,
          description:
            "Payment outstanding. Email and SMS require delivery provider configuration.",
          timestamp: stamp,
          read: false,
          route: "/credits",
          entityId: i.id,
        });
      }
    }
  return s;
}
