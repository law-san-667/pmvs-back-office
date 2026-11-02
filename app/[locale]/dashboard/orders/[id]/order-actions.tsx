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
import { intlLocale } from "@/i18n/config";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

/** Target statuses shown as a destructive action. */
const DESTRUCTIVE: OrderStatus[] = ["CANCELLED", "REFUNDED"];

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
  const t = useTranslations("orders.actions");
  const locale = useLocale();
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
      toast.success(
        t("success", {
          action: t(`label.${target}`).toLocaleLowerCase(intlLocale(locale)),
        }),
      );
      await utils.orders.invalidate();
      close();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("error"));
    }
  };

  const destructive = target !== null && DESTRUCTIVE.includes(target);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {allowedStatuses.map((status) => (
          <Button
            key={status}
            variant={DESTRUCTIVE.includes(status) ? "outline" : "default"}
            onClick={() => setTarget(status)}
          >
            {t(`label.${status}`)}
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
            <AlertDialogTitle>
              {target && t(`label.${target}`)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {target && target !== "PENDING" && t(`confirm.${target}`)}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-3">
            {target === "SHIPPED" && (
              <>
                <Field>
                  <FieldLabel htmlFor="order-carrier">
                    {t("carrier")}
                  </FieldLabel>
                  <Input
                    id="order-carrier"
                    value={carrier}
                    maxLength={100}
                    onChange={(event) => setCarrier(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="order-tracking">
                    {t("trackingNumber")}
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
                {target === "CANCELLED" ? t("reason") : t("note")}
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
              {t("back")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant={destructive ? "destructive" : "default"}
              disabled={
                updateStatus.isPending ||
                (target === "CANCELLED" && note.trim().length === 0)
              }
              onClick={(event) => {
                event.preventDefault();
                void submit();
              }}
            >
              {updateStatus.isPending ? t("saving") : t("submit")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
