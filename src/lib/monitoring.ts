import type { AppState, MonitorIssue } from "../types";
import { daysLeft, money } from "./utils";
export function scanOperations(state: AppState): MonitorIssue[] {
  const issues: MonitorIssue[] = [];
  for (const p of state.products.filter((p) => p.stock <= p.reorderLevel)) {
    const qty = Math.max(
      p.reorderLevel - p.stock,
      Math.ceil(p.weeklyAvgSales - p.stock),
    );
    issues.push({
      id: `stock-${p.id}`,
      kind: "Stock",
      severity: p.stock === 0 ? "critical" : "warning",
      title:
        p.stock === 0
          ? `${p.name} is out of stock`
          : `${p.name} needs replenishment`,
      detail: `${p.stock} units on hand · reorder ${qty} units to cover the next week.`,
      action: "Reorder",
      entityId: p.id,
      quantity: qty,
    });
  }
  for (const i of state.invoices.filter((i) => !i.paid && daysLeft(i) <= 5)) {
    issues.push({
      id: `credit-${i.id}`,
      kind: "Credit",
      severity: daysLeft(i) < 0 ? "critical" : "warning",
      title: `${i.id} · ${daysLeft(i) < 0 ? Math.abs(daysLeft(i)) + " days overdue" : daysLeft(i) + " days left"}`,
      detail: `${state.suppliers.find((s) => s.id === i.supplierId)?.name} · ${money(i.amount)} principal outstanding.`,
      action: "Review invoice",
      entityId: i.id,
    });
  }
  for (const t of state.trucks.filter((t) => t.delayed && t.progress < 100))
    issues.push({
      id: `truck-${t.id}`,
      kind: "Delivery",
      severity: "warning",
      title: `${t.id} delivery delayed`,
      detail: t.delayReason || "Check arrival time with the driver.",
      action: "Track truck",
      entityId: t.id,
    });
  return issues.sort(
    (a, b) =>
      (a.severity === "critical" ? 0 : 1) - (b.severity === "critical" ? 0 : 1),
  );
}
