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
import { useAppStore } from "../store";
import { Badge, Button, EmptyState } from "../components/ui";
import { date } from "../lib/utils";
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
  const rows = s.alerts
    .filter((a) => tab === "All" || a.type === tab)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const action = (a: (typeof rows)[number]) => {
    void s.command({ type: "readAlert", id: a.id });
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
        <div className="flex items-center justify-between border-b-[0.5px] border-edge px-4">
          <div className="flex gap-5">
            {["All", "Stock", "Credit", "Delivery", "System"].map((t) => (
              <button
                key={t}
                aria-label={`Show ${t} alerts`}
                onClick={() => setTab(t)}
                className={`border-b-2 py-4 ${t === tab ? "border-gold text-gold" : "border-transparent text-muted"}`}
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
          const Icon = icons[a.type];
          return (
            <article
              key={a.id}
              className={`flex items-center gap-4 border-b-[0.5px] border-edge p-5 ${a.read ? "bg-surface" : "bg-gold/[0.035]"}`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${a.type === "Credit" ? "bg-danger-tint text-danger" : a.type === "Stock" ? "bg-gold/10 text-gold" : "bg-ivory text-muted"}`}
              >
                <Icon aria-hidden size={17} />
              </div>
              <div className="flex-1">
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
                {a.type === "Stock"
                  ? "View inventory"
                  : a.type === "Credit"
                    ? "View invoice"
                    : a.type === "Delivery"
                      ? "Track truck"
                      : "View"}
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
    </>
  );
}
