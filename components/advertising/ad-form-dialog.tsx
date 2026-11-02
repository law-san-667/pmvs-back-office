"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { uploadFileToR2FromBrowser } from "@/lib/upload-to-r2";
import type { AdPlacement, Advertisement } from "@/lib/advertising";
import { AD_PLACEMENTS } from "@/lib/advertising";
import { trpc } from "@/server/trpc/client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { fromLocalInput, toLocalInput } from "./ad-utils";

export type AdFormValues = {
  title: string;
  subtitle: string | null;
  imageUrl: string;
  targetUrl: string | null;
  placement: AdPlacement;
  countryCodes: string[] | null;
  startsAt: string | null;
  endsAt: string | null;
  priority?: number;
};

const selectClass =
  "border-input bg-background h-9 w-full rounded-md border px-3 text-sm";
const isTargetValid = (value: string) =>
  !value || /^\/(?!\/)/.test(value) || /^https?:\/\/\S+$/i.test(value);

/**
 * Creates or edits an ad. Shops see that a change of content sends the ad
 * back for review; the platform form also sets the priority.
 */
export function AdFormDialog({
  open,
  ad,
  platform = false,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  ad: Advertisement | null;
  platform?: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: AdFormValues) => Promise<void>;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !saving) onClose();
      }}
    >
      <AlertDialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {open && (
          <AdForm
            key={ad?.id ?? "new"}
            ad={ad}
            platform={platform}
            saving={saving}
            onSubmit={onSubmit}
          />
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AdForm({
  ad,
  platform,
  saving,
  onSubmit,
}: {
  ad: Advertisement | null;
  platform: boolean;
  saving: boolean;
  onSubmit: (values: AdFormValues) => Promise<void>;
}) {
  const t = useTranslations("ads");
  const countries = trpc.geography.countries.useQuery({
    page: 1,
    limit: 100,
    orderBy: "name",
    order: "asc",
  });
  const createUpload = trpc.media.createUpload.useMutation();
  const [form, setForm] = useState({
    title: ad?.title ?? "",
    subtitle: ad?.subtitle ?? "",
    imageUrl: ad?.imageUrl ?? "",
    targetUrl: ad?.targetUrl ?? "",
    placement: ad?.placement ?? ("HOME_BANNER" as AdPlacement),
    countryCodes: ad?.countryCodes ?? [],
    startsAt: toLocalInput(ad?.startsAt),
    endsAt: toLocalInput(ad?.endsAt),
    priority: String(ad?.priority ?? 0),
  });
  const [uploading, setUploading] = useState<number | null>(null);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("errors.imageRequired"));
      return;
    }
    try {
      setUploading(0);
      const url = await uploadFileToR2FromBrowser(
        file,
        "images",
        (input) => createUpload.mutateAsync(input),
        setUploading,
      );
      if (url) setForm((current) => ({ ...current, imageUrl: url }));
    } catch {
      toast.error(t("errors.imageUploadFailed"));
    } finally {
      setUploading(null);
    }
  };

  const validPeriod =
    !form.startsAt ||
    !form.endsAt ||
    new Date(form.endsAt) > new Date(form.startsAt);
  const canSave =
    form.title.trim().length >= 2 &&
    Boolean(form.imageUrl) &&
    isTargetValid(form.targetUrl.trim()) &&
    validPeriod &&
    uploading === null;

  const save = () =>
    onSubmit({
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      imageUrl: form.imageUrl,
      targetUrl: form.targetUrl.trim() || null,
      placement: form.placement,
      countryCodes: form.countryCodes.length ? form.countryCodes : null,
      startsAt: fromLocalInput(form.startsAt),
      endsAt: fromLocalInput(form.endsAt),
      ...(platform && { priority: Number.parseInt(form.priority, 10) || 0 }),
    });

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {ad
            ? t("form.editTitle")
            : platform
              ? t("form.platformNewTitle")
              : t("form.requestTitle")}
        </AlertDialogTitle>
      </AlertDialogHeader>
      {!platform && (
        <p className="text-muted-foreground text-sm">
          {ad ? t("form.reviewNoteEdit") : t("form.reviewNote")}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="ad-placement">{t("form.placement")}</FieldLabel>
          <select
            id="ad-placement"
            className={selectClass}
            value={form.placement}
            onChange={(event) =>
              setForm({ ...form, placement: event.target.value as AdPlacement })
            }
          >
            {AD_PLACEMENTS.map((placement) => (
              <option key={placement} value={placement}>
                {t(`placement.${placement}`)}
              </option>
            ))}
          </select>
          <FieldDescription>{t(`placementHint.${form.placement}`)}</FieldDescription>
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="ad-title">{t("form.title")}</FieldLabel>
          <Input
            id="ad-title"
            value={form.title}
            maxLength={120}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
          />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="ad-subtitle">{t("form.subtitle")}</FieldLabel>
          <Input
            id="ad-subtitle"
            value={form.subtitle}
            maxLength={200}
            onChange={(event) =>
              setForm({ ...form, subtitle: event.target.value })
            }
          />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="ad-image">{t("form.image")}</FieldLabel>
          {form.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.imageUrl}
              alt=""
              className="max-h-40 w-full rounded-md border object-cover"
            />
          )}
          <Input
            id="ad-image"
            type="file"
            accept="image/*"
            disabled={uploading !== null}
            onChange={(event) => void upload(event.target.files?.[0])}
          />
          {uploading !== null && (
            <FieldDescription>{t("form.uploading", { progress: uploading })}</FieldDescription>
          )}
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="ad-target">{t("form.target")}</FieldLabel>
          <Input
            id="ad-target"
            value={form.targetUrl}
            placeholder={t("form.targetPlaceholder")}
            aria-invalid={!isTargetValid(form.targetUrl.trim())}
            onChange={(event) =>
              setForm({ ...form, targetUrl: event.target.value })
            }
          />
          <FieldDescription>{t("form.targetHint")}</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="ad-start">{t("form.start")}</FieldLabel>
          <Input
            id="ad-start"
            type="datetime-local"
            value={form.startsAt}
            onChange={(event) =>
              setForm({ ...form, startsAt: event.target.value })
            }
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="ad-end">{t("form.end")}</FieldLabel>
          <Input
            id="ad-end"
            type="datetime-local"
            value={form.endsAt}
            aria-invalid={!validPeriod}
            onChange={(event) =>
              setForm({ ...form, endsAt: event.target.value })
            }
          />
        </Field>
        {platform && (
          <Field>
            <FieldLabel htmlFor="ad-priority">{t("form.priority")}</FieldLabel>
            <Input
              id="ad-priority"
              inputMode="numeric"
              value={form.priority}
              onChange={(event) =>
                setForm({ ...form, priority: event.target.value })
              }
            />
            <FieldDescription>{t("form.priorityHint")}</FieldDescription>
          </Field>
        )}
        <div className="flex flex-col gap-2 sm:col-span-2">
          <p className="text-sm font-medium">
            {form.countryCodes.length
              ? t("form.countries", { count: form.countryCodes.length })
              : t("form.countriesAll")}
          </p>
          <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-3">
            {countries.data?.items.map((country) => (
              <label
                key={country.code}
                className="flex items-center gap-2 text-sm"
              >
                <Checkbox
                  checked={form.countryCodes.includes(country.code)}
                  onCheckedChange={(checked) =>
                    setForm({
                      ...form,
                      countryCodes: checked
                        ? [...form.countryCodes, country.code]
                        : form.countryCodes.filter(
                            (code) => code !== country.code,
                          ),
                    })
                  }
                />
                <span className="truncate">{country.name}</span>
              </label>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            {t("form.noCountryHint")}
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <AlertDialogCancel disabled={saving}>{t("form.cancel")}</AlertDialogCancel>
        <AlertDialogAction
          disabled={!canSave || saving}
          onClick={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          {saving
            ? t("form.saving")
            : ad || platform
              ? t("form.save")
              : t("form.submit")}
        </AlertDialogAction>
      </div>
    </>
  );
}
