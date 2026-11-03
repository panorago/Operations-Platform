import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  Package,
  ArrowUpRight,
  CreditCard,
  ShoppingBag,
  ArrowRight,
  Clock3,
  ArrowDownRight,
  ShieldCheck,
  Radio,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { subDays, parseISO } from "date-fns";
import { useAppStore } from "../store";
import {
  Badge,
  Button,
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
import { invoiceBalance } from "../lib/credit";
import PaymentModal from "../components/modules/PaymentModal";
import MonitorPanel from "../components/modules/MonitorPanel";
import SimulationControls from "../components/modules/SimulationControls";
import ActivityFeed from "../components/modules/ActivityFeed";
const TruckMap = lazy(() => import("../components/modules/TruckMap"));
export default function Dashboard() {
  const s = useAppStore();
  const [pay, setPay] = useState<string | null>(null),
    [period, setPeriod] = useState(7),
    [chartMode, setChartMode] = useState<"orders" | "spend">("orders");
  const stockIssues = s.products.filter((p) => p.stock <= p.reorderLevel);
  const overdue = s.invoices.filter((i) => !i.paid && daysLeft(i) < 0);
  const urgent = [...s.invoices]
    .filter((i) => !i.paid)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  const moving = s.trucks.filter((t) => t.progress < 100);
  const nearest = [...s.trucks]
    .sort(
      (a, b) => Number(distance(a.lat, a.lng)) - Number(distance(b.lat, b.lng)),
    )
    .slice(0, 4);
  const orders = s.orders.filter(
    (o) =>
      date(o.date, "yyyy-MM-dd") >=
      date(subDays(parseISO(today()), period - 1).toISOString(), "yyyy-MM-dd"),
  );
  const previous = s.orders.filter((o) => {
    const day = date(o.date, "yyyy-MM-dd");
    return (
      day >=
        date(
          subDays(parseISO(today()), period * 2 - 1).toISOString(),
          "yyyy-MM-dd",
        ) &&
      day <
        date(subDays(parseISO(today()), period - 1).toISOString(), "yyyy-MM-dd")
    );
  }).length;
  const delta = previous
    ? Math.round(((orders.length - previous) / previous) * 100)
    : null;
  const chart = useMemo(
    () =>
      Array.from({ length: period }, (_, i) => {
        const d = subDays(parseISO(today()), period - 1 - i);
        const day = date(d.toISOString(), "yyyy-MM-dd");
        const rows = s.orders.filter((o) => date(o.date, "yyyy-MM-dd") === day);
        return {
          day: date(d.toISOString(), period === 7 ? "EEE" : "dd MMM"),
          orders: rows.length,
          spend: Math.round(rows.reduce((n, o) => n + o.total, 0) * 100) / 100,
        };
      }),
    [s.orders, period],
  );
  const health = Math.round(
    ((s.products.length - stockIssues.length) / s.products.length) * 100,
  );
  const due = s.invoices
    .filter((i) => !i.paid && daysLeft(i) <= 30)
    .reduce((n, i) => n + invoiceBalance(i).total, 0);
  const metrics = [
    {
      label: "Deliveries on the move",
      value: String(moving.length).padStart(2, "0"),
      sub: `${s.trucks.filter((t) => t.progress >= 100).length} arrived · ${moving.filter((t) => t.delayed).length} delayed`,
      icon: Truck,
      chip: "Fleet live",
      tone: "success",
    },
    {
      label: `Orders · ${period} days`,
      value: String(orders.length).padStart(2, "0"),
      sub:
        delta === null
          ? "No orders in prior period"
          : `${delta >= 0 ? "+" : ""}${delta}% vs previous ${period} days`,
      icon: ShoppingBag,
      chip: money(orders.reduce((n, o) => n + o.total, 0)),
      tone: "neutral",
    },
    {
      label: "Products needing attention",
      value: String(stockIssues.length).padStart(2, "0"),
      sub: `${stockIssues.filter((p) => !p.stock).length} out of stock · ${stockIssues.filter((p) => p.stock > 0).length} running low`,
      icon: Package,
      chip: "Action needed",
      tone: "warning",
    },
    {
      label: "Credit due · next 30 days",
      value: money(due),
      sub: `${money(overdue.reduce((n, i) => n + invoiceBalance(i).total, 0))} overdue`,
      icon: CreditCard,
      chip: `${overdue.length} overdue`,
      tone: "danger",
    },
  ];
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-5">
        <div>
          <p className="dashboard-kicker mb-2">FreshMark command centre</p>
          <h1 className="text-[26px]">
            Good day, {s.user?.name.split(" ")[0]}{" "}
            <span className="text-gold">.</span>
          </h1>
          <p className="mt-2 text-muted">
            Your retail operation, connected. Here’s where to focus today.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/tracking"
            className="flex items-center gap-2 rounded border-[0.5px] border-edge bg-surface px-3 py-2 text-muted"
          >
            <Truck aria-hidden size={13} />
            Track fleet
          </Link>
          {s.user?.role !== "Finance" && (
            <Link
              to="/catalogue"
              className="flex items-center gap-2 rounded bg-noir px-4 py-2 text-gold"
            >
              <ShoppingBag aria-hidden size={13} />
              New order
              <ArrowUpRight aria-hidden size={12} />
            </Link>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <SimulationControls transactions />
        <div className="flex items-center rounded border-[0.5px] border-edge bg-surface p-0.5">
          {[7, 30].map((n) => (
            <button
              key={n}
              aria-label={`Dashboard last ${n} days`}
              onClick={() => setPeriod(n)}
              className={`rounded px-3 py-1.5 text-sm ${period === n ? "bg-noir text-gold" : "text-muted"}`}
            >
              Last {n} days
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {metrics.map((m) => (
          <article
            key={m.label}
            className="panel overflow-hidden p-4 transition-colors hover:border-gold/40"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">{m.label}</p>
              <m.icon aria-hidden size={15} className="text-gold" />
            </div>
            <div className="mb-3 mt-5 flex items-end justify-between gap-1">
              <p className="text-[27px] leading-none tracking-tight">
                {m.value}
              </p>
              <Badge variant={m.tone}>{m.chip}</Badge>
            </div>
            <p
              className={`text-xs ${m.tone === "danger" ? "text-danger" : "text-muted"}`}
            >
              {m.sub}
            </p>
          </article>
        ))}
      </div>
      <div className="grid grid-cols-[minmax(0,1.8fr)_minmax(300px,1fr)] items-start gap-4">
        <div className="space-y-4">
          <section className="panel overflow-hidden">
            <header className="flex items-center justify-between px-4 py-3.5">
              <div>
                <h3>Distribution network</h3>
                <p className="mt-1 text-xs text-muted">
                  Harare · interactive fleet simulation
                </p>
              </div>
              <Link
                to="/tracking"
                className="flex items-center gap-1 text-sm text-gold"
              >
                Open map
                <ArrowUpRight aria-hidden size={12} />
              </Link>
            </header>
            <div className="h-[290px]">
              <Suspense fallback={<Spinner />}>
                <TruckMap mini />
              </Suspense>
            </div>
            <div className="grid grid-cols-4 border-b-[0.5px] border-edge bg-ivory/40 px-4 py-2 text-xs uppercase tracking-wider text-muted">
              <span>Vehicle</span>
              <span>Supplier</span>
              <span>Route progress</span>
              <span className="text-right">ETA · CAT</span>
            </div>
            {nearest.map((t) => (
              <Link
                key={t.id}
                to={`/tracking?truck=${t.id}`}
                onClick={() => s.setSelectedTruck(t.id)}
                className="grid grid-cols-4 items-center gap-3 border-b-[0.5px] border-edge px-4 py-3 hover:bg-ivory/50"
              >
                <span className="flex items-center gap-2">
                  <StatusDot
                    status={
                      t.delayed
                        ? "danger"
                        : t.progress >= 100
                          ? "warning"
                          : "success"
                    }
                  />
                  <span className="font-medium">{t.id}</span>
                </span>
                <span className="truncate text-sm text-muted">{t.name}</span>
                <div>
                  <ProgressBar
                    value={t.progress}
                    color={t.delayed ? "warning" : "success"}
                  />
                  <span className="mt-1 block text-xs text-muted">
                    {Math.round(t.progress)}%
                  </span>
                </div>
                <span className="text-right text-sm">
                  {t.progress >= 100 ? "Arrived" : t.eta}
                </span>
              </Link>
            ))}
          </section>
          <section className="panel p-4">
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h3>Purchasing activity</h3>
                <p className="mt-1 text-xs text-muted">
                  {money(orders.reduce((n, o) => n + o.total, 0))} placed across{" "}
                  {orders.length} orders
                </p>
              </div>
              <select
                aria-label="Dashboard chart metric"
                value={chartMode}
                onChange={(e) =>
                  setChartMode(e.target.value as "orders" | "spend")
                }
                className="!py-1.5 !text-sm"
              >
                <option value="orders">Order volume</option>
                <option value="spend">Purchase value</option>
              </select>
            </header>
            <div className="h-[175px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chart}
                  margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="orderFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C9933A" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#C9933A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    stroke="#E2DDD6"
                    strokeDasharray="3 5"
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: "#6B6B7B" }}
                    minTickGap={20}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: "#6B6B7B" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    formatter={(value: number) =>
                      chartMode === "spend" ? money(value) : value
                    }
                  />
                  <Area
                    dataKey={chartMode}
                    name={chartMode === "spend" ? "Purchase value" : "Orders"}
                    type="monotone"
                    stroke="#C9933A"
                    strokeWidth={2}
                    fill="url(#orderFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="panel p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3>Supplier network</h3>
              <span className="text-xs text-muted">
                {s.suppliers.length} connected partners
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {s.suppliers.map((p) => (
                <Link
                  key={p.id}
                  to="/catalogue"
                  onClick={() => s.setActiveSupplier(p.id)}
                  className="flex items-center gap-2.5 rounded border-[0.5px] border-edge p-3 hover:bg-ivory"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-ivory text-sm text-gold">
                    {p.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {p.name.replace(" Ltd", "")}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {p.trucks.length} trucks · {p.category}
                    </p>
                  </div>
                  <StatusDot status={supplierStatus(p, s.invoices)} />
                </Link>
              ))}
            </div>
          </section>
        </div>
        <div className="space-y-4">
          <MonitorPanel compact />
          <ActivityFeed />
          <section className="panel flex items-center gap-4 p-4">
            <div className="relative h-24 w-24 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{ value: health }, { value: 100 - health }]}
                    dataKey="value"
                    innerRadius={34}
                    outerRadius={42}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                  >
                    <Cell fill="#2D7A4F" />
                    <Cell fill="#E2DDD6" />
                  </Pie>
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="18"
                    fill="#1C1C2E"
                  >
                    {health}%
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3>Shelf health</h3>
              <p className="mt-1 text-sm leading-5 text-muted">
                {s.products.length - stockIssues.length} of {s.products.length}{" "}
                products above reorder levels.
              </p>
              <Link
                to="/inventory"
                className="mt-2 inline-flex items-center gap-1 text-sm text-gold"
              >
                Review stock
                <ArrowUpRight aria-hidden size={11} />
              </Link>
            </div>
          </section>
          {urgent && (
            <section className="rounded-xl bg-gradient-to-br from-noir to-[#303045] p-5 text-white">
              <div className="flex items-center justify-between">
                <span className="dashboard-kicker !text-gold">
                  Next financial action
                </span>
                <CreditCard aria-hidden size={16} className="text-gold" />
              </div>
              <p className="mt-4 text-xs text-white/45">
                {urgent.id} ·{" "}
                {s.suppliers.find((p) => p.id === urgent.supplierId)?.name}
              </p>
              <div className="mb-4 mt-2 flex items-center justify-between">
                <p className="text-[28px]">
                  {money(invoiceBalance(urgent).total)}
                </p>
                <Badge variant={daysLeft(urgent) < 0 ? "danger" : "warning"}>
                  {Math.abs(daysLeft(urgent))} days{" "}
                  {daysLeft(urgent) < 0 ? "overdue" : "left"}
                </Badge>
              </div>
              <div className="flex gap-2">
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
                  Review invoice
                </Link>
              </div>
            </section>
          )}
        </div>
      </div>
      {pay && (
        <PaymentModal mode="pay" invoiceId={pay} onClose={() => setPay(null)} />
      )}
    </div>
  );
}
