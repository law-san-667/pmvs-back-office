"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { intlLocale } from "@/i18n/config";
import type { DiagnosticsOverview } from "@/lib/diagnostics-types";
import { cn } from "@/lib/utils";
import {
  ActivityIcon,
  AlertTriangleIcon,
  GaugeIcon,
  ServerCrashIcon,
  UsersIcon,
  XCircleIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  formatDuration,
  formatPercent,
  formatTime,
  METHOD_CLASSES,
  statusClasses,
} from "./diagnostics-utils";

type T = ReturnType<typeof useTranslations<"adminSystem">>;

const bucketLabel = (value: string, bucketSeconds: number, locale: string) =>
  new Intl.DateTimeFormat(intlLocale(locale), {
    ...(bucketSeconds >= 86400
      ? { day: "2-digit", month: "short" }
      : bucketSeconds >= 3600
        ? { day: "2-digit", hour: "2-digit", minute: "2-digit" }
        : { hour: "2-digit", minute: "2-digit" }),
  }).format(new Date(value));

const bucketSizeLabel = (seconds: number, t: T) =>
  seconds >= 86400
    ? t("diagnostics.overview.bucket.days", { count: seconds / 86400 })
    : seconds >= 3600
      ? t("diagnostics.overview.bucket.hours", { count: seconds / 3600 })
      : t("diagnostics.overview.bucket.minutes", { count: seconds / 60 });

