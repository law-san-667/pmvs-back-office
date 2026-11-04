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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBusiness } from "@/contexts/business-context";
import { useRouter } from "@/i18n/navigation";
import { getBackendErrorMessages } from "@/lib/backend-utils";
import {
  uploadFileToR2FromBrowser,
  type CreateR2Upload,
} from "@/lib/upload-to-r2";
import countries from "@/lib/countries.json";
import { msg } from "@/lib/validators/messages";
import {
  tenderDiffusionScopes,
  tenderStatusEnum,
  tenderTypeEnum,
} from "@/lib/validators/tenders";
import { intlLocale } from "@/i18n/config";
import { useLocale, useTranslations } from "next-intl";
import { trpc } from "@/server/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Trash2Icon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

const COUNTRY_CODES = countries.map((country) => country.code);

/** Country names in the page's language (lib/countries.json is in English). */
const countryNamer = (locale: string) => {
  const names = new Map(
    countries.map((country) => [country.code, country.name]),
  );
  let display: Intl.DisplayNames | null = null;
  try {
    display = new Intl.DisplayNames([intlLocale(locale)], { type: "region" });
  } catch {
    display = null;
  }
  return (code: string) => {
    try {
      return display?.of(code) ?? names.get(code) ?? code;
    } catch {
      return names.get(code) ?? code;
    }
  };
};

// Convert an ISO timestamp into the value expected by an
// `<input type="datetime-local" />` (i.e. `YYYY-MM-DDTHH:mm`, local time).
const toDatetimeLocal = (iso: string | null | undefined) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const fromDatetimeLocal = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const tenderFormSchema = z
  .object({
    title: z.string().trim().min(1, msg("tenders.errors.titleRequired")),
    description: z.string(),
    categoryId: z.string().min(1, msg("tenders.errors.categoryRequired")),
    subCategoryId: z.string().min(1, msg("tenders.errors.subCategoryRequired")),
    type: z.enum(tenderTypeEnum),
    status: z.enum(tenderStatusEnum),
    budgetMin: z.string(),
    budgetMax: z.string(),
    currency: z.string().min(1),
    location: z.string(),
    countryCode: z.string().min(2, msg("tenders.errors.countryRequired")),
    diffusionScope: z.enum(tenderDiffusionScopes),
    diffusionCountries: z.array(z.string()),
    opensAt: z.string(),
    submissionDeadline: z
      .string()
      .min(1, msg("tenders.errors.deadlineRequired")),
    evaluationDeadline: z.string(),
    requirements: z.string(),
    // Not enforced yet: the bidding terms page does not exist.
    acceptedBiddingTerms: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const min = data.budgetMin.trim();
    const max = data.budgetMax.trim();

    if (min && !/^\d+$/.test(min)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budgetMin"],
        message: msg("tenders.errors.budgetInteger"),
      });
    }
    if (max && !/^\d+$/.test(max)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budgetMax"],
        message: msg("tenders.errors.budgetInteger"),
      });
    }
    if (
      data.diffusionScope === "COUNTRIES" &&
      !data.diffusionCountries.some((code) => code !== data.countryCode)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["diffusionCountries"],
        message: msg("tenders.errors.diffusionCountriesRequired"),
      });
    }
    if (min && max && /^\d+$/.test(min) && /^\d+$/.test(max)) {
      if (Number(max) < Number(min)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["budgetMax"],
          message: msg("tenders.errors.budgetMaxBelowMin"),
        });
      }
    }
  });

type TenderFormData = z.infer<typeof tenderFormSchema>;

const defaultValues: TenderFormData = {
  title: "",
  description: "",
  categoryId: "",
  subCategoryId: "",
  type: "SUPPLY",
  status: "OPEN",
  budgetMin: "",
  budgetMax: "",
  currency: "XOF",
  location: "",
  countryCode: "",
  diffusionScope: "COUNTRY",
  diffusionCountries: [],
  opensAt: "",
  submissionDeadline: "",
  evaluationDeadline: "",
  requirements: "",
  acceptedBiddingTerms: false,
};

