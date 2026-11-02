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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import {
  formatOfferAmount,
  RESPONSE_STATUS_CLASSES,
  type TenderResponse,
} from "@/lib/tender-responses";
import { formatDate } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { trpc } from "@/server/trpc/client";
import { ArrowLeftIcon } from "lucide-react";
import { use, useState } from "react";
import { toast } from "sonner";

/**
 * Offers received on one of my tenders: compare them, shortlist or reject,
 * then award the tender to one of them.
 */
export default function TenderResponsesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("tenders.responses");
  const tTenders = useTranslations("tenders");
  const locale = useLocale();
  const utils = trpc.useUtils();
  const tender = trpc.tenders.detail.useQuery({ id });
  const responses = trpc.tenders.responses.useQuery({ id });
  const review = trpc.tenders.reviewResponse.useMutation();
  const award = trpc.tenders.award.useMutation();
  const [winner, setWinner] = useState<TenderResponse | null>(null);
  const isClosed = ["AWARDED", "CLOSED", "CANCELLED"].includes(
    tender.data?.status ?? "",
  );

  const refresh = () =>
    Promise.all([
      utils.tenders.responses.invalidate({ id }),
      utils.tenders.detail.invalidate({ id }),
    ]);

  const setStatus = async (
    response: TenderResponse,
    status: "SHORTLISTED" | "REJECTED",
  ) => {
    try {
      await review.mutateAsync({ id: response.id, status });
      toast.success(
        status === "SHORTLISTED" ? t("shortlisted") : t("rejected"),
      );
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failed"));
    }
  };

  const confirmAward = async () => {
    if (!winner) return;
    try {
      await award.mutateAsync({ tenderId: id, responseId: winner.id });
      toast.success(
        t("awarded", { name: winner.responderBusiness?.name ?? "" }),
      );
      setWinner(null);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failed"));
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          nativeButton={false}
          render={<Link href="/dashboard/tenders" />}
        >
          <ArrowLeftIcon className="size-4" />
          <span className="sr-only">{t("back")}</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{tender.data?.title}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("count", { count: responses.data?.length ?? 0 })}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {responses.isLoading && (
            <p className="text-muted-foreground text-sm">{t("loading")}</p>
          )}
          {responses.error && (
            <p className="text-destructive text-sm">
              {responses.error.message}
            </p>
          )}
          {responses.data?.length === 0 && (
            <p className="text-muted-foreground text-sm">{t("empty")}</p>
          )}
          {[...(responses.data ?? [])]
            .sort((a, b) => a.proposedAmountMinor - b.proposedAmountMinor)
            .map((response) => (
              <div
                key={response.id}
                className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-start md:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">
                      {response.responderBusiness?.name ?? t("supplier")}
                    </p>
                    <Badge
                      variant="outline"
                      className={RESPONSE_STATUS_CLASSES[response.status]}
                    >
                      {tTenders(`responseStatus.${response.status}`)}
                    </Badge>
                  </div>
                  <p className="text-lg font-bold">
                    {formatOfferAmount(
                      response.proposedAmountMinor,
                      response.currency,
                      locale,
                    )}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {[
                      response.deliveryDelayDays &&
                        t("delay", { days: response.deliveryDelayDays }),
                      response.validityDays &&
                        t("validity", { days: response.validityDays }),
                      t("receivedOn", {
                        date: formatDate(response.submittedAt, locale, {
                          dateStyle: "short",
                        }),
                      }),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {response.technicalOffer && (
                    <p className="text-sm whitespace-pre-line">
                      {response.technicalOffer}
                    </p>
                  )}
                  {response.coverLetter && (
                    <p className="text-muted-foreground text-sm whitespace-pre-line italic">
                      {response.coverLetter}
                    </p>
                  )}
                </div>
                {!isClosed &&
                  !["ACCEPTED", "REJECTED"].includes(response.status) && (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {response.status !== "SHORTLISTED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={review.isPending}
                          onClick={() =>
                            void setStatus(response, "SHORTLISTED")
                          }
                        >
                          {t("shortlist")}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={review.isPending}
                        onClick={() => void setStatus(response, "REJECTED")}
                      >
                        {t("reject")}
                      </Button>
                      <Button size="sm" onClick={() => setWinner(response)}>
                        {t("award")}
                      </Button>
                    </div>
                  )}
              </div>
            ))}
        </CardContent>
      </Card>

      <AlertDialog
        open={winner !== null}
        onOpenChange={(open) => {
          if (!open) setWinner(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("awardTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {winner?.responderBusiness?.name
                ? t("awardText", { name: winner.responderBusiness.name })
                : t("awardTextUnnamed")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={award.isPending}>
              {t("back")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={award.isPending}
              onClick={(event) => {
                event.preventDefault();
                void confirmAward();
              }}
            >
              {award.isPending ? t("awarding") : t("award")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
