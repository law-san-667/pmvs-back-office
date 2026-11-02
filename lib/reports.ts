/** Custom report types (client-safe). */

export type ReportDefinition = {
  period: { preset: string; from?: string; to?: string };
  metrics: string[];
  axes: string[];
  currency: string;
};

export type ReportCatalog = {
  metrics: { key: string; label: string; kind: string; source: string }[];
  axes: { key: string; label: string; time: boolean; traffic: boolean; platformOnly: boolean }[];
  presets: { key: string; label: string }[];
};

export type ReportColumn = { key: string; label: string; kind: string };

export type ReportResult = {
  from: string;
  to: string;
  currency: string;
  currencies: string[];
  columns: ReportColumn[];
  rows: (string | number)[][];
  totals: (string | number)[];
  totalRows: number;
  truncated: boolean;
};

export type SavedReport = {
  id: string;
  businessId: string | null;
  name: string;
  definition: ReportDefinition;
  createdAt: string;
  updatedAt: string;
};

export const REPORT_FORMATS = [
  { value: "xlsx", label: "Excel" },
  { value: "pdf", label: "PDF" },
  { value: "csv", label: "CSV" },
] as const;

export type ReportFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

/** Translated by the reports messages (frequency.*, emailStatus.*). */
export const EMAIL_STATUSES = ["SENT", "PARTIAL", "FAILED", "NOT_SENT", "PENDING"] as const;
export type EmailStatus = (typeof EMAIL_STATUSES)[number];
export const isEmailStatus = (status: string): status is EmailStatus =>
  (EMAIL_STATUSES as readonly string[]).includes(status);

export type ReportSubscription = {
  frequency: ReportFrequency;
  isActive: boolean;
  emails: string[];
};

export type ReportArchive = {
  id: string;
  businessId: string | null;
  frequency: ReportFrequency;
  title: string;
  periodFrom: string;
  periodTo: string;
  emailStatus: string;
  recipientsCount: number;
  emailedAt: string | null;
  createdAt: string;
};

export type ReportArchiveDetail = ReportArchive & { result: ReportResult };
