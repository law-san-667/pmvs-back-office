/** Marketing e-mails types and labels (client-safe). */

export const AUDIENCES = ["ALL", "BUYERS", "SELLERS", "ACCOUNTS", "NO_ACCOUNT"] as const;
export type Audience = (typeof AUDIENCES)[number];

export const LANGUAGES = ["fr", "en", "pt", "ar"] as const;
export type Language = (typeof LANGUAGES)[number];

export type Segment = { audience: Audience; countryCodes: string[]; languages: Language[] };

export type CampaignStatus = "DRAFT" | "SENDING" | "SENT" | "CANCELLED";

export type Campaign = {
  id: string;
  subject: string;
  preheader: string | null;
  body: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  segment: Segment;
  status: CampaignStatus;
  createdByName: string | null;
  sentByName: string | null;
  sendStartedAt: string | null;
  sendFinishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  recipients: { total: number; pending: number; sent: number; failed: number; skipped: number };
};

export type CampaignInput = {
  subject: string;
  preheader: string | null;
  body: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  segment: Segment;
};

export type SubscriberStatus = "PENDING" | "SUBSCRIBED" | "UNSUBSCRIBED";

export type Subscriber = {
  id: string;
  email: string;
  status: SubscriberStatus;
  language: string;
  countryCode: string | null;
  hasAccount: boolean;
  subscribedAt: string | null;
  unsubscribedAt: string | null;
  createdAt: string;
};

export type SubscribersPage = {
  items: Subscriber[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  counts: Record<SubscriberStatus, number>;
};

export type ConsentEvent = {
  id: string;
  event: "REQUESTED" | "CONFIRMED" | "UNSUBSCRIBED";
  source: string;
  consentText: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  actorName: string | null;
  createdAt: string;
};

