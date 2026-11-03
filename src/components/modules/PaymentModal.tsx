import { useMemo, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  Landmark,
  Smartphone,
  Truck,
  ArrowLeft,
  FileCheck2,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button, Modal } from "../ui";
import Select from "../ui/Select";
import { useAppStore, useCartStore } from "../../store";
import {
  creditCharge,
  invoiceBalance,
  defaultCreditPolicy,
} from "../../lib/credit";
import { money, date, today, download } from "../../lib/utils";
import type { PaymentCompletion } from "../../types";
const methods = [
  { name: "EcoCash", icon: Smartphone, note: "Wallet payment reference" },
  {
    name: "Bank Transfer",
    icon: Landmark,
    note: "Completed transfer reference",
  },
  {
    name: "Cash on Delivery",
    icon: Truck,
    note: "Arrange payment with supplier",
  },
];
export default function PaymentModal({
  mode,
  invoiceId,
  onClose,
}: {
  mode: "pay" | "credit";
  invoiceId?: string;
  onClose: () => void;
}) {
  const store = useAppStore(),
    cart = useCartStore();
  const [method, setMethod] = useState("Bank Transfer"),
    [terms, setTerms] = useState(30),
    [paymentDate, setPaymentDate] = useState(today()),
    [reference, setReference] = useState(""),
    [bank, setBank] = useState(""),
    [verified, setVerified] = useState(false),
    [acceptedRate, setAcceptedRate] = useState(""),
    [step, setStep] = useState<"details" | "review" | "complete">("details"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [completion, setCompletion] = useState<PaymentCompletion | null>(null);
  const invoice = store.invoices.find((i) => i.id === invoiceId);
  const credit = mode === "credit" && !invoiceId;
  const policy = store.settings.creditPolicy || defaultCreditPolicy;
  const rateKey = `${policy.annualRate}:${policy.graceDays}`;
  const acceptedInterest = acceptedRate === rateKey;
  const principal = invoice?.amount ?? cart.totals().total;
  const dueDate = format(addDays(parseISO(today()), terms), "yyyy-MM-dd");
  const quote = invoice
    ? invoiceBalance(invoice, paymentDate)
    : credit
      ? creditCharge(principal, today(), dueDate, policy)
      : { principal, interest: 0, total: principal, days: 0, annualRate: 0 };
  const total = quote.total;
  const suppliers = useMemo(
    () =>
      invoice
        ? [
            store.suppliers.find((s) => s.id === invoice.supplierId)?.name ||
              "Supplier",
          ]
        : [
            ...new Set(
              cart.items.map(
                (i) =>
                  store.products.find((p) => p.id === i.productId)
                    ?.supplierName || "Supplier",
              ),
            ),
          ],
    [invoice, store.suppliers, store.products, cart.items],
  );
  function validate() {
    if (invoiceId && !invoice) return "This invoice is no longer available.";
    if (!invoiceId && !cart.items.length)
      return "Add products before placing an order.";
    if (invoice?.paid) return "This invoice is already settled.";
    if (credit && policy.enabled && !acceptedInterest)
      return "Accept the interest terms before continuing.";
    if (invoice && method === "Bank Transfer" && !bank)
      return "Choose the bank used for this payment.";
    if (invoice && method !== "Cash on Delivery" && reference.trim().length < 4)
      return "Enter the reference from the completed payment (at least 4 characters).";
    if (invoice && !verified)
      return "Confirm that the payment was received before recording it.";
    return "";
  }
  function review() {
    const issue = validate();
    setError(issue);
    if (!issue) setStep("review");
  }
  async function confirm() {
    const issue = validate();
    if (issue) {
      setError(issue);
      setStep("details");
      return;
    }
    setBusy(true);
    setError("");
    const previous = new Set(store.orders.map((o) => o.id));
    const ok = await store.command(
      invoiceId
        ? {
            type: "payInvoice",
            id: invoiceId,
            method,
            paymentDate,
            paymentReference: reference.trim() || undefined,
            bankName:
              method === "Bank Transfer" ? bank || undefined : undefined,
          }
        : {
            type: "checkout",
            items: cart.items,
            mode,
            method,
            terms,
            paymentReference: reference.trim() || undefined,
            bankName:
              method === "Bank Transfer" ? bank || undefined : undefined,
            ...(credit && policy.enabled
              ? {
                  quotedAnnualRate: policy.annualRate,
                  quotedGraceDays: policy.graceDays,
                }
              : {}),
          },
    );
    setBusy(false);
    if (!ok) return;
    const current = useAppStore.getState();
    const paid = current.invoices.find((i) => i.id === invoiceId);
    const created = current.orders.filter((o) => !previous.has(o.id));
    setCompletion({
      id: invoiceId ? paid?.receiptId || invoiceId : created[0]?.id || "ORDER",
      title: invoiceId
        ? "Payment recorded"
        : credit
          ? "Credit order placed"
          : "Order placed",
      amount: invoiceId
        ? paid?.paidAmount || total
        : created.reduce((n, o) => n + o.total, 0),
      interest: quote.interest,
      method: credit ? `Net ${terms} credit` : method,
      reference: reference.trim(),
      bank: method === "Bank Transfer" ? bank : "",
      date: invoiceId ? paymentDate : today(),
      documentIds: invoiceId
        ? [invoiceId]
        : created.map((o) => o.invoiceId || o.id),
      supplierNames: suppliers,
    });
    if (!invoiceId) cart.clearCart();
    setStep("complete");
    toast.success(invoiceId ? "Payment record saved." : "Order saved.");
  }
  function receipt() {
    if (!completion) return;
    download(
      `${completion.id}-receipt.txt`,
      [
        "VENDA · FRESHMARK RETAIL ZIMBABWE",
        completion.title,
        `Record: ${completion.id}`,
        `Documents: ${completion.documentIds.join(", ")}`,
        `Supplier(s): ${completion.supplierNames.join(", ")}`,
        `Amount: ${money(completion.amount)}`,
        `Method: ${completion.method}`,
        `Date: ${date(completion.date)}`,
        completion.bank ? `Bank: ${completion.bank}` : "",
        completion.reference
          ? `External reference supplied: ${completion.reference}`
          : "",
        completion.interest
          ? `Interest: ${money(completion.interest)}${credit ? " (estimate at due date)" : ""}`
          : "",
        "This is a VENDA bookkeeping record. No wallet or bank account was charged by VENDA.",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
  const close = () => {
    if (!busy) onClose();
  };
  const footer =
    step === "complete" ? (
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={receipt}>
          <Download aria-hidden size={12} />
          Download receipt
        </Button>
        <Button className="flex-1" onClick={close}>
          Done
        </Button>
      </div>
    ) : step === "review" ? (
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() => setStep("details")}
          disabled={busy}
        >
          <ArrowLeft aria-hidden size={12} />
          Back
        </Button>
        <Button
          className="flex-1"
          onClick={() => void confirm()}
          disabled={busy || (credit && policy.enabled && !acceptedInterest)}
        >
          {busy
            ? "Saving record…"
            : invoiceId
              ? `Record ${money(total)} payment`
              : `Place ${money(total)} order`}
        </Button>
      </div>
    ) : (
      <Button className="w-full" onClick={review}>
        {invoiceId ? "Review payment" : "Review order"}
        <ChevronRight aria-hidden size={13} />
      </Button>
    );
  return (
    <Modal
      title={
        completion?.title ||
        (invoiceId ? "Pay invoice" : credit ? "Credit checkout" : "Checkout")
      }
      onClose={close}
      footer={
        invoiceId && !invoice && step !== "complete" ? (
          <Button onClick={close}>Close</Button>
        ) : (
          footer
        )
      }
    >
      <div className="space-y-5">
        {step !== "complete" && (
          <>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full ${step === "details" ? "bg-noir text-gold" : "bg-success-tint text-success"}`}
              >
                {step === "review" ? <Check aria-hidden size={10} /> : 1}
              </span>
              <span>Details</span>
              <span className="h-px flex-1 bg-edge" />
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full ${step === "review" ? "bg-noir text-gold" : "bg-ivory text-muted"}`}
              >
                2
              </span>
              <span>Review</span>
              <span className="h-px flex-1 bg-edge" />
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ivory">
                3
              </span>
              <span>Receipt</span>
            </div>
            <div className="rounded-xl bg-ivory p-4">
              <p className="eyebrow">
                {invoiceId ||
                  `${cart.items.length} product lines · VAT included`}
              </p>
              <div className="mt-2 flex items-end justify-between">
                <p className="text-[28px] leading-none">{money(total)}</p>
                <span className="text-xs text-muted">
                  {invoiceId
                    ? "Total to record"
                    : credit
                      ? "Estimated at due date"
                      : "Order total"}
                </span>
              </div>
              <p className="mt-3 text-sm text-muted">{suppliers.join(" · ")}</p>
            </div>
          </>
        )}
        {error && (
          <p role="alert" className="rounded bg-danger-tint p-3 text-danger">
            {error}
          </p>
        )}
        {step === "details" && (!invoiceId || invoice) && (
          <>
            {!credit && (
              <>
                <fieldset>
                  <legend className="mb-3 text-sm text-muted">
                    Payment method
                  </legend>
                  <div
                    role="radiogroup"
                    aria-label="Payment method"
                    className="grid grid-cols-3 gap-2"
                  >
                    {methods.map(({ name, icon: Icon }) => (
                      <label
                        key={name}
                        className={`relative flex cursor-pointer flex-col gap-2 rounded-xl border-[0.5px] p-3 transition-colors ${method === name ? "border-gold bg-gold/5 text-noir" : "border-edge text-muted hover:bg-ivory"}`}
                      >
                        <input
                          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          type="radio"
                          name="payment-method"
                          aria-label={name}
                          value={name}
                          checked={method === name}
                          onChange={() => {
                            setMethod(name);
                            setError("");
                            setVerified(false);
                          }}
                        />
                        <span className="flex items-center justify-between">
                          <Icon
                            aria-hidden
                            size={18}
                            className={
                              method === name ? "text-gold" : "text-muted"
                            }
                          />
                          {method === name && (
                            <CheckCircle2
                              aria-hidden
                              size={12}
                              className="text-gold"
                            />
                          )}
                        </span>
                        <span className="text-sm font-medium peer-focus-visible:underline">
                          {name}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                {method === "Bank Transfer" && (
                  <label className="field">
                    {invoice ? "Bank used" : "Preferred bank (optional)"}
                    <Select
                      aria-label="Payment bank"
                      value={bank}
                      onChange={(e) => setBank(e.target.value)}
                      className="w-full"
                    >
                      <option value="">Choose a bank</option>
                      {[
                        "CBZ Bank",
                        "FBC Bank",
                        "Stanbic Bank",
                        "Steward Bank",
                        "NMB Bank",
                        "ZB Bank",
                        "Other bank",
                      ].map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </Select>
                  </label>
                )}
                {method !== "Cash on Delivery" && (
                  <label className="field">
                    {invoice
                      ? "Completed payment reference"
                      : "Payment reference (optional)"}
                    <input
                      aria-label="Payment reference"
                      value={reference}
                      maxLength={80}
                      autoComplete="off"
                      placeholder={
                        method === "EcoCash"
                          ? "EcoCash transaction reference"
                          : "Bank transfer reference"
                      }
                      onChange={(e) => setReference(e.target.value)}
                    />
                    <span className="text-xs text-muted">
                      {invoice
                        ? "Use the reference from the payment already received."
                        : "You can arrange settlement directly with the supplier after placing the order."}
                    </span>
                  </label>
                )}
                {method === "Cash on Delivery" && (
                  <div className="rounded-xl bg-ivory p-3 text-sm leading-5 text-muted">
                    {invoice
                      ? "Use this option after cash has been received and counted."
                      : "Payment is due when the supplier delivers. The order will be saved with cash on delivery as its payment method."}
                  </div>
                )}
              </>
            )}
            {invoice && (
              <label className="field">
                Settlement date
                <input
                  aria-label="Settlement date"
                  type="date"
                  min={invoice.credit?.issuedDate}
                  max={today()}
                  value={paymentDate}
                  onChange={(e) => {
                    if (
                      e.target.value &&
                      e.target.value <= today() &&
                      (!invoice.credit ||
                        e.target.value >= invoice.credit.issuedDate)
                    )
                      setPaymentDate(e.target.value);
                  }}
                />
              </label>
            )}
            {(credit || invoice?.credit) && (
              <div className="space-y-2 rounded-xl border-[0.5px] border-edge p-3">
                <div className="flex justify-between">
                  <span className="text-muted">Principal incl. VAT</span>
                  <span>{money(principal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">
                    {invoice ? "Accrued" : "Estimated"} interest
                  </span>
                  <span className="text-gold">{money(quote.interest)}</span>
                </div>
                <p className="text-xs leading-5 text-muted">
                  {quote.annualRate > 0
                    ? `${quote.annualRate}% APR · ${quote.days} chargeable days · calculated through the actual settlement date.`
                    : "Interest charging is off or no approved rate has been configured."}
                </p>
              </div>
            )}
            {credit && (
              <>
                <label className="field">
                  Credit terms
                  <Select
                    aria-label="Credit terms"
                    value={terms}
                    onChange={(e) => setTerms(Number(e.target.value))}
                    className="w-full"
                  >
                    {[30, 15, 7].map((n) => (
                      <option key={n} value={n}>
                        Net {n} days
                      </option>
                    ))}
                  </Select>
                </label>
                <div className="rounded bg-ivory p-3">
                  <p className="mb-2 font-medium">Reminder schedule preview</p>
                  {store.settings.thresholds.map((days) => (
                    <p
                      key={days}
                      className="my-1 flex justify-between text-sm text-muted"
                    >
                      <span>{days}-day alert</span>
                      <span>
                        {terms < days
                          ? "On next reminder check"
                          : date(
                              format(
                                addDays(parseISO(today()), terms - days),
                                "yyyy-MM-dd",
                              ),
                            )}
                      </span>
                    </p>
                  ))}
                  <p className="mt-2 border-t-[0.5px] border-edge pt-2">
                    Payment due {date(dueDate)}
                  </p>
                </div>
                {policy.enabled && (
                  <label className="flex items-start gap-2 text-sm leading-5 text-muted">
                    <input
                      aria-label="Accept credit interest terms"
                      type="checkbox"
                      className="mt-1"
                      checked={acceptedInterest}
                      onChange={(e) =>
                        setAcceptedRate(e.target.checked ? rateKey : "")
                      }
                    />
                    I accept {policy.annualRate}% annual interest, accruing
                    daily after {policy.graceDays} grace days until actual
                    settlement.
                  </label>
                )}
              </>
            )}
            {invoice && (
              <label className="flex items-start gap-2 rounded border-[0.5px] border-edge p-3 text-sm leading-5">
                <input
                  aria-label="Confirm payment received"
                  type="checkbox"
                  className="mt-1"
                  checked={verified}
                  onChange={(e) => setVerified(e.target.checked)}
                />
                <span>
                  I confirm{" "}
                  {method === "Cash on Delivery"
                    ? "the cash was received"
                    : "this payment was received outside VENDA"}{" "}
                  and the amount is correct.
                </span>
              </label>
            )}
            <p className="text-xs leading-5 text-muted">
              {invoice
                ? "Recording a payment updates the invoice and reminders. It does not debit a wallet or bank account."
                : "Placing this order records your chosen settlement method. No wallet or bank account is charged."}
            </p>
          </>
        )}
        {step === "review" && (
          <>
            <div className="flex items-center gap-2 text-success">
              <FileCheck2 aria-hidden size={16} />
              <h3>Check before confirming</h3>
            </div>
            <dl className="space-y-3">
              {[
                ["Document", invoiceId || "New supplier order"],
                ["Method", credit ? `Net ${terms} credit` : method],
                ["Date", date(invoice ? paymentDate : today())],
                ...(bank && !credit && method === "Bank Transfer"
                  ? [["Bank", bank]]
                  : []),
                ...(reference && !credit ? [["Reference", reference]] : []),
                [
                  credit ? "Due date" : "Settlement",
                  credit
                    ? date(dueDate)
                    : invoice
                      ? "Received externally"
                      : method === "Cash on Delivery"
                        ? "Due on delivery"
                        : "Arrange with supplier",
                ],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between gap-4 border-b-[0.5px] border-edge pb-3"
                >
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right">{v}</dd>
                </div>
              ))}
            </dl>
            {!invoice && (
              <div className="max-h-36 overflow-auto rounded bg-ivory p-3">
                {cart.items.map((i) => (
                  <div
                    key={i.productId}
                    className="flex justify-between gap-3 py-1 text-sm"
                  >
                    <span>
                      {store.products.find((p) => p.id === i.productId)?.name} ×{" "}
                      {i.qty.toLocaleString()}
                    </span>
                    <span>
                      {money(
                        (store.products.find((p) => p.id === i.productId)
                          ?.price || 0) * i.qty,
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p className="rounded bg-gold/10 p-3 text-sm leading-5 text-muted">
              {invoice
                ? "This saves a local payment record and clears pending invoice reminders. Funds are not transferred by VENDA."
                : credit
                  ? "Confirming creates the supplier order and credit invoice under the terms shown."
                  : "The supplier order will be saved. Payment is arranged directly with the supplier."}
            </p>
          </>
        )}
        {step === "complete" && completion && (
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-tint text-success">
                <CheckCircle2 aria-hidden size={28} />
              </span>
              <h2>You’re all set</h2>
              <p className="max-w-xs text-sm leading-5 text-muted">
                {invoiceId
                  ? "The invoice is settled in your records and pending reminders are cleared."
                  : credit
                    ? "Your order and credit invoice are saved."
                    : "Your supplier order is saved and ready to process."}
              </p>
            </div>
            <div className="rounded-xl bg-ivory p-4">
              <p className="eyebrow">
                {credit ? "Principal financed" : "Recorded amount"}
              </p>
              <p className="mt-2 text-[28px]">{money(completion.amount)}</p>
              <div className="mt-4 space-y-2 text-sm">
                {[
                  ["Record", completion.id],
                  ["Method", completion.method],
                  ["Date", date(completion.date)],
                  ...(completion.reference
                    ? [["Reference", completion.reference]]
                    : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <span className="text-muted">{k}</span>
                    <span className="text-right">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs leading-5 text-muted">
              {invoiceId
                ? "This receipt confirms a VENDA bookkeeping entry, not a bank or wallet charge."
                : method === "Cash on Delivery" && !credit
                  ? "Payment remains due on delivery."
                  : "This confirmation does not transfer funds."}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
