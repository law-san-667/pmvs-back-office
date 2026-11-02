"use client";

import { AutomaticReports } from "@/components/reports/automatic-reports";
import { ReportBuilder } from "@/components/reports/report-builder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ReportsTabsContent({ businessId }: { businessId?: string }) {
  const t = useTranslations("reports.tabs");
  const tab = useSearchParams().get("tab") === "automatic" ? "automatic" : "custom";
  return (
    <Tabs defaultValue={tab}>
      <TabsList>
        <TabsTrigger value="custom">{t("custom")}</TabsTrigger>
        <TabsTrigger value="automatic">{t("automatic")}</TabsTrigger>
      </TabsList>
      <TabsContent value="custom" className="pt-4">
        <ReportBuilder businessId={businessId} />
      </TabsContent>
      <TabsContent value="automatic" className="pt-4">
        <AutomaticReports businessId={businessId} />
      </TabsContent>
    </Tabs>
  );
}

// `useSearchParams` (the `?tab=` deep link) needs a Suspense boundary.
export function ReportsTabs({ businessId }: { businessId?: string }) {
  return (
    <Suspense>
      <ReportsTabsContent businessId={businessId} />
    </Suspense>
  );
}
