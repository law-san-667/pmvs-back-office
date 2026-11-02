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
import { intlLocale } from "@/i18n/config";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

function MetricCard({
  title,
  linkLabel,
  value,
  icon,
  href,
}: {
  title: string;
  linkLabel: string;
  value: number | undefined;
  icon: React.ReactNode;
  href: string;
}) {
  const locale = useLocale();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <Link href={href} aria-label={linkLabel}>
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
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const monthLabels = useMemo(() => {
    const format = new Intl.DateTimeFormat(intlLocale(locale), {
      month: "short",
      timeZone: "UTC",
    });
    return Array.from({ length: 12 }, (_, index) =>
      format.format(new Date(Date.UTC(2024, index, 1))),
    );
  }, [locale]);
  const chartConfig = {
    revenue: {
      label: t("revenue"),
      color: "var(--color-primary)",
    },
  };
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
    month: monthLabels[month.month - 1],
    revenue: month.totalAmountMinor,
  }));
  const yearlyRevenue = (activeSeries?.months ?? []).reduce(
    (total, month) => total + month.totalAmountMinor,
    0,
  );

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      {stats.isError && (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
          {t("statsError", { message: stats.error.message })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{t("revenueYear", { year })}</CardTitle>
            {revenueSeries.length > 1 && (
              <CardAction>
                <select
                  value={activeCurrency}
                  onChange={(event) => setRequestedCurrency(event.target.value)}
                  className="border-input bg-background h-8 rounded-md border px-2 text-sm"
                  aria-label={t("chartCurrency")}
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
                  {formatMoney(yearlyRevenue, activeCurrency, locale)}
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
                            formatMoney(Number(value), activeCurrency, locale)
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
            title={t("metrics.customers")}
            linkLabel={t("metrics.customersLink")}
            value={stats.data?.totalCustomers}
            icon={<UsersIcon className="size-5" />}
            href="/dashboard/clients"
          />
          <MetricCard
            title={t("metrics.orders")}
            linkLabel={t("metrics.ordersLink")}
            value={stats.data?.totalOrders}
            icon={<ReceiptTextIcon className="size-5" />}
            href="/dashboard/orders"
          />
          <MetricCard
            title={t("metrics.products")}
            linkLabel={t("metrics.productsLink")}
            value={stats.data?.totalProducts}
            icon={<PackageIcon className="size-5" />}
            href="/dashboard/products"
          />
          <MetricCard
            title={t("metrics.sold")}
            linkLabel={t("metrics.soldLink")}
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
              <CardTitle>{t("recentOrders.title")}</CardTitle>
              <CardAction>
                <Link
                  href="/dashboard/orders"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
                >
                  {t("recentOrders.seeAll")} <ArrowUpRightIcon className="size-4" />
                </Link>
              </CardAction>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("recentOrders.order")}</TableHead>
                    <TableHead>{t("recentOrders.customer")}</TableHead>
                    <TableHead>{t("recentOrders.date")}</TableHead>
                    <TableHead>{t("recentOrders.total")}</TableHead>
                    <TableHead>{t("recentOrders.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        {t("recentOrders.loading")}
                      </TableCell>
                    </TableRow>
                  ) : recentOrders.isError ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-destructive h-32 text-center"
                      >
                        {t("recentOrders.error")}
                      </TableCell>
                    </TableRow>
                  ) : !recentOrders.data?.length ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        {t("recentOrders.empty")}
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
                                title={firstItem?.listing.title ?? t("recentOrders.order")}
                              />
                              <div>
                                <p className="font-medium">
                                  {t("recentOrders.items", {
                                    count: order.items.length,
                                  })}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {getOrderReference(order.id)}
                                </p>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell className="max-w-56">
                            <p className="truncate font-medium">{customerName}</p>
                            <p dir="auto" className="text-muted-foreground truncate text-xs">
                              {order.buyer.email ??
                                order.buyer.phoneNumber ??
                                "—"}
                            </p>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {new Intl.DateTimeFormat(intlLocale(locale), {
                              dateStyle: "medium",
                            }).format(new Date(order.createdAt))}
                          </TableCell>
                          <TableCell className="font-medium whitespace-nowrap">
                            {formatMoney(
                              order.totalAmountMinor,
                              order.currency,
                              locale,
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
              <CardTitle>{t("bestSelling.title")}</CardTitle>
              <CardAction>
                <Link
                  href="/dashboard/products"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
                >
                  {t("bestSelling.products")} <ArrowUpRightIcon className="size-4" />
                </Link>
              </CardAction>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("bestSelling.product")}</TableHead>
                    <TableHead>{t("bestSelling.sold")}</TableHead>
                    <TableHead>{t("bestSelling.orders")}</TableHead>
                    <TableHead>{t("revenue")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bestSelling.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        {t("bestSelling.loading")}
                      </TableCell>
                    </TableRow>
                  ) : bestSelling.isError ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-destructive h-32 text-center"
                      >
                        {t("bestSelling.error")}
                      </TableCell>
                    </TableRow>
                  ) : !bestSelling.data?.length ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        {t("bestSelling.empty")}
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
                            locale,
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
            <CardTitle>{t("recentCustomers.title")}</CardTitle>
            <CardAction>
              <Link href="/dashboard/clients" aria-label={t("recentCustomers.seeAll")}>
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
                {t("recentCustomers.error")}
              </p>
            ) : !customers.data?.items.length ? (
              <p className="text-muted-foreground text-sm">
                {t("recentCustomers.empty")}
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
                        {t("recentCustomers.orders", {
                          count: customer.totalOrders,
                        })}
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
