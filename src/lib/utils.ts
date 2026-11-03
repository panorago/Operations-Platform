import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import type { CartItem, Invoice, Product, Supplier } from "../types";
export const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );
export const date = (s: string, pattern = "dd MMM yyyy") =>
  s.length === 10
    ? format(parseISO(s), pattern)
    : formatInTimeZone(s, "Africa/Harare", pattern);
export const today = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Harare",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"]
    .map((t) => parts.find((p) => p.type === t)!.value)
    .join("-");
};
export const daysLeft = (i: Invoice, now = today()) =>
  differenceInCalendarDays(parseISO(i.dueDate), parseISO(now));
export const invoiceStatus = (i: Invoice) =>
  i.paid
    ? "Paid"
    : daysLeft(i) < 0
      ? "Overdue"
      : daysLeft(i) <= 5
        ? "Urgent"
        : daysLeft(i) <= 15
          ? "Due soon"
          : "On track";
export const stockStatus = (p: Product) =>
  p.stock === 0
    ? "Out of stock"
    : p.stock <= p.reorderLevel
      ? "Low stock"
      : "In stock";
export const supplierStatus = (s: Supplier, invoices: Invoice[] = []) =>
  invoices.some((i) => i.supplierId === s.id && !i.paid && daysLeft(i) < 0) ||
  s.creditUsed > s.creditLimit
    ? "danger"
    : s.creditUsed / s.creditLimit >= 0.85
      ? "warning"
      : "success";
export function download(name: string, content: string, type = "text/plain") {
  const u = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
export const distance = (lat: number, lng: number) => {
  const r = Math.PI / 180;
  const a =
    Math.sin(((lat + 17.8292) * r) / 2) ** 2 +
    Math.cos(lat * r) *
      Math.cos(-17.8292 * r) *
      Math.sin(((lng - 31.0522) * r) / 2) ** 2;
  return (6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
};

export function orderTotals(items: CartItem[], products: Product[]) {
  const groups = new Map<string, number>();
  for (const item of items) {
    const p = products.find((p) => p.id === item.productId);
    if (p)
      groups.set(
        p.supplierId,
        (groups.get(p.supplierId) || 0) + Math.round(p.price * 100) * item.qty,
      );
  }
  const subtotalCents = [...groups.values()].reduce((a, b) => a + b, 0);
  const totalCents = [...groups.values()].reduce(
    (a, b) => a + b + Math.round((b * 15) / 100),
    0,
  );
  return {
    subtotal: subtotalCents / 100,
    vat: (totalCents - subtotalCents) / 100,
    total: totalCents / 100,
  };
}