function Kpi({
  title,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  value: string | undefined;
  hint?: string;
  icon: typeof ActivityIcon;
  tone?: "default" | "warn" | "danger";
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium">{title}</p>
          {value === undefined ? (
            <Skeleton className="mt-1 h-7 w-16" />
          ) : (
            <p
              className={cn(
                "text-2xl font-bold",
                tone === "warn" && "text-amber-600",
                tone === "danger" && "text-red-600",
              )}
            >
              {value}
            </p>
          )}
          {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
        </div>
        <Icon className="text-muted-foreground size-5 shrink-0" />
      </CardContent>
    </Card>
  );
}

export function DiagnosticsOverviewPanel({
  overview,
  onStatusClick,
  onRouteClick,
  onErrorClick,
}: {
  overview: DiagnosticsOverview | undefined;
  onStatusClick: (status: number) => void;
  onRouteClick: (method: string, route: string) => void;
  onErrorClick: (sampleId: string) => void;
}) {
  const t = useTranslations("adminSystem");
  const locale = useLocale();
  const chartConfig = {
    success: { label: t("diagnostics.overview.chart.success"), color: "#22c55e" },
    clientErrors: { label: t("diagnostics.overview.chart.clientErrors"), color: "#f59e0b" },
    serverErrors: { label: t("diagnostics.overview.chart.serverErrors"), color: "#ef4444" },
  } satisfies ChartConfig;
  const totals = overview?.totals;
  const format = (value: number | undefined) =>
    value === undefined ? undefined : value.toLocaleString(intlLocale(locale));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi
          title={t("diagnostics.overview.recorded")}
          value={format(totals?.recorded)}
          hint={t("diagnostics.overview.recordedHint")}
          icon={ActivityIcon}
        />
        <Kpi
          title={t("diagnostics.overview.writeFailures")}
          value={totals ? formatPercent(totals.writeErrorRate, locale) : undefined}
          hint={
            totals
              ? t("diagnostics.overview.writeFailuresHint", {
                  failed: totals.failedWrites,
                  total: totals.writes,
                })
              : undefined
          }
          icon={XCircleIcon}
          tone={totals && totals.writeErrorRate > 0.05 ? "danger" : "default"}
        />
        <Kpi
          title={t("diagnostics.overview.chart.clientErrors")}
          value={format(totals?.clientErrors)}
          hint={t("diagnostics.overview.clientErrorsHint")}
          icon={AlertTriangleIcon}
          tone={totals?.clientErrors ? "warn" : "default"}
        />
        <Kpi
          title={t("diagnostics.overview.chart.serverErrors")}
          value={format(totals?.serverErrors)}
          hint={t("diagnostics.overview.serverErrorsHint")}
          icon={ServerCrashIcon}
          tone={totals?.serverErrors ? "danger" : "default"}
        />
        <Kpi
          title={t("diagnostics.overview.affectedUsers")}
          value={format(totals?.affectedUsers)}
          hint={t("diagnostics.overview.affectedUsersHint")}
          icon={UsersIcon}
        />
        <Kpi
          title={t("diagnostics.overview.latency")}
          value={
            totals
              ? `${formatDuration(totals.avgDurationMs)}`
              : undefined
          }
          hint={
            totals
              ? t("diagnostics.overview.p95", { value: formatDuration(totals.p95DurationMs) })
              : undefined
          }
          icon={GaugeIcon}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("diagnostics.overview.activityTitle")}</CardTitle>
          <CardDescription>
            {overview
              ? t("diagnostics.overview.activityDescriptionBucket", {
                  size: bucketSizeLabel(overview.bucketSeconds, t),
                })
              : t("diagnostics.overview.activityDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {overview ? (
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <BarChart data={overview.timeline}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="bucket"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={32}
                  tickFormatter={(value) => bucketLabel(value, overview.bucketSeconds, locale)}
                />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={32} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) => {
                        const bucket = payload?.[0]?.payload?.bucket;
                        return bucket ? formatTime(bucket, locale, false) : "";
                      }}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="success" stackId="a" fill="var(--color-success)" />
                <Bar dataKey="clientErrors" stackId="a" fill="var(--color-clientErrors)" />
                <Bar
                  dataKey="serverErrors"
                  stackId="a"
                  fill="var(--color-serverErrors)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <Skeleton className="h-[220px] w-full" />
          )}
          {overview && overview.statusCodes.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground text-xs">{t("diagnostics.overview.codes")}</span>
              {overview.statusCodes.map((item) => (
                <button
                  key={item.status}
                  type="button"
                  onClick={() => onStatusClick(item.status)}
                  className="cursor-pointer"
                >
                  <Badge variant="outline" className={statusClasses(item.status)}>
                    {item.status} · {item.count}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("diagnostics.overview.topRoutes")}</CardTitle>
            <CardDescription>{t("diagnostics.overview.topRoutesHint")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {!overview && <Skeleton className="h-40 w-full" />}
            {overview?.topRoutes.length === 0 && (
              <p className="text-muted-foreground py-6 text-center text-sm">{t("diagnostics.overview.noRequests")}</p>
            )}
            {overview?.topRoutes.map((route) => (
              <button
                key={`${route.method} ${route.route}`}
                type="button"
                onClick={() => onRouteClick(route.method, route.route)}
                className="hover:bg-muted flex w-full flex-col gap-0.5 rounded-md px-2 py-1.5 text-start"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded px-1 font-mono text-[10px] font-semibold",
                      METHOD_CLASSES[route.method] ?? "bg-muted",
                    )}
                  >
                    {route.method}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-mono text-xs">{route.route}</span>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      route.failures ? "text-red-600" : "text-muted-foreground",
                    )}
                  >
                    {t("diagnostics.overview.routeFailures", {
                      failures: route.failures,
                      total: route.total,
                    })}
                  </span>
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {t("diagnostics.overview.routeSummary", {
                    error: route.lastError ?? t("diagnostics.overview.noError"),
                    duration: formatDuration(route.avgDurationMs),
                  })}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("diagnostics.overview.topErrors")}</CardTitle>
            <CardDescription>{t("diagnostics.overview.topErrorsHint")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {!overview && <Skeleton className="h-40 w-full" />}
            {overview?.topErrors.length === 0 && (
              <p className="text-muted-foreground py-6 text-center text-sm">{t("diagnostics.overview.noErrors")}</p>
            )}
            {overview?.topErrors.map((error) => (
              <button
                key={`${error.status} ${error.errorMessage}`}
                type="button"
                onClick={() => onErrorClick(error.sampleId)}
                className="hover:bg-muted flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-start"
              >
                <Badge variant="outline" className={cn("shrink-0", statusClasses(error.status))}>
                  {error.status}
                </Badge>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-xs">{error.errorMessage}</span>
                  <span className="text-muted-foreground text-xs">
                    {t("diagnostics.overview.lastSeen", {
                      date: formatTime(error.lastSeenAt, locale, false),
                    })}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold">×{error.count}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
