"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/server/trpc/client";
import { FileTextIcon } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

const formatAmount = (amount: number, currency: string, locale: string) =>
  `${formatNumber(amount, locale)} ${
    currency === "XOF" || currency === "XAF" ? "FCFA" : currency
  }`;

/**
 * Invoice of a confirmed order (and its credit note if it was cancelled):
 * the PDF opens in a new tab through a short-lived link.
 */
export function InvoicesCard({ orderId }: { orderId: string }) {
  const t = useTranslations("invoices.card");
  const locale = useLocale();
  const documents = trpc.invoices.forOrder.useQuery({ id: orderId });
  const link = trpc.invoices.link.useMutation();
  const [error, setError] = useState<string | null>(null);

  if (!documents.data?.length) return null;

  const open = async (id: string) => {
    setError(null);
    // Opened before the request so the browser does not block it.
    const tab = window.open("", "_blank");
    try {
      const { url } = await link.mutateAsync({ id });
      if (tab) tab.location.replace(url);
      else window.location.assign(url);
    } catch {
      tab?.close();
      setError(t("openError"));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileTextIcon className="text-primary size-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {documents.data.map((document) => (
          <div
            key={document.id}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">
                {document.type === "CREDIT_NOTE"
                  ? t("creditNote", { number: document.number })
                  : t("invoice", { number: document.number })}
              </p>
              <p className="text-muted-foreground text-xs">
                {formatDate(document.issuedAt, locale, { dateStyle: "short" })}{" "}
                ·{" "}
                {formatAmount(
                  document.totalAmountMinor,
                  document.currency,
                  locale,
                )}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={link.isPending}
              onClick={() => void open(document.id)}
            >
              PDF
            </Button>
          </div>
        ))}
        {error && <p className="text-destructive text-xs">{error}</p>}
      </CardContent>
    </Card>
  );
}
