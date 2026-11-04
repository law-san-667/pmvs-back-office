"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BannedTerm } from "@/lib/compliance";
import { trpc } from "@/server/trpc/client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

export function TermsEditor({ canEdit }: { canEdit: boolean }) {
  const t = useTranslations("adminSettings.terms");
  const tc = useTranslations("adminSettings.common");
  const utils = trpc.useUtils();
  const terms = trpc.compliance.terms.useQuery();
  const add = trpc.compliance.addTerm.useMutation();
  const update = trpc.compliance.updateTerm.useMutation();
  const remove = trpc.compliance.removeTerm.useMutation();
  const [term, setTerm] = useState("");
  const [action, setAction] = useState<BannedTerm["action"]>("BLOCK");
  const [reason, setReason] = useState("");

  const guarded = async (work: () => Promise<unknown>) => {
    try {
      await work();
      await utils.compliance.terms.invalidate();
      await utils.compliance.overview.invalidate();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tc("actionFailed"));
      return false;
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (await guarded(() => add.mutateAsync({ term, action, reason: reason || null }))) {
      setTerm("");
      setReason("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title", { count: terms.data?.length ?? 0 })}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {canEdit && (
          <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
            <Input aria-label={t("term")} required minLength={2} maxLength={80} placeholder={t("termPlaceholder")} value={term} onChange={(event) => setTerm(event.target.value)} className="w-56" />
            <select aria-label={t("action")} value={action} onChange={(event) => setAction(event.target.value as BannedTerm["action"])} className="border-input bg-background h-9 rounded-md border px-2 text-sm">
              <option value="BLOCK">{t("actions.BLOCK")}</option>
              <option value="REVIEW">{t("actions.REVIEW")}</option>
            </select>
            <Input aria-label={t("reason")} maxLength={200} placeholder={t("reasonPlaceholder")} value={reason} onChange={(event) => setReason(event.target.value)} className="w-64" />
            <Button type="submit" disabled={add.isPending}>{tc("add")}</Button>
          </form>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("term")}</TableHead>
              <TableHead>{t("action")}</TableHead>
              <TableHead>{t("reason")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {terms.data?.map((row) => (
              <TableRow key={row.id} className={row.isActive ? "" : "opacity-50"}>
                <TableCell className="font-medium">{row.term}</TableCell>
                <TableCell>
                  {row.action === "BLOCK" ? <Badge variant="destructive">{t("actions.BLOCK")}</Badge> : <Badge variant="secondary">{t("actions.REVIEW")}</Badge>}
                </TableCell>
                <TableCell className="whitespace-normal">{row.reason ?? "—"}</TableCell>
                <TableCell className="text-end whitespace-nowrap">
                  {canEdit && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => guarded(() => update.mutateAsync({ id: row.id, isActive: !row.isActive }))}>
                        {row.isActive ? t("suspend") : t("reactivate")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => guarded(() => remove.mutateAsync({ id: row.id }))}>{tc("delete")}</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {terms.data && !terms.data.length && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground text-center">{t("empty")}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
