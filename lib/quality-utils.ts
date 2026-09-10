import type {
  QualityCheckKey,
  QualityKpi,
  QualityKpiKey,
  QualityThresholds,
} from "@/lib/admin-types";

/** The measured norms, in the order the quality charter lists them. */
export const QUALITY_KPI_LABELS: Record<
  QualityKpiKey,
  { title: string; description: string }
> = {
  negativeFeedback: {
    title: "Rétroaction négative",
    description: "Part des avis notés 1 ou 2 étoiles.",
  },
  responseRate: {
    title: "Service client réactif",
    description: "Part des conversations clients auxquelles le fournisseur a répondu.",
  },
  returnRate: {
    title: "Taux de retour des articles",
    description:
      "Part des commandes livrées qui ont été remboursées (il n'existe pas encore de flux de retour à proprement parler).",
  },
  cancellationRate: {
    title: "Annulations et ruptures de stock",
    description:
      "Commandes annulées par le fournisseur, et annonces en rupture de stock.",
  },
  shippingDelay: {
    title: "Délais de traitement et d'expédition",
    description:
      "Part des commandes expédiées dans le délai imparti après confirmation.",
  },
  minimumStock: {
    title: "Stock minimum par produit",
    description: "Produits publiés dont le stock est sous le minimum requis.",
  },
};

/** The norms only an admin can judge. */
export const QUALITY_CHECK_LABELS: Record<
  QualityCheckKey,
  { title: string; description: string }
> = {
  prohibitedProductsEnforced: {
    title: "Liste des produits prohibés strictement appliquée",
    description: "Aucune annonce ne relève de la liste des produits interdits.",
  },
  admissibleCategoriesDefined: {
    title: "Catégories de produits et services admissibles",
    description:
      "Le fournisseur ne vend que dans les catégories admises pour son profil.",
  },
  productQualityVerified: {
    title: "Normes de qualité des produits vérifiées",
    description: "La qualité des produits a été contrôlée par l'équipe.",
  },
};

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

export const formatKpiValue = (kpi: QualityKpi) => {
  if (kpi.value === null) return "—";
  if (kpi.unit === "percent") return `${kpi.value} %`;
  if (kpi.unit === "days") return `${kpi.value} j`;
  return String(kpi.value);
};

export const formatKpiThreshold = (kpi: QualityKpi) => {
  const sign = kpi.direction === "max" ? "≤" : "≥";
  if (kpi.key === "minimumStock") return "aucun produit sous le minimum";
  if (kpi.unit === "percent") return `${sign} ${kpi.threshold} %`;
  if (kpi.unit === "days") return `${sign} ${kpi.threshold} j`;
  return `${sign} ${kpi.threshold}`;
};

/** Short, human sentence for the figures behind a KPI. */
export const describeKpiDetails = (kpi: QualityKpi) => {
  const d = kpi.details;
  switch (kpi.key) {
    case "negativeFeedback":
      return `${d.negativeReviews ?? 0} avis négatif(s) sur ${d.reviews ?? 0}`;
    case "responseRate":
      return `${d.answered ?? 0} conversation(s) répondue(s) sur ${d.conversations ?? 0}`;
    case "returnRate":
      return `${d.refunded ?? 0} remboursement(s) sur ${d.delivered ?? 0} commande(s) livrée(s)`;
    case "cancellationRate":
      return `${d.cancelledBySupplier ?? 0} annulation(s) sur ${d.ordersReceived ?? 0} commande(s) · rupture ${d.stockOutRate === null || d.stockOutRate === undefined ? "—" : `${d.stockOutRate} %`} (${d.soldOutListings ?? 0} annonce(s))`;
    case "shippingDelay":
      return `${d.onTime ?? 0} à temps sur ${d.shippedOrders ?? 0} expédiée(s) · délai moyen ${d.averageHours === null || d.averageHours === undefined ? "—" : `${d.averageHours} h`} (max ${d.maxDays} j)`;
    case "minimumStock":
      return `${d.underMinimum ?? 0} produit(s) sous ${d.minimum} unité(s) sur ${d.publishedProducts ?? 0} publié(s)`;
  }
};

export const scoreClass = (score: number) =>
  score >= 80
    ? "text-green-700"
    : score >= 50
      ? "text-amber-700"
      : "text-red-700";

export const scoreBarClass = (score: number) =>
  score >= 80 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
