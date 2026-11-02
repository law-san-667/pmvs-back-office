"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ReportsTabs } from "@/components/reports/reports-tabs";
import { useUser } from "@/contexts/user-context";

export default function AdminReportsPage() {
  const { user } = useUser();

  if (user && user.role !== "ADMIN") {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-destructive text-sm">Réservé aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title="Rapports"
        description="Rapports sur toute la plateforme : composez-les, ou recevez-les automatiquement par e-mail."
      />
      {user && <ReportsTabs />}
    </div>
  );
}
