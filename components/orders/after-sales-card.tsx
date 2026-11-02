"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/contexts/user-context";
import {
  type AfterSalesCase,
  type CaseResolution,
  RESOLUTION_LABELS,
} from "@/lib/after-sales";
import { formatDate, formatPrice } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { trpc } from "@/server/trpc/client";
import { useState } from "react";
import { toast } from "sonner";

/**
 * The order's return or dispute: the seller accepts or refuses (72 h), the
 * Diarama team decides. Nothing shows when there is no case.
 */
export function AfterSalesCard({ orderId }: { orderId: string }) {
  const cases = trpc.afterSales.forOrder.useQuery({ id: orderId });
  const current = cases.data?.[0];
  if (!current) return null;
  return <CaseCard key={current.id + current.status} item={current} />;
}

export function CaseCard({ item }: { item: AfterSalesCase }) {
  const t = useTranslations("afterSales");
  const locale = useLocale();
  const { user } = useUser();
  const utils = trpc.useUtils();
  const answer = trpc.afterSales.answer.useMutation();
  const resolve = trpc.afterSales.resolve.useMutation();
  const [message, setMessage] = useState("");
  const [resolution, setResolution] = useState<CaseResolution>("REFUND_FULL");
  const [refundAmount, setRefundAmount] = useState("");
  const partialAmount = Number.parseInt(refundAmount.replace(/\D/g, ""), 10);
  const partialValid = resolution !== "REFUND_PARTIAL" || partialAmount > 0;
  const isAdmin = user?.role === "ADMIN";
  const decided = item.status === "RESOLVED" || item.status === "CANCELLED";

  const run = async (action: () => Promise<unknown>, done: string) => {
    try {
      await action();
      toast.success(done);
      setMessage("");
      await utils.afterSales.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("card.failed"));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {item.type === "DISPUTE"
            ? t("card.dispute")
            : t("card.returnRequest")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <p className="font-semibold">
          {t("card.summary", {
            reason: t(`reason.${item.reason}`),
            status: t(`status.${item.status}`),
          })}
        </p>
        <p className="whitespace-pre-line">{item.description}</p>
        {item.evidence.map((url) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-xs hover:underline"
          >
            {t("card.photo")}
          </a>
        ))}
        {item.supplierResponse && (
          <p className="text-muted-foreground">
            {t("card.supplierResponse", { response: item.supplierResponse })}
          </p>
        )}
        {item.resolution && (
          <p>
            {t.rich(
              item.resolutionNote ? "card.decisionWithNote" : "card.decision",
              {
                resolution:
                  item.resolution === "REFUND_PARTIAL" && item.refundAmountMinor
                    ? t("resolution.partialAmount", {
                        amount: formatPrice(item.refundAmountMinor, item.order?.currency ?? "XOF", locale),
                      })
                    : t(`resolution.${item.resolution}`),
                note: item.resolutionNote ?? "",
                b: (chunks) => <strong>{chunks}</strong>,
              },
            )}
          </p>
        )}

        {item.status === "OPEN" && !isAdmin && (
          <div className="flex flex-col gap-2 border-t pt-3">
            <p className="text-muted-foreground text-xs">
              {t("card.deadline", {
                date: formatDate(item.supplierResponseDueAt, locale, {
                  dateStyle: "short",
                  timeStyle: "medium",
                }),
              })}
            </p>
            <Textarea
              aria-label={t("card.yourAnswer")}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={message.trim().length < 3 || answer.isPending}
                onClick={() =>
                  void run(
                    () =>
                      answer.mutateAsync({
                        id: item.id,
                        accept: false,
                        message: message.trim(),
                      }),
                    t("card.refused"),
                  )
                }
              >
                {t("card.refuse")}
              </Button>
              <Button
                size="sm"
                disabled={message.trim().length < 3 || answer.isPending}
                onClick={() =>
                  void run(
                    () =>
                      answer.mutateAsync({
                        id: item.id,
                        accept: true,
                        message: message.trim(),
                      }),
                    t("card.accepted"),
                  )
                }
              >
                {t("card.accept")}
              </Button>
            </div>
          </div>
        )}

        {isAdmin && !decided && (
          <div className="flex flex-col gap-2 border-t pt-3">
            <select
              aria-label={t("card.decisionLabel")}
              value={resolution}
              onChange={(event) =>
                setResolution(event.target.value as CaseResolution)
              }
              className="border-input bg-background h-9 rounded-md border px-3"
            >
              {(Object.keys(RESOLUTION_LABELS) as CaseResolution[]).map(
                (value) => (
                  <option key={value} value={value}>
                    {t(`resolution.${value}`)}
                  </option>
                ),
              )}
            </select>
            <Textarea
              aria-label={t("card.decisionReason")}
              placeholder={t("card.decisionPlaceholder")}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            {resolution === "REFUND_PARTIAL" && (
              <label className="flex flex-col gap-1 text-xs">
                {t("card.refundAmount", { currency: item.order?.currency ?? "XOF" })}
                <input
                  inputMode="numeric"
                  value={refundAmount}
                  onChange={(event) => setRefundAmount(event.target.value)}
                  className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                />
              </label>
            )}
            {(resolution === "REFUND_FULL" || resolution === "REFUND_PARTIAL") && (
              <p className="text-muted-foreground text-xs">
                {t(resolution === "REFUND_FULL" ? "card.refundHint" : "card.partialRefundHint")}
              </p>
            )}
            <Button
              size="sm"
              disabled={message.trim().length < 3 || !partialValid || resolve.isPending}
              onClick={() =>
                void run(
                  () =>
                    resolve.mutateAsync({
                      id: item.id,
                      resolution,
                      note: message.trim(),
                      ...(resolution === "REFUND_PARTIAL" ? { refundAmountMinor: partialAmount } : {}),
                    }),
                  t("card.decided"),
                )
              }
            >
              {t("card.resolve")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
