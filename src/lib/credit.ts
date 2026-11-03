import { differenceInCalendarDays, parseISO, isValid } from "date-fns";
import type { CreditPolicy, Invoice } from "../types";
import { today } from "./utils";
export const defaultCreditPolicy: CreditPolicy = {
  enabled: false,
  annualRate: 0,
  graceDays: 0,
};
export function creditCharge(
  principal: number,
  issuedDate: string,
  paymentDate: string,
  policy: CreditPolicy,
) {
  const start = parseISO(issuedDate),
    end = parseISO(paymentDate);
  if (!isValid(start) || !isValid(end) || paymentDate < issuedDate)
    throw Error("Payment date cannot be before the credit purchase.");
  const elapsed = differenceInCalendarDays(end, start);
  const days = Math.max(0, elapsed - policy.graceDays);
  const principalCents = Math.round(principal * 100);
  const interestCents = policy.enabled
    ? Math.round((principalCents * (policy.annualRate / 100) * days) / 365)
    : 0;
  return {
    principal: principalCents / 100,
    interest: interestCents / 100,
    total: (principalCents + interestCents) / 100,
    days,
    annualRate: policy.enabled ? policy.annualRate : 0,
  };
}
export function invoiceBalance(invoice: Invoice, paymentDate = today()) {
  if (invoice.paid)
    return {
      principal: invoice.amount,
      interest: Math.max(
        0,
        (invoice.paidAmount ?? invoice.amount) - invoice.amount,
      ),
      total: invoice.paidAmount ?? invoice.amount,
      days: 0,
      annualRate: invoice.credit?.annualRate || 0,
    };
  if (!invoice.credit)
    return {
      principal: invoice.amount,
      interest: 0,
      total: invoice.amount,
      days: 0,
      annualRate: 0,
    };
  return creditCharge(invoice.amount, invoice.credit.issuedDate, paymentDate, {
    enabled: true,
    annualRate: invoice.credit.annualRate,
    graceDays: invoice.credit.graceDays,
  });
}
