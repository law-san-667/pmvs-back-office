export type CaseReason =
  | "NOT_RECEIVED"
  | "DAMAGED"
  | "NOT_AS_DESCRIBED"
  | "WRONG_ITEM"
  | "OTHER";
export type CaseStatus =
  | "OPEN"
  | "SUPPLIER_ACCEPTED"
  | "ESCALATED"
  | "RESOLVED"
  | "CANCELLED";
export type CaseResolution = "REFUND_FULL" | "REFUND_PARTIAL" | "REPLACEMENT" | "NO_REFUND";

export type AfterSalesCase = {
  id: string;
  orderId: string;
  businessId: string;
  type: "RETURN" | "DISPUTE";
  reason: CaseReason;
  description: string;
  evidence: string[];
  status: CaseStatus;
  supplierResponse: string | null;
  supplierRespondedAt: string | null;
  supplierResponseDueAt: string;
  resolution: CaseResolution | null;
  resolutionNote: string | null;
  /** REFUND_PARTIAL only. */
  refundAmountMinor?: number | null;
  resolvedAt: string | null;
  createdAt: string;
  business?: { name: string };
  order?: {
    id: string;
    status: string;
    totalAmountMinor: number;
    currency: string;
  };
};

/** French labels (admin screens); supplier pages use the afterSales messages. */
export const CASE_REASON_LABELS: Record<CaseReason, string> = {
  NOT_RECEIVED: "Commande non reçue",
  DAMAGED: "Article endommagé",
  NOT_AS_DESCRIBED: "Non conforme à l'annonce",
  WRONG_ITEM: "Mauvais article",
  OTHER: "Autre problème",
};

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  OPEN: "En attente du vendeur",
  SUPPLIER_ACCEPTED: "Accepté par le vendeur",
  ESCALATED: "En examen par Diarama",
  RESOLVED: "Résolu",
  CANCELLED: "Retiré",
};

export const RESOLUTION_LABELS: Record<CaseResolution, string> = {
  REFUND_FULL: "Remboursement intégral",
  REFUND_PARTIAL: "Remboursement partiel",
  REPLACEMENT: "Remplacement",
  NO_REFUND: "Pas de remboursement",
};

export const isCaseActive = (status: CaseStatus) =>
  status === "OPEN" || status === "SUPPLIER_ACCEPTED" || status === "ESCALATED";