export default function TenderForm({ tenderId }: { tenderId?: string }) {
  const t = useTranslations("tenders");
  const locale = useLocale();
  const countryName = useMemo(() => countryNamer(locale), [locale]);
  const typeItems = Object.fromEntries(
    tenderTypeEnum.map((type) => [type, t(`type.${type}`)]),
  );
  const diffusionItems = Object.fromEntries(
    tenderDiffusionScopes.map((scope) => [scope, t(`diffusion.${scope}`)]),
  );
  const diffusionAnchor = useComboboxAnchor();
  const router = useRouter();
  const utils = trpc.useUtils();
  const isEdit = !!tenderId;

  const { business } = useBusiness();
  const currentUser = trpc.auth.me.useQuery();

  const [submissionErrors, setSubmissionErrors] = useState<string[]>([]);
  // Card picture: a new file to upload, or the one already saved.
  const [imageFile, setImageFile] = useState<File>();
  // undefined: keep the tender's saved picture; null: removed.
  const [imageOverride, setImageOverride] = useState<string | null>();
  const [isUploading, setIsUploading] = useState(false);
  const createUploadMutation = trpc.media.createUpload.useMutation();
  const createUpload: CreateR2Upload = (input) =>
    createUploadMutation.mutateAsync(input);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const form = useForm<TenderFormData>({
    resolver: zodResolver(tenderFormSchema),
    defaultValues,
  });

  const watchedValues = useWatch({ control: form.control }) as TenderFormData;
  const categoryId = watchedValues.categoryId;
  const diffusionScope = watchedValues.diffusionScope;

  const categories = trpc.catalog.categories.useQuery(undefined);
  const selectedCategory = categories.data?.find((c) => c.id === categoryId);
  const subCategories = trpc.catalog.subCategories.useQuery(
    { categorySlug: selectedCategory?.slug },
    { enabled: !!selectedCategory?.slug },
  );

  const categoryItems = Object.fromEntries(
    (categories.data ?? []).map((cat) => [cat.id, cat.name]),
  );
  const subCategoryItems = Object.fromEntries(
    (subCategories.data ?? []).map((sub) => [sub.id, sub.name]),
  );

  const tenderDetail = trpc.tenders.detail.useQuery(
    { id: tenderId ?? "" },
    { enabled: isEdit },
  );

  // Default the country to the active business' country when creating.
  useEffect(() => {
    if (isEdit) return;
    if (business?.countryCode && !form.getValues("countryCode")) {
      form.setValue("countryCode", business.countryCode);
    }
  }, [business?.countryCode, form, isEdit]);

  // Prefill the form when editing an existing tender.
  useEffect(() => {
    const tender = tenderDetail.data;
    if (!tender) return;

    const requirements =
      typeof tender.requirements === "string"
        ? tender.requirements
        : tender.requirements
          ? JSON.stringify(tender.requirements, null, 2)
          : "";

    form.reset({
      title: tender.title,
      description: tender.description ?? "",
      categoryId: tender.categoryId,
      subCategoryId: tender.subCategoryId,
      type: tender.type,
      status: tender.status,
      budgetMin:
        tender.budgetMinMinor != null ? String(tender.budgetMinMinor) : "",
      budgetMax:
        tender.budgetMaxMinor != null ? String(tender.budgetMaxMinor) : "",
      currency: tender.currency || "XOF",
      location: tender.location ?? "",
      countryCode: tender.countryCode,
      diffusionScope: tender.diffusionScope ?? "COUNTRY",
      diffusionCountries: tender.diffusionCountries ?? [],
      opensAt: toDatetimeLocal(tender.opensAt),
      submissionDeadline: toDatetimeLocal(tender.submissionDeadline),
      evaluationDeadline: toDatetimeLocal(tender.evaluationDeadline),
      requirements,
      acceptedBiddingTerms: false,
    });
  }, [tenderDetail.data, form]);

  const createTender = trpc.tenders.create.useMutation({
    onSuccess: async () => {
      setSubmissionErrors([]);
      await utils.tenders.list.invalidate();
      router.replace("/dashboard/tenders");
      router.refresh();
    },
    onError: (error) => {
      setSubmissionErrors(
        getBackendErrorMessages(error, t("form.createError")),
      );
    },
  });

  const updateTender = trpc.tenders.update.useMutation({
    onSuccess: async () => {
      setSubmissionErrors([]);
      await utils.tenders.list.invalidate();
      router.replace("/dashboard/tenders");
      router.refresh();
    },
    onError: (error) => {
      setSubmissionErrors(
        getBackendErrorMessages(error, t("form.updateError")),
      );
    },
  });

  const deleteTender = trpc.tenders.delete.useMutation({
    onSuccess: async () => {
      setDeleteDialogOpen(false);
      await utils.tenders.list.invalidate();
      router.replace("/dashboard/tenders");
      router.refresh();
    },
    onError: (error) => {
      setDeleteDialogOpen(false);
      setSubmissionErrors(
        getBackendErrorMessages(error, t("form.deleteError")),
      );
    },
  });

  const savedImage =
    imageOverride !== undefined
      ? imageOverride
      : (tenderDetail.data?.image ?? null);
  const imagePreview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : undefined),
    [imageFile],
  );
  useEffect(
    () => () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    },
    [imagePreview],
  );

  const isMutating =
    isUploading || createTender.isPending || updateTender.isPending;

  const onSubmit = async (data: TenderFormData) => {
    if (isMutating) return;

    const publisherUserId = currentUser.data?.id;
    if (!publisherUserId) {
      setSubmissionErrors([t("form.noUser")]);
      return;
    }

    setSubmissionErrors([]);

    const submissionDeadline = fromDatetimeLocal(data.submissionDeadline);
    if (!submissionDeadline) {
      setSubmissionErrors([t("form.invalidDeadline")]);
      return;
    }

    let image = savedImage;
    if (imageFile) {
      try {
        setIsUploading(true);
        image =
          (await uploadFileToR2FromBrowser(
            imageFile,
            "images",
            createUpload,
          )) ?? null;
      } catch {
        setSubmissionErrors([t("form.uploadError")]);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    const payload = {
      publisherUserId,
      publisherBusinessId: business?.id ?? null,
      categoryId: data.categoryId,
      subCategoryId: data.subCategoryId,
      title: data.title.trim(),
      description: data.description.trim() ? data.description.trim() : null,
      image,
      type: data.type,
      status: data.status,
      budgetMinMinor: data.budgetMin.trim()
        ? parseInt(data.budgetMin, 10)
        : null,
      budgetMaxMinor: data.budgetMax.trim()
        ? parseInt(data.budgetMax, 10)
        : null,
      currency: data.currency,
      requirements: data.requirements.trim() ? data.requirements.trim() : null,
      location: data.location.trim() ? data.location.trim() : null,
      countryCode: data.countryCode,
      diffusionScope: data.diffusionScope,
      diffusionCountries:
        data.diffusionScope === "COUNTRIES" ? data.diffusionCountries : [],
      opensAt: fromDatetimeLocal(data.opensAt),
      submissionDeadline,
      evaluationDeadline: fromDatetimeLocal(data.evaluationDeadline),
    };

    if (isEdit && tenderId) {
      updateTender.mutate({ id: tenderId, ...payload });
    } else {
      createTender.mutate(payload);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">
            {isEdit ? t("form.editTitle") : t("form.createTitle")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isEdit ? t("form.editDescription") : t("form.createDescription")}
          </p>
        </div>

        {isEdit && (
          <Button
            type="button"
            variant="destructive"
            disabled={isMutating || deleteTender.isPending}
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2Icon className="size-4" />
            {t("form.delete")}
          </Button>
        )}
      </div>

      {submissionErrors.length > 0 && (
        <div className="border-destructive/30 bg-destructive/5 flex flex-wrap gap-2 rounded-md border p-3">
          {submissionErrors.map((error, index) => (
            <Badge
              key={`${error}-${index}`}
              variant="destructive"
              className="max-w-full text-start whitespace-normal"
            >
              <AlertCircle className="size-3" />
              {error}
            </Badge>
          ))}
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-bold">{t("form.general")}</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Controller
                    name="title"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>{t("form.title")}</FieldLabel>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          placeholder={t("form.titlePlaceholder")}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="description"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>{t("form.description")}</FieldLabel>
                        <Textarea
                          {...field}
                          rows={5}
                          placeholder={t("form.descriptionPlaceholder")}
                        />
                      </Field>
                    )}
                  />

                  <Field>
                    <FieldLabel htmlFor="tender-image">
                      {t("form.photo")}
                    </FieldLabel>
                    {(imageFile || savedImage) && (
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview ?? savedImage ?? undefined}
                          alt={t("form.photoPreview")}
                          className="h-20 w-32 rounded-md border object-cover"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setImageFile(undefined);
                            setImageOverride(null);
                          }}
                        >
                          {t("form.removePhoto")}
                        </Button>
                      </div>
                    )}
                    <Input
                      id="tender-image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) =>
                        setImageFile(event.target.files?.[0] ?? undefined)
                      }
                    />
                    <p className="text-muted-foreground text-xs">
                      {t("form.photoHint")}
                    </p>
                  </Field>

                  <Controller
                    name="type"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>{t("form.type")}</FieldLabel>
                        <Select
                          items={typeItems}
                          value={field.value}
                          onValueChange={(val) => val && field.onChange(val)}
                        >
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue
                              placeholder={t("form.typePlaceholder")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {tenderTypeEnum.map((type) => (
                              <SelectItem key={type} value={type}>
                                {t(`type.${type}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-bold">
                  {t("form.categoryCard")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="categoryId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>{t("form.category")}</FieldLabel>
                        <Select
                          items={categoryItems}
                          value={field.value}
                          onValueChange={(val) => {
                            if (!val) return;
                            field.onChange(val);
                            // Reset without validating: "required" would show
                            // before the user had a chance to pick one.
                            form.setValue("subCategoryId", "");
                          }}
                          disabled={categories.isLoading}
                        >
                          <SelectTrigger
                            aria-invalid={fieldState.invalid}
                            className="h-9 w-full"
                          >
                            <SelectValue
                              placeholder={
                                categories.isLoading
                                  ? t("form.loading")
                                  : t("form.categoryPlaceholder")
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {(categories.data ?? []).map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="subCategoryId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>{t("form.subCategory")}</FieldLabel>
                        <Select
                          items={subCategoryItems}
                          value={field.value}
                          onValueChange={(val) => val && field.onChange(val)}
                          disabled={!categoryId || subCategories.isLoading}
                        >
                          <SelectTrigger
                            aria-invalid={fieldState.invalid}
                            className="h-9 w-full"
                          >
                            <SelectValue
                              placeholder={
                                !categoryId
                                  ? t("form.categoryFirst")
                                  : subCategories.isLoading
                                    ? t("form.loading")
                                    : t("form.subCategoryPlaceholder")
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {(subCategories.data ?? []).map((sub) => (
                              <SelectItem key={sub.id} value={sub.id}>
                                {sub.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-bold">
                  {t("form.requirementsCard")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Controller
                  name="requirements"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>{t("form.requirements")}</FieldLabel>
                      <Textarea
                        {...field}
                        rows={4}
                        placeholder={t("form.requirementsPlaceholder")}
                      />
                    </Field>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-bold">{t("form.budget")}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Controller
                  name="currency"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>{t("form.currency")}</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={(val) => val && field.onChange(val)}
                      >
                        <SelectTrigger className="h-9 w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="XOF">Fcfa</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="budgetMin"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>{t("form.budgetMin")}</FieldLabel>
                        <InputGroup>
                          <InputGroupAddon
                            align="inline-start"
                            className="bg-primary/25"
                          >
                            {watchedValues.currency}
                          </InputGroupAddon>
                          <InputGroupInput
                            type="number"
                            min={0}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            aria-invalid={fieldState.invalid}
                            placeholder="0"
                          />
                        </InputGroup>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="budgetMax"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>{t("form.budgetMax")}</FieldLabel>
                        <InputGroup>
                          <InputGroupAddon
                            align="inline-start"
                            className="bg-primary/25"
                          >
                            {watchedValues.currency}
                          </InputGroupAddon>
                          <InputGroupInput
                            type="number"
                            min={0}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            aria-invalid={fieldState.invalid}
                            placeholder="0"
                          />
                        </InputGroup>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-bold">
                  {t("form.location")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Controller
                    name="countryCode"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>{t("form.country")}</FieldLabel>
                        <Combobox
                          items={COUNTRY_CODES}
                          itemToStringLabel={(code) => countryName(code)}
                          value={field.value || null}
                          onValueChange={(value) => field.onChange(value ?? "")}
                        >
                          <ComboboxInput
                            placeholder={t("form.countryPlaceholder")}
                            showClear
                            className="w-full"
                            aria-invalid={fieldState.invalid}
                          />
                          <ComboboxContent>
                            <ComboboxEmpty>{t("form.noCountry")}</ComboboxEmpty>
                            <ComboboxList>
                              {countries.map((country) => (
                                <ComboboxItem
                                  key={country.code}
                                  value={country.code}
                                >
                                  {countryName(country.code)}
                                </ComboboxItem>
                              ))}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="diffusionScope"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>{t("form.diffusion")}</FieldLabel>
                        <Select
                          items={diffusionItems}
                          value={field.value}
                          onValueChange={(val) => val && field.onChange(val)}
                        >
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {tenderDiffusionScopes.map((scope) => (
                              <SelectItem key={scope} value={scope}>
                                {t(`diffusion.${scope}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {t("form.diffusionHelp")}
                        </p>
                      </Field>
                    )}
                  />

                  {diffusionScope === "COUNTRIES" && (
                    <Controller
                      name="diffusionCountries"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>{t("form.diffusionCountries")}</FieldLabel>
                          <Combobox
                            multiple
                            items={COUNTRY_CODES}
                            itemToStringLabel={(code) => countryName(code)}
                            value={field.value}
                            onValueChange={(value) => field.onChange(value)}
                          >
                            <ComboboxChips ref={diffusionAnchor} className="w-full">
                              <ComboboxValue>
                                {(values: string[]) => (
                                  <>
                                    {values.map((code) => (
                                      <ComboboxChip key={code}>
                                        {countryName(code)}
                                      </ComboboxChip>
                                    ))}
                                    <ComboboxChipsInput
                                      placeholder={
                                        values.length
                                          ? undefined
                                          : t("form.diffusionCountriesPlaceholder")
                                      }
                                      aria-invalid={fieldState.invalid}
                                    />
                                  </>
                                )}
                              </ComboboxValue>
                            </ComboboxChips>
                            <ComboboxContent anchor={diffusionAnchor}>
                              <ComboboxEmpty>{t("form.noCountry")}</ComboboxEmpty>
                              <ComboboxList>
                                {(code: string) => (
                                  <ComboboxItem key={code} value={code}>
                                    {countryName(code)}
                                  </ComboboxItem>
                                )}
                              </ComboboxList>
                            </ComboboxContent>
                          </Combobox>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  )}

                  <Controller
                    name="location"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>{t("form.place")}</FieldLabel>
                        <Input
                          {...field}
                          placeholder={t("form.placePlaceholder")}
                        />
                      </Field>
                    )}
                  />
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-bold">
                  {t("form.deadlines")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Controller
                    name="opensAt"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>{t("form.opensAt")}</FieldLabel>
                        <Input {...field} type="datetime-local" />
                      </Field>
                    )}
                  />

                  <Controller
                    name="submissionDeadline"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>{t("form.submissionDeadline")}</FieldLabel>
                        <Input
                          {...field}
                          type="datetime-local"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="evaluationDeadline"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>{t("form.evaluationDeadline")}</FieldLabel>
                        <Input {...field} type="datetime-local" />
                      </Field>
                    )}
                  />
                </FieldGroup>
              </CardContent>
            </Card>
          </div>
        </div>

        <Controller
          name="acceptedBiddingTerms"
          control={form.control}
          render={({ field }) => (
            <label className="mt-6 flex items-start gap-3 text-sm">
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              <span>{t("form.terms")}</span>
            </label>
          )}
        />

        <Button
          type="submit"
          className="mt-4 h-14 w-full text-base"
          disabled={isMutating || deleteTender.isPending}
        >
          {createTender.isPending
            ? t("form.creating")
            : updateTender.isPending
              ? t("form.updating")
              : isEdit
                ? t("form.save")
                : t("form.publish")}
        </Button>
      </form>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.textUntitled")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTender.isPending}>
              {t("deleteDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteTender.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (tenderId) deleteTender.mutate({ id: tenderId });
              }}
            >
              {deleteTender.isPending
                ? t("deleteDialog.deleting")
                : t("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
