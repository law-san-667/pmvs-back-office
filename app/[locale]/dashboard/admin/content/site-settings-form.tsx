"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/server/trpc/client";
import type { SiteLink, SiteSettings } from "@/lib/content-format";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

/** One link per line: "Libellé | adresse". */
const linksToText = (links: SiteLink[]) =>
  links.map((link) => `${link.label} | ${link.href}`).join("\n");
const textToLinks = (text: string): SiteLink[] =>
  text
    .split("\n")
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter(([label, href]) => label && href)
    .map(([label, href]) => ({ label, href }));

/** Columns separated by a blank line; first line is the column title. */
const columnsToText = (columns: SiteSettings["footerColumns"]) =>
  columns.map((c) => [c.title, linksToText(c.links)].join("\n")).join("\n\n");
const textToColumns = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((block) => block.trim().split("\n"))
    .filter((lines) => lines[0]?.trim())
    .map(([title, ...links]) => ({
      title: title.trim(),
      links: textToLinks(links.join("\n")),
    }));

const CONTACT_FIELDS = [
  "legalName",
  "tradeName",
  "address",
  "city",
  "phone",
  "whatsapp",
  "email",
] as const;

export function SiteSettingsForm({ site }: { site: SiteSettings }) {
  const t = useTranslations("adminSettings.siteSettings");
  const tc = useTranslations("adminSettings.common");
  const utils = trpc.useUtils();
  const save = trpc.content.saveSite.useMutation();
  const [contact, setContact] = useState(site.contact);
  const [tagline, setTagline] = useState(site.tagline ?? "");
  const [offline, setOffline] = useState(site.offlinePaymentInstructions ?? "");
  const [social, setSocial] = useState(linksToText(site.socialLinks));
  const [columns, setColumns] = useState(columnsToText(site.footerColumns));

  const submit = async () => {
    try {
      const empty = (value?: string | null) => value?.trim() || null;
      await save.mutateAsync({
        contact: {
          ...contact,
          legalName: contact.legalName.trim(),
          tradeName: contact.tradeName.trim(),
          address: empty(contact.address),
          city: empty(contact.city),
          phone: empty(contact.phone),
          whatsapp: empty(contact.whatsapp),
          email: empty(contact.email),
        },
        tagline: empty(tagline),
        offlinePaymentInstructions: empty(offline),
        socialLinks: textToLinks(social),
        footerColumns: textToColumns(columns),
      });
      toast.success(t("saved"));
      await utils.content.site.invalidate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tc("saveFailed"),
      );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        {CONTACT_FIELDS.map((key) => (
          <Field key={key}>
            <FieldLabel htmlFor={`contact-${key}`}>
              {t(`contact.${key}`)}
            </FieldLabel>
            <Input
              id={`contact-${key}`}
              value={contact[key] ?? ""}
              onChange={(event) =>
                setContact({ ...contact, [key]: event.target.value })
              }
            />
          </Field>
        ))}
      </div>
      <Field>
        <FieldLabel htmlFor="tagline">{t("tagline")}</FieldLabel>
        <Input
          id="tagline"
          value={tagline}
          maxLength={500}
          onChange={(event) => setTagline(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="offline">{t("offline")}</FieldLabel>
        <FieldDescription>{t("offlineHint")}</FieldDescription>
        <Textarea
          id="offline"
          value={offline}
          maxLength={2000}
          onChange={(event) => setOffline(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="social">{t("social")}</FieldLabel>
        <FieldDescription>{t("socialHint")}</FieldDescription>
        <Textarea
          id="social"
          value={social}
          onChange={(event) => setSocial(event.target.value)}
          className="font-mono text-sm"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="columns">{t("columns")}</FieldLabel>
        <FieldDescription>{t("columnsHint")}</FieldDescription>
        <Textarea
          id="columns"
          value={columns}
          onChange={(event) => setColumns(event.target.value)}
          className="min-h-56 font-mono text-sm"
        />
      </Field>
      <div className="flex justify-end">
        <Button
          disabled={
            !contact.legalName.trim() ||
            !contact.tradeName.trim() ||
            save.isPending
          }
          onClick={() => void submit()}
        >
          {save.isPending ? tc("savingEllipsis") : tc("save")}
        </Button>
      </div>
    </div>
  );
}
