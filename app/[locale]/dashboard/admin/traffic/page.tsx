"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import IsLoadingScreen from "@/components/is-loading-screen";
import { TrafficDashboard, TrafficWindowPicker } from "@/components/traffic/traffic-dashboard";
import { useUser } from "@/contexts/user-context";
import { trpc } from "@/server/trpc/client";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function AdminTrafficPage() {
  const { user } = useUser();
  const t = useTranslations("adminSystem");
  const [days, setDays] = useState(30);
  const stats = trpc.traffic.platform.useQuery(
    { days },
    { enabled: user?.role === "ADMIN", placeholderData: (previous) => previous },
  );

  if (user && user.role !== "ADMIN") {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-destructive text-sm">{t("adminOnly")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <AdminPageHeader
          title={t("pages.traffic.title")}
          description={t("pages.traffic.description")}
        />
        <TrafficWindowPicker days={days} onChange={setDays} />
      </div>
      {stats.error && <p className="text-destructive text-sm">{stats.error.message}</p>}
      {stats.data ? (
        <TrafficDashboard stats={stats.data} />
      ) : (
        !stats.error && <IsLoadingScreen text={t("pages.traffic.loading")} />
      )}
    </div>
  );
}
