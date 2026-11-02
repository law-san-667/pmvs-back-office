"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
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
import { useBusiness } from "@/contexts/business-context";
import { Link } from "@/i18n/navigation";
import { trpc } from "@/server/trpc/client";
import { DownloadIcon, UploadIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

type ImportLine = {
  line: number;
  title: string | null;
  action: "create" | "update" | "error";
  listingId?: string;
  errors: string[];
  warnings: string[];
};

type ImportReport = {
  dryRun: boolean;
  total: number;
  created: number;
  updated: number;
  failed: number;
  lines: ImportLine[];
};

const ACTION_VARIANTS = {
  create: "default",
  update: "secondary",
  error: "destructive",
} as const;

/**
 * Catalogue in bulk: download the template or the current catalogue, check
 * a filled file, then import it. New rows become drafts to review.
 */
export default function CatalogImportPage() {
  const t = useTranslations("productImport");
  const locale = useLocale();
  const { businessId } = useBusiness();
  const utils = trpc.useUtils();
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [busy, setBusy] = useState<"check" | "import" | null>(null);

  const send = async (dryRun: boolean) => {
    if (!file || !businessId) return;
    setBusy(dryRun ? "check" : "import");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(
        `/api/catalog/${businessId}/import?dryRun=${dryRun}`,
        { method: "POST", body: form },
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? t("importFailed"));
      setReport(body.data);
      if (!dryRun) {
        toast.success(
          t("importDone", {
            created: body.data.created,
            updated: body.data.updated,
          }),
        );
        await utils.listings.list.invalidate();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("importFailed"));
    } finally {
      setBusy(null);
    }
  };

  const importable = report ? report.created + report.updated : 0;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        {locale !== "fr" && (
          <p className="text-muted-foreground mt-1 text-sm">
            {t("fileLanguage")}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("prepareTitle")}</CardTitle>
            <CardDescription>{t("prepareDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={!businessId}
              nativeButton={false}
              render={<a href={`/api/catalog/${businessId}/template`} />}
            >
              <DownloadIcon className="size-4" />
              {t("downloadTemplate")}
            </Button>
            <Button
              variant="outline"
              disabled={!businessId}
              nativeButton={false}
              render={<a href={`/api/catalog/${businessId}/export`} />}
            >
              <DownloadIcon className="size-4" />
              {t("exportCatalog")}
            </Button>
            <p className="text-muted-foreground w-full text-xs">
              {t("updateHint")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("checkTitle")}</CardTitle>
            <CardDescription>{t("checkDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setReport(null);
              }}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={!file || busy !== null}
                onClick={() => void send(true)}
              >
                {busy === "check" ? t("checking") : t("checkFile")}
              </Button>
              <Button
                disabled={!report?.dryRun || importable === 0 || busy !== null}
                onClick={() => void send(false)}
              >
                <UploadIcon className="size-4" />
                {busy === "import"
                  ? t("importing")
                  : t("importLines", { count: importable })}
              </Button>
            </div>
            {report?.dryRun && report.failed > 0 && (
              <p className="text-muted-foreground text-xs">
                {t("errorLinesHint")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {report && (
        <Card>
          <CardHeader>
            <CardTitle>
              {report.dryRun
                ? t("reportCheck", { total: report.total })
                : t("reportDone", { total: report.total })}
            </CardTitle>
            <CardDescription>
              {t("reportSummary", {
                created: report.created,
                updated: report.updated,
                failed: report.failed,
              })}
              {!report.dryRun && report.created > 0 && (
                <>
                  {" "}
                  <Link
                    href="/dashboard/products"
                    className="text-primary hover:underline"
                  >
                    {t("viewDrafts")}
                  </Link>
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">{t("columns.line")}</TableHead>
                  <TableHead>{t("columns.title")}</TableHead>
                  <TableHead>{t("columns.result")}</TableHead>
                  <TableHead>{t("columns.details")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.lines.map((line) => (
                  <TableRow key={line.line}>
                    <TableCell>{line.line}</TableCell>
                    <TableCell className="max-w-64 truncate font-medium">
                      {line.listingId && !report.dryRun ? (
                        <Link
                          href={`/dashboard/products/${line.listingId}`}
                          className="hover:underline"
                        >
                          {line.title}
                        </Link>
                      ) : (
                        (line.title ?? "—")
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ACTION_VARIANTS[line.action]}>
                        {t(`actions.${line.action}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs whitespace-normal">
                      {line.errors.map((message) => (
                        <p key={message} className="text-destructive">
                          {message}
                        </p>
                      ))}
                      {line.warnings.map((message) => (
                        <p key={message} className="text-amber-700">
                          {message}
                        </p>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
