"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MarketingAdmin } from "@/components/marketing/marketing-admin";
import { useUser } from "@/contexts/user-context";

export default function AdminMarketingPage() {
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
        title="E-mails marketing"
        description="Campagnes envoyées aux abonnés ayant confirmé leur inscription, et preuve de leur consentement."
      />
      {user && <MarketingAdmin />}
    </div>
  );
}
