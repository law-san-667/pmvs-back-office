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
import { trpc } from "@/server/trpc/client";
import {
  ArrowUpRightIcon,
  Building2Icon,
  CreditCardIcon,
  GavelIcon,
  PackageIcon,
  ShoppingCartIcon,
  UserCogIcon,
} from "lucide-react";

const metricDefinitions = [
  {
    key: "totalBusinesses" as const,
    title: "Entreprises",
    href: "/dashboard/admin/businesses",
    icon: Building2Icon,
  },
  {
    key: "totalListings" as const,
    title: "Produits & services publiés",
    href: "/dashboard/admin/listings",
    icon: PackageIcon,
  },
  {
    key: "totalTenders" as const,
    title: "Appels d’offres ouverts",
    href: "/dashboard/admin/tenders",
    icon: GavelIcon,
  },
  {
    key: "totalOrders" as const,
    title: "Commandes",
    href: "/dashboard/admin/orders",
    icon: ShoppingCartIcon,
  },
  {
    key: "totalTransactions" as const,
    title: "Transactions",
    href: "/dashboard/admin/transactions",
    icon: CreditCardIcon,
  },
  {
    key: "totalTeamMembers" as const,
    title: "Membres d’équipe",
    href: "/dashboard/admin/team-members",
    icon: UserCogIcon,
  },
];

export default function AdminDashboardPage() {
  const stats = trpc.admin.stats.useQuery();

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title="Tableau de bord"
        description="Vue d’ensemble de l’activité et des ressources de la plateforme."
      />

      {stats.isError && (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
          Impossible de charger les statistiques : {stats.error.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metricDefinitions.map((metric) => {
          const Icon = metric.icon;
          const value = stats.data?.[metric.key];

          return (
            <Card key={metric.key}>
              <CardHeader>
                <CardTitle>{metric.title}</CardTitle>
                <CardAction>
                  <Link href={metric.href} aria-label={`Voir ${metric.title}`}>
                    <ArrowUpRightIcon className="text-muted-foreground size-4" />
                  </Link>
                </CardAction>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                {value === undefined ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <p className="text-3xl font-bold text-[#3B9AE1]">
                    {value.toLocaleString("fr-FR")}
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
