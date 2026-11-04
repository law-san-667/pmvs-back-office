"use client";

import { AdminPagination } from "@/components/admin/admin-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type ComplianceFinding, formatDateTime } from "@/lib/compliance";
import { trpc } from "@/server/trpc/client";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

const STATUSES = ["OPEN", "DISMISSED", "RESOLVED"] as const;

/** Screen that deals with a finding. */
const findingHref = (finding: ComplianceFinding) =>
  finding.entityType === "listing"
    ? `/dashboard/admin/listings/${finding.entityId}`
    : finding.businessId
      ? `/dashboard/admin/businesses/${finding.businessId}`
      : null;

export function FindingsList() {
  const t = useTranslations("adminSettings.findings");
  const tc = useTranslations("adminSettings.common");
  const locale = useLocale();
  const [status, setStatus] = useState<ComplianceFinding["status"]>("OPEN");
  const [page, setPage] = useState(1);
  const utils = trpc.useUtils();
  const findings = trpc.compliance.findings.useQuery(
    { status, page, limit: 20 },
    { placeholderData: (previous) => previous },
  );
  const handle = trpc.compliance.handleFinding.useMutation();

  const act = async (finding: ComplianceFinding, next: "OPEN" | "DISMISSED") => {
    const note =
      next === "DISMISSED"
        ? (window.prompt(t("dismissPrompt")) ?? undefined)
        : undefined;
    if (next === "DISMISSED" && note === undefined) return;
    try {
      await handle.mutateAsync({ id: finding.id, status: next, note: note || undefined });
      await utils.compliance.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tc("actionFailed"));
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <select
          aria-label={t("status")}
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ComplianceFinding["status"]);
            setPage(1);
          }}
          className="border-input bg-background h-9 w-fit rounded-md border px-2 text-sm"
        >
          {STATUSES.map((item) => (
            <option key={item} value={item}>{t(`statuses.${item}`)}</option>
          ))}
        </select>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.finding")}</TableHead>
              <TableHead>{t("columns.since")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {findings.data?.items.map((finding) => {
              const href = findingHref(finding);
              return (
                <TableRow key={finding.id}>
                  <TableCell className="whitespace-normal">
                    <Badge variant={finding.kind === "DOCUMENT_EXPIRED" ? "destructive" : "secondary"}>
                      {t(`kinds.${finding.kind}`)}
                    </Badge>
                    <p className="mt-1 break-words">{finding.details}</p>
                    {finding.note && <p className="text-muted-foreground text-xs">{t("note", { note: finding.note })}</p>}
                  </TableCell>
                  <TableCell>{formatDateTime(finding.firstSeenAt, locale)}</TableCell>
                  <TableCell className="text-end whitespace-nowrap">
                    {href && (
                      <Button size="sm" variant="ghost" nativeButton={false} render={<Link href={href} />}>{t("open")}</Button>
                    )}
                    {finding.status === "OPEN" && (
                      <Button size="sm" variant="outline" onClick={() => act(finding, "DISMISSED")}>{t("dismiss")}</Button>
                    )}
                    {finding.status === "DISMISSED" && (
                      <Button size="sm" variant="outline" onClick={() => act(finding, "OPEN")}>{t("reopen")}</Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {findings.data && !findings.data.items.length && (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground text-center">{t("empty")}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {(findings.data?.totalPages ?? 0) > 1 && (
          <AdminPagination page={page} totalPages={findings.data?.totalPages ?? 1} onPageChange={setPage} />
        )}
      </CardContent>
    </Card>
  );
}
