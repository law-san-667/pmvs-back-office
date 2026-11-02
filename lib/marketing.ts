/** Marketing e-mails types and labels (client-safe). */

export const AUDIENCES = ["ALL", "BUYERS", "SELLERS", "ACCOUNTS", "NO_ACCOUNT"] as const;
export type Audience = (typeof AUDIENCES)[number];

export const AUDIENCE_LABELS: Record<Audience, string> = {
  ALL: "Tous les abonnés",
  BUYERS: "Acheteurs (au moins une commande)",
  SELLERS: "Vendeurs (membres d'une boutique)",
  ACCOUNTS: "Abonnés ayant un compte",
  NO_ACCOUNT: "Abonnés sans compte",
};

export const LANGUAGES = ["fr", "en", "pt", "ar"] as const;
export type Language = (typeof LANGUAGES)[number];
export const LANGUAGE_LABELS: Record<Language, string> = {
  fr: "Français",
  en: "Anglais",
  pt: "Portugais",
  ar: "Arabe",
};

export type Segment = { audience: Audience; countryCodes: string[]; languages: Language[] };

export type CampaignStatus = "DRAFT" | "SENDING" | "SENT" | "CANCELLED";
export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  DRAFT: "Brouillon",
  SENDING: "Envoi en cours",
  SENT: "Envoyée",
  CANCELLED: "Arrêtée",
};

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
export const SUBSCRIBER_STATUS_LABELS: Record<SubscriberStatus, string> = {
  PENDING: "En attente de confirmation",
  SUBSCRIBED: "Inscrit",
  UNSUBSCRIBED: "Désinscrit",
};

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

export const CONSENT_EVENT_LABELS: Record<ConsentEvent["event"], string> = {
  REQUESTED: "Demande d'inscription",
  CONFIRMED: "Consentement confirmé",
  UNSUBSCRIBED: "Désinscription",
};

export const CONSENT_SOURCE_LABELS: Record<string, string> = {
  WEB: "formulaire du site",
  MOBILE: "application mobile",
  ACCOUNT: "compte sur le site",
  EMAIL_LINK: "lien reçu par e-mail",
  ONE_CLICK: "bouton de la messagerie",
  ADMIN: "administrateur, à la demande de la personne",
};
