/** Ad types and constants shared by the advertising screens. */

export const AD_PLACEMENTS = [
  "HOME_BANNER",
  "SEARCH_RESULTS",
  "LISTING_DETAIL",
  "CATEGORY_SIDEBAR",
] as const;
export type AdPlacement = (typeof AD_PLACEMENTS)[number];
export type AdState =
  | "RUNNING"
  | "SCHEDULED"
  | "ENDED"
  | "PAUSED"
  | "PENDING"
  | "REJECTED";

export type Advertisement = {
  id: string;
  businessId: string | null;
  business: { id: string; name: string } | null;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  targetUrl: string | null;
  placement: AdPlacement;
  countryCodes: string[] | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  priority: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewReason: string | null;
  reviewedAt: string | null;
  impressions: number;
  clicks: number;
  state: AdState;
  createdAt: string;
  updatedAt: string;
};

export type AdStats = {
  impressions: number;
  clicks: number;
  clickRate: number;
  days: { day: string; impressions: number; clicks: number }[];
};
