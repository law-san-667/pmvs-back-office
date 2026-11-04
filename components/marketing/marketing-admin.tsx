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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { intlLocale } from "@/i18n/config";
import {
  AUDIENCES,
  type Audience,
  type Campaign,
  type CampaignInput,
  LANGUAGES,
  type Language,
  type Subscriber,
  type SubscriberStatus,
} from "@/lib/marketing";
import { trpc } from "@/server/trpc/client";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { toast } from "sonner";

const SELECT_CLASS = "border-input bg-background h-9 w-full rounded-md border px-2 text-sm";
const fail = { onError: (error: { message: string }) => toast.error(error.message) };
const formatDate = (value: string | null, locale: string) =>
  value
    ? new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "—";
const CONSENT_SOURCES = ["WEB", "MOBILE", "ACCOUNT", "EMAIL_LINK", "ONE_CLICK", "ADMIN"] as const;
const isConsentSource = (source: string): source is (typeof CONSENT_SOURCES)[number] =>
  (CONSENT_SOURCES as readonly string[]).includes(source);

const EMPTY: CampaignInput = {
  subject: "",
  preheader: null,
  body: "",
  ctaLabel: null,
  ctaUrl: null,
  segment: { audience: "ALL", countryCodes: [], languages: [] },
};

const statusVariant = (status: Campaign["status"]) =>
  status === "SENT" ? "default" : status === "SENDING" ? "secondary" : status === "CANCELLED" ? "destructive" : "outline";

const useAudienceSummary = () => {
  const t = useTranslations("adminSystem");
  return (segment: Campaign["segment"]) =>
    [
      t(`marketing.audience.${segment.audience}`),
      segment.countryCodes.length ? segment.countryCodes.join(", ") : null,
      segment.languages.length ? segment.languages.map((l) => t(`marketing.language.${l}`)).join(", ") : null,
    ]
      .filter(Boolean)
      .join(" · ");
};

// ─── Campaign form ──────────────────────────────────────────────────────────

