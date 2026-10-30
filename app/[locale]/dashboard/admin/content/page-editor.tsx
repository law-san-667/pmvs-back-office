"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  type AdminContentPage,
  CONTENT_LOCALES,
  type ContentLocale,
  parseContent,
  serializeContent,
} from "@/lib/content-format";
import { trpc } from "@/server/trpc/client";
import { useState } from "react";
import { toast } from "sonner";

const LOCALE_LABELS: Record<ContentLocale, string> = {
  fr: "Français",
  en: "Anglais",
  pt: "Portugais",
  ar: "Arabe",
};

const STOREFRONT_PATH = (slug: string) =>
  slug === "cgu" ? "/cgu" : `/pages/${slug}`;

/** Edits one page, one language at a time, in the plain-text format. */
export function PageEditor({ page }: { page: AdminContentPage }) {
  const utils = trpc.useUtils();
  const save = trpc.content.saveTranslation.useMutation();
  const publish = trpc.content.setPublished.useMutation();
  const [locale, setLocale] = useState<ContentLocale>("fr");

  const translation = (l: ContentLocale) =>
    page.translations.find((t) => t.locale === l);
  const load = (l: ContentLocale) => {
    const t = translation(l) ?? translation("fr");
    return {
      title: translation(l)?.title ?? t?.title ?? "",
      summary: translation(l)?.summary ?? "",
      body: translation(l) ? serializeContent(translation(l)!.sections) : "",
    };
  };
  const [draft, setDraft] = useState(() => load("fr"));
  const sections = parseContent(draft.body);

  const switchLocale = (next: ContentLocale) => {
    setLocale(next);
    setDraft(load(next));
  };

  const submit = async () => {
    try {
      await save.mutateAsync({
        id: page.id,
        locale,
        title: draft.title.trim(),
        summary: draft.summary.trim() || null,
        sections,
      });
      toast.success(
        `Contenu ${LOCALE_LABELS[locale].toLowerCase()} enregistré.`,
      );
      await utils.content.pages.invalidate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Échec de l’enregistrement.",
      );
    }
  };

  const togglePublished = async () => {
    try {
      await publish.mutateAsync({
        id: page.id,
        isPublished: !page.isPublished,
      });
      toast.success(
        page.isPublished ? "Page retirée du site." : "Page publiée.",
      );
      await utils.content.pages.invalidate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Échec de la publication.",
      );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              page.isPublished
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-slate-200 bg-slate-50 text-slate-600"
            }
          >
            {page.isPublished ? "Publiée" : "Brouillon"}
          </Badge>
          <span className="text-muted-foreground text-sm">
            Adresse sur le site : {STOREFRONT_PATH(page.slug)}
          </span>
        </div>
        <Button
          variant="outline"
          disabled={publish.isPending}
          onClick={() => void togglePublished()}
        >
          {page.isPublished ? "Retirer du site" : "Publier"}
        </Button>
      </div>

      <Tabs
        value={locale}
        onValueChange={(value) => switchLocale(value as ContentLocale)}
      >
        <TabsList>
          {CONTENT_LOCALES.map((l) => (
            <TabsTrigger key={l} value={l}>
              {LOCALE_LABELS[l]}
              {!translation(l) && (
                <span className="text-muted-foreground ml-1">·</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {locale !== "fr" && !translation(locale) && (
        <p className="text-muted-foreground text-sm">
          Pas encore de version {LOCALE_LABELS[locale].toLowerCase()} : les
          visiteurs lisent la version française.
        </p>
      )}

      <div
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="flex flex-col gap-4"
      >
        <Field>
          <FieldLabel htmlFor="page-title">Titre</FieldLabel>
          <Input
            id="page-title"
            value={draft.title}
            maxLength={200}
            onChange={(event) =>
              setDraft({ ...draft, title: event.target.value })
            }
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="page-summary">Résumé (sous le titre)</FieldLabel>
          <Input
            id="page-summary"
            value={draft.summary}
            maxLength={1000}
            onChange={(event) =>
              setDraft({ ...draft, summary: event.target.value })
            }
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="page-body">Contenu</FieldLabel>
          <FieldDescription>
            « ## Titre » commence une section, « - » une ligne de liste ; une
            ligne vide sépare les paragraphes. Vous pouvez coller un texte
            entier.
          </FieldDescription>
          <Textarea
            id="page-body"
            value={draft.body}
            onChange={(event) =>
              setDraft({ ...draft, body: event.target.value })
            }
            className="min-h-96 font-mono text-sm"
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {sections.length} section{sections.length > 1 ? "s" : ""}
          {sections.length > 0 &&
            ` : ${sections
              .map((s) => s.title)
              .slice(0, 4)
              .join(", ")}${sections.length > 4 ? "…" : ""}`}
        </p>
        <Button
          disabled={!draft.title.trim() || save.isPending}
          onClick={() => void submit()}
        >
          {save.isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}
