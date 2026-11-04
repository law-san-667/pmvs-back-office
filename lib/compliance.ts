/**
 * Compliance types (client-safe). Screens show the "documents" and
 * "adminSettings" messages.
 */

import { intlLocale } from "@/i18n/config";

export type ComplianceDocumentType =
  | "REGISTRATION"
  | "TAX"
  | "IDENTITY"
  | "INSURANCE"
  | "CERTIFICATION"
  | "OTHER";

export type ComplianceDocument = {
  id: string;
  businessId: string;
  type: ComplianceDocumentType;
  title: string;
  fileUrl: string;
  reference: string | null;
  issuedOn: string | null;
  expiresOn: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  business?: { name: string };
};

export type BannedTerm = {
  id: string;
  term: string;
  action: "BLOCK" | "REVIEW";
  reason: string | null;
  isActive: boolean;
  createdAt: string;
};

export type ComplianceFinding = {
  id: string;
  kind: "DOCUMENT_EXPIRING" | "DOCUMENT_EXPIRED" | "BANNED_TERM";
  businessId: string | null;
  entityType: string;
  entityId: string;
  details: string;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
  note: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  closedAt: string | null;
};

export type ComplianceOverview = {
  openFindings: number;
  pendingDocuments: number;
  expiringDocuments: number;
  expiredDocuments: number;
  activeTerms: number;
  lastRun: { status: string; startedAt: string } | null;
};

export type AuditEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  businessId: string | null;
  businessName: string | null;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  oldValues: unknown;
  newValues: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export const formatDay = (day: string | null, locale = "fr") =>
  day
    ? new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium", timeZone: "UTC" }).format(
        new Date(`${day.slice(0, 10)}T00:00:00Z`),
      )
    : "—";

export const formatDateTime = (value: string | null, locale = "fr") =>
  value
    ? new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "short", timeStyle: "short" }).format(
        new Date(value),
      )
    : "—";
