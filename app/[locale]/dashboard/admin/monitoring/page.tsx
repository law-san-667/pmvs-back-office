"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/contexts/user-context";
import { intlLocale } from "@/i18n/config";
import {
  type MonitoredJob,
  type MonitoringAlert,
  type MonitoringSettings,
  type SystemStatus,
} from "@/lib/monitoring";
import { cn } from "@/lib/utils";
import { trpc } from "@/server/trpc/client";
import {
  CheckCircle2Icon,
  DatabaseIcon,
  MessageCircleIcon,
  RefreshCwIcon,
  SendIcon,
  ServerIcon,
  ShieldAlertIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const REFRESH_MS = 60_000;
const PAGE_SIZE = 10;

type T = ReturnType<typeof useTranslations<"adminSystem">>;

const formatTime = (value: string | null, locale: string) =>
  value
    ? new Intl.DateTimeFormat(intlLocale(locale), {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";

const formatDuration = (ms: number | null) =>
  ms === null ? "—" : ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;

const formatBytes = (bytes: number, t: T) => {
  if (bytes < 1024 * 1024)
    return t("monitoring.units.kb", { value: String(Math.round(bytes / 1024)) });
  if (bytes < 1024 ** 3)
    return t("monitoring.units.mb", { value: (bytes / 1024 / 1024).toFixed(1) });
  return t("monitoring.units.gb", { value: (bytes / 1024 ** 3).toFixed(2) });
};

const formatEvery = (minutes: number | null, t: T) => {
  if (!minutes) return "—";
  if (minutes < 60) return t("monitoring.units.everyMinutes", { count: minutes });
  if (minutes === 24 * 60) return t("monitoring.units.daily");
  return t("monitoring.units.everyHours", { count: Math.round(minutes / 60) });
};

const formatUptime = (seconds: number, t: T) => {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days) return t("monitoring.units.uptimeDays", { days, hours });
  if (hours) return t("monitoring.units.uptimeHours", { hours, minutes });
  return t("monitoring.units.uptimeMinutes", { minutes });
};

export default function AdminMonitoringPage() {
  const { user } = useUser();
  const t = useTranslations("adminSystem");
  const locale = useLocale();
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [alertsPage, setAlertsPage] = useState(1);
  const [runsPage, setRunsPage] = useState(1);
  const utils = trpc.useUtils();

  const status = trpc.monitoring.status.useQuery(undefined, {
    refetchInterval: REFRESH_MS,
  });
  const alerts = trpc.monitoring.alerts.useQuery(
    { page: alertsPage, limit: PAGE_SIZE },
    { placeholderData: (previous) => previous },
  );
  const runs = trpc.monitoring.jobRuns.useQuery(
    { name: selectedJob ?? undefined, page: runsPage, limit: PAGE_SIZE },
    { placeholderData: (previous) => previous },
  );
  const runCheck = trpc.monitoring.runCheck.useMutation();

  const refresh = () =>
    Promise.all([
      utils.monitoring.status.invalidate(),
      utils.monitoring.alerts.invalidate(),
      utils.monitoring.jobRuns.invalidate(),
    ]);

  const checkNow = async () => {
    try {
      const result = await runCheck.mutateAsync();
      toast.success(
        result.findings
          ? t("monitoring.checkResult", { findings: result.findings, opened: result.opened })
          : t("monitoring.noProblem"),
      );
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("monitoring.checkFailed"));
    }
  };

  if (user && user.role !== "ADMIN") {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-destructive text-sm">
          {t("monitoring.adminOnly")}
        </p>
      </div>
    );
  }

  const data = status.data;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <AdminPageHeader
          title={t("monitoring.title")}
          description={t("monitoring.description")}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={refresh}>
            <RefreshCwIcon className={cn(status.isFetching && "animate-spin")} />
            {t("refresh")}
          </Button>
          <Button size="sm" onClick={checkNow} disabled={runCheck.isPending}>
            <ShieldAlertIcon />
            {t("monitoring.checkNow")}
          </Button>
        </div>
      </div>

      {status.error && (
        <p className="text-destructive text-sm">{status.error.message}</p>
      )}

      {data && <OpenAlerts alerts={data.openAlerts} />}
      {data && <StatusCards status={data} />}

      <JobsCard
        jobs={data?.jobs ?? []}
        selected={selectedJob}
        onSelect={(name) => {
          setSelectedJob((current) => (current === name ? null : name));
          setRunsPage(1);
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedJob
              ? t("monitoring.runs.titleForJob", {
                  job: (() => {
                    const job = data?.jobs.find((item) => item.name === selectedJob);
                    return job ? jobLabel(job, t) : selectedJob;
                  })(),
                })
              : t("monitoring.runs.title")}
          </CardTitle>
          <CardDescription>
            {t("monitoring.runs.hint")}
          </CardDescription>
          {selectedJob && (
            <CardAction>
              <Button size="sm" variant="ghost" onClick={() => setSelectedJob(null)}>
                {t("monitoring.runs.allJobs")}
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("monitoring.columns.job")}</TableHead>
                <TableHead>{t("monitoring.columns.start")}</TableHead>
                <TableHead>{t("monitoring.columns.duration")}</TableHead>
                <TableHead>{t("monitoring.columns.state")}</TableHead>
                <TableHead>{t("monitoring.columns.result")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.data?.items.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium">
                    {(() => {
                      const job = data?.jobs.find((item) => item.name === run.name);
                      return job ? jobLabel(job, t) : run.name;
                    })()}
                  </TableCell>
                  <TableCell>{formatTime(run.startedAt, locale)}</TableCell>
                  <TableCell>{formatDuration(run.durationMs)}</TableCell>
                  <TableCell>
                    <RunBadge status={run.status} />
                  </TableCell>
                  <TableCell className="max-w-md text-xs whitespace-normal break-words">
                    {run.error ? (
                      <span className="text-destructive">{run.error}</span>
                    ) : run.result === null || run.result === undefined ? (
                      "—"
                    ) : (
                      <code>{JSON.stringify(run.result)}</code>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {runs.data && !runs.data.items.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-center">
                    {t("monitoring.runs.empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {(runs.data?.totalPages ?? 0) > 1 && (
            <AdminPagination
              page={runsPage}
              totalPages={runs.data?.totalPages ?? 1}
              onPageChange={setRunsPage}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("monitoring.alerts.title", { count: alerts.data?.total ?? 0 })}</CardTitle>
          <CardDescription>
            {t("monitoring.alerts.hint")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("monitoring.columns.alert")}</TableHead>
                <TableHead>{t("monitoring.columns.severity")}</TableHead>
                <TableHead>{t("monitoring.columns.start")}</TableHead>
                <TableHead>{t("monitoring.columns.end")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.data?.items.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="max-w-lg whitespace-normal">
                    <p className="font-medium">{alert.title}</p>
                    {alert.details && (
                      <p className="text-muted-foreground text-xs break-words">
                        {alert.details}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <SeverityBadge severity={alert.severity} />
                  </TableCell>
                  <TableCell>{formatTime(alert.firstSeenAt, locale)}</TableCell>
                  <TableCell>
                    {alert.status === "OPEN" ? (
                      <Badge variant="destructive">{t("monitoring.alerts.ongoing")}</Badge>
                    ) : (
                      formatTime(alert.resolvedAt, locale)
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {alerts.data && !alerts.data.items.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground text-center">
                    {t("monitoring.alerts.empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {(alerts.data?.totalPages ?? 0) > 1 && (
            <AdminPagination
              page={alertsPage}
              totalPages={alerts.data?.totalPages ?? 1}
              onPageChange={setAlertsPage}
            />
          )}
        </CardContent>
      </Card>

      <SettingsCard />
    </div>
  );
}

function OpenAlerts({ alerts }: { alerts: MonitoringAlert[] }) {
  const t = useTranslations("adminSystem");
  const locale = useLocale();
  if (!alerts.length) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-green-600/30 bg-green-600/5 p-4 text-sm">
        <CheckCircle2Icon className="size-5 text-green-600" />
        {t("monitoring.alerts.none")}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={cn(
            "flex items-start gap-3 rounded-lg border p-4 text-sm",
            alert.severity === "CRITICAL"
              ? "border-destructive/40 bg-destructive/5"
              : "border-amber-500/40 bg-amber-500/5",
          )}
        >
          <TriangleAlertIcon
            className={cn(
              "mt-0.5 size-5 shrink-0",
              alert.severity === "CRITICAL" ? "text-destructive" : "text-amber-600",
            )}
          />
          <div className="min-w-0">
            <p className="font-medium">{alert.title}</p>
            {alert.details && (
              <p className="text-muted-foreground break-words">{alert.details}</p>
            )}
            <p className="text-muted-foreground mt-1 text-xs">
              {t("monitoring.alerts.since", {
                first: formatTime(alert.firstSeenAt, locale),
                last: formatTime(alert.lastSeenAt, locale),
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusCard({
  icon,
  title,
  ok,
  value,
  lines,
}: {
  icon: React.ReactNode;
  title: string;
  ok: boolean | null;
  value: string;
  lines: string[];
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          {icon}
          {title}
        </CardDescription>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span
            className={cn(
              "size-2.5 shrink-0 rounded-full",
              ok === null ? "bg-muted-foreground" : ok ? "bg-green-600" : "bg-destructive",
            )}
          />
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground flex flex-col gap-0.5 text-xs">
        {lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </CardContent>
    </Card>
  );
}

function StatusCards({ status }: { status: SystemStatus }) {
  const t = useTranslations("adminSystem");
  const locale = useLocale();
  const { whatsapp, sms, email } = status.services;
  const messages = (channel: string) => {
    const rows = status.messages24h.filter((row) => row.channel === channel);
    const sent = rows.filter((row) => row.status !== "FAILED").reduce((sum, row) => sum + row.count, 0);
    const failed = rows.filter((row) => row.status === "FAILED").reduce((sum, row) => sum + row.count, 0);
    return t("monitoring.status.messages24h", { sent, failed });
  };
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatusCard
        icon={<ServerIcon className="size-4" />}
        title={t("monitoring.status.api")}
        ok={status.requests15m.serverErrors === 0}
        value={
          status.requests15m.serverErrors
            ? t("monitoring.status.serverErrors", { count: status.requests15m.serverErrors })
            : t("monitoring.status.online")
        }
        lines={[
          t("monitoring.status.uptime", { duration: formatUptime(status.uptimeSeconds, t) }),
          t("monitoring.status.requests15m", {
            count: status.requests15m.recorded,
            p95: status.requests15m.p95Ms,
          }),
        ]}
      />
      <StatusCard
        icon={<DatabaseIcon className="size-4" />}
        title={t("monitoring.status.database")}
        ok
        value={formatBytes(status.database.sizeBytes, t)}
        lines={[
          t("monitoring.status.dbLatency", { ms: status.database.latencyMs }),
          t("monitoring.status.dbConnections", { count: status.database.connections }),
          t("monitoring.status.largestTable", {
            name: status.database.largestTables[0]?.name ?? "—",
          }),
        ]}
      />
      <StatusCard
        icon={<MessageCircleIcon className="size-4" />}
        title={t("monitoring.status.whatsapp")}
        ok={whatsapp.configured ? whatsapp.state === "open" : null}
        value={
          !whatsapp.configured
            ? t("monitoring.status.notConfigured")
            : whatsapp.state === "open"
              ? t("monitoring.status.connected")
              : whatsapp.state
                ? t("monitoring.status.disconnected", { state: whatsapp.state })
                : t("monitoring.status.unreachable")
        }
        lines={[messages("WHATSAPP")]}
      />
      <StatusCard
        icon={<SendIcon className="size-4" />}
        title={t("monitoring.status.smsEmail")}
        ok={sms.configured && email.configured}
        value={
          sms.configured && email.configured
            ? t("monitoring.status.allConfigured")
            : !sms.configured && !email.configured
              ? t("monitoring.status.noneConfigured")
              : sms.configured
                ? t("monitoring.status.emailNotConfigured")
                : t("monitoring.status.smsNotConfigured")
        }
        lines={[
          t("monitoring.status.smsLine", { summary: messages("SMS") }),
          t("monitoring.status.updatedAt", { date: formatTime(status.checkedAt, locale) }),
        ]}
      />
    </div>
  );
}

function JobState({ job }: { job: MonitoredJob }) {
  const t = useTranslations("adminSystem");
  if (job.lastStatus === "FAILED")
    return <Badge variant="destructive">{t("monitoring.jobState.failed")}</Badge>;
  if (job.late)
    return (
      <Badge className="bg-amber-500/15 text-amber-700">{t("monitoring.jobState.late")}</Badge>
    );
  if (job.lastStatus === "RUNNING")
    return <Badge variant="secondary">{t("monitoring.jobState.running")}</Badge>;
  if (!job.lastStatus) return <Badge variant="outline">{t("monitoring.jobState.never")}</Badge>;
  return <Badge className="bg-green-600/15 text-green-700">{t("monitoring.jobState.ok")}</Badge>;
}

function RunBadge({ status }: { status: string }) {
  const t = useTranslations("adminSystem");
  if (status === "FAILED")
    return <Badge variant="destructive">{t("monitoring.runStatus.failed")}</Badge>;
  if (status === "RUNNING")
    return <Badge variant="secondary">{t("monitoring.runStatus.running")}</Badge>;
  return (
    <Badge className="bg-green-600/15 text-green-700">{t("monitoring.runStatus.succeeded")}</Badge>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const t = useTranslations("adminSystem");
  return severity === "CRITICAL" ? (
    <Badge variant="destructive">{t("monitoring.severity.CRITICAL")}</Badge>
  ) : (
    <Badge className="bg-amber-500/15 text-amber-700">{t("monitoring.severity.WARNING")}</Badge>
  );
}

function JobsCard({
  jobs,
  selected,
  onSelect,
}: {
  jobs: MonitoredJob[];
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  const t = useTranslations("adminSystem");
  const locale = useLocale();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("monitoring.jobs.title")}</CardTitle>
        <CardDescription>{t("monitoring.jobs.hint")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("monitoring.columns.job")}</TableHead>
              <TableHead>{t("monitoring.columns.frequency")}</TableHead>
              <TableHead>{t("monitoring.columns.lastRun")}</TableHead>
              <TableHead>{t("monitoring.columns.lastSuccess")}</TableHead>
              <TableHead>{t("monitoring.columns.failures24h")}</TableHead>
              <TableHead>{t("monitoring.columns.state")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow
                key={job.name}
                onClick={() => onSelect(job.name)}
                className={cn("cursor-pointer", selected === job.name && "bg-muted")}
              >
                <TableCell className="whitespace-normal">
                  <p className="font-medium">{jobLabel(job, t)}</p>
                  {job.lastStatus === "FAILED" && job.lastError && (
                    <p className="text-destructive text-xs break-words">{job.lastError}</p>
                  )}
                </TableCell>
                <TableCell>{formatEvery(job.everyMinutes, t)}</TableCell>
                <TableCell>{formatTime(job.lastStartedAt, locale)}</TableCell>
                <TableCell>{formatTime(job.lastSuccessAt, locale)}</TableCell>
                <TableCell className={cn(job.failures24h > 0 && "text-destructive font-medium")}>
                  {job.failures24h}
                </TableCell>
                <TableCell>
                  <JobState job={job} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

const splitList = (value: string) =>
  value
    .split(/[\n,;]/)
    .map((item) => item.trim())
    .filter(Boolean);

function SettingsCard() {
  const t = useTranslations("adminSystem");
  const settings = trpc.monitoring.settings.useQuery();
  const save = trpc.monitoring.updateSettings.useMutation();
  const test = trpc.monitoring.testAlert.useMutation();
  const utils = trpc.useUtils();
  const [form, setForm] = useState<(Omit<MonitoringSettings, "emails" | "phones"> & {
    emails: string;
    phones: string;
  }) | null>(null);

  useEffect(() => {
    if (settings.data && !form) {
      setForm({
        ...settings.data,
        emails: settings.data.emails.join("\n"),
        phones: settings.data.phones.join("\n"),
      });
    }
  }, [settings.data, form]);

  if (!form) return null;

  const number = (key: "serverErrorsPer15Min" | "slowP95Ms" | "databaseSizeMb" | "repeatHours") => ({
    type: "number" as const,
    value: form[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [key]: Number(event.target.value) }),
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const saved = await save.mutateAsync({
        ...form,
        emails: splitList(form.emails),
        phones: splitList(form.phones),
      });
      setForm({ ...saved, emails: saved.emails.join("\n"), phones: saved.phones.join("\n") });
      await utils.monitoring.settings.invalidate();
      toast.success(t("monitoring.settings.saved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("monitoring.settings.saveFailed"));
    }
  };

  const sendTest = async () => {
    try {
      const result = await test.mutateAsync();
      toast.success(
        result.failed
          ? t("monitoring.settings.testResultWithFailures", {
              sent: result.sent,
              failed: result.failed,
            })
          : t("monitoring.settings.testResult", { sent: result.sent }),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("monitoring.settings.sendFailed"));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("monitoring.settings.title")}</CardTitle>
        <CardDescription>
          {t.rich("monitoring.settings.description", {
            code: (chunks) => <code>{chunks}</code>,
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="monitoring-emails">{t("monitoring.settings.emails")}</Label>
            <Textarea
              id="monitoring-emails"
              rows={3}
              value={form.emails}
              onChange={(event) => setForm({ ...form, emails: event.target.value })}
              placeholder="tech@diarama.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="monitoring-phones">{t("monitoring.settings.phones")}</Label>
            <Textarea
              id="monitoring-phones"
              rows={3}
              value={form.phones}
              onChange={(event) => setForm({ ...form, phones: event.target.value })}
              placeholder="+221 77 000 00 00"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="monitoring-errors">{t("monitoring.settings.serverErrors")}</Label>
            <Input id="monitoring-errors" min={1} {...number("serverErrorsPer15Min")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="monitoring-slow">{t("monitoring.settings.slow")}</Label>
            <Input id="monitoring-slow" min={200} step={100} {...number("slowP95Ms")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="monitoring-db">{t("monitoring.settings.databaseSize")}</Label>
            <Input id="monitoring-db" min={100} step={100} {...number("databaseSizeMb")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="monitoring-repeat">{t("monitoring.settings.repeat")}</Label>
            <Input id="monitoring-repeat" min={1} max={168} {...number("repeatHours")} />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.checkWhatsapp}
              onChange={(event) => setForm({ ...form, checkWhatsapp: event.target.checked })}
              className="size-4"
            />
            {t("monitoring.settings.checkWhatsapp")}
          </label>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button type="submit" disabled={save.isPending}>
              {t("monitoring.settings.save")}
            </Button>
            <Button type="button" variant="outline" onClick={sendTest} disabled={test.isPending}>
              <SendIcon />
              {t("monitoring.settings.sendTest")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/** The job's name in the admin's language; the API's French label for an unknown job. */
function jobLabel(
  job: { name: string; label: string },
  t: ReturnType<typeof useTranslations<"adminSystem">>,
) {
  const key = `monitoring.jobNames.${job.name}` as Parameters<typeof t>[0];
  return t.has(key) ? t(key) : job.label;
}
