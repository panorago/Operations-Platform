import { useState } from "react";
import { useAppStore } from "../store";
import { Badge, Button, DataTable, Modal } from "../components/ui";
import { date, money } from "../lib/utils";
import type { Order, OrderStatus } from "../types";
import toast from "react-hot-toast";
const statuses: OrderStatus[] = [
  "Pending",
  "Processing",
  "Dispatched",
  "Delivered",
  "Cancelled",
];
const tone = (s: string) =>
  s === "Delivered"
    ? "success"
    : s === "Cancelled"
      ? "danger"
      : s === "Dispatched"
        ? "info"
        : s === "Processing"
          ? "warning"
          : "neutral";
export default function Orders() {
  const s = useAppStore();
  const [q, setQ] = useState(""),
    [supplier, setSupplier] = useState("all"),
    [status, setStatus] = useState("all"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [page, setPage] = useState(1),
    [id, setId] = useState<string | null>(null);
  const selected = s.orders.find((o) => o.id === id);
  const filtered = s.orders.filter(
    (o) =>
      (
        o.id +
        " " +
        (o.invoiceId || "") +
        " " +
        s.suppliers.find((p) => p.id === o.supplierId)?.name
      )
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      (supplier === "all" || o.supplierId === supplier) &&
      (status === "all" || o.status === status) &&
      (!from || o.date.slice(0, 10) >= from) &&
      (!to || o.date.slice(0, 10) <= to),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 10)),
    current = Math.min(page, pages);
  const next: Record<OrderStatus, OrderStatus[]> = {
    Pending: ["Processing", "Cancelled"],
    Processing: ["Dispatched", "Cancelled"],
    Dispatched: ["Delivered"],
    Delivered: [],
    Cancelled: [],
  };
  const filter = (f: () => void) => {
    f();
    setPage(1);
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow mb-2">PURCHASING & FULFILMENT</p>
          <h1>Orders</h1>
          <p className="subtext">
            From supplier confirmation to your receiving bay.
          </p>
        </div>
        <Badge>{s.orders.length} total orders</Badge>
      </div>
      <div className="panel">
        <div className="toolbar flex-wrap px-4">
          <input
            aria-label="Search orders"
            placeholder="Search order or invoice…"
            value={q}
            onChange={(e) => filter(() => setQ(e.target.value))}
          />
          <select
            aria-label="Order supplier"
            value={supplier}
            onChange={(e) => filter(() => setSupplier(e.target.value))}
          >
            <option value="all">All suppliers</option>
            {s.suppliers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Order status"
            value={status}
            onChange={(e) => filter(() => setStatus(e.target.value))}
          >
            <option value="all">All statuses</option>
            {statuses.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-muted">
            From
            <input
              aria-label="Orders from date"
              type="date"
              value={from}
              onChange={(e) => filter(() => setFrom(e.target.value))}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-muted">
            To
            <input
              aria-label="Orders to date"
              type="date"
              value={to}
              min={from}
              onChange={(e) => filter(() => setTo(e.target.value))}
            />
          </label>
        </div>
        <DataTable<Order>
          data={filtered.slice((current - 1) * 10, current * 10)}
          onRow={(o) => setId(o.id)}
          columns={[
            {
              key: "id",
              label: "Order / Invoice #",
              sortValue: (o) => o.id,
              render: (o) => (
                <div className="font-medium">
                  {o.invoiceId || o.id}
                  <p className="mt-1 text-xs text-muted">
                    {o.paymentMode === "credit"
                      ? "Credit · Net " + o.terms
                      : o.paymentMethod}
                  </p>
                </div>
              ),
            },
            {
              key: "supplier",
              label: "Supplier",
              render: (o) =>
                s.suppliers.find((p) => p.id === o.supplierId)?.name,
            },
            {
              key: "items",
              label: "Items",
              render: (o) => o.items.reduce((n, i) => n + i.qty, 0),
            },
            {
              key: "total",
              label: "Total",
              sortValue: (o) => o.total,
              render: (o) => money(o.total),
            },
            {
              key: "date",
              label: "Date",
              sortValue: (o) => o.date,
              render: (o) => date(o.date),
            },
            {
              key: "status",
              label: "Status",
              render: (o) => <Badge variant={tone(o.status)}>{o.status}</Badge>,
            },
            {
              key: "action",
              label: "Actions",
              render: (o) => (
                <Button
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setId(o.id);
                  }}
                >
                  View →
                </Button>
              ),
            },
          ]}
        />
        <div className="flex items-center justify-between p-4 text-sm text-muted">
          <span>
            {filtered.length} orders · page {current} of {pages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={current <= 1}
              onClick={() => setPage(current - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={current >= pages}
              onClick={() => setPage(current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      {selected && (
        <Modal drawer title={selected.id} onClose={() => setId(null)}>
          <div className="space-y-5">
            <div className="flex justify-between">
              <Badge variant={tone(selected.status)}>{selected.status}</Badge>
              <span>{date(selected.date)}</span>
            </div>
            <div className="rounded-xl bg-ivory p-4">
              <h3>
                {s.suppliers.find((p) => p.id === selected.supplierId)?.name}
              </h3>
              <p className="mt-2 text-muted">
                {
                  s.suppliers.find((p) => p.id === selected.supplierId)
                    ?.contactEmail
                }
              </p>
              <p className="mt-2 text-muted">
                {selected.paymentMode === "credit"
                  ? `Net ${selected.terms} credit · ${selected.invoiceId}`
                  : `${selected.paymentMethod} · manual settlement`}
              </p>
            </div>
            <h3>Products</h3>
            {selected.items.map((i) => {
              const p = s.products.find((p) => p.id === i.productId);
              return (
                <div
                  key={i.productId}
                  className="flex justify-between border-b-[0.5px] border-edge pb-3"
                >
                  <span>
                    {p?.name} × {i.qty}
                  </span>
                  <span>{money((p?.price || 0) * i.qty)}</span>
                </div>
              );
            })}
            <div className="flex justify-between text-lg">
              <span>Total incl. VAT</span>
              <span>{money(selected.total)}</span>
            </div>
            <h3>Delivery timeline</h3>
            {["Pending", "Processing", "Dispatched", "Delivered"].map(
              (stage, i) => (
                <div key={stage} className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${statuses.indexOf(selected.status) >= i && selected.status !== "Cancelled" ? "bg-success-tint text-success" : "bg-ivory text-muted"}`}
                  >
                    {i + 1}
                  </span>
                  <span>{stage}</span>
                  {stage === selected.status && (
                    <Badge variant="gold">Current</Badge>
                  )}
                </div>
              ),
            )}
            {s.user?.role !== "Finance" &&
              next[selected.status].map((status) => (
                <Button
                  key={status}
                  variant={status === "Cancelled" ? "destructive" : "primary"}
                  className="mr-2"
                  onClick={() =>
                    void s
                      .command({ type: "orderStatus", id: selected.id, status })
                      .then((ok) => {
                        if (ok)
                          toast.success(
                            status === "Delivered"
                              ? "Delivery received. Inventory updated."
                              : "Order updated",
                          );
                      })
                  }
                >
                  Mark {status.toLowerCase()}
                </Button>
              ))}
          </div>
        </Modal>
      )}
    </>
  );
}
