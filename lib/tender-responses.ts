import { intlLocale } from "@/i18n/config";

export type TenderResponseStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "SHORTLISTED"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

export type TenderResponse = {
  id: string;
  tenderId: string;
  responderBusinessId: string;
  coverLetter: string | null;
  proposedAmountMinor: number;
  currency: string;
  deliveryDelayDays: number | null;
  validityDays: number | null;
  technicalOffer: string | null;
  status: TenderResponseStatus;
  submittedAt: string;
  responderBusiness?: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
  };
  tender?: {
    id: string;
    title: string;
    status: string;
    submissionDeadline: string;
  };
};

/** French labels (admin screens); supplier pages use tenders.responseStatus. */
export const RESPONSE_STATUS_LABELS: Record<TenderResponseStatus, string> = {
  SUBMITTED: "Reçue",
  UNDER_REVIEW: "En examen",
  SHORTLISTED: "Présélectionnée",
  ACCEPTED: "Retenue",
  REJECTED: "Non retenue",
  WITHDRAWN: "Retirée",
};

export const RESPONSE_STATUS_CLASSES: Record<TenderResponseStatus, string> = {
  SUBMITTED: "border-slate-200 bg-slate-50 text-slate-700",
  UNDER_REVIEW: "border-blue-200 bg-blue-50 text-blue-700",
  SHORTLISTED: "border-amber-200 bg-amber-50 text-amber-700",
  ACCEPTED: "border-green-200 bg-green-50 text-green-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  WITHDRAWN: "border-slate-200 bg-slate-50 text-slate-500",
};

/** "12 500 FCFA": pass the page's locale. */
export const formatOfferAmount = (
  amount: number,
  currency: string,
  locale = "fr",
) =>
  `${new Intl.NumberFormat(intlLocale(locale)).format(amount)} ${
    currency === "XOF" || currency === "XAF" ? "FCFA" : currency
  }`;
