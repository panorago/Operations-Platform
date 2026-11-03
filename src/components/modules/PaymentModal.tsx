import { useState } from "react";
import toast from "react-hot-toast";
import { Button, Modal } from "../ui";
import { useAppStore, useCartStore } from "../../store";
import { money } from "../../lib/utils";
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
  const invoice = store.invoices.find((i) => i.id === invoiceId);
  const total = invoice?.amount ?? cart.totals().total;
  const confirm = async () => {
    setBusy(true);
    const ok = await store.command(
      invoiceId
        ? { type: "payInvoice", id: invoiceId, method }
        : { type: "checkout", items: cart.items, mode, method, terms },
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
          disabled={busy || (!invoice && !cart.items.length)}
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
        {mode === "credit" && !invoice ? (
          <>
            <label className="field">
              Credit terms
              <select
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
            <p className="text-muted">
              Reminder checks at {store.settings.thresholds.join(" / ")} days
              before the due date. For short terms, elapsed thresholds activate
              on the next check. In-app reminders are enabled; email and SMS
              need a provider.
            </p>
          </>
        ) : (
          <label className="field">
            Payment method
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
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
