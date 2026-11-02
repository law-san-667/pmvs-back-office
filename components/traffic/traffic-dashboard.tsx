"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { intlLocale } from "@/i18n/config";
import { TRAFFIC_WINDOWS, type TrafficStats } from "@/lib/traffic";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useState } from "react";

/** Numbers, rates and days in the page's language. */
function useFormats() {
  const locale = intlLocale(useLocale());
  return {
    formatNumber: (value: number) => new Intl.NumberFormat(locale).format(value),
    formatRate: (value: number) =>
      `${new Intl.NumberFormat(locale, { maximumFractionDigits: value < 1 ? 2 : 1 }).format(value)} %`,
    formatDay: (day: string) =>
      new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(
        new Date(`${day}T00:00:00Z`),
      ),
  };
}

const METRICS = ["listingViews", "shopViews", "cartAdds", "orders"] as const;
type MetricKey = (typeof METRICS)[number];

/** Segmented control: a few exclusive options in one row. */
function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="bg-muted flex w-fit flex-wrap rounded-lg p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium",
            value === option.value
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function TrafficWindowPicker({
  days,
  onChange,
}: {
  days: number;
  onChange: (days: number) => void;
}) {
  const t = useTranslations("traffic");
  return (
    <Segmented
      label={t("window.label")}
      value={days}
      onChange={onChange}
      options={TRAFFIC_WINDOWS.map((value) => ({
        value,
        label: t("window.days", { count: value }),
      }))}
    />
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      </CardHeader>
      {hint && <CardContent className="text-muted-foreground text-xs">{hint}</CardContent>}
    </Card>
  );
}

/**
 * Views, cart additions and orders over the window: headline numbers, one
 * metric per day, the funnel and the best listings (and shops, platform view).
 */
export function TrafficDashboard({ stats }: { stats: TrafficStats }) {
  const t = useTranslations("traffic");
  const { formatNumber, formatRate, formatDay } = useFormats();
  const [metric, setMetric] = useState<MetricKey>("listingViews");
  const { totals } = stats;
  const metricLabel = t(`metrics.${metric}`);
  const chartConfig = {
    [metric]: { label: metricLabel, color: "var(--traffic-series)" },
  } satisfies ChartConfig;
  const widest = Math.max(...stats.funnel.map((step) => step.count), 1);

  return (
    // One series hue, checked for contrast on the light and dark surfaces.
    <div className="flex flex-col gap-6 [--traffic-series:#378ecb] dark:[--traffic-series:#3f9be0]">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label={t("metrics.listingViews")}
          value={formatNumber(totals.listingViews)}
          hint={t("tiles.shopViews", { count: formatNumber(totals.shopViews) })}
        />
        <StatTile
          label={t("metrics.cartAdds")}
          value={formatNumber(totals.cartAdds)}
          hint={t("tiles.ofViews", { rate: formatRate(totals.cartRate) })}
        />
        <StatTile
          label={t("metrics.orders")}
          value={formatNumber(totals.orders)}
          hint={t("tiles.confirmed", { count: formatNumber(totals.confirmedOrders) })}
        />
        <StatTile
          label={t("tiles.conversion")}
          value={formatRate(totals.conversionRate)}
          hint={t("tiles.conversionHint")}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("chart.title", { metric: metricLabel })}</CardTitle>
          <CardDescription>
            {t("chart.description", { from: formatDay(stats.from), to: formatDay(stats.to) })}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Segmented
            label={t("chart.metric")}
            value={metric}
            onChange={setMetric}
            options={METRICS.map((key) => ({ value: key, label: t(`metrics.${key}`) }))}
          />
          <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
            <AreaChart data={stats.days} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} strokeOpacity={0.5} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={formatDay}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={36}
                allowDecimals={false}
                tickFormatter={formatNumber}
              />
              <ChartTooltip
                cursor
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) =>
                      payload?.[0] ? formatDay(String(payload[0].payload.day)) : ""
                    }
                    indicator="line"
                  />
                }
              />
              <Area
                dataKey={metric}
                type="monotone"
                stroke={`var(--color-${metric})`}
                strokeWidth={2}
                fill={`var(--color-${metric})`}
                fillOpacity={0.12}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[2fr_3fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("funnel.title")}</CardTitle>
            <CardDescription>{t("funnel.description")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {stats.funnel.map((step, index) => (
              <div key={step.step} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span>{step.label}</span>
                  <span className="tabular-nums">
                    <span className="font-semibold">{formatNumber(step.count)}</span>
                    {index > 0 && (
                      <span className="text-muted-foreground ms-2 text-xs">
                        {formatRate(step.rateFromPrevious)}
                      </span>
                    )}
                  </span>
                </div>
                <div className="bg-muted h-3 rounded-full">
                  <div
                    className="h-3 rounded-full bg-[var(--traffic-series)]"
                    style={{ width: `${step.count ? Math.max((step.count / widest) * 100, 1.5) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("topListings.title")}</CardTitle>
            <CardDescription>{t("topTen")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("topListings.product")}</TableHead>
                  <TableHead className="text-end">{t("topListings.views")}</TableHead>
                  <TableHead className="text-end">{t("topListings.carts")}</TableHead>
                  <TableHead className="text-end">{t("columns.orders")}</TableHead>
                  <TableHead className="text-end">{t("columns.conversion")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topListings.map((row) => (
                  <TableRow key={row.listingId}>
                    <TableCell className="max-w-60 truncate font-medium" title={row.title}>
                      {row.title}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">{formatNumber(row.views)}</TableCell>
                    <TableCell className="text-end tabular-nums">{formatNumber(row.cartAdds)}</TableCell>
                    <TableCell className="text-end tabular-nums">{formatNumber(row.orders)}</TableCell>
                    <TableCell className="text-end tabular-nums">{formatRate(row.conversionRate)}</TableCell>
                  </TableRow>
                ))}
                {!stats.topListings.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground text-center">
                      {t("noVisits")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {stats.topBusinesses && (
        <Card>
          <CardHeader>
            <CardTitle>{t("topBusinesses.title")}</CardTitle>
            <CardDescription>{t("topTen")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("topBusinesses.shop")}</TableHead>
                  <TableHead className="text-end">{t("topBusinesses.listingViews")}</TableHead>
                  <TableHead className="text-end">{t("topBusinesses.shopViews")}</TableHead>
                  <TableHead className="text-end">{t("columns.orders")}</TableHead>
                  <TableHead className="text-end">{t("columns.conversion")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topBusinesses.map((row) => (
                  <TableRow key={row.businessId}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-end tabular-nums">{formatNumber(row.listingViews)}</TableCell>
                    <TableCell className="text-end tabular-nums">{formatNumber(row.shopViews)}</TableCell>
                    <TableCell className="text-end tabular-nums">{formatNumber(row.orders)}</TableCell>
                    <TableCell className="text-end tabular-nums">{formatRate(row.conversionRate)}</TableCell>
                  </TableRow>
                ))}
                {!stats.topBusinesses.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground text-center">
                      {t("noVisits")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
