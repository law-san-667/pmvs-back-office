"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GridEditor } from "@/components/vendability/grid-editor";
import { QuestionnaireEditor } from "@/components/vendability/questionnaire-editor";
import { TopListings } from "@/components/vendability/top-listings";
import { useUser } from "@/contexts/user-context";
import { trpc } from "@/server/trpc/client";

export default function AdminVendabilityPage() {
  const { user } = useUser();
  const top = trpc.vendability.platformTop.useQuery(undefined, { enabled: user?.role === "ADMIN" });

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
        title="Vendabilité"
        description="Les meilleurs produits de la plateforme, la grille du score et le questionnaire des fournisseurs."
      />
      <Tabs defaultValue="top">
        <TabsList className="flex-wrap">
          <TabsTrigger value="top">Meilleurs produits</TabsTrigger>
          <TabsTrigger value="grid">Grille du score</TabsTrigger>
          <TabsTrigger value="questionnaire">Questionnaire</TabsTrigger>
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
