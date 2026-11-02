/** Supplier questionnaire and vendability types (client-safe). */

export type QuestionOption = { id: string; label: string; points: number };

export type Question = {
  id: string;
  label: string;
  help?: string;
  type: "CHOICE" | "TEXT";
  required: boolean;
  weight: number;
  options: QuestionOption[];
};

export type QuestionnaireVersion = {
  id: string;
  version: number;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  questions: Question[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type QuestionnaireAnswer = {
  id: string;
  questionnaireId: string;
  version: number;
  answers: Record<string, string>;
  score: number | null;
  submittedAt: string;
};

export type ShopQuestionnaire = {
  questionnaire: QuestionnaireVersion | null;
  response: QuestionnaireAnswer | null;
  upToDate: boolean;
};

export type QuestionnaireResponseRow = {
  id: string;
  businessId: string;
  businessName: string;
  answers: Record<string, string>;
  score: number | null;
  submittedAt: string;
};

export type TopListings = {
  windowDays: number;
  ranked: number;
  items: {
    listingId: string;
    title: string;
    businessId: string;
    businessName: string;
    units: number;
    views: number;
    score: number;
    criteria: { key: string; label: string; weight: number; value: number | null }[];
  }[];
};

export const CRITERION_LABELS = {
  sales: "Unités commandées",
  conversion: "Taux de conversion",
  cartRate: "Taux d'ajout au panier",
  views: "Vues",
  rating: "Note des acheteurs",
  availability: "Disponibilité",
  completeness: "Qualité de la fiche",
  supplier: "Questionnaire du fournisseur",
} as const;

export type VendabilitySettings = {
  windowDays: number;
  minViews: number;
  minScore: number;
  weights: Record<keyof typeof CRITERION_LABELS, number>;
  targets: { units: number; views: number; conversionRate: number; cartRate: number };
};

export const VERSION_STATUS_LABELS: Record<QuestionnaireVersion["status"], string> = {
  DRAFT: "En préparation",
  PUBLISHED: "En vigueur",
  ARCHIVED: "Archivée",
};
