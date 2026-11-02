"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Advertisement } from "@/lib/advertising";
import { formatDate, formatNumber } from "@/lib/utils";
import { trpc } from "@/server/trpc/client";
import { useLocale, useTranslations } from "next-intl";

/** Impressions and clicks of an ad over the last 30 days. */
export function AdStatsDialog({
  ad,
  onClose,
}: {
  ad: Advertisement | null;
  onClose: () => void;
}) {
  const t = useTranslations("ads");
  const locale = useLocale();
  const stats = trpc.advertising.stats.useQuery(
    { id: ad?.id ?? "", days: 30 },
    { enabled: Boolean(ad) },
  );
  const max = Math.max(
    1,
    ...(stats.data?.days.map((day) => day.impressions) ?? []),
  );

  return (
    <AlertDialog
      open={ad !== null}
      onOpenChange={(isOpen) => !isOpen && onClose()}
    >
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("stats.title", { title: ad?.title ?? "" })}</AlertDialogTitle>
        </AlertDialogHeader>
        {stats.isLoading ? (
          <p className="text-muted-foreground text-sm">{t("stats.loading")}</p>
        ) : stats.data ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                [t("stats.impressions"), formatNumber(stats.data.impressions, locale)],
                [t("stats.clicks"), formatNumber(stats.data.clicks, locale)],
                [
                  t("stats.clickRate"),
                  formatNumber(stats.data.clickRate / 100, locale, {
                    style: "percent",
                    maximumFractionDigits: 2,
                  }),
                ],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs">{label}</p>
                  <p className="text-lg font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">{t("stats.period")}</p>
            {stats.data.days.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t("stats.empty")}
              </p>
            ) : (
              <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
                {stats.data.days.map((day) => (
                  <div
                    key={day.day}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span className="w-20 shrink-0">
                      {formatDate(day.day, locale, { dateStyle: "short" })}
                    </span>
                    <div className="bg-muted h-3 flex-1 overflow-hidden rounded">
                      <div
                        className="bg-primary h-full"
                        style={{ width: `${(day.impressions / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-24 shrink-0 text-end">
                      {t("stats.dayLine", {
                        impressions: formatNumber(day.impressions, locale),
                        clicks: day.clicks,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-destructive text-sm">{stats.error?.message}</p>
        )}
        <div className="flex justify-end">
          <AlertDialogCancel>{t("stats.close")}</AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
