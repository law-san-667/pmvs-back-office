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
import {
  type MonitoredJob,
  type MonitoringAlert,
  type MonitoringSettings,
  type SystemStatus,
  formatBytes,
  formatEvery,
  formatUptime,
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
import { useEffect, useState } from "react";
import { toast } from "sonner";

const REFRESH_MS = 60_000;
const PAGE_SIZE = 10;

const formatTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";

const formatDuration = (ms: number | null) =>
  ms === null ? "—" : ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;

export default function AdminMonitoringPage() {
  const { user } = useUser();
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
          ? `${result.findings} problème(s) détecté(s), ${result.opened} nouvelle(s) alerte(s).`
          : "Aucun problème détecté.",
      );
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Vérification impossible.");
    }
  };

  if (user && user.role !== "ADMIN") {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-destructive text-sm">
          La supervision est réservée aux administrateurs.
        </p>
      </div>
    );
  }

  const data = status.data;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <AdminPageHeader
          title="Supervision"
          description="État de la plateforme, des tâches planifiées et des services externes. Les alertes partent par e-mail, WhatsApp ou SMS et dans l'application."
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={refresh}>
            <RefreshCwIcon className={cn(status.isFetching && "animate-spin")} />
            Actualiser
          </Button>
          <Button size="sm" onClick={checkNow} disabled={runCheck.isPending}>
            <ShieldAlertIcon />
            Vérifier maintenant
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
            Exécutions récentes
            {selectedJob
              ? ` : ${data?.jobs.find((job) => job.name === selectedJob)?.label ?? selectedJob}`
              : ""}
          </CardTitle>
          <CardDescription>
            Cliquez sur une tâche ci-dessus pour ne voir que ses exécutions.
          </CardDescription>
          {selectedJob && (
            <CardAction>
              <Button size="sm" variant="ghost" onClick={() => setSelectedJob(null)}>
                Toutes les tâches
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tâche</TableHead>
                <TableHead>Début</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>État</TableHead>
                <TableHead>Résultat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.data?.items.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium">
                    {data?.jobs.find((job) => job.name === run.name)?.label ?? run.name}
                  </TableCell>
                  <TableCell>{formatTime(run.startedAt)}</TableCell>
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
                    Aucune exécution enregistrée.
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
          <CardTitle>Historique des alertes ({alerts.data?.total ?? 0})</CardTitle>
          <CardDescription>
            Une alerte se ferme d&apos;elle-même quand le problème n&apos;est plus
            détecté ; les destinataires en sont prévenus.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alerte</TableHead>
                <TableHead>Gravité</TableHead>
                <TableHead>Début</TableHead>
                <TableHead>Fin</TableHead>
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
                  <TableCell>{formatTime(alert.firstSeenAt)}</TableCell>
                  <TableCell>
                    {alert.status === "OPEN" ? (
                      <Badge variant="destructive">En cours</Badge>
                    ) : (
                      formatTime(alert.resolvedAt)
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {alerts.data && !alerts.data.items.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground text-center">
                    Aucune alerte pour l&apos;instant.
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
  if (!alerts.length) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-green-600/30 bg-green-600/5 p-4 text-sm">
        <CheckCircle2Icon className="size-5 text-green-600" />
        Aucun problème détecté lors de la dernière vérification.
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
              Depuis le {formatTime(alert.firstSeenAt)} · vu le{" "}
              {formatTime(alert.lastSeenAt)}
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
  const { whatsapp, sms, email } = status.services;
  const messages = (channel: string) => {
    const rows = status.messages24h.filter((row) => row.channel === channel);
    const sent = rows.filter((row) => row.status !== "FAILED").reduce((sum, row) => sum + row.count, 0);
    const failed = rows.filter((row) => row.status === "FAILED").reduce((sum, row) => sum + row.count, 0);
    return `24 h : ${sent} envoyé(s), ${failed} en échec`;
  };
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatusCard
        icon={<ServerIcon className="size-4" />}
        title="API"
        ok={status.requests15m.serverErrors === 0}
        value={
          status.requests15m.serverErrors
            ? `${status.requests15m.serverErrors} erreur(s) serveur`
            : "En ligne"
        }
        lines={[
          `Démarrée depuis ${formatUptime(status.uptimeSeconds)}`,
          `15 min : ${status.requests15m.recorded} requête(s) enregistrée(s), 95 % sous ${status.requests15m.p95Ms} ms`,
        ]}
      />
      <StatusCard
        icon={<DatabaseIcon className="size-4" />}
        title="Base de données"
        ok
        value={formatBytes(status.database.sizeBytes)}
        lines={[
          `Réponse en ${status.database.latencyMs} ms`,
          `${status.database.connections} connexion(s) ouverte(s)`,
          `Plus grosse table : ${status.database.largestTables[0]?.name ?? "—"}`,
        ]}
      />
      <StatusCard
        icon={<MessageCircleIcon className="size-4" />}
        title="WhatsApp (Evolution)"
        ok={whatsapp.configured ? whatsapp.state === "open" : null}
        value={
          !whatsapp.configured
            ? "Non configuré"
            : whatsapp.state === "open"
              ? "Connecté"
              : whatsapp.state
                ? `Déconnecté (${whatsapp.state})`
                : "Injoignable"
        }
        lines={[messages("WHATSAPP")]}
      />
      <StatusCard
        icon={<SendIcon className="size-4" />}
        title="SMS et e-mail"
        ok={sms.configured && email.configured}
        value={
          sms.configured && email.configured
            ? "Configurés"
            : !sms.configured && !email.configured
              ? "Non configurés"
              : sms.configured
                ? "E-mail non configuré"
                : "SMS non configuré"
        }
        lines={[`SMS — ${messages("SMS")}`, `Mis à jour le ${formatTime(status.checkedAt)}`]}
      />
    </div>
  );
}

function JobState({ job }: { job: MonitoredJob }) {
  if (job.lastStatus === "FAILED") return <Badge variant="destructive">En échec</Badge>;
  if (job.late) return <Badge className="bg-amber-500/15 text-amber-700">En retard</Badge>;
  if (job.lastStatus === "RUNNING") return <Badge variant="secondary">En cours</Badge>;
  if (!job.lastStatus) return <Badge variant="outline">Jamais exécutée</Badge>;
  return <Badge className="bg-green-600/15 text-green-700">OK</Badge>;
}

function RunBadge({ status }: { status: string }) {
  if (status === "FAILED") return <Badge variant="destructive">Échec</Badge>;
  if (status === "RUNNING") return <Badge variant="secondary">En cours</Badge>;
  return <Badge className="bg-green-600/15 text-green-700">Réussie</Badge>;
}

function SeverityBadge({ severity }: { severity: string }) {
  return severity === "CRITICAL" ? (
    <Badge variant="destructive">Critique</Badge>
  ) : (
    <Badge className="bg-amber-500/15 text-amber-700">Avertissement</Badge>
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tâches planifiées</CardTitle>
        <CardDescription>
          Une tâche est en retard après trois exécutions manquées. Après un
          redémarrage de l&apos;API, les tâches quotidiennes apparaissent
          « jamais exécutées » jusqu&apos;à leur prochain passage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tâche</TableHead>
              <TableHead>Fréquence</TableHead>
              <TableHead>Dernière exécution</TableHead>
              <TableHead>Dernière réussite</TableHead>
              <TableHead>Échecs (24 h)</TableHead>
              <TableHead>État</TableHead>
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
                  <p className="font-medium">{job.label}</p>
                  {job.lastStatus === "FAILED" && job.lastError && (
                    <p className="text-destructive text-xs break-words">{job.lastError}</p>
                  )}
                </TableCell>
                <TableCell>{formatEvery(job.everyMinutes)}</TableCell>
                <TableCell>{formatTime(job.lastStartedAt)}</TableCell>
                <TableCell>{formatTime(job.lastSuccessAt)}</TableCell>
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
      toast.success("Réglages enregistrés.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Enregistrement impossible.");
    }
  };

  const sendTest = async () => {
    try {
      const result = await test.mutateAsync();
      toast.success(
        `Message de test : ${result.sent} canal(aux) OK${result.failed ? `, ${result.failed} en échec` : ""}.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi impossible.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Destinataires et seuils</CardTitle>
        <CardDescription>
          Les administrateurs reçoivent aussi chaque alerte dans l&apos;application.
          Une alerte toujours en cours est renvoyée après le délai choisi. Pour
          être prévenu si l&apos;API entière tombe, branchez une sonde externe
          (UptimeRobot ou Better Stack, gratuits) sur l&apos;adresse{" "}
          <code>/v1/health</code>{" "}
          de l&apos;API.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="monitoring-emails">E-mails (un par ligne)</Label>
            <Textarea
              id="monitoring-emails"
              rows={3}
              value={form.emails}
              onChange={(event) => setForm({ ...form, emails: event.target.value })}
              placeholder="tech@diarama.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="monitoring-phones">Téléphones WhatsApp / SMS (un par ligne)</Label>
            <Textarea
              id="monitoring-phones"
              rows={3}
              value={form.phones}
              onChange={(event) => setForm({ ...form, phones: event.target.value })}
              placeholder="+221 77 000 00 00"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="monitoring-errors">Erreurs serveur en 15 min</Label>
            <Input id="monitoring-errors" min={1} {...number("serverErrorsPer15Min")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="monitoring-slow">Lenteur : 95 % des requêtes au-delà de (ms)</Label>
            <Input id="monitoring-slow" min={200} step={100} {...number("slowP95Ms")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="monitoring-db">Taille de la base au-delà de (Mo)</Label>
            <Input id="monitoring-db" min={100} step={100} {...number("databaseSizeMb")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="monitoring-repeat">Renvoyer une alerte en cours toutes les (h)</Label>
            <Input id="monitoring-repeat" min={1} max={168} {...number("repeatHours")} />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.checkWhatsapp}
              onChange={(event) => setForm({ ...form, checkWhatsapp: event.target.checked })}
              className="size-4"
            />
            Alerter quand WhatsApp est déconnecté
          </label>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button type="submit" disabled={save.isPending}>
              Enregistrer
            </Button>
            <Button type="button" variant="outline" onClick={sendTest} disabled={test.isPending}>
              <SendIcon />
              Envoyer un message de test
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
