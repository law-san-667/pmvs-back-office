import type { BusinessCategory } from "@/lib/backend-resource-types";

export const BUSINESS_CATEGORY_LABELS: Record<BusinessCategory, string> = {
  PHYSICAL_PERSON: "Personne physique",
  SME: "PME",
  LARGE_ENTERPRISE: "Grande entreprise",
};

export const BUSINESS_CATEGORY_DESCRIPTIONS: Record<BusinessCategory, string> =
  {
    PHYSICAL_PERSON:
      "Vendeur individuel, sans structure juridique enregistrée.",
    SME: "Petite ou moyenne entreprise enregistrée.",
    LARGE_ENTERPRISE: "Grande entreprise ou groupe.",
  };

export const BUSINESS_CATEGORY_OPTIONS = (
  Object.keys(BUSINESS_CATEGORY_LABELS) as BusinessCategory[]
).map((value) => ({
  value,
  label: BUSINESS_CATEGORY_LABELS[value],
  description: BUSINESS_CATEGORY_DESCRIPTIONS[value],
}));

/** Categories that must upload legal documents and fill the legal profile. */
export const LEGAL_BUSINESS_CATEGORIES: BusinessCategory[] = [
  "SME",
  "LARGE_ENTERPRISE",
];

export const isLegalBusinessCategory = (
  category?: BusinessCategory | null,
): boolean =>
  Boolean(category) &&
  LEGAL_BUSINESS_CATEGORIES.includes(category as BusinessCategory);
