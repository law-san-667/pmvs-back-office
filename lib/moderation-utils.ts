import type { ListingModerationStatus } from "@/lib/backend-resource-types";

export const MODERATION_STATUS_CLASSES: Record<ListingModerationStatus, string> =
  {
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
    APPROVED: "border-green-200 bg-green-50 text-green-700",
    REJECTED: "border-red-200 bg-red-50 text-red-700",
  };

