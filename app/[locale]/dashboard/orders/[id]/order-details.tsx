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
  formatDate,
  formatMoney,
  getListingImage,
  getOrderReference,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import {
  ArrowLeftIcon,
  CalendarIcon,
  CreditCardIcon,
  ImageIcon,
  MapPinIcon,
  PackageSearchIcon,
} from "lucide-react";

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
  const { businessId, isLoading: isBusinessLoading } = useBusiness();
  const order = trpc.orders.detail.useQuery({ id }, { retry: false });
  const ordersHref = admin ? "/dashboard/admin/orders" : "/dashboard/orders";

  if ((!admin && isBusinessLoading) || order.isLoading) {
    return (
      <div className="text-muted-foreground flex min-h-80 items-center justify-center gap-2 p-6">
        <Spinner /> Chargement de la commande...
      </div>
    );
  }

  if (order.isError || !order.data) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-3 p-6 text-center">
        <PackageSearchIcon className="text-muted-foreground size-10" />
        <div>
          <p className="font-bold">Commande introuvable</p>
          <p className="text-muted-foreground text-sm">
            {order.error?.message ??
              "Cette commande n’existe pas ou vous n’avez pas accès à ses détails."}
          </p>
        </div>
        <Button variant="outline" render={<Link href={ordersHref} />}>
          <ArrowLeftIcon className="size-4" /> Retour aux commandes
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
          <p className="font-bold">Commande non disponible</p>
          <p className="text-muted-foreground text-sm">
            Cette commande n’est pas liée à l’entreprise active.
          </p>
        </div>
        <Button variant="outline" render={<Link href={ordersHref} />}>
          <ArrowLeftIcon className="size-4" /> Retour aux commandes
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
            render={<Link href={ordersHref} />}
          >
            <ArrowLeftIcon className="size-4" />
            <span className="sr-only">Retour aux commandes</span>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                Commande {getOrderReference(data.id)}
              </h1>
              <OrderStatusBadge status={data.status} />
            </div>
            <p className="text-muted-foreground text-sm">
              Créée le {formatDate(data.createdAt, true)}
            </p>
          </div>
        </div>
        <p className="text-2xl font-bold">
          {formatMoney(businessTotal, data.currency)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <CalendarIcon className="text-primary size-5" />
            <div>
              <p className="text-muted-foreground text-xs">
                Dernière mise à jour
              </p>
              <p className="font-medium">{formatDate(data.updatedAt, true)}</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <CreditCardIcon className="text-primary size-5" />
            <div>
              <p className="text-muted-foreground text-xs">Paiement</p>
              <p className="font-medium">
                {PAYMENT_METHOD_LABELS[data.paymentMethod]}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <MapPinIcon className="text-primary size-5" />
            <div>
              <p className="text-muted-foreground text-xs">Livraison</p>
              <p className="font-medium">
                {address
                  ? `${address.city}, ${address.countryCode}`
                  : "Non renseignée"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Articles ({businessItems.length})</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Prix unitaire</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead className="text-right">Sous-total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businessItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center">
                      Aucun article de cette commande n’est lié à l’entreprise
                      active.
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
                        {formatMoney(item.unitPriceMinor, data.currency)}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="text-right font-bold whitespace-nowrap">
                        {formatMoney(item.totalPriceMinor, data.currency)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Separator className="my-4" />
            <div className="flex justify-end">
              <div className="flex w-full max-w-xs items-center justify-between text-base">
                <span>Total</span>
                <span className="font-bold">
                  {formatMoney(businessTotal, data.currency)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Adresse de livraison</CardTitle>
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
                <p className="text-muted-foreground">
                  Aucune adresse de livraison renseignée.
                </p>
              )}
              {data.notes && (
                <>
                  <Separator className="my-4" />
                  <p className="mb-1 font-medium">Note du client</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {data.notes}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historique</CardTitle>
            </CardHeader>
            <CardContent>
              {data.statusHistory.length === 0 ? (
                <p className="text-muted-foreground">
                  Aucun historique disponible.
                </p>
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
                          {ORDER_STATUS_LABELS[entry.toStatus]}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatDate(entry.createdAt, true)}
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
