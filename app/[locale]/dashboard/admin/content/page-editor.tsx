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
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

const STOREFRONT_PATH = (slug: string) =>
  slug === "cgu" ? "/cgu" : `/pages/${slug}`;

/** Edits one page, one language at a time, in the plain-text format. */
export function PageEditor({ page }: { page: AdminContentPage }) {
  const t = useTranslations("adminSettings.pageEditor");
  const tc = useTranslations("adminSettings.common");
  const tContent = useTranslations("adminSettings.content");
  const utils = trpc.useUtils();
  const save = trpc.content.saveTranslation.useMutation();
  const publish = trpc.content.setPublished.useMutation();
  const [locale, setLocale] = useState<ContentLocale>("fr");

  const translation = (l: ContentLocale) =>
    page.translations.find((tr) => tr.locale === l);
  const load = (l: ContentLocale) => {
    const fallback = translation(l) ?? translation("fr");
    return {
      title: translation(l)?.title ?? fallback?.title ?? "",
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
      toast.success(t("saved", { locale }));
      await utils.content.pages.invalidate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tc("saveFailed"),
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
        page.isPublished ? t("unpublished") : t("publishedToast"),
      );
      await utils.content.pages.invalidate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("publishFailed"),
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
            {page.isPublished ? tContent("published") : tContent("draft")}
          </Badge>
          <span className="text-muted-foreground text-sm">
            {t("storefrontPath", { path: STOREFRONT_PATH(page.slug) })}
          </span>
        </div>
        <Button
          variant="outline"
          disabled={publish.isPending}
          onClick={() => void togglePublished()}
        >
          {page.isPublished ? t("unpublish") : t("publish")}
        </Button>
      </div>

      <Tabs
        value={locale}
        onValueChange={(value) => switchLocale(value as ContentLocale)}
      >
        <TabsList>
          {CONTENT_LOCALES.map((l) => (
            <TabsTrigger key={l} value={l}>
              {t(`languages.${l}`)}
              {!translation(l) && (
                <span className="text-muted-foreground ms-1">·</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {locale !== "fr" && !translation(locale) && (
        <p className="text-muted-foreground text-sm">
          {t("missingTranslation", { locale })}
        </p>
      )}

      <div
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="flex flex-col gap-4"
      >
        <Field>
          <FieldLabel htmlFor="page-title">{t("title")}</FieldLabel>
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
          <FieldLabel htmlFor="page-summary">{t("summary")}</FieldLabel>
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
          <FieldLabel htmlFor="page-body">{t("body")}</FieldLabel>
          <FieldDescription>{t("bodyHint")}</FieldDescription>
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
          {sections.length > 0
            ? t("sectionsWithTitles", {
                count: sections.length,
                titles: `${sections
                  .map((s) => s.title)
                  .slice(0, 4)
                  .join(", ")}${sections.length > 4 ? "…" : ""}`,
              })
            : t("sections", { count: sections.length })}
        </p>
        <Button
          disabled={!draft.title.trim() || save.isPending}
          onClick={() => void submit()}
        >
          {save.isPending ? tc("savingEllipsis") : tc("save")}
        </Button>
      </div>
    </div>
  );
}
