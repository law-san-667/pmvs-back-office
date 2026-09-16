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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  formatDuration,
  formatPercent,
  formatTime,
  METHOD_CLASSES,
  statusClasses,
} from "./diagnostics-utils";

const chartConfig = {
  success: { label: "Succès", color: "#22c55e" },
  clientErrors: { label: "Erreurs 4xx", color: "#f59e0b" },
  serverErrors: { label: "Erreurs 5xx", color: "#ef4444" },
} satisfies ChartConfig;

const bucketLabel = (value: string, bucketSeconds: number) =>
  new Intl.DateTimeFormat("fr-FR", {
    ...(bucketSeconds >= 86400
      ? { day: "2-digit", month: "short" }
      : bucketSeconds >= 3600
        ? { day: "2-digit", hour: "2-digit", minute: "2-digit" }
        : { hour: "2-digit", minute: "2-digit" }),
  }).format(new Date(value));

const bucketSizeLabel = (seconds: number) =>
  seconds >= 86400
    ? `${seconds / 86400} j`
    : seconds >= 3600
      ? `${seconds / 3600} h`
      : `${seconds / 60} min`;

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
  const totals = overview?.totals;
  const format = (value: number | undefined) =>
    value === undefined ? undefined : value.toLocaleString("fr-FR");

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi
          title="Requêtes enregistrées"
          value={format(totals?.recorded)}
          hint="Écritures + lectures en échec"
          icon={ActivityIcon}
        />
        <Kpi
          title="Échec des écritures"
          value={totals ? formatPercent(totals.writeErrorRate) : undefined}
          hint={totals ? `${totals.failedWrites} / ${totals.writes} écritures` : undefined}
          icon={XCircleIcon}
          tone={totals && totals.writeErrorRate > 0.05 ? "danger" : "default"}
        />
        <Kpi
          title="Erreurs 4xx"
          value={format(totals?.clientErrors)}
          hint="Validation, droits, introuvable"
          icon={AlertTriangleIcon}
          tone={totals?.clientErrors ? "warn" : "default"}
        />
        <Kpi
          title="Erreurs 5xx"
          value={format(totals?.serverErrors)}
          hint="Pannes côté serveur"
          icon={ServerCrashIcon}
          tone={totals?.serverErrors ? "danger" : "default"}
        />
        <Kpi
          title="Utilisateurs impactés"
          value={format(totals?.affectedUsers)}
          hint="Connectés, avec au moins une erreur"
          icon={UsersIcon}
        />
        <Kpi
          title="Latence moy. / p95"
          value={
            totals
              ? `${formatDuration(totals.avgDurationMs)}`
              : undefined
          }
          hint={totals ? `p95 : ${formatDuration(totals.p95DurationMs)}` : undefined}
          icon={GaugeIcon}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activité dans le temps</CardTitle>
          <CardDescription>
            Requêtes enregistrées
            {overview ? `, par tranche de ${bucketSizeLabel(overview.bucketSeconds)}` : ""}
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
                  tickFormatter={(value) => bucketLabel(value, overview.bucketSeconds)}
                />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={32} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) => {
                        const bucket = payload?.[0]?.payload?.bucket;
                        return bucket ? formatTime(bucket, false) : "";
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
              <span className="text-muted-foreground text-xs">Codes :</span>
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
            <CardTitle>Routes les plus en échec</CardTitle>
            <CardDescription>Cliquez pour filtrer l&apos;historique.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {!overview && <Skeleton className="h-40 w-full" />}
            {overview?.topRoutes.length === 0 && (
              <p className="text-muted-foreground py-6 text-center text-sm">Aucune requête sur la période.</p>
            )}
            {overview?.topRoutes.map((route) => (
              <button
                key={`${route.method} ${route.route}`}
                type="button"
                onClick={() => onRouteClick(route.method, route.route)}
                className="hover:bg-muted flex w-full flex-col gap-0.5 rounded-md px-2 py-1.5 text-left"
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
                    {route.failures}/{route.total} en échec
                  </span>
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {route.lastError ?? "Aucune erreur"} · {formatDuration(route.avgDurationMs)} moy.
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Erreurs les plus fréquentes</CardTitle>
            <CardDescription>Cliquez pour ouvrir l&apos;occurrence la plus récente.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {!overview && <Skeleton className="h-40 w-full" />}
            {overview?.topErrors.length === 0 && (
              <p className="text-muted-foreground py-6 text-center text-sm">Aucune erreur sur la période. 🎉</p>
            )}
            {overview?.topErrors.map((error) => (
              <button
                key={`${error.status} ${error.errorMessage}`}
                type="button"
                onClick={() => onErrorClick(error.sampleId)}
                className="hover:bg-muted flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left"
              >
                <Badge variant="outline" className={cn("shrink-0", statusClasses(error.status))}>
                  {error.status}
                </Badge>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-xs">{error.errorMessage}</span>
                  <span className="text-muted-foreground text-xs">
                    Dernière : {formatTime(error.lastSeenAt, false)}
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
