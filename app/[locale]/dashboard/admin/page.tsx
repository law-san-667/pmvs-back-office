"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
    Card,
    CardAction,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { intlLocale } from "@/i18n/config";
import { trpc } from "@/server/trpc/client";
import {
    ArrowUpRightIcon,
    Building2Icon,
    CreditCardIcon,
    GavelIcon,
    PackageIcon,
    ShieldAlertIcon,
    ShoppingCartIcon,
    UserCogIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

const metricDefinitions = [
  {
    key: "totalBusinesses" as const,
    href: "/dashboard/admin/businesses",
    icon: Building2Icon,
  },
  {
    key: "totalListings" as const,
    href: "/dashboard/admin/listings",
    icon: PackageIcon,
  },
  {
    key: "totalTenders" as const,
    href: "/dashboard/admin/tenders",
    icon: GavelIcon,
  },
  {
    key: "totalOrders" as const,
    href: "/dashboard/admin/orders",
    icon: ShoppingCartIcon,
  },
  {
    key: "totalTransactions" as const,
    href: "/dashboard/admin/transactions",
    icon: CreditCardIcon,
  },
  {
    key: "totalTeamMembers" as const,
    href: "/dashboard/admin/team-members",
    icon: UserCogIcon,
  },
];

export default function AdminDashboardPage() {
  const stats = trpc.admin.stats.useQuery();
  const moderation = trpc.admin.moderationSummary.useQuery();
  const t = useTranslations("adminSystem");
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title={t("dashboard.title")}
        description={t("dashboard.description")}
      />

      {(moderation.data?.pending ?? 0) > 0 && (
        <Link
          href="/dashboard/admin/listings"
          className="border-amber-200 bg-amber-50 flex items-center justify-between gap-4 rounded-lg border p-4 text-sm text-amber-900"
        >
          <span className="flex items-center gap-2">
            <ShieldAlertIcon className="size-5" />
            {t("dashboard.pendingModeration", { count: moderation.data?.pending ?? 0 })}
          </span>
          <span className="font-medium underline">{t("dashboard.openModeration")}</span>
        </Link>
      )}

      {stats.isError && (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
          {t("dashboard.statsError", { error: stats.error.message })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metricDefinitions.map((metric) => {
          const Icon = metric.icon;
          const value = stats.data?.[metric.key];
          const title = t(`dashboard.metrics.${metric.key}`);

          return (
            <Card key={metric.key}>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardAction>
                  <Link href={metric.href} aria-label={t("dashboard.view", { title })}>
                    <ArrowUpRightIcon className="text-muted-foreground size-4" />
                  </Link>
                </CardAction>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                {value === undefined ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <p className="text-3xl font-bold text-[#3B9AE1]">
                    {value.toLocaleString(intlLocale(locale))}
                  </p>
                )}
                <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                  <Icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
