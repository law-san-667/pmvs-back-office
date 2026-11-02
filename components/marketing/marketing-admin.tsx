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
import {
  AUDIENCES,
  AUDIENCE_LABELS,
  type Audience,
  CAMPAIGN_STATUS_LABELS,
  CONSENT_EVENT_LABELS,
  CONSENT_SOURCE_LABELS,
  type Campaign,
  type CampaignInput,
  LANGUAGES,
  LANGUAGE_LABELS,
  type Language,
  SUBSCRIBER_STATUS_LABELS,
  type Subscriber,
  type SubscriberStatus,
} from "@/lib/marketing";
import { trpc } from "@/server/trpc/client";
import { useId, useState } from "react";
import { toast } from "sonner";

const SELECT_CLASS = "border-input bg-background h-9 w-full rounded-md border px-2 text-sm";
const fail = { onError: (error: { message: string }) => toast.error(error.message) };
const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "—";
const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? "s" : ""}`;

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

const audienceSummary = (segment: Campaign["segment"]) =>
  [
    AUDIENCE_LABELS[segment.audience],
    segment.countryCodes.length ? segment.countryCodes.join(", ") : null,
    segment.languages.length ? segment.languages.map((l) => LANGUAGE_LABELS[l]).join(", ") : null,
  ]
    .filter(Boolean)
    .join(" · ");

// ─── Campaign form ──────────────────────────────────────────────────────────

function CampaignForm({
  campaign,
  onDone,
}: {
  campaign: Campaign | null;
  onDone: (id: string | null) => void;
}) {
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
      toast.success("Brouillon enregistré.");
      onDone(saved.id);
    },
  });
  const update = trpc.marketing.updateCampaign.useMutation({
    ...fail,
    onSuccess: async () => {
      await refresh();
      toast.success("Brouillon enregistré.");
    },
  });
  const test = trpc.marketing.testCampaign.useMutation({
    ...fail,
    onSuccess: (result) => toast.success(`E-mail de test envoyé à ${result.to}.`),
  });
  const send = trpc.marketing.sendCampaign.useMutation({
    ...fail,
    onSuccess: async () => {
      await refresh();
      toast.success("Envoi lancé.");
    },
  });
  const cancel = trpc.marketing.cancelCampaign.useMutation({
    ...fail,
    onSuccess: async () => {
      await refresh();
      toast.success("Envoi arrêté.");
    },
  });
  const remove = trpc.marketing.deleteCampaign.useMutation({
    ...fail,
    onSuccess: async () => {
      await refresh();
      toast.success("Brouillon supprimé.");
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
        <CardTitle>{campaign ? campaign.subject : "Nouvelle campagne"}</CardTitle>
        <CardDescription>
          {campaign
            ? `${CAMPAIGN_STATUS_LABELS[campaign.status]} · créée par ${campaign.createdByName ?? "—"} le ${formatDate(campaign.createdAt)}`
            : "Rédigez l'e-mail, choisissez le public, envoyez-vous un test, puis lancez l'envoi."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {campaign && campaign.status !== "DRAFT" && r && (
          <div className="flex flex-col gap-2 rounded-lg border p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <span className="font-medium">
                {plural(r.sent, "envoyé")} sur {r.total}
              </span>
              <span className="text-muted-foreground text-xs">
                {r.failed > 0 && `${plural(r.failed, "échec")} · `}
                {r.skipped > 0 && `${r.skipped} non envoyé(s) (désinscrits ou envoi arrêté) · `}
                lancé par {campaign.sentByName ?? "—"} le {formatDate(campaign.sendStartedAt)}
                {campaign.sendFinishedAt && `, terminé le ${formatDate(campaign.sendFinishedAt)}`}
              </span>
            </div>
            <Progress value={r.total ? (done / r.total) * 100 : 0} aria-label="Avancement de l'envoi" />
            {campaign.status === "SENDING" && (
              <div>
                <Button variant="outline" size="sm" disabled={cancel.isPending} onClick={() => cancel.mutate({ id: campaign.id })}>
                  Arrêter l&apos;envoi
                </Button>
              </div>
            )}
          </div>
        )}

        <fieldset disabled={!editable} className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-subject`}>Objet</Label>
              <Input id={`${id}-subject`} value={form.subject} maxLength={150} onChange={(e) => set("subject", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-preheader`}>Texte d&apos;aperçu (facultatif)</Label>
              <Input
                id={`${id}-preheader`}
                value={form.preheader ?? ""}
                maxLength={150}
                placeholder="Affiché après l'objet dans la boîte de réception"
                onChange={(e) => set("preheader", e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-body`}>Message</Label>
            <Textarea
              id={`${id}-body`}
              value={form.body}
              rows={10}
              maxLength={20000}
              onChange={(e) => set("body", e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Une ligne vide entre deux paragraphes, « ## » au début d&apos;une ligne pour un titre, « - » pour une
              liste. Les adresses https:// deviennent des liens. Le motif de réception, le lien de désinscription et
              l&apos;adresse de la société sont ajoutés automatiquement.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-cta-label`}>Texte du bouton (facultatif)</Label>
              <Input
                id={`${id}-cta-label`}
                value={form.ctaLabel ?? ""}
                maxLength={60}
                placeholder="Voir les offres"
                onChange={(e) => set("ctaLabel", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-cta-url`}>Adresse du bouton</Label>
              <Input
                id={`${id}-cta-url`}
                value={form.ctaUrl ?? ""}
                maxLength={500}
                placeholder="/listings ou https://…"
                onChange={(e) => set("ctaUrl", e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border p-4">
            <p className="text-sm font-medium">Public</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${id}-audience`}>Abonnés</Label>
                <select
                  id={`${id}-audience`}
                  className={SELECT_CLASS}
                  value={form.segment.audience}
                  onChange={(e) => set("segment", { ...form.segment, audience: e.target.value as Audience })}
                >
                  {AUDIENCES.map((audience) => (
                    <option key={audience} value={audience}>
                      {AUDIENCE_LABELS[audience]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${id}-countries`}>Pays (codes, facultatif)</Label>
                <Input
                  id={`${id}-countries`}
                  value={countries}
                  placeholder="SN, CI, ML — vide : tous les pays"
                  onChange={(e) => setCountries(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm">Langue de l&apos;abonné (aucune cochée : toutes)</span>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {LANGUAGES.map((language) => (
                  <label key={language} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.segment.languages.includes(language)}
                      onCheckedChange={(checked) => toggleLanguage(language, Boolean(checked))}
                    />
                    {LANGUAGE_LABELS[language]}
                  </label>
                ))}
              </div>
            </div>
            {editable && (
              <p role="status" className="text-sm">
                {count.data
                  ? `${plural(count.data.count, "abonné")} inscrit${count.data.count > 1 ? "s" : ""} dans ce public.`
                  : "Calcul du public…"}
              </p>
            )}
          </div>
        </fieldset>

        {editable && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer le brouillon"}
            </Button>
            <Button
              variant="outline"
              disabled={!campaign || saving || test.isPending}
              onClick={() => void saveThen(() => campaign && test.mutate({ id: campaign.id }))}
            >
              M&apos;envoyer un test
            </Button>
            <Button
              variant="outline"
              disabled={!campaign || saving || send.isPending || !count.data?.count}
              onClick={() => setConfirmSend(true)}
            >
              Envoyer…
            </Button>
            {campaign && (
              <Button variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(true)}>
                Supprimer
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <AlertDialog open={confirmSend} onOpenChange={setConfirmSend}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Envoyer cette campagne ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {form.subject} » partira vers {plural(count.data?.count ?? 0, "abonné")} ({audienceSummary(segment)}).
              Le brouillon est enregistré avant l&apos;envoi. Une fois lancé, l&apos;envoi peut être arrêté mais pas
              annulé pour les e-mails déjà partis.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void saveThen(() => campaign && send.mutate({ id: campaign.id }))}
            >
              Envoyer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce brouillon ?</AlertDialogTitle>
            <AlertDialogDescription>Il n&apos;a été envoyé à personne ; il sera définitivement supprimé.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => campaign && remove.mutate({ id: campaign.id })}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// ─── Campaigns ──────────────────────────────────────────────────────────────

function Campaigns() {
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
          Envoyées uniquement aux personnes ayant confirmé leur inscription.
        </p>
        <Button onClick={() => setSelected("new")}>Nouvelle campagne</Button>
      </div>
      {campaigns.error && <p className="text-destructive text-sm">{campaigns.error.message}</p>}
      {campaigns.data && (
        <Card>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Objet</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Public</TableHead>
                  <TableHead className="text-end">Envoyés</TableHead>
                  <TableHead>Date</TableHead>
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
                      <Badge variant={statusVariant(campaign.status)}>{CAMPAIGN_STATUS_LABELS[campaign.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-64 truncate text-xs">
                      {audienceSummary(campaign.segment)}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">
                      {campaign.status === "DRAFT" ? "—" : `${campaign.recipients.sent} / ${campaign.recipients.total}`}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {formatDate(campaign.sendStartedAt ?? campaign.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
                {!campaigns.data.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground text-center">
                      Aucune campagne pour l&apos;instant.
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
  const utils = trpc.useUtils();
  const [asking, setAsking] = useState(false);
  const events = trpc.marketing.consent.useQuery({ id: subscriber?.id ?? "" }, { enabled: Boolean(subscriber) });
  const unsubscribe = trpc.marketing.unsubscribe.useMutation({
    ...fail,
    onSuccess: async (saved) => {
      utils.marketing.consent.setData({ id: subscriber!.id }, saved);
      await utils.marketing.subscribers.invalidate();
      setAsking(false);
      toast.success("Adresse désinscrite.");
    },
  });
  const unsubscribed = events.data?.at(-1)?.event === "UNSUBSCRIBED" || subscriber?.status === "UNSUBSCRIBED";

  return (
    <Dialog open={Boolean(subscriber)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="break-all">{subscriber?.email}</DialogTitle>
          <DialogDescription>
            Preuve du consentement : chaque demande, confirmation et désinscription, avec le texte accepté.
          </DialogDescription>
        </DialogHeader>
        <ol className="flex flex-col gap-3">
          {events.data?.map((event) => (
            <li key={event.id} className="rounded-lg border p-3 text-sm">
              <p className="font-medium">
                {CONSENT_EVENT_LABELS[event.event]} · {formatDate(event.createdAt)}
              </p>
              <p className="text-muted-foreground text-xs">
                Par {CONSENT_SOURCE_LABELS[event.source] ?? event.source}
                {event.actorName && ` (${event.actorName})`}
                {event.ipAddress && ` · adresse IP ${event.ipAddress}`}
              </p>
              {event.consentText && <p className="mt-2 text-xs italic">« {event.consentText} »</p>}
              {event.userAgent && (
                <p className="text-muted-foreground mt-1 text-xs break-all">Navigateur : {event.userAgent}</p>
              )}
            </li>
          ))}
        </ol>
        {subscriber && !unsubscribed && (
          <div className="flex flex-col gap-2 border-t pt-4">
            {asking ? (
              <>
                <p className="text-sm">
                  Désinscrire cette adresse à la demande de la personne ? Elle devra se réinscrire elle-même pour
                  recevoir de nouveau les campagnes.
                </p>
                <div className="flex gap-2">
                  <Button variant="destructive" disabled={unsubscribe.isPending} onClick={() => unsubscribe.mutate({ id: subscriber.id })}>
                    Désinscrire
                  </Button>
                  <Button variant="ghost" onClick={() => setAsking(false)}>
                    Annuler
                  </Button>
                </div>
              </>
            ) : (
              <div>
                <Button variant="outline" onClick={() => setAsking(true)}>
                  Désinscrire à sa demande…
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
                <CardDescription>{SUBSCRIBER_STATUS_LABELS[key]}</CardDescription>
                <p className="text-2xl font-semibold tabular-nums">{data.counts[key]}</p>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          aria-label="Rechercher une adresse"
          placeholder="Rechercher une adresse…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="sm:max-w-xs"
        />
        <select
          aria-label="Statut"
          className={`${SELECT_CLASS} sm:w-60`}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as SubscriberStatus | "");
            setPage(1);
          }}
        >
          <option value="">Tous les statuts</option>
          {(["SUBSCRIBED", "PENDING", "UNSUBSCRIBED"] as const).map((key) => (
            <option key={key} value={key}>
              {SUBSCRIBER_STATUS_LABELS[key]}
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
                  <TableHead>Adresse</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Langue</TableHead>
                  <TableHead>Pays</TableHead>
                  <TableHead>Compte</TableHead>
                  <TableHead>Inscrit le</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-64 truncate font-medium" title={item.email}>
                      {item.email}
                    </TableCell>
                    <TableCell className="text-xs">{SUBSCRIBER_STATUS_LABELS[item.status]}</TableCell>
                    <TableCell className="text-xs uppercase">{item.language}</TableCell>
                    <TableCell className="text-xs">{item.countryCode ?? "—"}</TableCell>
                    <TableCell className="text-xs">{item.hasAccount ? "Oui" : "Non"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {formatDate(item.subscribedAt)}
                    </TableCell>
                    <TableCell className="text-end">
                      <Button variant="ghost" size="sm" onClick={() => setOpen(item)}>
                        Consentement
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!data.items.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground text-center">
                      Aucune adresse.
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
            Précédent
          </Button>
          <span className="tabular-nums">
            {page} / {data.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
            Suivant
          </Button>
        </div>
      )}
      <ConsentDialog subscriber={open} onClose={() => setOpen(null)} />
    </div>
  );
}

export function MarketingAdmin() {
  return (
    <Tabs defaultValue="campaigns">
      <TabsList>
        <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
        <TabsTrigger value="subscribers">Abonnés</TabsTrigger>
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
