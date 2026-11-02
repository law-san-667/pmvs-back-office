"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useBusiness } from "@/contexts/business-context";
import type { Tender } from "@/lib/backend-resource-types";
import {
  formatOfferAmount,
  RESPONSE_STATUS_CLASSES,
} from "@/lib/tender-responses";
import { formatDate } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { trpc } from "@/server/trpc/client";
import { useState } from "react";
import { toast } from "sonner";

const toInt = (value: string) => {
  const n = Number.parseInt(value.replace(/\s/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Open tenders my shop can answer, and the offers it already sent. Shops
 * selling in the tender's category are also told when one is published.
 */
export default function TenderOpportunitiesPage() {
  const t = useTranslations("tenders.opportunities");
  const tTenders = useTranslations("tenders");
  const locale = useLocale();
  const { business, businessId } = useBusiness();
  const utils = trpc.useUtils();
  const open = trpc.tenders.list.useQuery({
    page: 1,
    limit: 50,
    orderBy: "submissionDeadline",
    order: "asc",
    countryCode: business?.countryCode,
  });
  const mine = trpc.tenders.myResponses.useQuery(
    { page: 1 },
    { enabled: Boolean(businessId) },
  );
  const submit = trpc.tenders.submitResponse.useMutation();
  const withdraw = trpc.tenders.withdrawResponse.useMutation();
  const [target, setTarget] = useState<Tender | null>(null);
  const [form, setForm] = useState({
    amount: "",
    delay: "",
    validity: "30",
    technicalOffer: "",
    coverLetter: "",
  });

  const answered = new Set(
    mine.data?.items
      .filter((r) => r.status !== "WITHDRAWN")
      .map((r) => r.tenderId),
  );
  const opportunities = (open.data?.items ?? []).filter(
    (tender) => tender.publisherBusinessId !== businessId,
  );

  const send = async () => {
    if (!target) return;
    const amount = toInt(form.amount);
    if (!amount) return;
    try {
      await submit.mutateAsync({
        tenderId: target.id,
        proposedAmountMinor: amount,
        deliveryDelayDays: toInt(form.delay),
        validityDays: toInt(form.validity),
        technicalOffer: form.technicalOffer.trim() || null,
        coverLetter: form.coverLetter.trim() || null,
      });
      toast.success(t("sentToast"));
      setTarget(null);
      setForm({
        amount: "",
        delay: "",
        validity: "30",
        technicalOffer: "",
        coverLetter: "",
      });
      await utils.tenders.myResponses.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("sendError"));
    }
  };

  const remove = async (id: string) => {
    try {
      await withdraw.mutateAsync({ id });
      toast.success(t("withdrawn"));
      await utils.tenders.myResponses.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("withdrawError"));
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <CardTitle>{t("open", { count: opportunities.length })}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {open.isLoading && (
              <p className="text-muted-foreground text-sm">{t("loading")}</p>
            )}
            {!open.isLoading && opportunities.length === 0 && (
              <p className="text-muted-foreground text-sm">{t("empty")}</p>
            )}
            {opportunities.map((tender) => (
              <div
                key={tender.id}
                className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{tender.title}</p>
                  <p className="text-muted-foreground text-sm">
                    {tender.budgetMaxMinor
                      ? t("deadlineWithBudget", {
                          date: formatDate(tender.submissionDeadline, locale, {
                            dateStyle: "short",
                          }),
                          budget: formatOfferAmount(
                            tender.budgetMaxMinor,
                            tender.currency,
                            locale,
                          ),
                        })
                      : t("deadline", {
                          date: formatDate(tender.submissionDeadline, locale, {
                            dateStyle: "short",
                          }),
                        })}
                  </p>
                </div>
                {answered.has(tender.id) ? (
                  <Badge variant="outline">{t("sent")}</Badge>
                ) : (
                  <Button size="sm" onClick={() => setTarget(tender)}>
                    {t("respond")}
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("mine")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {!mine.data?.items.length && (
              <p className="text-muted-foreground text-sm">{t("noneSent")}</p>
            )}
            {mine.data?.items.map((response) => (
              <div
                key={response.id}
                className="flex flex-col gap-1 rounded-lg border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">
                    {response.tender?.title}
                  </p>
                  <Badge
                    variant="outline"
                    className={RESPONSE_STATUS_CLASSES[response.status]}
                  >
                    {tTenders(`responseStatus.${response.status}`)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-muted-foreground text-sm">
                    {formatOfferAmount(
                      response.proposedAmountMinor,
                      response.currency,
                      locale,
                    )}
                  </p>
                  {["SUBMITTED", "UNDER_REVIEW"].includes(response.status) &&
                    response.tender?.status === "OPEN" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={withdraw.isPending}
                        onClick={() => void remove(response.id)}
                      >
                        {t("withdraw")}
                      </Button>
                    )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={target !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setTarget(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("dialogTitle", { title: target?.title ?? "" })}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field className="sm:col-span-3">
              <FieldLabel htmlFor="offer-amount">
                {t("amount", {
                  currency:
                    target?.currency === "XOF"
                      ? "FCFA"
                      : (target?.currency ?? ""),
                })}
              </FieldLabel>
              <Input
                id="offer-amount"
                inputMode="numeric"
                value={form.amount}
                onChange={(event) =>
                  setForm({ ...form, amount: event.target.value })
                }
              />
            </Field>
            <Field className="sm:col-span-1">
              <FieldLabel htmlFor="offer-delay">{t("delay")}</FieldLabel>
              <Input
                id="offer-delay"
                inputMode="numeric"
                value={form.delay}
                onChange={(event) =>
                  setForm({ ...form, delay: event.target.value })
                }
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="offer-validity">{t("validity")}</FieldLabel>
              <Input
                id="offer-validity"
                inputMode="numeric"
                value={form.validity}
                onChange={(event) =>
                  setForm({ ...form, validity: event.target.value })
                }
              />
            </Field>
            <Field className="sm:col-span-3">
              <FieldLabel htmlFor="offer-technical">
                {t("technicalOffer")}
              </FieldLabel>
              <Textarea
                id="offer-technical"
                value={form.technicalOffer}
                maxLength={20000}
                onChange={(event) =>
                  setForm({ ...form, technicalOffer: event.target.value })
                }
              />
            </Field>
            <Field className="sm:col-span-3">
              <FieldLabel htmlFor="offer-letter">{t("coverLetter")}</FieldLabel>
              <Textarea
                id="offer-letter"
                value={form.coverLetter}
                maxLength={5000}
                onChange={(event) =>
                  setForm({ ...form, coverLetter: event.target.value })
                }
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel disabled={submit.isPending}>
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!toInt(form.amount) || submit.isPending}
              onClick={(event) => {
                event.preventDefault();
                void send();
              }}
            >
              {submit.isPending ? t("sending") : t("submit")}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
