"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "@/i18n/navigation";
import { type AppNotification, notificationHref } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { trpc } from "@/server/trpc/client";
import { intlLocale } from "@/i18n/config";
import { BellIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

type T = ReturnType<typeof useTranslations<"notifications">>;

const timeAgo = (date: string, t: T, locale: string) => {
  const minutes = Math.round((Date.now() - new Date(date).getTime()) / 60_000);
  if (minutes < 1) return t("bell.justNow");
  if (minutes < 60) return t("bell.minutesAgo", { minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t("bell.hoursAgo", { hours });
  return new Date(date).toLocaleDateString(intlLocale(locale));
};

/**
 * Header bell: unread count, the latest notifications, a click opens the
 * related page. Refreshed by the socket (notification:new), on focus and
 * every minute.
 */
export function NotificationsBell() {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const router = useRouter();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const refresh = { refetchInterval: 60_000, refetchOnWindowFocus: true };
  const unread = trpc.notifications.unreadCount.useQuery(undefined, refresh);
  const list = trpc.notifications.list.useQuery(
    { page: 1, limit: 15 },
    { ...refresh, enabled: open },
  );
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => void utils.notifications.invalidate(),
  });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => void utils.notifications.invalidate(),
  });
  const count = unread.data?.unread ?? 0;

  const openNotification = (notification: AppNotification) => {
    if (!notification.readAt) markRead.mutate({ id: notification.id });
    const href = notificationHref(notification.link);
    if (href) {
      setOpen(false);
      router.push(href);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="secondary"
            size="icon-sm"
            className="relative bg-zinc-100"
            aria-label={
              count ? t("bell.unread", { count }) : t("bell.title")
            }
          />
        }
      >
        <BellIcon className="size-4" />
        {count > 0 && (
          <span className="bg-primary text-primary-foreground absolute -top-1.5 -end-1.5 flex min-w-4 items-center justify-center rounded-full px-1 text-[9px] leading-4 font-bold tabular-nums">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">{t("bell.title")}</p>
          {count > 0 && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              {t("bell.markAllRead")}
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {list.isLoading ? (
            <p className="text-muted-foreground p-4 text-sm">{t("bell.loading")}</p>
          ) : !list.data?.items.length ? (
            <p className="text-muted-foreground p-4 text-sm">
              {t("bell.empty")}
            </p>
          ) : (
            list.data.items.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => openNotification(notification)}
                className={cn(
                  "hover:bg-muted flex w-full flex-col gap-0.5 border-b px-3 py-2 text-start last:border-b-0",
                  !notification.readAt && "bg-primary/5",
                )}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  {!notification.readAt && (
                    <span className="bg-primary size-1.5 shrink-0 rounded-full" />
                  )}
                  {notification.title}
                </span>
                {notification.body && (
                  <span className="text-muted-foreground line-clamp-2 text-xs">
                    {notification.body}
                  </span>
                )}
                <span className="text-muted-foreground text-[11px]">
                  {timeAgo(notification.createdAt, t, locale)}
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
