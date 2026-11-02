/** Traffic and conversion types (client-safe). */

export type TrafficCounts = {
  listingViews: number;
  shopViews: number;
  cartAdds: number;
  orders: number;
  confirmedOrders: number;
};

export type TrafficStats = {
  from: string;
  to: string;
  totals: TrafficCounts & { conversionRate: number; cartRate: number };
  days: (TrafficCounts & { day: string })[];
  funnel: { step: string; label: string; count: number; rateFromPrevious: number }[];
  topListings: {
    listingId: string;
    title: string;
    views: number;
    cartAdds: number;
    orders: number;
    conversionRate: number;
  }[];
  topBusinesses?: {
    businessId: string;
    name: string;
    listingViews: number;
    shopViews: number;
    orders: number;
    conversionRate: number;
  }[];
};

export const TRAFFIC_WINDOWS = [7, 30, 90] as const;
