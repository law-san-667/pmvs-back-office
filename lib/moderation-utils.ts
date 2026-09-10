import type { ListingModerationStatus } from "@/lib/backend-resource-types";

export const MODERATION_STATUS_LABELS: Record<ListingModerationStatus, string> =
  {
    PENDING: "En attente de validation",
    APPROVED: "Validé",
    REJECTED: "Refusé",
  };

export const MODERATION_STATUS_CLASSES: Record<ListingModerationStatus, string> =
  {
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
    APPROVED: "border-green-200 bg-green-50 text-green-700",
    REJECTED: "border-red-200 bg-red-50 text-red-700",
  };

export const LISTING_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  PAUSED: "En pause",
  SOLD: "Épuisé",
  ARCHIVED: "Archivé",
};
