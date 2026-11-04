"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminTableState } from "@/components/admin/admin-table-state";
import IsLoadingScreen from "@/components/is-loading-screen";
import { DiagnosticsOverviewPanel } from "@/components/admin/diagnostics/diagnostics-overview";
import {
  computeRange,
  describeUser,
  formatDuration,
  formatTime,
  METHOD_CLASSES,
  RANGE_PRESETS,
  statusClasses,
  type RangeKey,
} from "@/components/admin/diagnostics/diagnostics-utils";
import {
  RequestDetailSheet,
  type DetailFilter,
} from "@/components/admin/diagnostics/request-detail-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUser } from "@/contexts/user-context";
import type { HttpMethod, StatusClass } from "@/lib/diagnostics-types";
import { cn } from "@/lib/utils";
import { trpc } from "@/server/trpc/client";
import { RefreshCwIcon, SearchIcon, XIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useDeferredValue, useEffect, useState } from "react";

const PAGE_SIZE = 25;
const LIVE_REFRESH_MS = 15_000;
const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const STATUS_CLASSES: StatusClass[] = ["2xx", "3xx", "4xx", "5xx"];

type Filters = {
  method?: HttpMethod;
  statusClass?: StatusClass;
  status?: number;
  route?: string;
  userId?: string;
  ip?: string;
};

/** Removable chips for filters set by clicking around the dashboard. */
type Chip = { key: keyof Filters; label: string };

// `useSearchParams` (the `?reqId=` deep link) needs a Suspense boundary.
export default function AdminDiagnosticsPage() {
  const t = useTranslations("adminSystem");
  return (
    <Suspense fallback={<IsLoadingScreen text={t("diagnostics.loading")} />}>
      <DiagnosticsDashboard />
    </Suspense>
  );
}

