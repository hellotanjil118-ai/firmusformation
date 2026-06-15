export const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue", "cancelled"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export const INVOICE_STATUS_COLOR: Record<InvoiceStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-600",
  paid: "bg-emerald-500/10 text-emerald-700",
  overdue: "bg-red-500/10 text-red-600",
  cancelled: "bg-zinc-500/10 text-zinc-600",
};

export type InvoiceItem = { description: string; quantity: number; unit_price: number };

export const DEFAULT_PAYMENT_INSTRUCTIONS = `Bank transfer / Wise / Payoneer accepted.

Wise: payments@firmusformation.com
Payoneer: payments@firmusformation.com

Please include the invoice number as the payment reference. Email a receipt screenshot once paid.`;