function CampaignForm({
  campaign,
  onDone,
}: {
  campaign: Campaign | null;
  onDone: (id: string | null) => void;
}) {
  const t = useTranslations("adminSystem");
  const locale = useLocale();
  const audienceSummary = useAudienceSummary();
  const id = useId();
  const utils = trpc.useUtils();
  const [form, setForm] = useState<CampaignInput>(
    campaign
      ? {
          subject: campaign.subject,
          preheader: campaign.preheader,
          body: campaign.body,
          ctaLabel: campaign.ctaLabel,
          ctaUrl: campaign.ctaUrl,
          segment: campaign.segment,
        }
      : EMPTY,
  );
  const [countries, setCountries] = useState(form.segment.countryCodes.join(", "));
  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const editable = !campaign || campaign.status === "DRAFT";

  const countryCodes = countries
    .split(/[\s,;]+/)
    .map((code) => code.trim().toUpperCase())
    .filter((code) => /^[A-Z]{2}$/.test(code));
  const segment = { ...form.segment, countryCodes: [...new Set(countryCodes)] };
  const count = trpc.marketing.segmentCount.useQuery(segment, { enabled: editable });
  const set = <K extends keyof CampaignInput>(key: K, value: CampaignInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const blankToNull = (value: string | null) => (value?.trim() ? value.trim() : null);
  const payload = (): CampaignInput => ({
    ...form,
    preheader: blankToNull(form.preheader),
    ctaLabel: blankToNull(form.ctaLabel),
    ctaUrl: blankToNull(form.ctaUrl),
    segment,
  });

  const refresh = () => utils.marketing.campaigns.invalidate();
  const create = trpc.marketing.createCampaign.useMutation({
    ...fail,
    onSuccess: async (saved) => {
      await refresh();
      toast.success(t("marketing.toast.draftSaved"));
      onDone(saved.id);
    },
  });
  const update = trpc.marketing.updateCampaign.useMutation({
    ...fail,
    onSuccess: async () => {
      await refresh();
      toast.success(t("marketing.toast.draftSaved"));
    },
  });
  const test = trpc.marketing.testCampaign.useMutation({
    ...fail,
    onSuccess: (result) => toast.success(t("marketing.toast.testSent", { to: result.to })),
  });
  const send = trpc.marketing.sendCampaign.useMutation({
    ...fail,
    onSuccess: async () => {
      await refresh();
      toast.success(t("marketing.toast.sendStarted"));
    },
  });
  const cancel = trpc.marketing.cancelCampaign.useMutation({
    ...fail,
    onSuccess: async () => {
      await refresh();
      toast.success(t("marketing.toast.sendStopped"));
    },
  });
  const remove = trpc.marketing.deleteCampaign.useMutation({
    ...fail,
    onSuccess: async () => {
      await refresh();
      toast.success(t("marketing.toast.draftDeleted"));
      onDone(null);
    },
  });

  const save = async () => {
    if (campaign) await update.mutateAsync({ id: campaign.id, ...payload() });
    else await create.mutateAsync(payload());
  };
  const saving = create.isPending || update.isPending;
  /** Test and send always use the saved version. */
  const saveThen = async (action: () => void) => {
    try {
      await save();
      action();
    } catch {
      // Shown by the mutation's toast.
    }
  };

  const toggleLanguage = (language: Language, checked: boolean) =>
    set("segment", {
      ...form.segment,
      languages: checked
        ? [...form.segment.languages, language]
        : form.segment.languages.filter((item) => item !== language),
    });

  const r = campaign?.recipients;
  const done = r ? r.sent + r.failed + r.skipped : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{campaign ? campaign.subject : t("marketing.newCampaign")}</CardTitle>
        <CardDescription>
          {campaign
            ? t("marketing.form.createdBy", {
                status: t(`marketing.campaignStatus.${campaign.status}`),
                name: campaign.createdByName ?? "—",
                date: formatDate(campaign.createdAt, locale),
              })
            : t("marketing.form.intro")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {campaign && campaign.status !== "DRAFT" && r && (
          <div className="flex flex-col gap-2 rounded-lg border p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <span className="font-medium">
                {t("marketing.progress.sentOf", { sent: r.sent, total: r.total })}
              </span>
              <span className="text-muted-foreground text-xs">
                {r.failed > 0 && t("marketing.progress.failed", { count: r.failed })}
                {r.skipped > 0 && t("marketing.progress.skipped", { count: r.skipped })}
                {t("marketing.progress.startedBy", {
                  name: campaign.sentByName ?? "—",
                  date: formatDate(campaign.sendStartedAt, locale),
                })}
                {campaign.sendFinishedAt &&
                  t("marketing.progress.finished", { date: formatDate(campaign.sendFinishedAt, locale) })}
              </span>
            </div>
            <Progress value={r.total ? (done / r.total) * 100 : 0} aria-label={t("marketing.progress.label")} />
            {campaign.status === "SENDING" && (
              <div>
                <Button variant="outline" size="sm" disabled={cancel.isPending} onClick={() => cancel.mutate({ id: campaign.id })}>
                  {t("marketing.progress.stop")}
                </Button>
              </div>
            )}
          </div>
        )}

        <fieldset disabled={!editable} className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-subject`}>{t("marketing.form.subject")}</Label>
              <Input id={`${id}-subject`} value={form.subject} maxLength={150} onChange={(e) => set("subject", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-preheader`}>{t("marketing.form.preheader")}</Label>
              <Input
                id={`${id}-preheader`}
                value={form.preheader ?? ""}
                maxLength={150}
                placeholder={t("marketing.form.preheaderPlaceholder")}
                onChange={(e) => set("preheader", e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-body`}>{t("marketing.form.body")}</Label>
            <Textarea
              id={`${id}-body`}
              value={form.body}
              rows={10}
              maxLength={20000}
              onChange={(e) => set("body", e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              {t("marketing.form.bodyHint")}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-cta-label`}>{t("marketing.form.ctaLabel")}</Label>
              <Input
                id={`${id}-cta-label`}
                value={form.ctaLabel ?? ""}
                maxLength={60}
                placeholder={t("marketing.form.ctaLabelPlaceholder")}
                onChange={(e) => set("ctaLabel", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-cta-url`}>{t("marketing.form.ctaUrl")}</Label>
              <Input
                id={`${id}-cta-url`}
                value={form.ctaUrl ?? ""}
                maxLength={500}
                placeholder={t("marketing.form.ctaUrlPlaceholder")}
                onChange={(e) => set("ctaUrl", e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border p-4">
            <p className="text-sm font-medium">{t("marketing.form.audience")}</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${id}-audience`}>{t("marketing.form.subscribers")}</Label>
                <select
                  id={`${id}-audience`}
                  className={SELECT_CLASS}
                  value={form.segment.audience}
                  onChange={(e) => set("segment", { ...form.segment, audience: e.target.value as Audience })}
                >
                  {AUDIENCES.map((audience) => (
                    <option key={audience} value={audience}>
                      {t(`marketing.audience.${audience}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${id}-countries`}>{t("marketing.form.countries")}</Label>
                <Input
                  id={`${id}-countries`}
                  value={countries}
                  placeholder={t("marketing.form.countriesPlaceholder")}
                  onChange={(e) => setCountries(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm">{t("marketing.form.languages")}</span>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {LANGUAGES.map((language) => (
                  <label key={language} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.segment.languages.includes(language)}
                      onCheckedChange={(checked) => toggleLanguage(language, Boolean(checked))}
                    />
                    {t(`marketing.language.${language}`)}
                  </label>
                ))}
              </div>
            </div>
            {editable && (
              <p role="status" className="text-sm">
                {count.data
                  ? t("marketing.form.audienceCount", { count: count.data.count })
                  : t("marketing.form.audienceCounting")}
              </p>
            )}
          </div>
        </fieldset>

        {editable && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? t("marketing.form.saving") : t("marketing.form.saveDraft")}
            </Button>
            <Button
              variant="outline"
              disabled={!campaign || saving || test.isPending}
              onClick={() => void saveThen(() => campaign && test.mutate({ id: campaign.id }))}
            >
              {t("marketing.form.sendTest")}
            </Button>
            <Button
              variant="outline"
              disabled={!campaign || saving || send.isPending || !count.data?.count}
              onClick={() => setConfirmSend(true)}
            >
              {t("marketing.form.sendEllipsis")}
            </Button>
            {campaign && (
              <Button variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(true)}>
                {t("marketing.form.delete")}
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <AlertDialog open={confirmSend} onOpenChange={setConfirmSend}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("marketing.confirmSend.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("marketing.confirmSend.description", {
                subject: form.subject,
                count: count.data?.count ?? 0,
                audience: audienceSummary(segment),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("marketing.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void saveThen(() => campaign && send.mutate({ id: campaign.id }))}
            >
              {t("marketing.confirmSend.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("marketing.confirmDelete.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("marketing.confirmDelete.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("marketing.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => campaign && remove.mutate({ id: campaign.id })}>{t("marketing.form.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// ─── Campaigns ──────────────────────────────────────────────────────────────

function Campaigns() {
  const t = useTranslations("adminSystem");
  const locale = useLocale();
  const audienceSummary = useAudienceSummary();
  const [selected, setSelected] = useState<string | "new" | null>(null);
  const campaigns = trpc.marketing.campaigns.useQuery(undefined, {
    // Follow a sending while it runs.
    refetchInterval: (query) => (query.state.data?.some((c) => c.status === "SENDING") ? 3000 : false),
  });
  const current = campaigns.data?.find((campaign) => campaign.id === selected) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          {t("marketing.campaigns.intro")}
        </p>
        <Button onClick={() => setSelected("new")}>{t("marketing.newCampaign")}</Button>
      </div>
      {campaigns.error && <p className="text-destructive text-sm">{campaigns.error.message}</p>}
      {campaigns.data && (
        <Card>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("marketing.campaigns.subject")}</TableHead>
                  <TableHead>{t("marketing.campaigns.status")}</TableHead>
                  <TableHead>{t("marketing.campaigns.audience")}</TableHead>
                  <TableHead className="text-end">{t("marketing.campaigns.sent")}</TableHead>
                  <TableHead>{t("marketing.campaigns.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.data.map((campaign) => (
                  <TableRow
                    key={campaign.id}
                    data-state={campaign.id === selected ? "selected" : undefined}
                    className="cursor-pointer"
                    onClick={() => setSelected(campaign.id)}
                  >
                    <TableCell className="max-w-72 font-medium">
                      <button type="button" className="truncate text-start hover:underline" onClick={() => setSelected(campaign.id)}>
                        {campaign.subject}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(campaign.status)}>{t(`marketing.campaignStatus.${campaign.status}`)}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-64 truncate text-xs">
                      {audienceSummary(campaign.segment)}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">
                      {campaign.status === "DRAFT" ? "—" : `${campaign.recipients.sent} / ${campaign.recipients.total}`}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {formatDate(campaign.sendStartedAt ?? campaign.createdAt, locale)}
                    </TableCell>
                  </TableRow>
                ))}
                {!campaigns.data.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground text-center">
                      {t("marketing.campaigns.empty")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {selected === "new" && <CampaignForm key="new" campaign={null} onDone={setSelected} />}
      {current && <CampaignForm key={`${current.id}-${current.status}`} campaign={current} onDone={setSelected} />}
    </div>
  );
}

// ─── Subscribers ────────────────────────────────────────────────────────────

function ConsentDialog({ subscriber, onClose }: { subscriber: Subscriber | null; onClose: () => void }) {
  const t = useTranslations("adminSystem");
  const locale = useLocale();
  const utils = trpc.useUtils();
  const [asking, setAsking] = useState(false);
  const events = trpc.marketing.consent.useQuery({ id: subscriber?.id ?? "" }, { enabled: Boolean(subscriber) });
  const unsubscribe = trpc.marketing.unsubscribe.useMutation({
    ...fail,
    onSuccess: async (saved) => {
      utils.marketing.consent.setData({ id: subscriber!.id }, saved);
      await utils.marketing.subscribers.invalidate();
      setAsking(false);
      toast.success(t("marketing.consent.unsubscribed"));
    },
  });
  const unsubscribed = events.data?.at(-1)?.event === "UNSUBSCRIBED" || subscriber?.status === "UNSUBSCRIBED";

  return (
    <Dialog open={Boolean(subscriber)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="break-all">{subscriber?.email}</DialogTitle>
          <DialogDescription>
            {t("marketing.consent.description")}
          </DialogDescription>
        </DialogHeader>
        <ol className="flex flex-col gap-3">
          {events.data?.map((event) => (
            <li key={event.id} className="rounded-lg border p-3 text-sm">
              <p className="font-medium">
                {t(`marketing.consentEvent.${event.event}`)} · {formatDate(event.createdAt, locale)}
              </p>
              <p className="text-muted-foreground text-xs">
                {t("marketing.consent.by", {
                  source: isConsentSource(event.source) ? t(`marketing.consentSource.${event.source}`) : event.source,
                })}
                {event.actorName && ` (${event.actorName})`}
                {event.ipAddress && t("marketing.consent.ip", { ip: event.ipAddress })}
              </p>
              {event.consentText && (
                <p className="mt-2 text-xs italic">{t("marketing.consent.quote", { text: event.consentText })}</p>
              )}
              {event.userAgent && (
                <p className="text-muted-foreground mt-1 text-xs break-all">
                  {t("marketing.consent.browser", { userAgent: event.userAgent })}
                </p>
              )}
            </li>
          ))}
        </ol>
        {subscriber && !unsubscribed && (
          <div className="flex flex-col gap-2 border-t pt-4">
            {asking ? (
              <>
                <p className="text-sm">
                  {t("marketing.consent.confirm")}
                </p>
                <div className="flex gap-2">
                  <Button variant="destructive" disabled={unsubscribe.isPending} onClick={() => unsubscribe.mutate({ id: subscriber.id })}>
                    {t("marketing.consent.unsubscribe")}
                  </Button>
                  <Button variant="ghost" onClick={() => setAsking(false)}>
                    {t("marketing.cancel")}
                  </Button>
                </div>
              </>
            ) : (
              <div>
                <Button variant="outline" onClick={() => setAsking(true)}>
                  {t("marketing.consent.unsubscribeOnRequest")}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Subscribers() {
  const t = useTranslations("adminSystem");
  const locale = useLocale();
  const [status, setStatus] = useState<SubscriberStatus | "">("SUBSCRIBED");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Subscriber | null>(null);
  const list = trpc.marketing.subscribers.useQuery({ status: status || undefined, search: search.trim() || undefined, page });
  const data = list.data;

  return (
    <div className="flex flex-col gap-4">
      {data && (
        <div className="grid gap-4 sm:grid-cols-3">
          {(["SUBSCRIBED", "PENDING", "UNSUBSCRIBED"] as const).map((key) => (
            <Card key={key} size="sm">
              <CardHeader>
                <CardDescription>{t(`marketing.subscriberStatus.${key}`)}</CardDescription>
                <p className="text-2xl font-semibold tabular-nums">{data.counts[key]}</p>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          aria-label={t("marketing.subscribers.searchLabel")}
          placeholder={t("marketing.subscribers.searchPlaceholder")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="sm:max-w-xs"
        />
        <select
          aria-label={t("marketing.subscribers.status")}
          className={`${SELECT_CLASS} sm:w-60`}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as SubscriberStatus | "");
            setPage(1);
          }}
        >
          <option value="">{t("marketing.subscribers.allStatuses")}</option>
          {(["SUBSCRIBED", "PENDING", "UNSUBSCRIBED"] as const).map((key) => (
            <option key={key} value={key}>
              {t(`marketing.subscriberStatus.${key}`)}
            </option>
          ))}
        </select>
      </div>
      {list.error && <p className="text-destructive text-sm">{list.error.message}</p>}
      {data && (
        <Card>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("marketing.subscribers.email")}</TableHead>
                  <TableHead>{t("marketing.subscribers.status")}</TableHead>
                  <TableHead>{t("marketing.subscribers.language")}</TableHead>
                  <TableHead>{t("marketing.subscribers.country")}</TableHead>
                  <TableHead>{t("marketing.subscribers.account")}</TableHead>
                  <TableHead>{t("marketing.subscribers.subscribedAt")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-64 truncate font-medium" title={item.email}>
                      {item.email}
                    </TableCell>
                    <TableCell className="text-xs">{t(`marketing.subscriberStatus.${item.status}`)}</TableCell>
                    <TableCell className="text-xs uppercase">{item.language}</TableCell>
                    <TableCell className="text-xs">{item.countryCode ?? "—"}</TableCell>
                    <TableCell className="text-xs">{item.hasAccount ? t("marketing.subscribers.yes") : t("marketing.subscribers.no")}</TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {formatDate(item.subscribedAt, locale)}
                    </TableCell>
                    <TableCell className="text-end">
                      <Button variant="ghost" size="sm" onClick={() => setOpen(item)}>
                        {t("marketing.subscribers.consent")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!data.items.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground text-center">
                      {t("marketing.subscribers.empty")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {t("marketing.subscribers.previous")}
          </Button>
          <span className="tabular-nums">
            {page} / {data.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
            {t("marketing.subscribers.next")}
          </Button>
        </div>
      )}
      <ConsentDialog subscriber={open} onClose={() => setOpen(null)} />
    </div>
  );
}

export function MarketingAdmin() {
  const t = useTranslations("adminSystem");
  return (
    <Tabs defaultValue="campaigns">
      <TabsList>
        <TabsTrigger value="campaigns">{t("marketing.tabs.campaigns")}</TabsTrigger>
        <TabsTrigger value="subscribers">{t("marketing.tabs.subscribers")}</TabsTrigger>
      </TabsList>
      <TabsContent value="campaigns" className="pt-4">
        <Campaigns />
      </TabsContent>
      <TabsContent value="subscribers" className="pt-4">
        <Subscribers />
      </TabsContent>
    </Tabs>
  );
}
