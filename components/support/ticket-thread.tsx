"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/contexts/user-context";
import { Link } from "@/i18n/navigation";
import {
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  type TicketPriority,
  type TicketStatus,
  ticketReference,
} from "@/lib/support";
import { cn, formatDate } from "@/lib/utils";
import { trpc } from "@/server/trpc/client";
import { ArrowLeftIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

const STAFF_ROLES = ["ADMIN", "MODERATOR", "OPERATOR"];

/**
 * One support request: its messages and a reply box. The team also sets
 * the status and priority and takes the request.
 */
export function TicketThread({ id }: { id: string }) {
  const t = useTranslations("support");
  const locale = useLocale();
  const dateTime = (value: string) =>
    formatDate(value, locale, { dateStyle: "short", timeStyle: "medium" });
  const { user } = useUser();
  const utils = trpc.useUtils();
  const ticket = trpc.support.ticket.useQuery({ id });
  const reply = trpc.support.reply.useMutation();
  const update = trpc.support.update.useMutation();
  const close = trpc.support.close.useMutation();
  const [body, setBody] = useState("");
  const isStaff = STAFF_ROLES.includes(user?.role ?? "");
  const data = ticket.data;
  const backHref = isStaff ? "/dashboard/admin/support" : "/dashboard/support";

  const refresh = () => utils.support.invalidate();

  const send = async () => {
    try {
      await reply.mutateAsync({ id, body: body.trim() });
      setBody("");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("sendError"));
    }
  };

  const change = async (patch: {
    status?: TicketStatus;
    priority?: TicketPriority;
    assignedToUserId?: string | null;
  }) => {
    try {
      await update.mutateAsync({ id, ...patch });
      toast.success(t("ticket.updated"));
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("ticket.failed"));
    }
  };

  if (ticket.isLoading) {
    return <p className="text-muted-foreground p-6 text-sm">{t("loading")}</p>;
  }
  if (!data) {
    return (
      <p className="text-muted-foreground p-6 text-sm">{t("ticket.notFound")}</p>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            nativeButton={false}
            render={<Link href={backHref} />}
          >
            <ArrowLeftIcon className="size-4" />
            <span className="sr-only">{t("ticket.back")}</span>
          </Button>
          <div>
            <h1 className="text-xl font-bold">{data.subject}</h1>
            <p className="text-muted-foreground text-sm">
              {t("ticket.reference", {
                reference: ticketReference(data.id),
                category: t(`category.${data.category}`),
              })}
              {data.business
                ? ` · ${t("ticket.shop", { name: data.business.name })}`
                : ""}
              {data.requester
                ? ` · ${data.requester.firstName} ${data.requester.lastName}`
                : ""}
            </p>
          </div>
        </div>
        <Badge variant="outline">{t(`status.${data.status}`)}</Badge>
      </div>

      {isStaff && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 pt-6">
            <label className="flex items-center gap-2 text-sm">
              {t("ticket.status")}
              <select
                value={data.status}
                disabled={update.isPending}
                onChange={(event) =>
                  void change({ status: event.target.value as TicketStatus })
                }
                className="border-input bg-background h-9 rounded-md border px-2"
              >
                {(Object.keys(TICKET_STATUS_LABELS) as TicketStatus[]).map(
                  (value) => (
                    <option key={value} value={value}>
                      {t(`status.${value}`)}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              {t("ticket.priority")}
              <select
                value={data.priority}
                disabled={update.isPending}
                onChange={(event) =>
                  void change({
                    priority: event.target.value as TicketPriority,
                  })
                }
                className="border-input bg-background h-9 rounded-md border px-2"
              >
                {(Object.keys(TICKET_PRIORITY_LABELS) as TicketPriority[]).map(
                  (value) => (
                    <option key={value} value={value}>
                      {t(`priority.${value}`)}
                    </option>
                  ),
                )}
              </select>
            </label>
            {data.assignedToUserId !== user?.id && (
              <Button
                variant="outline"
                size="sm"
                disabled={update.isPending}
                onClick={() =>
                  void change({ assignedToUserId: user?.id ?? null })
                }
              >
                {t("ticket.take")}
              </Button>
            )}
            <span className="text-muted-foreground text-xs">
              {data.firstRespondedAt
                ? t("ticket.firstResponded")
                : t("ticket.responseDue", {
                    date: dateTime(data.firstResponseDueAt),
                  })}
            </span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("ticket.exchanges")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {data.messages?.map((message) => (
            <div
              key={message.id}
              className={cn(
                "max-w-[85%] rounded-lg px-4 py-3 text-sm",
                message.isStaff
                  ? "bg-primary/10 self-start"
                  : "bg-muted self-end",
              )}
            >
              <p className="text-muted-foreground mb-1 text-xs">
                {t("ticket.messageMeta", {
                  author: message.isStaff
                    ? t("ticket.staff")
                    : t("ticket.requester"),
                  date: dateTime(message.createdAt),
                })}
              </p>
              <p className="whitespace-pre-line">{message.body}</p>
            </div>
          ))}
          {data.status !== "CLOSED" && (
            <div className="flex flex-col gap-2 border-t pt-4">
              <Textarea
                value={body}
                maxLength={10000}
                placeholder={t("ticket.yourMessage")}
                onChange={(event) => setBody(event.target.value)}
              />
              <div className="flex justify-end gap-2">
                {!isStaff && (
                  <Button
                    variant="ghost"
                    disabled={close.isPending}
                    onClick={() => void close.mutateAsync({ id }).then(refresh)}
                  >
                    {t("ticket.close")}
                  </Button>
                )}
                <Button
                  disabled={!body.trim() || reply.isPending}
                  onClick={() => void send()}
                >
                  {reply.isPending ? t("sending") : t("send")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
