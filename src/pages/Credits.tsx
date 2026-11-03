import { addDays, subDays, parseISO } from "date-fns";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppStore } from "../store";
import {
  Badge,
  Button,
  DataTable,
  MetricCard,
  Modal,
  ProgressBar,
} from "../components/ui";
import {
  date,
  daysLeft,
  download,
  invoiceStatus,
  money,
  today,
} from "../lib/utils";
import type { Invoice } from "../types";
import PaymentModal from "../components/modules/PaymentModal";
import {
  CreditCard,
  Wallet,
  Calendar,
  ArrowUpRight,
  Mail,
  MessageSquare,
  Bell,
} from "lucide-react";
export default function Credits() {
  const s = useAppStore();
  const [params, setParams] = useSearchParams();
  const [pay, setPay] = useState<string | null>(null);
  const [filter, setFilter] = useState("outstanding");
  const selected = s.invoices.find((i) => i.id === params.get("invoice"));
  const used = s.suppliers.reduce((n, p) => n + p.creditUsed, 0),
    limit = s.suppliers.reduce((n, p) => n + p.creditLimit, 0);
  const tone = (i: Invoice) =>
    i.paid
      ? "neutral"
      : daysLeft(i) < 0
        ? "danger"
        : daysLeft(i) <= 15
          ? "warning"
          : "success";
  const receipt = (i: Invoice) =>
    download(
      `${i.id}-receipt.txt`,
      `FRESHMARK RETAIL ZIMBABWE\nPayment record — manual settlement\nInvoice: ${i.id}\nSupplier: ${s.suppliers.find((p) => p.id === i.supplierId)?.name}\nAmount: ${money(i.amount)}\nMethod: ${i.paymentMethod || "Historical record"}\nRecorded: ${date(i.paidAt || i.dueDate)}\nThis record is not bank settlement confirmation.`,
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow mb-2">FINANCIAL HEALTH</p>
          <h1>Credit & payments</h1>
          <p className="subtext">
            Keep supplier relationships healthy, one payment at a time.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => void s.command({ type: "triggerReminders" })}
        >
          Check reminder schedules
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <MetricCard
          label="Total credit limit"
          value={money(limit)}
          sub={`${s.suppliers.length} supplier accounts`}
          icon={<Wallet aria-hidden size={15} />}
        />
        <MetricCard
          label="Currently used"
          value={money(used)}
          sub={
            <>
              <ProgressBar value={(used / limit) * 100} color="warning" />
              <span className="mt-2 block">
                {((used / limit) * 100).toFixed(1)}% of aggregate limit
              </span>
            </>
          }
          icon={<CreditCard aria-hidden size={15} />}
        />
        <MetricCard
          label="Due this month"
          value={money(
            s.invoices
              .filter(
                (i) => !i.paid && i.dueDate.startsWith(today().slice(0, 7)),
              )
              .reduce((n, i) => n + i.amount, 0),
          )}
          sub="Based on invoice due dates"
          icon={<Calendar aria-hidden size={15} />}
        />
        <MetricCard
          label="Available credit"
          value={money(Math.max(0, limit - used))}
          sub="Supplier-specific limits apply"
          icon={<ArrowUpRight aria-hidden size={15} />}
        />
      </div>
      <div className="panel mt-5">
        <div className="flex items-center justify-between p-4">
          <h3>Supplier invoices</h3>
          <select
            aria-label="Invoice filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="outstanding">Outstanding</option>
            <option value="all">All invoices</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <DataTable<Invoice>
          data={s.invoices.filter(
            (i) => filter === "all" || (filter === "paid" ? i.paid : !i.paid),
          )}
          onRow={(i) => setParams({ invoice: i.id })}
          columns={[
            {
              key: "id",
              label: "Invoice #",
              sortValue: (i) => i.id,
              render: (i) => <span className="font-medium">{i.id}</span>,
            },
            {
              key: "supplier",
              label: "Supplier",
              render: (i) =>
                s.suppliers.find((p) => p.id === i.supplierId)?.name,
            },
            {
              key: "amount",
              label: "Amount",
              sortValue: (i) => i.amount,
              render: (i) => money(i.amount),
            },
            {
              key: "due",
              label: "Due date",
              sortValue: (i) => i.dueDate,
              render: (i) => date(i.dueDate),
            },
            {
              key: "days",
              label: "Days left / over",
              sortValue: (i) => daysLeft(i),
              render: (i) =>
                i.paid ? (
                  "—"
                ) : (
                  <span
                    className={daysLeft(i) < 0 ? "text-danger" : "text-muted"}
                  >
                    {Math.abs(daysLeft(i))} days{" "}
                    {daysLeft(i) < 0 ? "overdue" : "left"}
                  </span>
                ),
            },
            {
              key: "status",
              label: "Status",
              render: (i) => (
                <Badge variant={tone(i)}>{invoiceStatus(i)}</Badge>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              render: (i) => (
                <div
                  className="flex gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {i.paid ? (
                    <Button variant="secondary" onClick={() => receipt(i)}>
                      Receipt
                    </Button>
                  ) : (
                    <Button onClick={() => setPay(i.id)}>Pay now</Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => setParams({ invoice: i.id })}
                  >
                    View
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </div>
      <p className="mt-3 text-sm text-muted">
        Opening balances are supplied account snapshots and may differ from
        invoice totals. Credit availability follows the account balance.
      </p>
      {selected && (
        <Modal
          drawer
          title={selected.id}
          onClose={() => setParams({})}
          footer={
            selected.paid ? (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => receipt(selected)}
              >
                Download payment record
              </Button>
            ) : (
              <Button className="w-full" onClick={() => setPay(selected.id)}>
                Pay {money(selected.amount)} — Clear reminders
              </Button>
            )
          }
        >
          <div className="space-y-5">
            <div className="flex justify-between">
              <span>
                {s.suppliers.find((p) => p.id === selected.supplierId)?.name}
              </span>
              <Badge variant={tone(selected)}>{invoiceStatus(selected)}</Badge>
            </div>
            <div className="rounded-xl bg-ivory p-4">
              <p className="text-2xl">{money(selected.amount)}</p>
              <p className="mt-2 text-muted">Due {date(selected.dueDate)}</p>
            </div>
            <h3>Reminder escalation timeline</h3>
            {selected.reminders.map((r, i) => (
              <div key={r.days} className="flex gap-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${i === 0 ? "bg-success-tint text-success" : i === 1 ? "bg-gold/10 text-gold" : "bg-danger-tint text-danger"}`}
                >
                  {i + 1}
                </span>
                <div className="flex-1 border-b-[0.5px] border-edge pb-5">
                  <div className="flex justify-between">
                    <h3 className="text-base">{r.days}-day reminder</h3>
                    <Badge variant={r.sent ? "success" : "neutral"}>
                      {r.delivery}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {r.sentAt
                      ? date(r.sentAt, "dd MMM yyyy · HH:mm")
                      : `Scheduled ${date(subDays(parseISO(selected.dueDate), r.days).toISOString())}`}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                    {r.channels.includes("email") && (
                      <Mail aria-hidden size={11} />
                    )}{" "}
                    {r.channels.includes("sms") && (
                      <MessageSquare aria-hidden size={11} />
                    )}
                    <Bell aria-hidden size={11} />
                    {r.channels.join(" · ")}
                  </div>
                  {r.sent && (
                    <p className="mt-2 text-xs text-muted">
                      {r.delivery}.{" "}
                      {r.channelDelivery
                        ? Object.entries(r.channelDelivery)
                            .map(
                              ([channel, result]) =>
                                `${channel}: ${result.status === "Accepted" ? "accepted by provider" : result.status.toLowerCase()}`,
                            )
                            .join(" · ")
                        : "Email / SMS: pending provider configuration."}
                    </p>
                  )}
                </div>
              </div>
            ))}
            <div className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-noir text-gold">
                4
              </span>
              <div>
                <h3 className="text-base">
                  Overdue —{" "}
                  {s.settings.suspendCredit
                    ? "credit suspended"
                    : "credit review"}
                </h3>
                <p className="mt-2 text-xs text-muted">
                  Trigger date:{" "}
                  {date(addDays(parseISO(selected.dueDate), 1).toISOString())}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted">
                  {selected.paid
                    ? "Closed after payment."
                    : selected.overduePing
                      ? "Active daily in-app ping."
                      : "Activates when the invoice is overdue."}{" "}
                  {s.settings.dailyPings
                    ? "Continues daily until paid."
                    : "Daily pings disabled."}
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
      {pay && (
        <PaymentModal mode="pay" invoiceId={pay} onClose={() => setPay(null)} />
      )}
    </>
  );
}
