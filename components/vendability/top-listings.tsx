"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { intlLocale } from "@/i18n/config";
import type { TopListings as TopListingsData } from "@/lib/vendability";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

/** One value on a 0-100 track, with its number beside it. */
function ScoreBar({ value, label }: { value: number; label: string }) {
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className="bg-muted h-2 w-full rounded-full"
    >
      <div
        className="h-2 rounded-full bg-[#378ecb] dark:bg-[#3f9be0]"
        style={{ width: `${value ? Math.max(value, 2) : 0}%` }}
      />
    </div>
  );
}

/** The five best products, each with the detail of its score on demand. */
export function TopListings({ data, showShop }: { data: TopListingsData; showShop?: boolean }) {
  const t = useTranslations("vendability.top");
  const locale = useLocale();
  const formatNumber = (value: number) => new Intl.NumberFormat(intlLocale(locale)).format(value);
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>
          {t("description", { days: data.windowDays, ranked: formatNumber(data.ranked) })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!data.items.length && (
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
        )}
        <ol className="flex flex-col divide-y">
          {data.items.map((item, index) => (
            <li key={item.listingId} className="py-3">
              <button
                type="button"
                aria-expanded={opened === item.listingId}
                className="flex w-full flex-col gap-2 text-start"
                onClick={() => setOpened(opened === item.listingId ? null : item.listingId)}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0">
                    <span className="text-muted-foreground me-2 tabular-nums">{index + 1}.</span>
                    <span className="font-medium">{item.title}</span>
                    {showShop && (
                      <span className="text-muted-foreground block text-xs sm:ms-2 sm:inline">
                        {item.businessName}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-lg font-semibold tabular-nums">{item.score}</span>
                </span>
                <ScoreBar value={item.score} label={t("scoreOf", { title: item.title })} />
                <span className="text-muted-foreground text-xs">
                  {t("summary", {
                    units: formatNumber(item.units),
                    views: formatNumber(item.views),
                  })}
                </span>
              </button>
              {opened === item.listingId && (
                <dl className="mt-3 grid gap-2">
                  {item.criteria.map((criterion) => (
                    <div
                      key={criterion.key}
                      className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[14rem_1fr_6rem]"
                    >
                      <dt>{criterion.label}</dt>
                      <dd className="order-3 col-span-2 sm:order-none sm:col-span-1">
                        {criterion.value !== null && <ScoreBar value={criterion.value} label={criterion.label} />}
                      </dd>
                      <dd className="text-muted-foreground text-end text-xs tabular-nums">
                        {criterion.value === null ? t("notRated") : `${criterion.value} / 100`}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
