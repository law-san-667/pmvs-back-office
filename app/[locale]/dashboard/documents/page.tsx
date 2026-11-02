"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBusiness } from "@/contexts/business-context";
import {
  type ComplianceDocument,
  type ComplianceDocumentType,
  formatDay,
} from "@/lib/compliance";
import { uploadFileToR2FromBrowser } from "@/lib/upload-to-r2";
import { trpc } from "@/server/trpc/client";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

const today = () => new Date().toISOString().slice(0, 10);

const DOCUMENT_TYPES: ComplianceDocumentType[] = [
  "REGISTRATION",
  "TAX",
  "IDENTITY",
  "INSURANCE",
  "CERTIFICATION",
  "OTHER",
];

function ExpiryBadge({ doc }: { doc: ComplianceDocument }) {
  const t = useTranslations("documents");
  if (!doc.expiresOn) return null;
  const days = Math.round((Date.parse(`${doc.expiresOn}T00:00:00Z`) - Date.parse(`${today()}T00:00:00Z`)) / 86_400_000);
  if (days < 0) return <Badge variant="destructive">{t("expired")}</Badge>;
  if (days <= 30) return <Badge className="bg-amber-500/15 text-amber-700">{t("expiresIn", { days })}</Badge>;
  return null;
}

function DocumentStatus({ doc }: { doc: ComplianceDocument }) {
  const t = useTranslations("documents");
  if (doc.status === "APPROVED") return <Badge className="bg-green-600/15 text-green-700">{t("status.APPROVED")}</Badge>;
  if (doc.status === "REJECTED") return <Badge variant="destructive">{t("status.REJECTED")}</Badge>;
  return <Badge variant="secondary">{t("status.PENDING")}</Badge>;
}

const emptyForm = {
  type: "REGISTRATION" as ComplianceDocumentType,
  title: "",
  reference: "",
  issuedOn: "",
  expiresOn: "",
};

export default function DocumentsPage() {
  const t = useTranslations("documents");
  const locale = useLocale();
  const { businessId } = useBusiness();
  const utils = trpc.useUtils();
  const documents = trpc.compliance.businessDocuments.useQuery(
    { businessId: businessId ?? "" },
    { enabled: Boolean(businessId) },
  );
  const createUpload = trpc.media.createUpload.useMutation();
  const file = trpc.compliance.fileDocument.useMutation();
  const withdraw = trpc.compliance.withdrawDocument.useMutation();
  const [form, setForm] = useState(emptyForm);
  const [picked, setPicked] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!businessId || !picked) return;
    setBusy(true);
    try {
      const fileUrl = await uploadFileToR2FromBrowser(picked, "docs", (input) => createUpload.mutateAsync(input));
      if (!fileUrl) throw new Error(t("errors.uploadFailed"));
      await file.mutateAsync({
        businessId,
        type: form.type,
        title: form.title,
        fileUrl,
        reference: form.reference || null,
        issuedOn: form.issuedOn || null,
        expiresOn: form.expiresOn || null,
      });
      toast.success(t("filed"));
      setForm(emptyForm);
      setPicked(null);
      await utils.compliance.businessDocuments.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.fileFailed"));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await withdraw.mutateAsync({ id });
      await utils.compliance.businessDocuments.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.withdrawFailed"));
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("intro")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("form.title")}</CardTitle>
          <CardDescription>{t("form.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="doc-type">{t("form.type")}</Label>
              <select
                id="doc-type"
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value as ComplianceDocumentType })}
                className="border-input bg-background h-9 rounded-md border px-2 text-sm"
              >
                {DOCUMENT_TYPES.map((value) => (
                  <option key={value} value={value}>{t(`type.${value}`)}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="doc-title">{t("form.name")}</Label>
              <Input id="doc-title" required minLength={2} maxLength={160} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="doc-reference">{t("form.reference")}</Label>
              <Input id="doc-reference" maxLength={120} value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="doc-file">{t("form.file")}</Label>
              <Input id="doc-file" type="file" required accept=".pdf,image/*" onChange={(event) => setPicked(event.target.files?.[0] ?? null)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="doc-issued">{t("form.issuedOn")}</Label>
              <Input id="doc-issued" type="date" value={form.issuedOn} onChange={(event) => setForm({ ...form, issuedOn: event.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="doc-expires">{t("form.expiresOn")}</Label>
              <Input id="doc-expires" type="date" min={today()} value={form.expiresOn} onChange={(event) => setForm({ ...form, expiresOn: event.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={busy || !picked}>{t("form.submit")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("list.title", { count: documents.data?.length ?? 0 })}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("list.document")}</TableHead>
                <TableHead>{t("list.type")}</TableHead>
                <TableHead>{t("list.expiry")}</TableHead>
                <TableHead>{t("list.status")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.data?.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="whitespace-normal">
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="font-medium underline-offset-4 hover:underline">{doc.title}</a>
                    {doc.status === "REJECTED" && doc.reviewReason && (
                      <p className="text-destructive text-xs">{doc.reviewReason}</p>
                    )}
                  </TableCell>
                  <TableCell>{t(`type.${doc.type}`)}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">{formatDay(doc.expiresOn, locale)} <ExpiryBadge doc={doc} /></span>
                  </TableCell>
                  <TableCell><DocumentStatus doc={doc} /></TableCell>
                  <TableCell className="text-end">
                    {doc.status !== "APPROVED" && (
                      <Button size="sm" variant="ghost" onClick={() => remove(doc.id)}>{t("list.withdraw")}</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {documents.data && !documents.data.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-center">{t("list.empty")}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
