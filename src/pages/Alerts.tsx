import PaymentModal from "../components/modules/PaymentModal";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Package,
  CreditCard,
  Truck,
  Settings,
  Check,
  ArrowRight,
} from "lucide-react";
import { useAppStore, useCartStore } from "../store";
import { Badge, Button, EmptyState } from "../components/ui";
import { date, daysLeft } from "../lib/utils";
const icons = {
  Stock: Package,
  Credit: CreditCard,
  Delivery: Truck,
  System: Settings,
};
export default function Alerts() {
  const s = useAppStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState("All");
  const [pay, setPay] = useState<string | null>(null);
  const canPay = s.user?.role !== "Operations";
  const rows = s.alerts
    .filter(
      (a) => (tab === "All" || a.type === tab) && (a.id !== "sync" || !a.read),
    )
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const action = (a: (typeof rows)[number]) => {
    void s.command({ type: "readAlert", id: a.id });
    const product = s.products.find((p) => p.id === a.entityId);
    const invoice = s.invoices.find((i) => i.id === a.entityId);
    if (
      a.type === "Stock" &&
      product &&
      product.stock > 0 &&
      product.stock <= product.reorderLevel &&
      s.user?.role !== "Finance"
    ) {
      useCartStore
        .getState()
        .addItem(
          product.id,
          false,
          Math.max(1, product.reorderLevel - product.stock),
        );
      s.setActiveSupplier(product.supplierId);
      navigate("/catalogue");
      return;
    }
    if (
      a.type === "Credit" &&
      invoice &&
      !invoice.paid &&
      daysLeft(invoice) < 0 &&
      canPay
    ) {
      setPay(invoice.id);
      return;
    }
    if (a.id === "sync") return;
    navigate(
      a.type === "Credit" && a.entityId
        ? `/credits?invoice=${a.entityId}`
        : a.type === "Delivery" && a.entityId
          ? `/tracking?truck=${a.entityId}`
          : a.route,
    );
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow mb-2">STAY ONE STEP AHEAD</p>
          <h1>Alerts & reminders</h1>
          <p className="subtext">
            The signals that matter, from every corner of your operation.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => void s.command({ type: "readAll" })}
        >
          <Check aria-hidden size={12} />
          Mark all read
        </Button>
      </div>
      <div className="panel">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-[0.5px] border-edge px-3 pb-2 sm:px-4">
          <div className="flex gap-3 sm:gap-5">
            {["All", "Stock", "Credit", "Delivery", "System"].map((t) => (
              <button
                key={t}
                aria-label={`Show ${t} alerts`}
                onClick={() => setTab(t)}
                className={`border-b-[0.5px] py-4 ${t === tab ? "border-gold text-gold" : "border-transparent text-muted"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <Badge variant="gold">
            {s.alerts.filter((a) => !a.read).length} unread
          </Badge>
        </div>
        {rows.map((a) => {
          const product = s.products.find((p) => p.id === a.entityId);
          const invoice = s.invoices.find((i) => i.id === a.entityId);
          const actionLabel =
            a.id === "sync"
              ? "Dismiss"
              : a.type === "Stock"
                ? product &&
                  product.stock > 0 &&
                  product.stock <= product.reorderLevel &&
                  s.user?.role !== "Finance"
                  ? "Reorder"
                  : "View inventory"
                : a.type === "Credit"
                  ? invoice && !invoice.paid && daysLeft(invoice) < 0 && canPay
                    ? "Pay now"
                    : "View invoice"
                  : a.type === "Delivery"
                    ? "Track truck"
                    : "View";
          const Icon = icons[a.type];
          return (
            <article
              key={a.id}
              className={`flex flex-wrap items-start gap-3 border-b-[0.5px] border-edge p-5 ${a.read ? "bg-surface" : "bg-gold/[0.035]"}`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${a.type === "Credit" ? "bg-danger-tint text-danger" : a.type === "Stock" ? "bg-gold/10 text-gold" : "bg-ivory text-muted"}`}
              >
                <Icon aria-hidden size={17} />
              </div>
              <div className="min-w-[180px] flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base">{a.title}</h3>
                  {!a.read && (
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">{a.description}</p>
                <p className="mt-2 text-xs text-muted">
                  {date(a.timestamp, "dd MMM yyyy · HH:mm")} CAT · {a.type}
                </p>
              </div>
              <Button
                variant="secondary"
                aria-label={`Open ${a.title}`}
                onClick={() => action(a)}
              >
                {actionLabel}
                <ArrowRight aria-hidden size={11} />
              </Button>
              {!a.read && (
                <Button
                  variant="ghost"
                  aria-label={`Mark ${a.title} read`}
                  onClick={() =>
                    void s.command({ type: "readAlert", id: a.id })
                  }
                >
                  <Check aria-hidden size={13} />
                </Button>
              )}
            </article>
          );
        })}
        {!rows.length && (
          <EmptyState
            title="All clear"
            description="There are no alerts in this category."
          />
        )}
      </div>
      {pay && (
        <PaymentModal mode="pay" invoiceId={pay} onClose={() => setPay(null)} />
      )}
    </>
  );
}
