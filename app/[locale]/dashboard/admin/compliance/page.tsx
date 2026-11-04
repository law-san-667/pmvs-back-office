"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AuditJournal } from "@/components/admin/compliance/audit-journal";
import { DocumentsReview } from "@/components/admin/compliance/documents-review";
import { FindingsList } from "@/components/admin/compliance/findings-list";
import { TermsEditor } from "@/components/admin/compliance/terms-editor";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/contexts/user-context";
import { formatDateTime } from "@/lib/compliance";
import { trpc } from "@/server/trpc/client";
import { ShieldCheckIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

function Tile({ label, value }: { label: string; value: number | undefined }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <p className="text-2xl font-semibold tabular-nums">{value ?? "—"}</p>
      </CardHeader>
    </Card>
  );
}

export default function AdminCompliancePage() {
  const t = useTranslations("adminSettings.compliance");
  const locale = useLocale();
  const { user } = useUser();
  const utils = trpc.useUtils();
  const isAdmin = user?.role === "ADMIN";
  const isTeam = isAdmin || user?.role === "MODERATOR";
  const overview = trpc.compliance.overview.useQuery(undefined, { enabled: isTeam });
  const run = trpc.compliance.run.useMutation();

  if (user && !isTeam) {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-destructive text-sm">{t("teamOnly")}</p>
      </div>
    );
  }

  const runNow = async () => {
    try {
      const result = await run.mutateAsync();
      toast.success(
        t("runDone", {
          raised: result.raised,
          closed: result.closed,
          reminders: result.reminders,
        }),
      );
      await utils.compliance.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("runFailed"));
    }
  };

  const data = overview.data;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <AdminPageHeader
          title={t("title")}
          description={
            data?.lastRun
              ? t("descriptionLastRun", { date: formatDateTime(data.lastRun.startedAt, locale) })
              : t("description")
          }
        />
        <Button size="sm" onClick={runNow} disabled={run.isPending}>
          <ShieldCheckIcon />
          {t("runNow")}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label={t("tiles.openFindings")} value={data?.openFindings} />
        <Tile label={t("tiles.pendingDocuments")} value={data?.pendingDocuments} />
        <Tile label={t("tiles.expiringDocuments")} value={data?.expiringDocuments} />
        <Tile label={t("tiles.expiredDocuments")} value={data?.expiredDocuments} />
      </div>

      <Tabs defaultValue="findings">
        <TabsList className="flex-wrap">
          <TabsTrigger value="findings">{t("tabs.findings")}</TabsTrigger>
          <TabsTrigger value="documents">{t("tabs.documents")}</TabsTrigger>
          <TabsTrigger value="terms">{t("tabs.terms")}</TabsTrigger>
          {isAdmin && <TabsTrigger value="audit">{t("tabs.audit")}</TabsTrigger>}
        </TabsList>
        <TabsContent value="findings" className="pt-4"><FindingsList /></TabsContent>
        <TabsContent value="documents" className="pt-4"><DocumentsReview /></TabsContent>
        <TabsContent value="terms" className="pt-4"><TermsEditor canEdit={isAdmin} /></TabsContent>
        {isAdmin && <TabsContent value="audit" className="pt-4"><AuditJournal /></TabsContent>}
      </Tabs>
    </div>
  );
}
