"use client";

import IsLoadingScreen from "@/components/is-loading-screen";
import { TrafficDashboard, TrafficWindowPicker } from "@/components/traffic/traffic-dashboard";
import { useBusiness } from "@/contexts/business-context";
import { trpc } from "@/server/trpc/client";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function TrafficPage() {
  const t = useTranslations("traffic");
  const { businessId } = useBusiness();
  const [days, setDays] = useState(30);
  const stats = trpc.traffic.business.useQuery(
    { businessId: businessId ?? "", days },
    { enabled: Boolean(businessId), placeholderData: (previous) => previous },
  );

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("page.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("page.subtitle")}</p>
        </div>
        <TrafficWindowPicker days={days} onChange={setDays} />
      </div>
      {stats.error && <p className="text-destructive text-sm">{stats.error.message}</p>}
      {stats.data ? (
        <TrafficDashboard stats={stats.data} />
      ) : (
        !stats.error && <IsLoadingScreen text={t("page.loading")} />
      )}
    </div>
  );
}
