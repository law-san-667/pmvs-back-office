import { formatDate, formatNumber } from "@/lib/utils";
import type { AdPlacement, AdState } from "@/lib/advertising";
import type { useTranslations } from "next-intl";

/** French names of the placements, for the admin screens (shops use the "ads" messages). */
export const PLACEMENT_LABELS: Record<AdPlacement, string> = {
  HOME_BANNER: "Bannière de l'accueil",
  SEARCH_RESULTS: "Résultats de recherche",
  LISTING_DETAIL: "Fiche produit",
  CATEGORY_SIDEBAR: "Pages catégorie",
};

export const STATE_CLASSES: Record<AdState, string> = {
  RUNNING: "bg-emerald-100 text-emerald-800",
  SCHEDULED: "bg-sky-100 text-sky-800",
  ENDED: "bg-zinc-100 text-zinc-700",
  PAUSED: "bg-zinc-100 text-zinc-700",
  PENDING: "bg-amber-100 text-amber-800",
  REJECTED: "bg-red-100 text-red-800",
};

/** `datetime-local` value of an ISO date, in local time. */
export const toLocalInput = (value: string | null | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
};

export const fromLocalInput = (value: string) =>
  value ? new Date(value).toISOString() : null;

type AdsT = ReturnType<typeof useTranslations<"ads">>;

export const formatPeriod = (
  startsAt: string | null,
  endsAt: string | null,
  t: AdsT,
  locale: string,
) => {
  const format = (value: string) => formatDate(value, locale, { dateStyle: "short" });
  if (!startsAt && !endsAt) return t("period.none");
  if (!endsAt) return t("period.from", { date: format(startsAt!) });
  if (!startsAt) return t("period.until", { date: format(endsAt) });
  return t("period.range", { start: format(startsAt), end: format(endsAt) });
};

export const clickRate = (impressions: number, clicks: number, locale = "fr") =>
  impressions
    ? formatNumber(clicks / impressions, locale, {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })
    : "—";
