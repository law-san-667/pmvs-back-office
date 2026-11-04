"use client";

import { AdminPagination } from "@/components/admin/admin-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type ComplianceDocument, formatDay } from "@/lib/compliance";
import { trpc } from "@/server/trpc/client";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

const VIEWS = ["PENDING", "EXPIRING", "APPROVED", "REJECTED"] as const;
type View = (typeof VIEWS)[number];

function Status({ doc }: { doc: ComplianceDocument }) {
  const t = useTranslations("documents.status");
  if (doc.status === "APPROVED") return <Badge className="bg-green-600/15 text-green-700">{t("APPROVED")}</Badge>;
  if (doc.status === "REJECTED") return <Badge variant="destructive">{t("REJECTED")}</Badge>;
  return <Badge variant="secondary">{t("PENDING")}</Badge>;
}

export function DocumentsReview() {
  const t = useTranslations("adminSettings.documents");
  const tc = useTranslations("adminSettings.common");
  const tType = useTranslations("documents.type");
  const locale = useLocale();
  const [view, setView] = useState<View>("PENDING");
  const [page, setPage] = useState(1);
  const utils = trpc.useUtils();
  const documents = trpc.compliance.documents.useQuery(
    {
      ...(view === "EXPIRING" ? { expiringWithinDays: 30 } : { status: view }),
      page,
      limit: 20,
    },
    { placeholderData: (previous) => previous },
  );
  const review = trpc.compliance.reviewDocument.useMutation();

  const decide = async (doc: ComplianceDocument, status: "APPROVED" | "REJECTED") => {
    const reason =
      status === "REJECTED" ? (window.prompt(t("rejectReason")) ?? "") : undefined;
    if (status === "REJECTED" && !reason) return;
    try {
      await review.mutateAsync({ id: doc.id, status, reason });
      await utils.compliance.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tc("actionFailed"));
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <select
          aria-label={t("view")}
          value={view}
          onChange={(event) => {
            setView(event.target.value as View);
            setPage(1);
          }}
          className="border-input bg-background h-9 w-fit rounded-md border px-2 text-sm"
        >
          {VIEWS.map((item) => (
            <option key={item} value={item}>{t(`views.${item}`)}</option>
          ))}
        </select>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.document")}</TableHead>
              <TableHead>{t("columns.shop")}</TableHead>
              <TableHead>{t("columns.expiry")}</TableHead>
              <TableHead>{t("columns.status")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.data?.items.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="whitespace-normal">
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="font-medium underline-offset-4 hover:underline">{doc.title}</a>
                  <p className="text-muted-foreground text-xs">
                    {tType(doc.type)}{doc.reference ? ` · ${doc.reference}` : ""}
                  </p>
                  {doc.reviewReason && <p className="text-destructive text-xs">{doc.reviewReason}</p>}
                </TableCell>
                <TableCell>{doc.business?.name ?? "—"}</TableCell>
                <TableCell>{formatDay(doc.expiresOn, locale)}</TableCell>
                <TableCell><Status doc={doc} /></TableCell>
                <TableCell className="text-end whitespace-nowrap">
                  {doc.status !== "APPROVED" && (
                    <Button size="sm" variant="outline" onClick={() => decide(doc, "APPROVED")}>{t("approve")}</Button>
                  )}
                  {doc.status !== "REJECTED" && (
                    <Button size="sm" variant="ghost" onClick={() => decide(doc, "REJECTED")}>{t("reject")}</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {documents.data && !documents.data.items.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground text-center">{t("empty")}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {(documents.data?.totalPages ?? 0) > 1 && (
          <AdminPagination page={page} totalPages={documents.data?.totalPages ?? 1} onPageChange={setPage} />
        )}
      </CardContent>
    </Card>
  );
}
