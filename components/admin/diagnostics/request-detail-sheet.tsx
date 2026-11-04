"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { trpc } from "@/server/trpc/client";
import {
  CopyIcon,
  FilterIcon,
  GlobeIcon,
  RouteIcon,
  TerminalIcon,
  UserIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  buildCurl,
  describeUser,
  formatDuration,
  formatTime,
  METHOD_CLASSES,
  prettyJson,
  statusClasses,
} from "./diagnostics-utils";

export type DetailFilter =
  | { kind: "userId"; value: string; label: string }
  | { kind: "ip"; value: string; label: string }
  | { kind: "route"; value: string; method: string; label: string };

type T = ReturnType<typeof useTranslations<"adminSystem">>;

const copy = async (text: string, label: string, t: T) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(t("diagnostics.detail.copied", { label }));
  } catch {
    toast.error(t("diagnostics.detail.copyFailed"));
  }
};

function Field({
  label,
  value,
  mono = false,
  onCopy,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  onCopy?: () => void;
}) {
  const t = useTranslations("adminSystem");
  return (
    <div className="grid grid-cols-[7rem_1fr] items-start gap-2 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("flex min-w-0 items-start gap-1 break-all", mono && "font-mono text-xs")}>
        <span className="min-w-0">{value || "—"}</span>
        {onCopy && value ? (
          <button
            type="button"
            onClick={onCopy}
            className="text-muted-foreground hover:text-foreground shrink-0"
            aria-label={t("diagnostics.detail.copyField", { label })}
          >
            <CopyIcon className="size-3.5" />
          </button>
        ) : null}
      </span>
    </div>
  );
}

function JsonBlock({ value, empty }: { value: unknown; empty: string }) {
  const t = useTranslations("adminSystem");
  const text = prettyJson(value);

  if (!text) {
    return <p className="text-muted-foreground py-6 text-center text-sm">{empty}</p>;
  }

  return (
    <div className="relative">
      <Button
        size="icon-sm"
        variant="ghost"
        className="absolute top-1 end-1"
        onClick={() => void copy(text, t("diagnostics.detail.content"), t)}
        aria-label={t("diagnostics.detail.copy")}
      >
        <CopyIcon />
      </Button>
      <pre className="bg-muted max-h-[50vh] overflow-auto rounded-md p-3 pe-10 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all">
        {text}
      </pre>
    </div>
  );
}

/**
 * Everything stored about one request: payloads, answer, error and stack,
 * plus shortcuts to the related history (same user, IP or route) and a
 * ready-to-run cURL to reproduce it.
 */
