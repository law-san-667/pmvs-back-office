import type { QualityThresholds } from "@/lib/admin-types";

export const QUALITY_THRESHOLD_FIELDS: Array<{
  key: keyof QualityThresholds;
  label: string;
  unit: string;
  hint: string;
}> = [
  {
    key: "maxNegativeFeedbackRate",
    label: "Rétroaction négative maximale",
    unit: "%",
    hint: "Avis à 1 ou 2 étoiles.",
  },
  {
    key: "minResponseRate",
    label: "Taux de réponse minimal",
    unit: "%",
    hint: "Conversations clients avec au moins une réponse.",
  },
  {
    key: "maxReturnRate",
    label: "Taux de retour maximal",
    unit: "%",
    hint: "Commandes livrées puis remboursées.",
  },
  {
    key: "maxCancellationRate",
    label: "Taux d'annulation maximal",
    unit: "%",
    hint: "Commandes annulées par le fournisseur.",
  },
  {
    key: "maxStockOutRate",
    label: "Taux de rupture maximal",
    unit: "%",
    hint: "Annonces en rupture parmi celles publiées.",
  },
  {
    key: "maxShippingDelayDays",
    label: "Délai d'expédition maximal",
    unit: "jours",
    hint: "Entre la confirmation et l'expédition.",
  },
  {
    key: "minOnTimeShippingRate",
    label: "Part minimale d'expéditions à temps",
    unit: "%",
    hint: "Commandes expédiées dans le délai.",
  },
  {
    key: "minStockPerProduct",
    label: "Stock minimum par produit",
    unit: "unités",
    hint: "Chaque produit publié doit en avoir au moins autant.",
  },
  {
    key: "evaluationWindowDays",
    label: "Fenêtre d'évaluation",
    unit: "jours",
    hint: "Période sur laquelle les indicateurs sont calculés.",
  },
];

export const scoreClass = (score: number) =>
  score >= 80
    ? "text-green-700"
    : score >= 50
      ? "text-amber-700"
      : "text-red-700";

export const scoreBarClass = (score: number) =>
  score >= 80 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
