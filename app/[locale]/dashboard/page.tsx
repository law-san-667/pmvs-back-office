"use client";

import { OrderStatusBadge } from "@/components/order-status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import {
  formatMoney,
  getInitials,
  getListingImage,
  getOrderReference,
} from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import {
  ArrowUpRightIcon,
  ImageIcon,
  PackageIcon,
  ReceiptTextIcon,
  ShoppingBagIcon,
  UsersIcon,
} from "lucide-react";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const MONTH_LABELS = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sept",
  "Oct",
  "Nov",
  "Déc",
];

const chartConfig = {
  revenue: {
    label: "Chiffre d’affaires",
    color: "var(--color-primary)",
  },
};

function MetricCard({
  title,
  value,
  icon,
  href,
}: {
  title: string;
  value: number | undefined;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <Link href={href} aria-label={`Voir ${title.toLowerCase()}`}>
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
        <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function ProductImage({ images, title }: { images: unknown; title: string }) {
  const image = getListingImage(images);

  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image}
      alt={title}
      className="bg-muted size-12 rounded-lg object-cover"
    />
  ) : (
    <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-lg">
      <ImageIcon className="size-5" />
    </div>
  );
}

export default function DashboardHomePage() {
  const year = new Date().getFullYear();
  const [requestedCurrency, setRequestedCurrency] = useState<string | null>(
    null,
  );
  const stats = trpc.sellerDashboard.stats.useQuery({ year });
  const recentOrders = trpc.sellerDashboard.recentOrders.useQuery();
  const bestSelling = trpc.sellerDashboard.bestSellingProducts.useQuery({
    limit: 5,
  });
  const customers = trpc.sellerDashboard.customers.useQuery({
    page: 1,
    limit: 8,
    orderBy: "lastOrderAt",
    order: "desc",
  });

  const revenueSeries = stats.data?.revenueGraph.series ?? [];
  const activeSeries =
    revenueSeries.find((series) => series.currency === requestedCurrency) ??
    revenueSeries.find((series) => series.currency === "XOF") ??
    revenueSeries[0];
  const activeCurrency = activeSeries?.currency ?? "XOF";
  const chartData = (activeSeries?.months ?? []).map((month) => ({
    month: MONTH_LABELS[month.month - 1],
    revenue: month.totalAmountMinor,
  }));
  const yearlyRevenue = (activeSeries?.months ?? []).reduce(
    (total, month) => total + month.totalAmountMinor,
    0,
  );

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm">
          Vue d’ensemble de l’activité de votre entreprise
        </p>
      </div>

      {stats.isError && (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
          Impossible de charger les statistiques : {stats.error.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Chiffre d’affaires {year}</CardTitle>
            {revenueSeries.length > 1 && (
              <CardAction>
                <select
                  value={activeCurrency}
                  onChange={(event) => setRequestedCurrency(event.target.value)}
                  className="border-input bg-background h-8 rounded-md border px-2 text-sm"
                  aria-label="Devise du graphique"
                >
                  {revenueSeries.map((series) => (
                    <option key={series.currency} value={series.currency}>
                      {series.currency}
                    </option>
                  ))}
                </select>
              </CardAction>
            )}
          </CardHeader>
          <CardContent>
            {stats.isLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <>
                <p className="mb-3 text-2xl font-bold">
                  {formatMoney(yearlyRevenue, activeCurrency)}
                </p>
                <ChartContainer
                  config={chartConfig}
                  className="h-[210px] w-full"
                >
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="fillRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-primary)"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-primary)"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis hide />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) =>
                            formatMoney(Number(value), activeCurrency)
                          }
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      fill="url(#fillRevenue)"
                    />
                  </AreaChart>
                </ChartContainer>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MetricCard
            title="Clients"
            value={stats.data?.totalCustomers}
            icon={<UsersIcon className="size-5" />}
            href="/dashboard/clients"
          />
          <MetricCard
            title="Commandes"
            value={stats.data?.totalOrders}
            icon={<ReceiptTextIcon className="size-5" />}
            href="/dashboard/orders"
          />
          <MetricCard
            title="Produits"
            value={stats.data?.totalProducts}
            icon={<PackageIcon className="size-5" />}
            href="/dashboard/products"
          />
          <MetricCard
            title="Articles vendus"
            value={stats.data?.totalSold}
            icon={<ShoppingBagIcon className="size-5" />}
            href="/dashboard/orders"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Dernières commandes</CardTitle>
              <CardAction>
                <Link
                  href="/dashboard/orders"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
                >
                  Voir tout <ArrowUpRightIcon className="size-4" />
                </Link>
              </CardAction>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Commande</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        Chargement des commandes...
                      </TableCell>
                    </TableRow>
                  ) : recentOrders.isError ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-destructive h-32 text-center"
                      >
                        Impossible de charger les commandes.
                      </TableCell>
                    </TableRow>
                  ) : !recentOrders.data?.length ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        Aucune commande pour le moment.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentOrders.data.map((order) => {
                      const firstItem = order.items[0];
                      const customerName =
                        `${order.buyer.firstName} ${order.buyer.lastName}`.trim();

                      return (
                        <TableRow key={order.id}>
                          <TableCell>
                            <Link
                              href={`/dashboard/orders/${order.id}`}
                              className="flex items-center gap-3"
                            >
                              <ProductImage
                                images={firstItem?.listing.images}
                                title={firstItem?.listing.title ?? "Commande"}
                              />
                              <div>
                                <p className="font-medium">
                                  {order.items.length} article
                                  {order.items.length > 1 ? "s" : ""}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {getOrderReference(order.id)}
                                </p>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{customerName}</p>
                            <p className="text-muted-foreground text-xs">
                              {order.buyer.email ??
                                order.buyer.phoneNumber ??
                                "—"}
                            </p>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {new Intl.DateTimeFormat("fr-FR", {
                              dateStyle: "medium",
                            }).format(new Date(order.createdAt))}
                          </TableCell>
                          <TableCell className="font-medium whitespace-nowrap">
                            {formatMoney(
                              order.totalAmountMinor,
                              order.currency,
                            )}
                          </TableCell>
                          <TableCell>
                            <OrderStatusBadge status={order.status} />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produits les plus vendus</CardTitle>
              <CardAction>
                <Link
                  href="/dashboard/products"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
                >
                  Produits <ArrowUpRightIcon className="size-4" />
                </Link>
              </CardAction>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Vendus</TableHead>
                    <TableHead>Commandes</TableHead>
                    <TableHead>Chiffre d’affaires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bestSelling.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        Chargement des produits...
                      </TableCell>
                    </TableRow>
                  ) : bestSelling.isError ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-destructive h-32 text-center"
                      >
                        Impossible de charger les meilleures ventes.
                      </TableCell>
                    </TableRow>
                  ) : !bestSelling.data?.length ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        Les produits livrés apparaîtront ici.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bestSelling.data.map((item) => (
                      <TableRow key={item.product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <ProductImage
                              images={item.product.images}
                              title={item.product.title}
                            />
                            <p className="font-medium">{item.product.title}</p>
                          </div>
                        </TableCell>
                        <TableCell>{item.totalSold}</TableCell>
                        <TableCell>{item.totalOrders}</TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          {formatMoney(
                            item.totalRevenueMinor,
                            item.product.currency,
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Clients récents</CardTitle>
            <CardAction>
              <Link href="/dashboard/clients" aria-label="Voir les clients">
                <ArrowUpRightIcon className="text-muted-foreground size-4" />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {customers.isLoading ? (
              Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))
            ) : customers.isError ? (
              <p className="text-destructive text-sm">
                Impossible de charger les clients.
              </p>
            ) : !customers.data?.items.length ? (
              <p className="text-muted-foreground text-sm">
                Aucun client pour le moment.
              </p>
            ) : (
              customers.data.items.map((customer) => {
                const name =
                  `${customer.firstName} ${customer.lastName}`.trim();

                return (
                  <div key={customer.id} className="flex items-center gap-3">
                    <Avatar size="sm">
                      <AvatarImage src={customer.profileImage ?? undefined} />
                      <AvatarFallback>{getInitials(name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{name}</p>
                      <p className="text-muted-foreground text-xs">
                        {customer.totalOrders} commande
                        {customer.totalOrders > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
