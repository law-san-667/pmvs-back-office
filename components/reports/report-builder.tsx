"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  REPORT_FORMATS,
  type ReportCatalog,
  type ReportColumn,
  type ReportDefinition,
  type ReportResult,
  type SavedReport,
} from "@/lib/reports";
import { intlLocale } from "@/i18n/config";
import { trpc } from "@/server/trpc/client";
import { DownloadIcon, PlayIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const DISPLAYED_ROWS = 200;
const SELECT_CLASS =
  "border-input bg-background h-9 w-full rounded-md border px-2 text-sm disabled:opacity-50";

const formatNumber = (value: number, locale: string) =>
  new Intl.NumberFormat(intlLocale(locale)).format(value);
const formatDate = (day: string, locale: string) =>
  new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${day}T00:00:00Z`),
  );

const formatCell = (
  column: ReportColumn,
  cell: string | number,
  currency: string,
  locale: string,
) => {
  if (typeof cell === "string") return cell;
  if (column.kind === "percent") {
    return `${new Intl.NumberFormat(intlLocale(locale), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cell)} %`;
  }
  if (column.kind === "money") {
    return `${formatNumber(cell, locale)} ${currency === "XOF" || currency === "XAF" ? "FCFA" : currency}`;
  }
  return formatNumber(cell, locale);
};

const DEFAULT_DEFINITION: ReportDefinition = {
  period: { preset: "LAST_30_DAYS" },
  metrics: ["ordersPlaced", "amountOrdered"],
  axes: ["month"],
  currency: "XOF",
};

/** Why an axis cannot be picked given the rest of the report, if so. */
const axisBlocked = (
  catalog: ReportCatalog,
  axisKey: string,
  metrics: string[],
  otherAxis: string | undefined,
) => {
  const axis = catalog.axes.find((item) => item.key === axisKey);
  if (!axis) return true;
  if (axisKey === otherAxis) return true;
  if (axis.time && catalog.axes.find((item) => item.key === otherAxis)?.time) return true;
  const usesTraffic = metrics.some(
    (key) => catalog.metrics.find((metric) => metric.key === key)?.source !== "sales",
  );
  return usesTraffic && !axis.traffic;
};

/** Why an indicator cannot be picked given the axes, if so. */
const metricBlocked = (catalog: ReportCatalog, source: string, axes: string[]) =>
  source !== "sales" &&
  axes.some((key) => catalog.axes.find((axis) => axis.key === key)?.traffic === false);

function DeleteSaved({
  report,
  onClose,
  onDeleted,
}: {
  report: SavedReport;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const t = useTranslations("reports.builder.delete");
  const remove = trpc.reports.deleteSaved.useMutation({
    onSuccess: onDeleted,
    onError: (error) => toast.error(error.message),
  });
  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("description", { name: report.name })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={remove.isPending}
            onClick={(event) => {
              event.preventDefault();
              remove.mutate({ id: report.id });
            }}
          >
            {remove.isPending ? t("deleting") : t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ResultTable({ report }: { report: ReportResult }) {
  const t = useTranslations("reports.result");
  const locale = useLocale();
  const shown = report.rows.slice(0, DISPLAYED_ROWS);
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            {report.columns.map((column) => (
              <TableHead
                key={column.key}
                className={column.kind === "text" ? "whitespace-normal" : "text-end whitespace-normal"}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.map((cell, index) => {
                const column = report.columns[index]!;
                return (
                  <TableCell
                    key={column.key}
                    className={
                      column.kind === "text"
                        ? "max-w-72 truncate"
                        : "text-end tabular-nums"
                    }
                    title={typeof cell === "string" ? cell : undefined}
                  >
                    {formatCell(column, cell, report.currency, locale)}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
          {!shown.length && (
            <TableRow>
              <TableCell colSpan={report.columns.length} className="text-muted-foreground text-center">
                {t("empty")}
              </TableCell>
            </TableRow>
          )}
          <TableRow className="bg-muted/50 font-semibold">
            {report.totals.map((cell, index) => {
              const column = report.columns[index]!;
              return (
                <TableCell key={column.key} className={column.kind === "text" ? "" : "text-end tabular-nums"}>
                  {formatCell(column, cell, report.currency, locale)}
                </TableCell>
              );
            })}
          </TableRow>
        </TableBody>
      </Table>
      {report.totalRows > shown.length && (
        <p className="text-muted-foreground text-xs">
          {report.truncated
            ? t("truncated", {
                shown: formatNumber(shown.length, locale),
                total: formatNumber(report.totalRows, locale),
                limit: formatNumber(report.rows.length, locale),
              })
            : t("partial", {
                shown: formatNumber(shown.length, locale),
                total: formatNumber(report.totalRows, locale),
              })}
        </p>
      )}
    </>
  );
}

/**
 * Builds a report from the closed lists of the API, for a shop or (no shop)
 * for the platform. The API stays the judge of what can go together.
 */
export function ReportBuilder({ businessId }: { businessId?: string }) {
  const t = useTranslations("reports.builder");
  const locale = useLocale();
  const utils = trpc.useUtils();
  const catalog = trpc.reports.catalog.useQuery();
  const saved = trpc.reports.saved.useQuery({ businessId });
  const [definition, setDefinition] = useState<ReportDefinition>(DEFAULT_DEFINITION);
  const [submitted, setSubmitted] = useState<ReportDefinition | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState("");
  const [deleting, setDeleting] = useState<SavedReport | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const result = trpc.reports.run.useQuery(
    { businessId, definition: submitted ?? DEFAULT_DEFINITION },
    { enabled: Boolean(submitted), retry: false },
  );

  const selected = saved.data?.find((report) => report.id === selectedId) ?? null;
  const axes = useMemo(
    () => catalog.data?.axes.filter((axis) => businessId === undefined || !axis.platformOnly) ?? [],
    [catalog.data, businessId],
  );

  const refreshSaved = () => utils.reports.saved.invalidate({ businessId });
  const createSaved = trpc.reports.createSaved.useMutation({
    onSuccess: async (created) => {
      await refreshSaved();
      setSelectedId(created.id);
      setName("");
      toast.success(t("saved"));
    },
    onError: (error) => toast.error(error.message),
  });
  const updateSaved = trpc.reports.updateSaved.useMutation({
    onSuccess: async () => {
      await refreshSaved();
      toast.success(t("updated"));
    },
    onError: (error) => toast.error(error.message),
  });

  if (catalog.error) return <p className="text-destructive text-sm">{catalog.error.message}</p>;
  if (!catalog.data) return <p className="text-muted-foreground text-sm">{t("loading")}</p>;

  const list = catalog.data;
  const { metrics, period } = definition;
  const axisAt = (index: number) => definition.axes[index] ?? "";
  const setAxis = (index: number, value: string) => {
    const next = [axisAt(0), axisAt(1)];
    next[index] = value;
    setDefinition({ ...definition, axes: next.filter(Boolean) });
  };
  const toggleMetric = (key: string, checked: boolean) =>
    setDefinition({
      ...definition,
      metrics: checked ? [...metrics, key] : metrics.filter((metric) => metric !== key),
    });
  const load = (id: string) => {
    setSelectedId(id);
    const report = saved.data?.find((item) => item.id === id);
    if (report) {
      setDefinition(report.definition);
      setSubmitted(report.definition);
    }
  };

  const download = async (format: string) => {
    if (!submitted) return;
    setExporting(format);
    try {
      const response = await fetch("/api/report-export", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessId,
          format,
          title: selected?.name ?? t("defaultTitle"),
          definition: submitted,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? t("exportError"));
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download =
        /filename="([^"]+)"/.exec(response.headers.get("content-disposition") ?? "")?.[1] ??
        `${t("fileName")}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("exportError"));
    } finally {
      setExporting(null);
    }
  };

  const groups = [
    { title: t("groups.sales"), items: list.metrics.filter((metric) => metric.source === "sales") },
    { title: t("groups.traffic"), items: list.metrics.filter((metric) => metric.source !== "sales") },
  ];
  const report = submitted ? result.data : undefined;
  const otherCurrencies = report?.currencies.filter((code) => code !== report.currency) ?? [];
  const dirty =
    selected && JSON.stringify(selected.definition) !== JSON.stringify(definition);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("timezone")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="flex flex-col gap-1.5 xl:col-span-2">
              <Label htmlFor="report-saved">{t("savedReport")}</Label>
              <div className="flex items-center gap-2">
                <select
                  id="report-saved"
                  className={SELECT_CLASS}
                  value={selectedId}
                  onChange={(event) => load(event.target.value)}
                >
                  <option value="">{t("newReport")}</option>
                  {saved.data?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {selected && (
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={t("deleteNamed", { name: selected.name })}
                    onClick={() => setDeleting(selected)}
                  >
                    <Trash2Icon />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 xl:col-span-2">
              <Label htmlFor="report-period">{t("period")}</Label>
              <select
                id="report-period"
                className={SELECT_CLASS}
                value={period.preset}
                onChange={(event) =>
                  setDefinition({ ...definition, period: { preset: event.target.value } })
                }
              >
                {list.presets.map((preset) => (
                  <option key={preset.key} value={preset.key}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
            {period.preset === "CUSTOM" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="report-from">{t("from")}</Label>
                  <Input
                    id="report-from"
                    type="date"
                    value={period.from ?? ""}
                    onChange={(event) =>
                      setDefinition({ ...definition, period: { ...period, from: event.target.value } })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="report-to">{t("to")}</Label>
                  <Input
                    id="report-to"
                    type="date"
                    value={period.to ?? ""}
                    onChange={(event) =>
                      setDefinition({ ...definition, period: { ...period, to: event.target.value } })
                    }
                  />
                </div>
              </>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {groups.map((group) => (
              <fieldset key={group.title} className="flex flex-col gap-2">
                <legend className="mb-1 text-sm font-medium">{group.title}</legend>
                {group.items.map((metric) => {
                  const blocked = metricBlocked(list, metric.source, definition.axes);
                  return (
                    <Label key={metric.key} className={blocked ? "font-normal opacity-50" : "font-normal"}>
                      <Checkbox
                        checked={metrics.includes(metric.key)}
                        disabled={blocked || (!metrics.includes(metric.key) && metrics.length >= 8)}
                        onCheckedChange={(checked) => toggleMetric(metric.key, Boolean(checked))}
                      />
                      {metric.label}
                    </Label>
                  );
                })}
              </fieldset>
            ))}
          </div>
          {definition.axes.some(
            (key) => list.axes.find((axis) => axis.key === key)?.traffic === false,
          ) && (
            <p className="text-muted-foreground text-xs">
              {t("trafficUnavailable")}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1].map((index) => (
              <div key={index} className="flex flex-col gap-1.5">
                <Label htmlFor={`report-axis-${index}`}>
                  {index === 0 ? t("axisFirst") : t("axisSecond")}
                </Label>
                <select
                  id={`report-axis-${index}`}
                  className={SELECT_CLASS}
                  value={axisAt(index)}
                  disabled={index === 1 && !axisAt(0)}
                  onChange={(event) => setAxis(index, event.target.value)}
                >
                  <option value="">{t("noAxis")}</option>
                  {axes.map((axis) => (
                    <option
                      key={axis.key}
                      value={axis.key}
                      disabled={axisBlocked(list, axis.key, metrics, axisAt(index === 0 ? 1 : 0))}
                    >
                      {axis.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <Button disabled={!metrics.length} onClick={() => setSubmitted(definition)}>
              <PlayIcon />
              {t("generate")}
            </Button>
            {selected && (
              <Button
                variant="outline"
                disabled={!dirty || !metrics.length || updateSaved.isPending}
                onClick={() => updateSaved.mutate({ id: selected.id, definition })}
              >
                <SaveIcon />
                {t("update", { name: selected.name })}
              </Button>
            )}
            <form
              className="flex flex-wrap items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                createSaved.mutate({ businessId, name, definition });
              }}
            >
              <Input
                aria-label={t("nameLabel")}
                placeholder={t("namePlaceholder")}
                value={name}
                maxLength={120}
                onChange={(event) => setName(event.target.value)}
                className="w-56"
              />
              <Button
                type="submit"
                variant="outline"
                disabled={name.trim().length < 2 || !metrics.length || createSaved.isPending}
              >
                <SaveIcon />
                {t("save")}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {submitted && (
        <Card>
          <CardHeader>
            <CardTitle>{selected?.name ?? t("result")}</CardTitle>
            {report && (
              <CardDescription>
                {t("resultDescription", {
                  from: formatDate(report.from, locale),
                  to: formatDate(report.to, locale),
                })}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {result.error && <p className="text-destructive text-sm">{result.error.message}</p>}
            {result.isFetching && !report && (
              <p className="text-muted-foreground text-sm">{t("computing")}</p>
            )}
            {report && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {REPORT_FORMATS.map((format) => (
                    <Button
                      key={format.value}
                      size="sm"
                      variant="outline"
                      disabled={exporting !== null}
                      onClick={() => void download(format.value)}
                    >
                      <DownloadIcon />
                      {exporting === format.value ? t("preparing") : format.label}
                    </Button>
                  ))}
                  {report.currencies.length > 1 && (
                    <div className="ms-auto flex items-center gap-2">
                      <Label htmlFor="report-currency">{t("currency")}</Label>
                      <select
                        id="report-currency"
                        className={`${SELECT_CLASS} w-24`}
                        value={submitted.currency}
                        onChange={(event) => {
                          const next = { ...definition, currency: event.target.value };
                          setDefinition(next);
                          setSubmitted({ ...submitted, currency: event.target.value });
                        }}
                      >
                        {report.currencies.map((code) => (
                          <option key={code} value={code}>
                            {code}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                {otherCurrencies.length > 0 && (
                  <p className="text-muted-foreground text-xs">
                    {t("otherCurrencies", { currencies: otherCurrencies.join(", ") })}
                  </p>
                )}
                <ResultTable report={report} />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {deleting && (
        <DeleteSaved
          report={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={async () => {
            setDeleting(null);
            setSelectedId("");
            await refreshSaved();
            toast.success(t("deleted"));
          }}
        />
      )}
    </div>
  );
}
