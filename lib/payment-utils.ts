import type {
  PaymentStatus,
  PayoutAccountStatus,
  PayoutStatus,
} from "@/lib/admin-types";
import { intlLocale } from "@/i18n/config";

/** An amount in its currency for the page's language ("12 500 F CFA"). */
export const formatAmount = (
  amountMinor: number,
  currency: string,
  locale = "fr",
) => {
  try {
    return new Intl.NumberFormat(intlLocale(locale), {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amountMinor);
  } catch {
    return `${new Intl.NumberFormat(intlLocale(locale)).format(amountMinor)} ${currency}`;
  }
};

export const PAYMENT_STATUS_CLASSES: Record<PaymentStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  SUCCEEDED: "border-green-200 bg-green-50 text-green-700",
  CANCELLED: "border-slate-200 bg-slate-50 text-slate-600",
  ERRORED: "border-red-200 bg-red-50 text-red-700",
  REFUND_PENDING: "border-blue-200 bg-blue-50 text-blue-700",
  REFUNDED: "border-blue-200 bg-blue-50 text-blue-700",
};

export const PAYOUT_STATUS_CLASSES: Record<PayoutStatus, string> = {
  NOT_APPLICABLE: "border-slate-200 bg-slate-50 text-slate-500",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  PROCESSING: "border-blue-200 bg-blue-50 text-blue-700",
  SUCCEEDED: "border-green-200 bg-green-50 text-green-700",
  FAILED: "border-red-200 bg-red-50 text-red-700",
  ON_HOLD: "border-violet-200 bg-violet-50 text-violet-700",
};

export const PAYOUT_ACCOUNT_STATUS_LABELS: Record<PayoutAccountStatus, string> =
  {
    ACTIVE: "Actif",
    SUSPENDED: "Suspendu",
  };

