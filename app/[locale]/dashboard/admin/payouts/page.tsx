"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import type { OperationPayment } from "@/server/trpc/_procedures/payment-operations";
import { useState } from "react";
import { toast } from "sonner";

const orderRef = (id: string) => `#${id.slice(0, 8).toUpperCase()}`;

/**
 * The agent's desk: offline payments to confirm once the money is on the
 * account, then supplier shares to release once the order is delivered.
 */
export default function PaymentOperationsPage() {
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
    toast.error(error instanceof Error ? error.message : "Échec.");

  const confirmPayment = async (payment: OperationPayment) => {
    try {
      await confirm.mutateAsync({
        id: payment.id,
        reference: (references[payment.id] ?? "").trim(),
      });
      toast.success(
        `Paiement de la commande ${orderRef(payment.orderId)} confirmé.`,
      );
      await refresh();
    } catch (error) {
      fail(error);
    }
  };

  const rejectPayment = async (payment: OperationPayment) => {
    const reason = window.prompt(
      "Motif du refus (communiqué à l'acheteur) :",
      "Aucun virement reçu.",
    );
    if (!reason?.trim()) return;
    try {
      await reject.mutateAsync({ id: payment.id, reason });
      toast.success("Paiement refusé, commande annulée.");
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
      toast.success(`${result.released.length} versement(s) effectué(s).`);
      if (result.processing?.length) {
        toast.info(`${result.processing.length} versement(s) en cours chez PayDunya.`);
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
        title="Paiements et versements"
        description="Confirmez les virements reçus, puis versez la part des fournisseurs une fois la commande livrée. Chaque décision est enregistrée."
      />

      <Card>
        <CardHeader>
          <CardTitle>
            Paiements hors ligne à confirmer ({offline.data?.total ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!offline.data?.items.length && (
            <p className="text-muted-foreground text-sm">
              {offline.isLoading ? "Chargement…" : "Aucun paiement en attente."}
            </p>
          )}
          {offline.data?.items.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-col gap-3 rounded-lg border p-3 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0 text-sm">
                <p className="font-semibold">
                  {formatMoney(payment.amountMinor, payment.currency)} ·
                  Commande{" "}
                  <Link
                    className="text-primary hover:underline"
                    href={`/dashboard/admin/orders/${payment.orderId}`}
                  >
                    {orderRef(payment.orderId)}
                  </Link>
                </p>
                <p className="text-muted-foreground">
                  {payment.order.buyer.firstName} {payment.order.buyer.lastName}{" "}
                  → {payment.order.business.name} · commandé le{" "}
                  {new Date(payment.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  className="h-9 w-48"
                  placeholder="Référence du virement"
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
                  Argent reçu
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={reject.isPending}
                  onClick={() => void rejectPayment(payment)}
                >
                  Refuser
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle>
            Parts fournisseurs retenues ({held.data?.total ?? 0})
            {(payoutInfo?.processing ?? 0) > 0 && (
              <span className="text-muted-foreground ms-2 text-sm font-normal">
                · {payoutInfo?.processing} versement(s) en cours chez PayDunya
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
            Seulement les commandes livrées
          </label>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!heldItems.length && (
            <p className="text-muted-foreground text-sm">
              {held.isLoading ? "Chargement…" : "Aucune part à verser."}
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
                    {formatMoney(
                      payment.payoutDueMinor ?? payment.payoutAmountMinor ?? 0,
                      payment.currency,
                    )}{" "}
                    à {payment.order.business.name}
                    {(payment.refundedPayoutMinor ?? 0) > 0 && (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        (part de {formatMoney(payment.payoutAmountMinor ?? 0, payment.currency)} moins{" "}
                        {formatMoney(payment.refundedPayoutMinor ?? 0, payment.currency)} remboursés)
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground">
                    Commande {orderRef(payment.orderId)} ·{" "}
                    {ready ? "livrée" : "pas encore livrée"} ·{" "}
                    {account
                      ? `${account.service} ${account.destinationNumber}`
                      : "aucun compte de versement"}
                  </p>
                </div>
              </label>
            );
          })}
          {selected.length > 0 && (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-3">
              <span className="text-sm">
                {selected.length} part(s) · total{" "}
                <strong>
                  {formatMoney(selectedTotal, heldItems[0]?.currency ?? "XOF")}
                </strong>
              </span>
              <Input
                className="h-9 w-56"
                placeholder="Référence du transfert effectué"
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
                Valider le versement
              </Button>
              {payoutInfo?.paydunyaPayouts && (
                <Button
                  disabled={release.isPending}
                  onClick={() => void releaseSelected("PAYDUNYA")}
                  title="Verse la part nette sur le compte mobile money du fournisseur, depuis le solde PayDunya de Diarama."
                >
                  Verser par PayDunya
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
