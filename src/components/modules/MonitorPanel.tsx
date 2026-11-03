import { useMemo } from "react";
import {
  BrainCircuit,
  ArrowUpRight,
  RefreshCw,
  ShieldCheck,
  Radio,
  Package,
  Truck,
  CreditCard,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore, useCartStore } from "../../store";
import { scanOperations } from "../../lib/monitoring";
import { date } from "../../lib/utils";
import { Badge, Button } from "../ui";
import type { MonitorIssue } from "../../types";
export default function MonitorPanel({
  compact = false,
}: {
  compact?: boolean;
}) {
  const s = useAppStore();
  const navigate = useNavigate();
  const issues = useMemo(
    () => scanOperations(s),
    [s.products, s.invoices, s.trucks],
  );
  const monitor = s.monitor;
  const connected = Boolean(monitor?.providerReady);
  const configured = Boolean(monitor?.providerConfigured || connected);
  const act = (issue: MonitorIssue) => {
    if (issue.kind === "Stock" && s.user?.role !== "Finance") {
      useCartStore
        .getState()
        .addItem(issue.entityId, false, issue.quantity || 1);
      s.setActiveSupplier(
        s.products.find((p) => p.id === issue.entityId)?.supplierId || "all",
      );
      navigate("/catalogue");
    } else
      navigate(
        issue.kind === "Credit"
          ? `/credits?invoice=${issue.entityId}`
          : issue.kind === "Delivery"
            ? `/tracking?truck=${issue.entityId}`
            : "/inventory",
      );
  };
  return (
    <section className="panel overflow-hidden">
      <header className="flex items-center justify-between gap-2 border-b-[0.5px] border-edge p-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold/10 text-gold">
            <BrainCircuit aria-hidden size={17} />
          </span>
          <div>
            <h3>Operations monitor</h3>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
              <span
                className={`h-1.5 w-1.5 rounded-full ${connected ? "animate-pulse bg-success" : "bg-gold"}`}
              />
              {connected
                ? monitor?.status === "paused"
                  ? "AI paused"
                  : s.monitorBusy
                    ? "AI analysing…"
                    : "Live AI connected"
                : configured
                  ? monitor?.status === "error"
                    ? "AI unavailable · local checks active"
                    : "AI configured · awaiting first check"
                  : "Live stock & credit checks · AI not connected"}
            </p>
          </div>
        </div>
        <Badge
          variant={
            issues.some((i) => i.severity === "critical")
              ? "warning"
              : "success"
          }
        >
          {issues.length} signals
        </Badge>
      </header>
      <div className="grid grid-cols-3 gap-2 border-b-[0.5px] border-edge bg-ivory/40 px-4 py-3">
        {[
          { name: "Stock", icon: Package },
          { name: "Credit", icon: CreditCard },
          { name: "Delivery", icon: Truck },
        ].map(({ name, icon: Icon }) => (
          <div key={name} className="flex items-center gap-2 text-sm">
            <Icon aria-hidden size={12} className="text-muted" />
            <span>{issues.filter((i) => i.kind === name).length}</span>
            <span className="text-xs text-muted">{name}</span>
          </div>
        ))}
      </div>
      {monitor?.summary && (
        <div className="border-b-[0.5px] border-edge bg-success-tint/30 p-4">
          <p className="eyebrow mb-2 text-success">
            AI ASSESSMENT ·{" "}
            {monitor.analyzedAt
              ? date(monitor.analyzedAt, "HH:mm") + " CAT"
              : ""}
          </p>
          <p aria-live="polite" className="text-base leading-6">
            {monitor.summary}
          </p>
        </div>
      )}
      <div
        className={
          compact
            ? "max-h-[272px] overflow-y-auto"
            : "grid grid-cols-1 gap-0 md:grid-cols-3"
        }
      >
        {issues.slice(0, compact ? 3 : 6).map((issue) => (
          <article key={issue.id} className="border-b-[0.5px] border-edge p-4">
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${issue.severity === "critical" ? "bg-danger" : "bg-gold"}`}
              />
              <span className="text-xs uppercase tracking-wider text-muted">
                {issue.kind} · {issue.severity}
              </span>
            </div>
            <p className="font-medium">{issue.title}</p>
            <p className="mb-3 mt-1 text-sm leading-5 text-muted">
              {issue.detail}
            </p>
            <button
              aria-label={`${issue.action}: ${issue.title}`}
              className="flex items-center gap-1 text-sm text-gold"
              onClick={() => act(issue)}
            >
              {issue.action}
              <ArrowUpRight aria-hidden size={11} />
            </button>
          </article>
        ))}
      </div>
      {!issues.length && (
        <div className="p-5 text-success">
          <ShieldCheck aria-hidden className="mr-2 inline" size={15} />
          All monitored stock, credit and delivery checks are clear.
        </div>
      )}
      <footer className="flex flex-wrap items-center justify-between gap-2 p-4">
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <Radio aria-hidden size={11} />
          {monitor?.checkedAt
            ? "Checked " + date(monitor.checkedAt, "HH:mm:ss") + " CAT"
            : "Monitoring current workspace"}
        </span>
        {configured ? (
          <Button
            aria-label="Analyze operations"
            variant="secondary"
            disabled={s.monitorBusy}
            onClick={() => void s.runAnalysis()}
          >
            <RefreshCw
              aria-hidden
              size={11}
              className={s.monitorBusy ? "animate-spin" : ""}
            />
            {s.monitorBusy ? "Analysing…" : "Analyze now"}
          </Button>
        ) : (
          <Link to="/settings?tab=Notifications" className="text-sm text-gold">
            Connect AI ↗
          </Link>
        )}
      </footer>
      {monitor?.error && (
        <p role="alert" className="px-4 pb-4 text-sm text-danger">
          {monitor.error}
        </p>
      )}
    </section>
  );
}
