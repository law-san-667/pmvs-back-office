"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useBusiness } from "@/contexts/business-context";
import { Link, useRouter } from "@/i18n/navigation";
import {
  TICKET_CATEGORY_LABELS,
  type TicketCategory,
  ticketReference,
} from "@/lib/support";
import { formatDate } from "@/lib/utils";
import { trpc } from "@/server/trpc/client";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

/** Seller support: ask the Diarama team, follow the answers. */
export default function SellerSupportPage() {
  const t = useTranslations("support");
  const locale = useLocale();
  const router = useRouter();
  const { businessId } = useBusiness();
  const tickets = trpc.support.mine.useQuery();
  const create = trpc.support.create.useMutation();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory>("OTHER");
  const [body, setBody] = useState("");

  const submit = async () => {
    try {
      const ticket = await create.mutateAsync({
        subject: subject.trim(),
        category,
        body: body.trim(),
        businessId: businessId ?? undefined,
      });
      toast.success(t("sent"));
      router.push(`/dashboard/support/${ticket.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("sendError"));
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("intro")}</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle>{t("mine.title")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {!tickets.data?.items.length && (
              <p className="text-muted-foreground text-sm">
                {tickets.isLoading ? t("loading") : t("mine.empty")}
              </p>
            )}
            {tickets.data?.items.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/dashboard/support/${ticket.id}`}
                className="hover:bg-muted flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{ticket.subject}</p>
                  <p className="text-muted-foreground text-xs">
                    {t("mine.ticketLine", {
                      reference: ticketReference(ticket.id),
                      category: t(`category.${ticket.category}`),
                      date: formatDate(ticket.lastMessageAt, locale, { dateStyle: "short" }),
                    })}
                  </p>
                </div>
                <Badge variant="outline">
                  {t(`status.${ticket.status}`)}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("new.title")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Field>
              <FieldLabel htmlFor="ticket-subject">{t("new.subject")}</FieldLabel>
              <Input
                id="ticket-subject"
                value={subject}
                maxLength={200}
                onChange={(event) => setSubject(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ticket-category">{t("new.category")}</FieldLabel>
              <select
                id="ticket-category"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as TicketCategory)
                }
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              >
                {(Object.keys(TICKET_CATEGORY_LABELS) as TicketCategory[]).map(
                  (value) => (
                    <option key={value} value={value}>
                      {t(`category.${value}`)}
                    </option>
                  ),
                )}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="ticket-body">{t("new.message")}</FieldLabel>
              <Textarea
                id="ticket-body"
                value={body}
                maxLength={10000}
                onChange={(event) => setBody(event.target.value)}
              />
            </Field>
            <Button
              disabled={
                subject.trim().length < 3 ||
                body.trim().length < 10 ||
                create.isPending
              }
              onClick={() => void submit()}
            >
              {create.isPending ? t("sending") : t("send")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
