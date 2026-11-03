import { suppliers } from "./suppliers";
import { products } from "./products";
import { trucks } from "./trucks";
import { invoices } from "./invoices";
import type { AppState, Alert } from "../types";
const timestamp = "2026-11-03T08:00:00+02:00";
export const seed: AppState = {
  suppliers,
  products,
  trucks,
  invoices,
  orders: Array.from({ length: 14 }, (_, i) => {
    const supplierId = `sup-${(i % 6) + 1}`;
    return {
      id: `ORD-${1040 + i}`,
      supplierId,
      items: products
        .filter((p) => p.supplierId === supplierId)
        .slice(0, 3)
        .map((p) => ({ productId: p.id, qty: 10, credit: false })),
      total:
        Math.round(
          products
            .filter((p) => p.supplierId === supplierId)
            .slice(0, 3)
            .reduce((n, p) => n + p.price * 10, 0) * 115,
        ) / 100,
      date: `2026-11-${String(3 - Math.floor(i / 5)).padStart(2, "0")}T08:30:00+02:00`,
      status: (["Processing", "Dispatched", "Delivered", "Pending"] as const)[
        i % 4
      ],
      paymentMode: "pay",
      paymentMethod: "Cash on Delivery",
      terms: 0,
    };
  }),
  alerts: [
    ...products
      .filter((p) => p.stock <= p.reorderLevel)
      .map((p) => ({
        id: `stock-${p.id}`,
        type: "Stock" as const,
        title: `${p.name} — ${p.stock === 0 ? "Out of stock" : "Low stock"}`,
        description: `${p.supplierName} · ${p.stock} units available. Reorder level ${p.reorderLevel}.`,
        timestamp,
        read: false,
        route: "/inventory",
        entityId: p.id,
      })),
    ...invoices
      .filter((i) => !i.paid)
      .slice(0, 3)
      .map((i) => ({
        id: `credit-${i.id}`,
        type: "Credit" as const,
        title: `${i.id} · ${suppliers.find((s) => s.id === i.supplierId)?.name}`,
        description: `Payment due ${i.dueDate}. Review the invoice and payment schedule.`,
        timestamp,
        read: false,
        route: "/credits",
        entityId: i.id,
      })),
    {
      id: "delivery-6",
      type: "Delivery",
      title: "ZW-06 Mazoe Beverages — Delayed +2h",
      description: "Road works on Seke Rd. Updated ETA 17:00 CAT.",
      timestamp,
      read: false,
      route: "/tracking",
      entityId: "ZW-06",
    },
    {
      id: "sync",
      type: "System",
      title: "Catalogue synced — 29 products updated",
      description: "All six supplier catalogues are available for ordering.",
      timestamp,
      read: false,
      route: "/catalogue",
    },
    {
      id: "limit",
      type: "System",
      title: "Credit limit warning: Olivine at 107% of limit",
      description:
        "Settle outstanding credit before placing a new credit order.",
      timestamp,
      read: false,
      route: "/credits",
    },
  ] as Alert[],
  settings: {
    company: {
      name: "FreshMark Retail Zimbabwe",
      address: "Borrowdale, Harare, Zimbabwe",
      phone: "+263 242 700 100",
      email: "operations@freshmark.co.zw",
    },
    notifications: Object.fromEntries(
      ["Stock", "Credit", "Delivery", "System"].map((k) => [
        k,
        { email: true, sms: k !== "System", inapp: true },
      ]),
    ),
    thresholds: [15, 10, 5],
    dailyPings: true,
    suspendCredit: true,
  },
};
