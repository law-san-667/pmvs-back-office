import type {
  LedgerAccount,
  PaymentStatus,
  PayoutAccountStatus,
  PayoutStatus,
} from "@/lib/admin-types";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "En attente",
  SUCCEEDED: "Payée",
  CANCELLED: "Annulée",
  ERRORED: "Échouée",
  REFUND_PENDING: "Remboursement en cours",
  REFUNDED: "Remboursée",
};

export const PAYMENT_STATUS_CLASSES: Record<PaymentStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  SUCCEEDED: "border-green-200 bg-green-50 text-green-700",
  CANCELLED: "border-slate-200 bg-slate-50 text-slate-600",
  ERRORED: "border-red-200 bg-red-50 text-red-700",
  REFUND_PENDING: "border-blue-200 bg-blue-50 text-blue-700",
  REFUNDED: "border-blue-200 bg-blue-50 text-blue-700",
};

export const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  NOT_APPLICABLE: "—",
  PENDING: "Reversement en attente",
  PROCESSING: "Reversement en cours",
  SUCCEEDED: "Reversé",
  FAILED: "Reversement échoué",
};

export const PAYOUT_STATUS_CLASSES: Record<PayoutStatus, string> = {
  NOT_APPLICABLE: "border-slate-200 bg-slate-50 text-slate-500",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  PROCESSING: "border-blue-200 bg-blue-50 text-blue-700",
  SUCCEEDED: "border-green-200 bg-green-50 text-green-700",
  FAILED: "border-red-200 bg-red-50 text-red-700",
};

export const PAYOUT_ACCOUNT_STATUS_LABELS: Record<PayoutAccountStatus, string> =
  {
    ACTIVE: "Actif",
    SUSPENDED: "Suspendu",
  };

export const LEDGER_ACCOUNT_LABELS: Record<LedgerAccount, string> = {
  SALES: "Ventes encaissées",
  PROVIDER_FEES: "Frais LawPay",
  PLATFORM_REVENUE: "Commissions plateforme",
  SUPPLIER_PAYABLE: "Dû aux fournisseurs",
  SUPPLIER_PAID: "Reversé aux fournisseurs",
  SUPPLIER_RECEIVABLE: "À récupérer (remboursements)",
  REFUNDS: "Remboursements clients",
};
