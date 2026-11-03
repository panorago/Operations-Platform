import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ShoppingBag,
  CreditCard,
  Truck,
  Activity,
} from "lucide-react";
import { useAppStore } from "../../store";
import { money, date } from "../../lib/utils";
import { Badge, EmptyState } from "../ui";
export default function ActivityFeed() {
  const events = useAppStore((s) => s.activity) || [];
  const [tab, setTab] = useState("All");
  const rows = events.filter(
    (e) =>
      tab === "All" ||
      e.type ===
        tab
          .toLowerCase()
          .replace("deliveries", "delivery")
          .replace("payments", "payment")
          .replace("orders", "order"),
  );
  return (
    <section className="panel">
      <header className="flex items-center justify-between p-4">
        <div>
          <h3>Transaction stream</h3>
          <p className="mt-1 text-xs text-muted">
            Actual workspace events as they happen
          </p>
        </div>
        <Badge variant="success">
          <span className="h-1 w-1 animate-pulse rounded-full bg-success" />
          Live
        </Badge>
      </header>
      <div className="flex gap-1 border-y-[0.5px] border-edge px-3 py-2">
        {["All", "Orders", "Payments", "Deliveries"].map((t) => (
          <button
            key={t}
            aria-label={`Show ${t.toLowerCase()} transactions`}
            onClick={() => setTab(t)}
            className={`rounded px-2 py-1 text-xs ${tab === t ? "bg-noir text-gold" : "text-muted hover:bg-ivory"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="max-h-[320px] overflow-y-auto px-4">
        {rows.slice(0, 12).map((e) => {
          const Icon =
            e.type === "payment"
              ? CreditCard
              : e.type === "delivery"
                ? Truck
                : e.type === "order"
                  ? ShoppingBag
                  : Activity;
          const route = e.entityId.startsWith("INV-")
            ? `/credits?invoice=${e.entityId}`
            : e.entityId.startsWith("ORD-")
              ? `/orders?order=${e.entityId}`
              : e.entityId.startsWith("ZW-")
                ? `/tracking?truck=${e.entityId}`
                : "/inventory";
          return (
            <Link
              key={e.id}
              to={route}
              className="activity-enter flex items-start gap-2.5 border-b-[0.5px] border-edge py-3.5"
            >
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded ${e.type === "payment" ? "bg-success-tint text-success" : e.type === "delivery" ? "bg-blue-50 text-blue-700" : "bg-gold/10 text-gold"}`}
              >
                <Icon aria-hidden size={12} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{e.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  {e.description}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {date(e.timestamp, "HH:mm:ss")} CAT
                  {e.amount !== undefined && (
                    <span className="ml-2 text-noir">{money(e.amount)}</span>
                  )}
                </p>
              </div>
              <ArrowUpRight
                aria-hidden
                size={11}
                className="shrink-0 text-muted"
              />
            </Link>
          );
        })}
        {!rows.length && (
          <EmptyState
            title="No transactions in this view"
            description="Place an order or record a payment to see activity here."
          />
        )}
      </div>
      <Link
        to="/orders"
        className="flex items-center justify-center gap-1 p-3 text-sm text-gold"
      >
        Open all orders
        <ArrowUpRight aria-hidden size={11} />
      </Link>
    </section>
  );
}
