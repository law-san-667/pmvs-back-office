"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MarketingAdmin } from "@/components/marketing/marketing-admin";
import { useUser } from "@/contexts/user-context";
import { useTranslations } from "next-intl";

export default function AdminMarketingPage() {
  const { user } = useUser();
  const t = useTranslations("adminSystem");
  if (user && user.role !== "ADMIN") {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-destructive text-sm">{t("adminOnly")}</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title={t("pages.marketing.title")}
        description={t("pages.marketing.description")}
      />
      {user && <MarketingAdmin />}
    </div>
  );
}
