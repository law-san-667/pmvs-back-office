"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { OrderStatus } from "@/lib/seller-dashboard-types";
import { trpc } from "@/server/trpc/client";
import { useState } from "react";
import { toast } from "sonner";

/** Button label and confirmation text of each target status. */
const ACTIONS: Record<
  OrderStatus,
  { label: string; confirm: string; destructive?: boolean }
> = {
  PENDING: { label: "Remettre en attente", confirm: "" },
  CONFIRMED: {
    label: "Confirmer",
    confirm: "Vous confirmez pouvoir honorer cette commande.",
  },
  PROCESSING: {
    label: "En préparation",
    confirm: "La commande passe en préparation.",
  },
  SHIPPED: {
    label: "Expédier",
    confirm: "La commande est remise au transporteur.",
  },
  DELIVERED: {
    label: "Marquer livrée",
    confirm: "Vous confirmez que l’acheteur a reçu la commande.",
  },
  CANCELLED: {
    label: "Annuler la commande",
    confirm:
      "La commande est annulée et le stock est remis en vente. Indiquez le motif à l’acheteur.",
    destructive: true,
  },
  REFUNDED: {
    label: "Marquer remboursée",
    confirm: "Vous confirmez que l’acheteur a été remboursé.",
    destructive: true,
  },
};

/**
 * Next steps of an order for the seller (or an operator / admin acting for
 * the shop). The API lists them in `allowedStatuses`, so the workflow lives
 * in one place.
 */
export function OrderActions({
  orderId,
  allowedStatuses,
}: {
  orderId: string;
  allowedStatuses: OrderStatus[];
}) {
  const utils = trpc.useUtils();
  const updateStatus = trpc.orders.updateStatus.useMutation();
  const [target, setTarget] = useState<OrderStatus | null>(null);
  const [note, setNote] = useState("");
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  if (allowedStatuses.length === 0) return null;

  const close = () => {
    setTarget(null);
    setNote("");
    setCarrier("");
    setTrackingNumber("");
  };

  const submit = async () => {
    if (!target) return;
    try {
      await updateStatus.mutateAsync({
        id: orderId,
        status: target,
        note: note.trim() || null,
        ...(target === "SHIPPED" && {
          carrier: carrier.trim() || null,
          trackingNumber: trackingNumber.trim() || null,
        }),
      });
      toast.success(`Commande : ${ACTIONS[target].label.toLowerCase()} ✓`);
      await utils.orders.invalidate();
      close();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "La mise à jour a échoué.",
      );
    }
  };

  const action = target ? ACTIONS[target] : null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {allowedStatuses.map((status) => (
          <Button
            key={status}
            variant={ACTIONS[status].destructive ? "outline" : "default"}
            onClick={() => setTarget(status)}
          >
            {ACTIONS[status].label}
          </Button>
        ))}
      </div>

      <AlertDialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{action?.label}</AlertDialogTitle>
            <AlertDialogDescription>{action?.confirm}</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-3">
            {target === "SHIPPED" && (
              <>
                <Field>
                  <FieldLabel htmlFor="order-carrier">Transporteur</FieldLabel>
                  <Input
                    id="order-carrier"
                    value={carrier}
                    maxLength={100}
                    onChange={(event) => setCarrier(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="order-tracking">
                    Numéro de suivi
                  </FieldLabel>
                  <Input
                    id="order-tracking"
                    value={trackingNumber}
                    maxLength={100}
                    onChange={(event) => setTrackingNumber(event.target.value)}
                  />
                </Field>
              </>
            )}
            <Field>
              <FieldLabel htmlFor="order-note">
                {target === "CANCELLED" ? "Motif" : "Note (facultative)"}
              </FieldLabel>
              <Textarea
                id="order-note"
                value={note}
                maxLength={1000}
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateStatus.isPending}>
              Retour
            </AlertDialogCancel>
            <AlertDialogAction
              variant={action?.destructive ? "destructive" : "default"}
              disabled={
                updateStatus.isPending ||
                (target === "CANCELLED" && note.trim().length === 0)
              }
              onClick={(event) => {
                event.preventDefault();
                void submit();
              }}
            >
              {updateStatus.isPending ? "Enregistrement..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
