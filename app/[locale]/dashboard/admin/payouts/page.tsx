"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import type { OperationPayment } from "@/server/trpc/_procedures/payment-operations";
import { intlLocale } from "@/i18n/config";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

const orderRef = (id: string) => `#${id.slice(0, 8).toUpperCase()}`;

/**
 * The agent's desk: offline payments to confirm once the money is on the
 * account, then supplier shares to release once the order is delivered.
 */
export default function PaymentOperationsPage() {
  const t = useTranslations("adminCommerce");
  const locale = useLocale();
  const utils = trpc.useUtils();
  const offline = trpc.paymentOperations.pendingOffline.useQuery();
  const [onlyReady, setOnlyReady] = useState(true);
  const held = trpc.paymentOperations.heldPayouts.useQuery({
    releasable: onlyReady,
  });
  const confirm = trpc.paymentOperations.confirmOffline.useMutation();
  const reject = trpc.paymentOperations.rejectOffline.useMutation();
  const release = trpc.paymentOperations.release.useMutation();
  const [references, setReferences] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [payoutReference, setPayoutReference] = useState("");

  const refresh = () => utils.paymentOperations.invalidate();
  const fail = (error: unknown) =>
    toast.error(error instanceof Error ? error.message : t("common.failed"));

  const confirmPayment = async (payment: OperationPayment) => {
    try {
      await confirm.mutateAsync({
        id: payment.id,
        reference: (references[payment.id] ?? "").trim(),
      });
      toast.success(
        t("payouts.confirmed", { ref: orderRef(payment.orderId) }),
      );
      await refresh();
    } catch (error) {
      fail(error);
    }
  };

  const rejectPayment = async (payment: OperationPayment) => {
    const reason = window.prompt(
      t("payouts.rejectPrompt"),
      t("payouts.rejectDefault"),
    );
    if (!reason?.trim()) return;
    try {
      await reject.mutateAsync({ id: payment.id, reason });
      toast.success(t("payouts.rejected"));
      await refresh();
    } catch (error) {
      fail(error);
    }
  };

  const releaseSelected = async (method: "MANUAL" | "PAYDUNYA" = "MANUAL") => {
    try {
      const result = await release.mutateAsync({
        paymentIds: selected,
        method,
        ...(method === "MANUAL" ? { reference: payoutReference.trim() } : {}),
      });
      toast.success(
        t("payouts.released", { count: result.released.length }),
      );
      if (result.processing?.length) {
        toast.info(
          t("payouts.processingToast", { count: result.processing.length }),
        );
      }
      for (const skip of result.skipped) toast.warning(skip.reason);
      setSelected([]);
      setPayoutReference("");
      await refresh();
    } catch (error) {
      fail(error);
    }
  };

  const heldItems = held.data?.items ?? [];
  // Extra fields of the list: whether PayDunya can pay, and what it is processing.
  const payoutInfo = held.data as unknown as { paydunyaPayouts?: boolean; processing?: number } | undefined;
  const selectedTotal = heldItems
    .filter((p) => selected.includes(p.id))
    .reduce((total, p) => total + (p.payoutDueMinor ?? p.payoutAmountMinor ?? 0), 0);

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title={t("payouts.title")}
        description={t("payouts.description")}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {t("payouts.offlineTitle", { count: offline.data?.total ?? 0 })}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!offline.data?.items.length && (
            <p className="text-muted-foreground text-sm">
              {offline.isLoading
                ? t("common.loading")
                : t("payouts.noPending")}
            </p>
          )}
          {offline.data?.items.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-col gap-3 rounded-lg border p-3 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0 text-sm">
                <p className="font-semibold">
                  {t.rich("payouts.offlineOrder", {
                    amount: formatMoney(
                      payment.amountMinor,
                      payment.currency,
                      locale,
                    ),
                    ref: orderRef(payment.orderId),
                    link: (chunks) => (
                      <Link
                        className="text-primary hover:underline"
                        href={`/dashboard/admin/orders/${payment.orderId}`}
                      >
                        {chunks}
                      </Link>
                    ),
                  })}
                </p>
                <p className="text-muted-foreground">
                  {t("payouts.orderedBy", {
                    buyer: `${payment.order.buyer.firstName} ${payment.order.buyer.lastName}`,
                    business: payment.order.business.name,
                    date: new Date(payment.createdAt).toLocaleDateString(
                      intlLocale(locale),
                    ),
                  })}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  className="h-9 w-48"
                  placeholder={t("payouts.transferReference")}
                  value={references[payment.id] ?? ""}
                  onChange={(event) =>
                    setReferences({
                      ...references,
                      [payment.id]: event.target.value,
                    })
                  }
                />
                <Button
                  size="sm"
                  disabled={
                    (references[payment.id] ?? "").trim().length < 3 ||
                    confirm.isPending
                  }
                  onClick={() => void confirmPayment(payment)}
                >
                  {t("payouts.moneyReceived")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={reject.isPending}
                  onClick={() => void rejectPayment(payment)}
                >
                  {t("common.reject")}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle>
            {t("payouts.heldTitle", { count: held.data?.total ?? 0 })}
            {(payoutInfo?.processing ?? 0) > 0 && (
              <span className="text-muted-foreground ms-2 text-sm font-normal">
                {t("payouts.processing", {
                  count: payoutInfo?.processing ?? 0,
                })}
              </span>
            )}
          </CardTitle>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyReady}
              onChange={(event) => {
                setOnlyReady(event.target.checked);
                setSelected([]);
              }}
            />
            {t("payouts.onlyDelivered")}
          </label>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!heldItems.length && (
            <p className="text-muted-foreground text-sm">
              {held.isLoading ? t("common.loading") : t("payouts.noShares")}
            </p>
          )}
          {heldItems.map((payment) => {
            const account = payment.order.business.payoutAccount;
            const ready = payment.order.status === "DELIVERED";
            return (
              <label
                key={payment.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm"
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  disabled={!ready}
                  checked={selected.includes(payment.id)}
                  onChange={(event) =>
                    setSelected(
                      event.target.checked
                        ? [...selected, payment.id]
                        : selected.filter((id) => id !== payment.id),
                    )
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {t("payouts.shareTo", {
                      amount: formatMoney(
                        payment.payoutDueMinor ??
                          payment.payoutAmountMinor ??
                          0,
                        payment.currency,
                        locale,
                      ),
                      business: payment.order.business.name,
                    })}
                    {(payment.refundedPayoutMinor ?? 0) > 0 && (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        {t("payouts.deduction", {
                          share: formatMoney(payment.payoutAmountMinor ?? 0, payment.currency, locale),
                          refunded: formatMoney(payment.refundedPayoutMinor ?? 0, payment.currency, locale),
                        })}
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground">
                    {t("payouts.orderLine", {
                      ref: orderRef(payment.orderId),
                      state: ready
                        ? t("payouts.delivered")
                        : t("payouts.notDelivered"),
                      account: account
                        ? `${account.service} ${account.destinationNumber}`
                        : t("payouts.noAccount"),
                    })}
                  </p>
                </div>
              </label>
            );
          })}
          {selected.length > 0 && (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-3">
              <span className="text-sm">
                {t.rich("payouts.selection", {
                  count: selected.length,
                  total: formatMoney(
                    selectedTotal,
                    heldItems[0]?.currency ?? "XOF",
                    locale,
                  ),
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </span>
              <Input
                className="h-9 w-56"
                placeholder={t("payouts.payoutReference")}
                value={payoutReference}
                onChange={(event) => setPayoutReference(event.target.value)}
              />
              <Button
                variant={payoutInfo?.paydunyaPayouts ? "outline" : "default"}
                disabled={
                  payoutReference.trim().length < 3 || release.isPending
                }
                onClick={() => void releaseSelected("MANUAL")}
              >
                {t("payouts.validatePayout")}
              </Button>
              {payoutInfo?.paydunyaPayouts && (
                <Button
                  disabled={release.isPending}
                  onClick={() => void releaseSelected("PAYDUNYA")}
                  title={t("payouts.paydunyaHint")}
                >
                  {t("payouts.payByPaydunya")}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
