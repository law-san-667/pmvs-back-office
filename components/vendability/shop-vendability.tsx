"use client";

import { ShopQuestionnaireForm } from "@/components/vendability/shop-questionnaire";
import { TopListings } from "@/components/vendability/top-listings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/server/trpc/client";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Content({ businessId }: { businessId: string }) {
  const t = useTranslations("vendability");
  const tab = useSearchParams().get("tab") === "questionnaire" ? "questionnaire" : "top";
  const top = trpc.vendability.shopTop.useQuery({ businessId });
  return (
    <Tabs defaultValue={tab}>
      <TabsList>
        <TabsTrigger value="top">{t("tabs.top")}</TabsTrigger>
        <TabsTrigger value="questionnaire">{t("tabs.questionnaire")}</TabsTrigger>
      </TabsList>
      <TabsContent value="top" className="pt-4">
        {top.error && <p className="text-destructive text-sm">{top.error.message}</p>}
        {top.data && <TopListings data={top.data} />}
      </TabsContent>
      <TabsContent value="questionnaire" className="pt-4">
        <ShopQuestionnaireForm businessId={businessId} />
      </TabsContent>
    </Tabs>
  );
}

// `useSearchParams` (the `?tab=` deep link) needs a Suspense boundary.
export function ShopVendability({ businessId }: { businessId: string }) {
  return (
    <Suspense>
      <Content businessId={businessId} />
    </Suspense>
  );
}