export function RequestDetailSheet({
  logId,
  onClose,
  onFilter,
}: {
  logId: string | null;
  onClose: () => void;
  onFilter: (filter: DetailFilter) => void;
}) {
  const t = useTranslations("adminSystem");
  const locale = useLocale();
  const detail = trpc.admin.diagnosticsRequest.useQuery(
    { id: logId ?? "" },
    { enabled: Boolean(logId) },
  );
  const log = detail.data;
  const userLabel = log ? describeUser(log.user) : null;

  return (
    <Sheet open={Boolean(logId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl data-[side=right]:sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2">
            {log ? (
              <>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 font-mono text-xs font-semibold",
                    METHOD_CLASSES[log.method] ?? "bg-muted",
                  )}
                >
                  {log.method}
                </span>
                <Badge variant="outline" className={statusClasses(log.status)}>
                  {log.status}
                </Badge>
                <span className="font-mono text-sm break-all">{log.path}</span>
              </>
            ) : (
              t("diagnostics.detail.title")
            )}
          </SheetTitle>
          <SheetDescription>
            {log ? `${formatTime(log.createdAt, locale)} · ${formatDuration(log.durationMs)}` : " "}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-6">
          {detail.isLoading && (
            <div className="text-muted-foreground flex items-center gap-2 py-10">
              <Spinner /> {t("diagnostics.detail.loading")}
            </div>
          )}
          {detail.error && (
            <p className="text-destructive text-sm">{detail.error.message}</p>
          )}

          {log && (
            <>
              {log.errorMessage && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {log.errorMessage}
                </div>
              )}

              <div className="rounded-md border p-3">
                <Field
                  label={t("diagnostics.detail.requestId")}
                  value={log.reqId}
                  mono
                  onCopy={
                    log.reqId
                      ? () => void copy(log.reqId!, t("diagnostics.detail.requestId"), t)
                      : undefined
                  }
                />
                <Field label={t("diagnostics.detail.route")} value={log.route} mono />
                <Field
                  label={t("diagnostics.detail.user")}
                  value={
                    userLabel
                      ? `${userLabel}${log.userRole ? ` · ${log.userRole}` : ""}`
                      : log.userId
                        ? t("diagnostics.detail.deletedUser", { id: log.userId })
                        : t("diagnostics.anonymous")
                  }
                />
                <Field label={t("diagnostics.detail.ip")} value={log.ip} mono />
                <Field label={t("diagnostics.detail.userAgent")} value={log.userAgent} />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void copy(buildCurl(log), "cURL", t)}
                >
                  <TerminalIcon /> {t("diagnostics.detail.copyCurl")}
                </Button>
                {log.userId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onFilter({
                        kind: "userId",
                        value: log.userId!,
                        label: userLabel ?? log.userId!,
                      })
                    }
                  >
                    <UserIcon /> {t("diagnostics.detail.userRequests")}
                  </Button>
                )}
                {log.ip && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onFilter({ kind: "ip", value: log.ip!, label: log.ip! })
                    }
                  >
                    <GlobeIcon /> {t("diagnostics.detail.sameIp")}
                  </Button>
                )}
                {log.route && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onFilter({
                        kind: "route",
                        value: log.route!,
                        method: log.method,
                        label: `${log.method} ${log.route}`,
                      })
                    }
                  >
                    <RouteIcon /> {t("diagnostics.detail.sameRoute")}
                  </Button>
                )}
              </div>

              <Tabs defaultValue={log.errorStack ? "error" : "request"}>
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="request">{t("diagnostics.detail.tabs.request")}</TabsTrigger>
                  <TabsTrigger value="response">{t("diagnostics.detail.tabs.response")}</TabsTrigger>
                  <TabsTrigger value="headers">{t("diagnostics.detail.tabs.headers")}</TabsTrigger>
                  <TabsTrigger value="error">{t("diagnostics.detail.tabs.error")}</TabsTrigger>
                </TabsList>

                <TabsContent value="request" className="flex flex-col gap-3 pt-2">
                  {log.query && Object.keys(log.query).length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-1 flex items-center gap-1 text-xs font-medium">
                        <FilterIcon className="size-3" /> {t("diagnostics.detail.queryParams")}
                      </p>
                      <JsonBlock value={log.query} empty="" />
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs font-medium">
                      {t("diagnostics.detail.body")}
                    </p>
                    <JsonBlock value={log.requestBody} empty={t("diagnostics.detail.noBody")} />
                  </div>
                </TabsContent>

                <TabsContent value="response" className="pt-2">
                  <JsonBlock
                    value={log.responseBody}
                    empty={
                      log.status < 400
                        ? t("diagnostics.detail.successNotStored")
                        : t("diagnostics.detail.noResponse")
                    }
                  />
                </TabsContent>

                <TabsContent value="headers" className="pt-2">
                  <JsonBlock value={log.requestHeaders} empty={t("diagnostics.detail.noHeaders")} />
                </TabsContent>

                <TabsContent value="error" className="pt-2">
                  <JsonBlock
                    value={log.errorStack}
                    empty={
                      log.errorMessage
                        ? t("diagnostics.detail.noStack")
                        : t("diagnostics.detail.noError")
                    }
                  />
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
