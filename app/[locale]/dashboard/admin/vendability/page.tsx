"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GridEditor } from "@/components/vendability/grid-editor";
import { QuestionnaireEditor } from "@/components/vendability/questionnaire-editor";
import { TopListings } from "@/components/vendability/top-listings";
import { useUser } from "@/contexts/user-context";
import { trpc } from "@/server/trpc/client";
import { useTranslations } from "next-intl";

export default function AdminVendabilityPage() {
  const { user } = useUser();
  const t = useTranslations("adminSystem");
  const top = trpc.vendability.platformTop.useQuery(undefined, { enabled: user?.role === "ADMIN" });

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
        title={t("pages.vendability.title")}
        description={t("pages.vendability.description")}
      />
      <Tabs defaultValue="top">
        <TabsList className="flex-wrap">
          <TabsTrigger value="top">{t("pages.vendability.tabs.top")}</TabsTrigger>
          <TabsTrigger value="grid">{t("pages.vendability.tabs.grid")}</TabsTrigger>
          <TabsTrigger value="questionnaire">{t("pages.vendability.tabs.questionnaire")}</TabsTrigger>
        </TabsList>
        <TabsContent value="top" className="pt-4">
          {top.error && <p className="text-destructive text-sm">{top.error.message}</p>}
          {top.data && <TopListings data={top.data} showShop />}
        </TabsContent>
        <TabsContent value="grid" className="pt-4">
          <GridEditor />
        </TabsContent>
        <TabsContent value="questionnaire" className="pt-4">
          <QuestionnaireEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
