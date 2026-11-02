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
  const { user } = useUser();
  const utils = trpc.useUtils();
  const isAdmin = user?.role === "ADMIN";
  const isTeam = isAdmin || user?.role === "MODERATOR";
  const overview = trpc.compliance.overview.useQuery(undefined, { enabled: isTeam });
  const run = trpc.compliance.run.useMutation();

  if (user && !isTeam) {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-destructive text-sm">Réservé à l&apos;équipe Diarama.</p>
      </div>
    );
  }

  const runNow = async () => {
    try {
      const result = await run.mutateAsync();
      toast.success(
        `Contrôle terminé : ${result.raised} nouveau(x) point(s), ${result.closed} résolu(s), ${result.reminders} relance(s).`,
      );
      await utils.compliance.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Contrôle impossible.");
    }
  };

  const data = overview.data;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <AdminPageHeader
          title="Conformité"
          description={`Documents des fournisseurs, termes interdits et journal d'audit. Contrôle automatique chaque matin${data?.lastRun ? ` (dernier : ${formatDateTime(data.lastRun.startedAt)})` : ""}.`}
        />
        <Button size="sm" onClick={runNow} disabled={run.isPending}>
          <ShieldCheckIcon />
          Contrôler maintenant
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="Points à examiner" value={data?.openFindings} />
        <Tile label="Documents à valider" value={data?.pendingDocuments} />
        <Tile label="Expirent sous 30 jours" value={data?.expiringDocuments} />
        <Tile label="Documents expirés" value={data?.expiredDocuments} />
      </div>

      <Tabs defaultValue="findings">
        <TabsList className="flex-wrap">
          <TabsTrigger value="findings">Points à examiner</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="terms">Termes interdits</TabsTrigger>
          {isAdmin && <TabsTrigger value="audit">Journal d&apos;audit</TabsTrigger>}
        </TabsList>
        <TabsContent value="findings" className="pt-4"><FindingsList /></TabsContent>
        <TabsContent value="documents" className="pt-4"><DocumentsReview /></TabsContent>
        <TabsContent value="terms" className="pt-4"><TermsEditor canEdit={isAdmin} /></TabsContent>
        {isAdmin && <TabsContent value="audit" className="pt-4"><AuditJournal /></TabsContent>}
      </Tabs>
    </div>
  );
}