function DiagnosticsDashboard() {
  const { user } = useUser();
  const t = useTranslations("adminSystem");
  const locale = useLocale();
  const searchParams = useSearchParams();

  const [rangeKey, setRangeKey] = useState<RangeKey>("24h");
  const [range, setRange] = useState(() => computeRange("24h"));
  const [isLive, setIsLive] = useState(false);
  // `?reqId=` deep link: an error id quoted by a user opens straight on it.
  const [search, setSearch] = useState(searchParams.get("reqId") ?? "");
  const deferredSearch = useDeferredValue(search.trim());
  const [filters, setFilters] = useState<Filters>({});
  const [chipLabels, setChipLabels] = useState<Partial<Record<keyof Filters, string>>>({});
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refresh = () => setRange(computeRange(rangeKey));

  // Live mode slides the window forward, which refetches both queries.
  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(
      () => setRange(computeRange(rangeKey)),
      LIVE_REFRESH_MS,
    );
    return () => clearInterval(timer);
  }, [isLive, rangeKey]);

  const overview = trpc.admin.diagnosticsOverview.useQuery(range, {
    placeholderData: (previous) => previous,
  });
  const requests = trpc.admin.diagnosticsRequests.useQuery(
    {
      ...range,
      ...filters,
      search: deferredSearch || undefined,
      page,
      limit: PAGE_SIZE,
      orderBy: "createdAt",
      order: "desc",
    },
    { placeholderData: (previous) => previous },
  );

  const setFilter = <K extends keyof Filters>(
    key: K,
    value: Filters[K],
    label?: string,
  ) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setChipLabels((current) => ({ ...current, [key]: label }));
    setPage(1);
  };

  const clearFilter = (key: keyof Filters) => {
    setFilters((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setPage(1);
  };

  const applyDetailFilter = (filter: DetailFilter) => {
    if (filter.kind === "route") {
      setFilter("route", filter.value, filter.label);
      setFilter("method", filter.method as HttpMethod);
    } else {
      setFilter(filter.kind, filter.value, filter.label);
    }
    setSelectedId(null);
  };

  const chips: Chip[] = (["route", "userId", "ip", "status"] as const)
    .filter((key) => filters[key] !== undefined)
    .map((key) => ({
      key,
      label:
        key === "status"
          ? t("diagnostics.chips.status", { status: String(filters.status) })
          : key === "userId"
            ? t("diagnostics.chips.user", { user: chipLabels.userId ?? filters.userId ?? "" })
            : key === "ip"
              ? t("diagnostics.chips.ip", { ip: filters.ip ?? "" })
              : t("diagnostics.chips.route", { route: chipLabels.route ?? filters.route ?? "" }),
    }));

  if (user && user.role !== "ADMIN") {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-destructive text-sm">
          {t("diagnostics.adminOnly")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <AdminPageHeader
          title={t("diagnostics.title")}
          description={t("diagnostics.description")}
        />
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-muted flex rounded-lg p-1">
            {RANGE_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => {
                  setRangeKey(preset.key);
                  setRange(computeRange(preset.key));
                  setPage(1);
                }}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium",
                  rangeKey === preset.key
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(`diagnostics.ranges.${preset.key}`)}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            variant={isLive ? "default" : "outline"}
            onClick={() => setIsLive((live) => !live)}
          >
            <span
              className={cn(
                "size-2 rounded-full",
                isLive ? "animate-pulse bg-green-300" : "bg-muted-foreground",
              )}
            />
            {isLive ? t("diagnostics.live") : t("diagnostics.goLive")}
          </Button>
          <Button size="sm" variant="outline" onClick={refresh}>
            <RefreshCwIcon
              className={cn(
                (overview.isFetching || requests.isFetching) && "animate-spin",
              )}
            />
            {t("refresh")}
          </Button>
        </div>
      </div>

      {overview.error && (
        <p className="text-destructive text-sm">{overview.error.message}</p>
      )}

      <DiagnosticsOverviewPanel
        overview={overview.data}
        onStatusClick={(status) => setFilter("status", status)}
        onRouteClick={(method, route) => {
          setFilter("route", route, `${method} ${route}`);
          setFilter("method", method as HttpMethod);
        }}
        onErrorClick={setSelectedId}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("diagnostics.history.title", { count: requests.data?.total ?? 0 })}</CardTitle>
          <CardDescription>
            {t("diagnostics.history.hint")}
          </CardDescription>
          <CardAction>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <SearchIcon className="text-muted-foreground absolute top-1/2 start-2.5 size-4 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder={t("diagnostics.history.searchPlaceholder")}
                  className="h-9 w-72 ps-8"
                />
              </div>
              <select
                value={filters.method ?? "ALL"}
                onChange={(event) =>
                  event.target.value === "ALL"
                    ? clearFilter("method")
                    : setFilter("method", event.target.value as HttpMethod)
                }
                className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                aria-label={t("diagnostics.history.method")}
              >
                <option value="ALL">{t("diagnostics.history.allMethods")}</option>
                {METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              <select
                value={filters.statusClass ?? "ALL"}
                onChange={(event) =>
                  event.target.value === "ALL"
                    ? clearFilter("statusClass")
                    : setFilter("statusClass", event.target.value as StatusClass)
                }
                className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                aria-label={t("diagnostics.history.statusClass")}
              >
                <option value="ALL">{t("diagnostics.history.allStatuses")}</option>
                {STATUS_CLASSES.map((statusClass) => (
                  <option key={statusClass} value={statusClass}>
                    {statusClass}
                  </option>
                ))}
              </select>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <Badge key={chip.key} variant="secondary" className="gap-1 pe-1">
                  <span className="max-w-72 truncate">{chip.label}</span>
                  <button
                    type="button"
                    onClick={() => clearFilter(chip.key)}
                    aria-label={t("diagnostics.chips.remove", { label: chip.label })}
                    className="hover:bg-background rounded"
                  >
                    <XIcon className="size-3" />
                  </button>
                </Badge>
              ))}
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  setFilters({});
                  setSearch("");
                  setPage(1);
                }}
              >
                {t("diagnostics.chips.clearAll")}
              </Button>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("diagnostics.columns.date")}</TableHead>
                  <TableHead>{t("diagnostics.columns.request")}</TableHead>
                  <TableHead>{t("diagnostics.columns.status")}</TableHead>
                  <TableHead>{t("diagnostics.columns.error")}</TableHead>
                  <TableHead>{t("diagnostics.columns.user")}</TableHead>
                  <TableHead className="text-end">{t("diagnostics.columns.duration")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AdminTableState
                  colSpan={6}
                  isLoading={requests.isLoading}
                  error={requests.error?.message}
                  isEmpty={!requests.data?.items.length}
                  loadingLabel={t("diagnostics.history.loading")}
                  emptyLabel={t("diagnostics.history.empty")}
                />
                {requests.data?.items.map((log) => (
                  <TableRow
                    key={log.id}
                    onClick={() => setSelectedId(log.id)}
                    className="cursor-pointer"
                  >
                    <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                      {formatTime(log.createdAt, locale)}
                    </TableCell>
                    <TableCell className="max-w-80">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "shrink-0 rounded px-1 font-mono text-[10px] font-semibold",
                            METHOD_CLASSES[log.method] ?? "bg-muted",
                          )}
                        >
                          {log.method}
                        </span>
                        <span className="truncate font-mono text-xs" title={log.path}>
                          {log.path}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusClasses(log.status)}>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-96">
                      <span
                        className="line-clamp-2 text-xs"
                        title={log.errorMessage ?? undefined}
                      >
                        {log.errorMessage ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {describeUser(log.user) ?? (
                        <span className="text-muted-foreground">
                          {log.ip ?? t("diagnostics.anonymous")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-end text-xs whitespace-nowrap",
                        log.durationMs >= 2000 && "font-semibold text-amber-700",
                      )}
                    >
                      {formatDuration(log.durationMs)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <AdminPagination
            page={page}
            totalPages={requests.data?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <RequestDetailSheet
        logId={selectedId}
        onClose={() => setSelectedId(null)}
        onFilter={applyDetailFilter}
      />
    </div>
  );
}
