import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  Package,
  ArrowUpRight,
  CreditCard,
  ShoppingBag,
  ArrowRight,
  Activity,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts";
import { useAppStore } from "../store";
import {
  Badge,
  MetricCard,
  ProgressBar,
  Spinner,
  StatusDot,
} from "../components/ui";
import {
  money,
  date,
  today,
  daysLeft,
  stockStatus,
  supplierStatus,
  distance,
} from "../lib/utils";
import { useState } from "react";
import PaymentModal from "../components/modules/PaymentModal";
const TruckMap = lazy(() => import("../components/modules/TruckMap"));
export default function Dashboard() {
  const s = useAppStore();
  const [pay, setPay] = useState<string | null>(null);
  const alerts = s.products.filter((p) => p.stock <= p.reorderLevel);
  const overdue = s.invoices.filter((i) => !i.paid && daysLeft(i) < 0);
  const urgent = [...s.invoices]
    .filter((i) => !i.paid)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  const nearest = [...s.trucks]
    .sort(
      (a, b) => Number(distance(a.lat, a.lng)) - Number(distance(b.lat, b.lng)),
    )
    .slice(0, 4);
  const recent = s.orders.filter(
    (o) =>
      o.date.slice(0, 10) >=
      date(new Date(Date.now() - 7 * 86400000).toISOString(), "yyyy-MM-dd"),
  );
  const previous = s.orders.filter((o) => {
    const day = date(o.date, "yyyy-MM-dd");
    return (
      day >=
        date(
          new Date(Date.now() - 14 * 86400000).toISOString(),
          "yyyy-MM-dd",
        ) &&
      day <
        date(new Date(Date.now() - 7 * 86400000).toISOString(), "yyyy-MM-dd")
    );
  }).length;
  const change = previous
    ? `${(((recent.length - previous) / previous) * 100).toFixed(0)}% vs prior week`
    : "No orders in prior week";
  const chart = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000).toISOString();
    return {
      day: date(d, "EEE"),
      orders: s.orders.filter(
        (o) => date(o.date, "yyyy-MM-dd") === date(d, "yyyy-MM-dd"),
      ).length,
    };
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow mb-2">YOUR OPERATION, AT A GLANCE</p>
          <h1>
            Good day, {s.user?.name.split(" ")[0]}{" "}
            <span className="text-gold">.</span>
          </h1>
          <p className="subtext">
            Here’s what’s happening across FreshMark today.
          </p>
        </div>
        <Link
          className="flex items-center gap-2 rounded bg-noir px-4 py-2 text-gold"
          to="/catalogue"
        >
          <ShoppingBag aria-hidden size={13} /> Place an order{" "}
          <ArrowUpRight aria-hidden size={12} />
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <MetricCard
          label="Trucks in transit"
          value={s.trucks.length.toString().padStart(2, "0")}
          sub={`${s.trucks.filter((t) => !t.delayed).length} on route · ${s.trucks.filter((t) => t.delayed).length} delayed`}
          icon={<Truck aria-hidden size={15} />}
        />
        <MetricCard
          label="Orders this week"
          value={recent.length.toString().padStart(2, "0")}
          sub={change}
          icon={<ShoppingBag aria-hidden size={15} />}
        />
        <MetricCard
          label="Stock alerts"
          value={alerts.length.toString().padStart(2, "0")}
          sub={`${alerts.filter((p) => !p.stock).length} critical · ${alerts.filter((p) => p.stock > 0).length} low stock`}
          icon={<Package aria-hidden size={15} />}
        />
        <MetricCard
          label="Credit due · 30 days"
          value={money(
            s.invoices
              .filter((i) => !i.paid && daysLeft(i) <= 30)
              .reduce((n, i) => n + i.amount, 0),
          )}
          sub={
            <span className="text-danger">
              {money(overdue.reduce((n, i) => n + i.amount, 0))} overdue ·
              action needed
            </span>
          }
          icon={<CreditCard aria-hidden size={15} />}
        />
      </div>
      <div className="mb-3 mt-6 flex justify-between">
        <h3>
          Supplier network{" "}
          <span className="ml-2 text-xs text-muted">
            {s.suppliers.length.toString().padStart(2, "0")} PARTNERS
          </span>
        </h3>
        <Link to="/settings" className="text-sm text-muted">
          Manage suppliers →
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {s.suppliers.map((p) => (
          <Link
            key={p.id}
            to="/catalogue"
            onClick={() => s.setActiveSupplier(p.id)}
            className="panel flex items-center gap-3 p-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded bg-ivory text-gold">
              <Package aria-hidden size={15} />
            </div>
            <div className="flex-1">
              <p className="font-medium">{p.name}</p>
              <p className="mt-1 text-xs text-muted">
                {p.category} · {p.trucks.length} trucks in transit
              </p>
            </div>
            <StatusDot
              status={
                s.trucks.some((t) => t.supplierId === p.id && t.delayed)
                  ? "danger"
                  : supplierStatus(p, s.invoices)
              }
            />
            <ArrowUpRight aria-hidden size={12} className="text-muted" />
          </Link>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-[3fr_2fr] gap-4">
        <section className="panel overflow-hidden">
          <div className="flex justify-between p-4">
            <div>
              <h3>Live deliveries</h3>
              <p className="mt-1 text-xs text-muted">
                Harare distribution network · simulated GPS
              </p>
            </div>
            <Badge variant="success">
              <Activity aria-hidden size={9} /> LIVE SIMULATION
            </Badge>
          </div>
          <div className="relative h-[235px]">
            <Suspense fallback={<Spinner />}>
              <TruckMap mini />
            </Suspense>
            <span className="absolute bottom-3 left-3 z-[400] rounded bg-surface px-2 py-1 text-xs">
              ■ FreshMark HQ{" "}
              <span className="ml-2 text-success">● On route</span>
              <span className="ml-2 text-danger">● Delayed</span>
            </span>
          </div>
          <div className="px-4">
            {nearest.map((t) => (
              <Link
                key={t.id}
                to="/tracking"
                onClick={() => s.setSelectedTruck(t.id)}
                className="grid grid-cols-[1fr_1fr_90px] items-center gap-4 border-b-[0.5px] border-edge py-3"
              >
                <div className="flex items-center gap-2">
                  <StatusDot status={t.delayed ? "danger" : "success"} />
                  <div>
                    <span className="font-medium">{t.id}</span>
                    <p className="mt-1 text-xs text-muted">
                      {t.name} ·{" "}
                      {
                        s.products.filter((p) => p.supplierId === t.supplierId)
                          .length
                      }{" "}
                      product lines
                    </p>
                  </div>
                </div>
                <div>
                  <ProgressBar value={t.progress} />
                  <p className="mt-1 text-xs text-muted">
                    {t.progress}% of route
                  </p>
                </div>
                <span className="text-right">
                  {t.eta} <span className="text-xs text-muted">CAT</span>
                </span>
              </Link>
            ))}
          </div>
          <Link
            to="/tracking"
            className="flex items-center justify-center gap-2 py-4 text-sm text-gold"
          >
            View all {s.trucks.length} trucks{" "}
            <ArrowRight aria-hidden size={12} />
          </Link>
        </section>
        <div className="space-y-4">
          <section className="panel">
            <div className="flex justify-between p-4">
              <h3>Stock needs attention</h3>
              <Badge variant="danger">{alerts.length} alerts</Badge>
            </div>
            <div className="max-h-[255px] overflow-auto px-4">
              {alerts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border-b-[0.5px] border-edge py-2.5"
                >
                  <div>
                    <p>{p.name}</p>
                    <p className="mt-1 text-xs text-muted">{p.supplierName}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={p.stock ? "warning" : "danger"}>
                      {stockStatus(p)}
                    </Badge>
                    <p className="mt-1 text-xs text-muted">{p.stock} units</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/inventory" className="block p-4 text-sm text-gold">
              Go to inventory →
            </Link>
          </section>
          {urgent && (
            <section className="rounded-xl bg-noir p-4 text-white">
              <div className="flex items-center justify-between">
                <span className="eyebrow text-gold">
                  PAYMENT REQUIRES ATTENTION
                </span>
                <CreditCard aria-hidden className="text-gold" size={15} />
              </div>
              <div className="mt-4 flex justify-between">
                <div>
                  <p className="text-xs text-white/40">
                    {urgent.id} ·{" "}
                    {s.suppliers.find((p) => p.id === urgent.supplierId)?.name}
                  </p>
                  <p className="mt-2 text-2xl">{money(urgent.amount)}</p>
                </div>
                <Badge variant="danger">
                  {Math.abs(daysLeft(urgent))} days{" "}
                  {daysLeft(urgent) < 0 ? "overdue" : "left"}
                </Badge>
              </div>
              <div className="mt-4 flex gap-2">
                {s.user?.role !== "Operations" && (
                  <button
                    aria-label="Pay urgent invoice"
                    className="rounded bg-gold px-4 py-2 text-noir"
                    onClick={() => setPay(urgent.id)}
                  >
                    Pay now
                  </button>
                )}
                <Link
                  to={`/credits?invoice=${urgent.id}`}
                  className="rounded border-[0.5px] border-white/20 px-4 py-2 text-white/60"
                >
                  View details
                </Link>
              </div>
            </section>
          )}
        </div>
      </div>
      <section className="panel mt-4 p-4">
        <div className="flex justify-between">
          <h3>Order activity</h3>
          <span className="text-xs text-muted">Last 7 days</span>
        </div>
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart}>
              <XAxis
                dataKey="day"
                tick={{ fontSize: 9, fill: "#6B6B7B" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="orders"
                stroke="#C9933A"
                fill="#C9933A"
                fillOpacity={0.08}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
      {pay && (
        <PaymentModal mode="pay" invoiceId={pay} onClose={() => setPay(null)} />
      )}
    </>
  );
}
