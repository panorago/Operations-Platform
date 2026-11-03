import {
  creditCharge,
  invoiceBalance,
  defaultCreditPolicy,
} from "../../lib/credit";
import { addDays, parseISO } from "date-fns";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button, Modal } from "../ui";
import { useAppStore, useCartStore } from "../../store";
import { money, date, today } from "../../lib/utils";
export default function PaymentModal({
  mode,
  invoiceId,
  onClose,
}: {
  mode: "pay" | "credit";
  invoiceId?: string;
  onClose: () => void;
}) {
  const store = useAppStore();
  const cart = useCartStore();
  const [method, setMethod] = useState("Bank Transfer");
  const [terms, setTerms] = useState(30);
  const [busy, setBusy] = useState(false);
  const [paymentDate, setPaymentDate] = useState(today());
  const [acceptedInterest, setAcceptedInterest] = useState(false);
  const invoice = store.invoices.find((i) => i.id === invoiceId);
  const principal = invoice?.amount ?? cart.totals().total;
  const policy = store.settings.creditPolicy || defaultCreditPolicy;
  const dueDate = date(
    addDays(parseISO(today()), terms).toISOString(),
    "yyyy-MM-dd",
  );
  const quote = invoice
    ? invoiceBalance(invoice, paymentDate)
    : mode === "credit"
      ? creditCharge(principal, today(), dueDate, policy)
      : { principal, interest: 0, total: principal, days: 0, annualRate: 0 };
  const total = quote.total;
  const confirm = async () => {
    setBusy(true);
    const ok = await store.command(
      invoiceId
        ? { type: "payInvoice", id: invoiceId, method, paymentDate }
        : {
            type: "checkout",
            items: cart.items,
            mode,
            method,
            terms,
            ...(mode === "credit" && policy.enabled
              ? {
                  quotedAnnualRate: policy.annualRate,
                  quotedGraceDays: policy.graceDays,
                }
              : {}),
          },
    );
    setBusy(false);
    if (ok) {
      if (!invoiceId) cart.clearCart();
      toast.success(
        invoiceId
          ? "Payment recorded. Pending reminders cleared."
          : "Order placed successfully",
      );
      onClose();
    }
  };
  return (
    <Modal
      title={
        invoiceId
          ? "Record invoice payment"
          : mode === "credit"
            ? "Credit checkout"
            : "Confirm supplier order"
      }
      onClose={onClose}
      footer={
        <Button
          className="w-full"
          onClick={() => void confirm()}
          disabled={
            busy ||
            (!invoice && !cart.items.length) ||
            (!invoice &&
              mode === "credit" &&
              policy.enabled &&
              !acceptedInterest)
          }
        >
          {busy
            ? "Saving…"
            : invoiceId
              ? `Record ${money(total)} payment`
              : `Place ${money(total)} order`}
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl bg-ivory p-4">
          <p className="eyebrow">
            {invoiceId ||
              `${cart.items.length} product lines · includes 15% VAT`}
          </p>
          <p className="mt-2 text-2xl">{money(total)}</p>
        </div>
        {!invoice && (
          <div className="max-h-40 space-y-2 overflow-y-auto">
            {cart.items.map((i) => (
              <div key={i.productId} className="flex justify-between">
                <span>
                  {store.products.find((p) => p.id === i.productId)?.name} ×{" "}
                  {i.qty}
                </span>
                <span>
                  {money(
                    (store.products.find((p) => p.id === i.productId)?.price ||
                      0) * i.qty,
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
        {(mode === "credit" || invoice?.credit) && (
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
                ? `${quote.annualRate}% APR · simple daily interest · ${quote.days} chargeable days. Interest is recalculated using the actual settlement date. Credit limits apply to principal.`
                : "No interest rate is configured. Set an approved APR in Settings → Credits to charge interest on new credit purchases."}
            </p>
          </div>
        )}
        {invoice && (
          <label className="field">
            Settlement date
            <input
              aria-label="Settlement date"
              type="date"
              value={paymentDate}
              min={invoice.credit?.issuedDate}
              max={today()}
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
        {mode === "credit" && !invoice ? (
          <>
            <label className="field">
              Credit terms
              <select
                aria-label="Credit terms"
                value={terms}
                onChange={(e) => setTerms(Number(e.target.value))}
              >
                {[30, 15, 7].map((n) => (
                  <option key={n} value={n}>
                    Net {n} days
                  </option>
                ))}
              </select>
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
                          addDays(
                            parseISO(today()),
                            terms - days,
                          ).toISOString(),
                        )}
                  </span>
                </p>
              ))}
              <p className="mt-2 border-t-[0.5px] border-edge pt-2">
                Payment due{" "}
                {date(addDays(parseISO(today()), terms).toISOString())}
              </p>
            </div>
            <p className="text-muted">
              Reminder checks at {store.settings.thresholds.join(" / ")} days
              before the due date. For short terms, elapsed thresholds activate
              on the next check. In-app reminders are enabled; email and SMS
              need a provider.
            </p>
            {policy.enabled && (
              <label className="flex items-start gap-2 text-sm leading-5 text-muted">
                <input
                  aria-label="Accept credit interest terms"
                  type="checkbox"
                  checked={acceptedInterest}
                  onChange={(e) => setAcceptedInterest(e.target.checked)}
                  className="mt-1"
                />
                I accept {policy.annualRate}% annual interest, accruing daily
                after {policy.graceDays} grace days, until the actual payment
                date.
              </label>
            )}
          </>
        ) : (
          <label className="field">
            Payment method
            <select
              aria-label="Payment method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {["EcoCash", "Bank Transfer", "Cash on Delivery"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
        )}
        <p className="rounded bg-gold/10 p-3 text-sm text-muted">
          {invoice
            ? "Confirm only after verifying funds were received. This records a manual payment; it does not debit an account."
            : "EcoCash and bank transfers require manual settlement with the supplier. Placing an order does not transfer funds."}
        </p>
      </div>
    </Modal>
  );
}
