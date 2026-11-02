"use client";

import { OrderStatusBadge } from "@/components/order-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBusiness } from "@/contexts/business-context";
import { Link } from "@/i18n/navigation";
import {
  getListingImage,
  getOrderReference,
} from "@/lib/seller-dashboard-utils";
import { formatAmount } from "@/lib/payment-utils";
import { formatDate } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { trpc } from "@/server/trpc/client";
import { OrderActions } from "./order-actions";
import { InvoicesCard } from "@/components/orders/invoices-card";
import { AfterSalesCard } from "@/components/orders/after-sales-card";
import {
  ArrowLeftIcon,
  CalendarIcon,
  CreditCardIcon,
  ImageIcon,
  MapPinIcon,
  PackageSearchIcon,
} from "lucide-react";

const DATE_TIME = { dateStyle: "medium", timeStyle: "short" } as const;

function ItemImage({ images, title }: { images: unknown; title: string }) {
  const image = getListingImage(images);

  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image}
      alt={title}
      className="bg-muted size-14 rounded-lg object-cover"
    />
  ) : (
    <div className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-lg">
      <ImageIcon className="size-5" />
    </div>
  );
}

export function OrderDetails({
  id,
  admin = false,
}: {
  id: string;
  admin?: boolean;
}) {
  const t = useTranslations("orders");
  const tPayment = useTranslations("transactions");
  const locale = useLocale();
  const { businessId, isLoading: isBusinessLoading } = useBusiness();
  const order = trpc.orders.detail.useQuery({ id }, { retry: false });
  const ordersHref = admin ? "/dashboard/admin/orders" : "/dashboard/orders";

  if ((!admin && isBusinessLoading) || order.isLoading) {
    return (
      <div className="text-muted-foreground flex min-h-80 items-center justify-center gap-2 p-6">
        <Spinner /> {t("detail.loading")}
      </div>
    );
  }

  if (order.isError || !order.data) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-3 p-6 text-center">
        <PackageSearchIcon className="text-muted-foreground size-10" />
        <div>
          <p className="font-bold">{t("detail.notFoundTitle")}</p>
          <p className="text-muted-foreground text-sm">
            {order.error?.message ?? t("detail.notFoundText")}
          </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={ordersHref} />}
        >
          <ArrowLeftIcon className="size-4" /> {t("detail.back")}
        </Button>
      </div>
    );
  }

  const data = order.data;
  const businessItems = admin
    ? data.items
    : data.items.filter((item) => item.listing.businessId === businessId);
  const businessTotal = businessItems.reduce(
    (total, item) => total + item.totalPriceMinor,
    0,
  );

  if (!admin && (!businessId || data.businessId !== businessId)) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-3 p-6 text-center">
        <PackageSearchIcon className="text-muted-foreground size-10" />
        <div>
          <p className="font-bold">{t("detail.unavailableTitle")}</p>
          <p className="text-muted-foreground text-sm">
            {t("detail.unavailableText")}
          </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={ordersHref} />}
        >
          <ArrowLeftIcon className="size-4" /> {t("detail.back")}
        </Button>
      </div>
    );
  }

  const address = data.shippingAddress;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            nativeButton={false}
            render={<Link href={ordersHref} />}
          >
            <ArrowLeftIcon className="size-4" />
            <span className="sr-only">{t("detail.back")}</span>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {t("detail.title", { reference: getOrderReference(data.id) })}
              </h1>
              <OrderStatusBadge status={data.status} />
            </div>
            <p className="text-muted-foreground text-sm">
              {t("detail.createdAt", {
                date: formatDate(data.createdAt, locale, DATE_TIME),
              })}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <p className="text-2xl font-bold">
            {formatAmount(businessTotal, data.currency, locale)}
          </p>
          <OrderActions
            orderId={data.id}
            allowedStatuses={data.allowedStatuses ?? []}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <CalendarIcon className="text-primary size-5" />
            <div>
              <p className="text-muted-foreground text-xs">
                {t("detail.updatedAt")}
              </p>
              <p className="font-medium">
                {formatDate(data.updatedAt, locale, DATE_TIME)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <CreditCardIcon className="text-primary size-5" />
            <div>
              <p className="text-muted-foreground text-xs">
                {t("detail.payment")}
              </p>
              <p className="font-medium">
                {data.payment?.providerPaymentMethod ??
                  t(
                    `paymentMethod.${data.payment?.method ?? data.paymentMethod}`,
                  )}
              </p>
              {data.payment && (
                <p className="text-muted-foreground text-xs">
                  {tPayment(`paymentStatus.${data.payment.status}`)}
                  {data.payment.transactionReference
                    ? ` · ${data.payment.transactionReference}`
                    : ""}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <MapPinIcon className="text-primary size-5" />
            <div>
              <p className="text-muted-foreground text-xs">
                {t("detail.delivery")}
              </p>
              <p className="font-medium">
                {address
                  ? `${address.city}, ${address.countryCode}`
                  : t("detail.deliveryNotProvided")}
              </p>
              {(data.carrier || data.trackingNumber) && (
                <p className="text-muted-foreground text-xs">
                  {[data.carrier, data.trackingNumber]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>
              {t("detail.items", { count: businessItems.length })}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("detail.columns.product")}</TableHead>
                  <TableHead>{t("detail.columns.unitPrice")}</TableHead>
                  <TableHead>{t("detail.columns.quantity")}</TableHead>
                  <TableHead className="text-end">
                    {t("detail.columns.subtotal")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businessItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center">
                      {t("detail.noItems")}
                    </TableCell>
                  </TableRow>
                ) : (
                  businessItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ItemImage
                            images={item.listing.images}
                            title={item.listing.title}
                          />
                          <p className="font-medium">{item.listing.title}</p>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatAmount(
                          item.unitPriceMinor,
                          data.currency,
                          locale,
                        )}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="text-end font-bold whitespace-nowrap">
                        {formatAmount(
                          item.totalPriceMinor,
                          data.currency,
                          locale,
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Separator className="my-4" />
            <div className="flex justify-end">
              <div className="flex w-full max-w-xs items-center justify-between text-base">
                <span>{t("detail.total")}</span>
                <span className="font-bold">
                  {formatAmount(businessTotal, data.currency, locale)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("detail.shippingAddress")}</CardTitle>
            </CardHeader>
            <CardContent>
              {address ? (
                <div className="space-y-1">
                  <p className="font-bold">{address.recipientName}</p>
                  <p>{address.phoneNumber}</p>
                  {address.street && <p>{address.street}</p>}
                  <p>
                    {[address.postalCode, address.city, address.state]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p>{address.countryCode}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">{t("detail.noAddress")}</p>
              )}
              {data.notes && (
                <>
                  <Separator className="my-4" />
                  <p className="mb-1 font-medium">{t("detail.customerNote")}</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {data.notes}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <InvoicesCard orderId={data.id} />
            <AfterSalesCard orderId={data.id} />
            <CardHeader>
              <CardTitle>{t("detail.history")}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.statusHistory.length === 0 ? (
                <p className="text-muted-foreground">{t("detail.noHistory")}</p>
              ) : (
                <ol className="space-y-4">
                  {[...data.statusHistory].reverse().map((entry, index) => (
                    <li key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="bg-primary mt-1.5 size-2.5 rounded-full" />
                        {index < data.statusHistory.length - 1 && (
                          <span className="bg-border mt-1 h-full w-px" />
                        )}
                      </div>
                      <div className="pb-1">
                        <p className="font-medium">
                          {t(`status.${entry.toStatus}`)}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatDate(entry.createdAt, locale, DATE_TIME)}
                        </p>
                        {entry.note && (
                          <p className="text-muted-foreground mt-1 text-sm">
                            {entry.note}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
