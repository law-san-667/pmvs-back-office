"use client";

import Tiptap from "@/components/editor/tiptap";
import {
  CategorySelects,
  CountryCombobox,
  ListingDeleteDialog,
  optionalInt,
  optionalNumber,
  optionalText,
  richTextOrNull,
  SubmissionErrors,
  useListingMutations,
} from "@/components/forms/listing-form-shared";
import {
  ListingCropDialog,
  ListingMediaFields,
  useListingMedia,
} from "@/components/forms/listing-media";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getMutationErrorMessage } from "@/lib/mutation-error";
import {
  uploadFilesToR2FromBrowser,
  type CreateR2Upload,
} from "@/lib/upload-to-r2";
import {
  listingAvailabilityChannelEnum,
  listingExposureEnum,
  listingStockPolicyEnum,
  type Listing,
  type ListingBrand,
  type ListingCertificate,
  type ListingSpecificsSection,
  type MarketPriceInput,
} from "@/lib/validators/listings-services";
import { msg, useValidationMessage } from "@/lib/validators/messages";
import { trpc } from "@/server/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileTextIcon, PlusIcon, Trash2Icon, UploadIcon, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type FieldPath,
  type UseFormReturn,
} from "react-hook-form";
import { z } from "zod";

const DEFAULT_MARKET = "SN";
const MAX_VARIANTS = 8;

/** Label of each enum value, built from productFormEnterprise.<group>.<value>. */
const optionLabels = <T extends string>(
  values: readonly T[],
  label: (value: T) => string,
) =>
  Object.fromEntries(values.map((value) => [value, label(value)])) as Record<
    T,
    string
  >;

/** Message keys of the step titles (productFormEnterprise.steps.*). */
const STEPS = [
  "info",
  "logistics",
  "description",
  "features",
  "photos",
] as const;

const CERTIFICATE_ACCEPT = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "application/pdf": [".pdf"],
};

const integerString = (message: string) =>
  z.string().refine((value) => !value.trim() || /^\d+$/.test(value.trim()), {
    message,
  });
const decimalString = (message: string) =>
  z
    .string()
    .refine(
      (value) =>
        !value.trim() || (Number.isFinite(Number(value)) && Number(value) >= 0),
      { message },
    );
const percentString = decimalString(
  msg("productFormEnterprise.errors.percentInvalid"),
).refine((value) => !value.trim() || Number(value) <= 100, {
  message: msg("productFormEnterprise.errors.percentMax"),
});

const b2cPriceSchema = z.object({
  countryCode: z
    .string()
    .min(2, msg("productFormEnterprise.errors.marketRequired")),
  priceAmountMinor: integerString(
    msg("productFormEnterprise.errors.priceInvalid"),
  ).refine((value) => value.trim().length > 0, {
    message: msg("productFormEnterprise.errors.priceRequired"),
  }),
  vatRatePercent: percentString,
  vmpCommissionPercent: percentString,
  ddpPriceAmountMinor: integerString(
    msg("productFormEnterprise.errors.ddpPriceInvalid"),
  ),
});

const b2bPriceSchema = z.object({
  countryCode: z
    .string()
    .min(2, msg("productFormEnterprise.errors.marketRequired")),
  priceAmountMinor: integerString(
    msg("productFormEnterprise.errors.priceInvalid"),
  ).refine((value) => value.trim().length > 0, {
    message: msg("productFormEnterprise.errors.fobPriceRequired"),
  }),
  minOrderQuantity: integerString(
    msg("productFormEnterprise.errors.quantityInvalid"),
  ),
  agentCommissionPercent: percentString,
  cartonsPerPallet: integerString(
    msg("productFormEnterprise.errors.numberInvalid"),
  ),
  containerType: z.string(),
  unitsPerContainer: integerString(
    msg("productFormEnterprise.errors.numberInvalid"),
  ),
});

const variantSchema = z.object({
  name: z.string(),
  values: z.string(),
});

const enterpriseFormSchema = z.object({
  // Step 1
  launchDate: z.string(),
  gs1Reference: z.string(),
  internalReference: z.string(),
  region: z.string(),
  exposure: z.enum(["", ...listingExposureEnum]),
  brand: z.string(),
  title: z
    .string()
    .trim()
    .min(1, msg("productFormEnterprise.errors.titleRequired")),
  shortDescription: z.string(),
  isService: z.boolean(),
  categoryId: z
    .string()
    .min(1, msg("productFormEnterprise.errors.categoryRequired")),
  subCategoryId: z
    .string()
    .min(1, msg("productFormEnterprise.errors.subCategoryRequired")),
  currency: z.string().min(1),
  b2cPrices: z
    .array(b2cPriceSchema)
    .min(1, msg("productFormEnterprise.errors.b2cRequired")),
  b2bPrices: z.array(b2bPriceSchema),
  // Step 2
  hsCode: z.string(),
  ean13: z.string(),
  cupCode: z.string(),
  isFragile: z.boolean(),
  packaging: z.string(),
  unit: z.string(),
  baseValueMinor: integerString(msg("productFormEnterprise.errors.valueInvalid")),
  grossWeightKg: decimalString(msg("productFormEnterprise.errors.weightInvalid")),
  widthCm: decimalString(msg("productFormEnterprise.errors.widthInvalid")),
  heightCm: decimalString(msg("productFormEnterprise.errors.heightInvalid")),
  depthCm: decimalString(msg("productFormEnterprise.errors.depthInvalid")),
  weightVolumeRatio: z.string(),
  packagingType: z.string(),
  transporters: z.string(),
  readyToShip: z.boolean(),
  availableOn: z.enum(["", ...listingAvailabilityChannelEnum]),
  storageLocation: z.string(),
  stock: integerString(msg("productFormEnterprise.errors.quantityInvalid")),
  lowStockThreshold: integerString(
    msg("productFormEnterprise.errors.thresholdInvalid"),
  ),
  leadTime: z.string(),
  outOfStockPolicy: z.enum(["", ...listingStockPolicyEnum]),
  specialDeliveryTime: z.string(),
  // Step 3
  description: z.string(),
  history: z.string(),
  composition: z.string(),
  nutrition: z.string(),
  benefits: z.string(),
  storage: z.string(),
  maintenance: z.string(),
  manufacturing: z.string(),
  // Step 4
  variants: z.array(variantSchema).max(MAX_VARIANTS),
  seoTitle: z
    .string()
    .max(70, msg("productFormEnterprise.errors.seoTitleMax")),
  seoExternalUrl: z
    .string()
    .refine((value) => !value.trim() || z.url().safeParse(value).success, {
      message: msg("productFormEnterprise.errors.urlInvalid"),
    }),
  seoMetaDescription: z
    .string()
    .max(160, msg("productFormEnterprise.errors.metaDescriptionMax")),
});

type EnterpriseFormData = z.infer<typeof enterpriseFormSchema>;
type FormControl = Control<EnterpriseFormData>;

const emptyB2cPrice = (countryCode = ""): EnterpriseFormData["b2cPrices"][number] => ({
  countryCode,
  priceAmountMinor: "",
  vatRatePercent: "",
  vmpCommissionPercent: "",
  ddpPriceAmountMinor: "",
});

const emptyB2bPrice = (): EnterpriseFormData["b2bPrices"][number] => ({
  countryCode: "",
  priceAmountMinor: "",
  minOrderQuantity: "",
  agentCommissionPercent: "",
  cartonsPerPallet: "",
  containerType: "",
  unitsPerContainer: "",
});

const emptyValues: EnterpriseFormData = {
  launchDate: "",
  gs1Reference: "",
  internalReference: "",
  region: "",
  exposure: "",
  brand: "",
  title: "",
  shortDescription: "",
  isService: false,
  categoryId: "",
  subCategoryId: "",
  currency: "XOF",
  b2cPrices: [emptyB2cPrice(DEFAULT_MARKET)],
  b2bPrices: [],
  hsCode: "",
  ean13: "",
  cupCode: "",
  isFragile: false,
  packaging: "",
  unit: "",
  baseValueMinor: "",
  grossWeightKg: "",
  widthCm: "",
  heightCm: "",
  depthCm: "",
  weightVolumeRatio: "",
  packagingType: "",
  transporters: "",
  readyToShip: true,
  availableOn: "",
  storageLocation: "",
  stock: "",
  lowStockThreshold: "",
  leadTime: "",
  outOfStockPolicy: "",
  specialDeliveryTime: "",
  description: "",
  history: "",
  composition: "",
  nutrition: "",
  benefits: "",
  storage: "",
  maintenance: "",
  manufacturing: "",
  variants: [{ name: "", values: "" }],
  seoTitle: "",
  seoExternalUrl: "",
  seoMetaDescription: "",
};

const str = (value: string | number | null | undefined) =>
  value === null || value === undefined ? "" : String(value);

const toFormValues = (listing: Listing): EnterpriseFormData => {
  const b2c = listing.marketPrices.filter((price) => price.priceType === "B2C");
  const b2b = listing.marketPrices.filter((price) => price.priceType === "B2B");

  return {
    ...emptyValues,
    launchDate: listing.launchDate ?? "",
    gs1Reference: listing.gs1Reference ?? "",
    internalReference: listing.internalReference ?? "",
    region: listing.region ?? "",
    exposure: listing.exposure ?? "",
    brand: listing.brand ?? "",
    title: listing.title,
    shortDescription: listing.shortDescription ?? "",
    isService: listing.isService,
    categoryId: listing.categoryId,
    subCategoryId: listing.subCategoryId,
    currency: listing.currency || "XOF",
    b2cPrices: b2c.length
      ? b2c.map((price) => ({
          countryCode: price.countryCode,
          priceAmountMinor: str(price.priceAmountMinor),
          vatRatePercent: str(price.vatRatePercent),
          vmpCommissionPercent: str(price.vmpCommissionPercent),
          ddpPriceAmountMinor: str(price.ddpPriceAmountMinor),
        }))
      : [
          {
            ...emptyB2cPrice(DEFAULT_MARKET),
            priceAmountMinor:
              listing.priceAmountMinor >= 0 ? str(listing.priceAmountMinor) : "",
          },
        ],
    b2bPrices: b2b.map((price) => ({
      countryCode: price.countryCode,
      priceAmountMinor: str(price.priceAmountMinor),
      minOrderQuantity: str(price.minOrderQuantity),
      agentCommissionPercent: str(price.agentCommissionPercent),
      cartonsPerPallet: str(price.cartonsPerPallet),
      containerType: price.containerType ?? "",
      unitsPerContainer: str(price.unitsPerContainer),
    })),
    hsCode: listing.hsCode ?? "",
    ean13: listing.ean13 ?? "",
    cupCode: listing.cupCode ?? "",
    isFragile: listing.isFragile ?? false,
    packaging: listing.logistics?.packaging ?? "",
    unit: listing.logistics?.unit ?? "",
    baseValueMinor: str(listing.logistics?.baseValueMinor),
    grossWeightKg: str(listing.logistics?.grossWeightKg),
    widthCm: str(listing.logistics?.widthCm),
    heightCm: str(listing.logistics?.heightCm),
    depthCm: str(listing.logistics?.depthCm),
    weightVolumeRatio: listing.logistics?.weightVolumeRatio ?? "",
    packagingType: listing.logistics?.packagingType ?? "",
    transporters: listing.transporters ?? "",
    readyToShip: listing.readyToShip ?? true,
    availableOn: listing.availableOn ?? "",
    storageLocation: listing.storageLocation ?? "",
    stock: listing.quantityAvailable ? str(listing.quantityAvailable) : "",
    lowStockThreshold:
      listing.lowStockThreshold != null ? str(listing.lowStockThreshold) : "",
    leadTime: listing.leadTime ?? "",
    outOfStockPolicy: listing.outOfStockPolicy ?? "",
    specialDeliveryTime: listing.specialDeliveryTime ?? "",
    description: listing.description ?? "",
    history: listing.editorial?.history ?? "",
    composition: listing.editorial?.composition ?? "",
    nutrition: listing.editorial?.nutrition ?? "",
    benefits: listing.editorial?.benefits ?? "",
    storage: listing.editorial?.storage ?? "",
    maintenance: listing.editorial?.maintenance ?? "",
    manufacturing: listing.editorial?.manufacturing ?? "",
    variants: listing.specificsSections.length
      ? listing.specificsSections.map((section) => ({
          name: section.title,
          values: section.items
            .map((item) => String(item.value ?? item.label))
            .join(", "),
        }))
      : [{ name: "", values: "" }],
    seoTitle: listing.seo?.title ?? "",
    seoExternalUrl: listing.seo?.externalUrl ?? "",
    seoMetaDescription: listing.seo?.metaDescription ?? "",
  };
};

/** Fields validated before leaving each step. */
const STEP_FIELDS: FieldPath<EnterpriseFormData>[][] = [
  ["title", "categoryId", "subCategoryId", "b2cPrices", "b2bPrices"],
  [
    "baseValueMinor",
    "grossWeightKg",
    "widthCm",
    "heightCm",
    "depthCm",
    "stock",
    "lowStockThreshold",
  ],
  [],
  ["variants", "seoTitle", "seoExternalUrl", "seoMetaDescription"],
  [],
];

const cleanObject = <T extends Record<string, unknown>>(input: T) => {
  const entries = Object.entries(input).filter(
    ([, value]) => value !== undefined && value !== null && value !== "",
  );
  return entries.length ? (Object.fromEntries(entries) as Partial<T>) : null;
};

type ManagedCertificate = {
  key: string;
  name: string;
  url?: string;
  file?: File;
};

/** A brand row: name plus a logo already online or still to upload. */
type ManagedBrand = {
  key: string;
  name: string;
  logoUrl?: string;
  logoFile?: File;
};

const MAX_BRANDS = 4;

// ─── Small field helpers ─────────────────────────────────────────────────────

function TextField({
  control,
  name,
  label,
  placeholder,
  type = "text",
  hint,
}: {
  control: FormControl;
  name: FieldPath<EnterpriseFormData>;
  label: string;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  hint?: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>{label}</FieldLabel>
          <Input
            value={typeof field.value === "string" ? field.value : ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            type={type}
            placeholder={placeholder}
            aria-invalid={fieldState.invalid}
          />
          {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

function TextareaField({
  control,
  name,
  label,
  placeholder,
  rows = 4,
}: {
  control: FormControl;
  name: FieldPath<EnterpriseFormData>;
  label: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>{label}</FieldLabel>
          <Textarea
            value={typeof field.value === "string" ? field.value : ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder={placeholder}
            rows={rows}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

function SelectField<T extends string>({
  control,
  name,
  label,
  options,
  placeholder,
}: {
  control: FormControl;
  name: FieldPath<EnterpriseFormData>;
  label: string;
  options: Record<T, string>;
  placeholder?: string;
}) {
  const t = useTranslations("productFormEnterprise");

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Field>
          <FieldLabel>{label}</FieldLabel>
          <select
            value={typeof field.value === "string" ? field.value : ""}
            onChange={(event) => field.onChange(event.target.value)}
            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
          >
            <option value="">{placeholder ?? t("select")}</option>
            {(Object.keys(options) as T[]).map((value) => (
              <option key={value} value={value}>
                {options[value]}
              </option>
            ))}
          </select>
        </Field>
      )}
    />
  );
}

function CheckboxField({
  control,
  name,
  label,
  description,
}: {
  control: FormControl;
  name: FieldPath<EnterpriseFormData>;
  label: string;
  description?: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <label className="flex items-start gap-3 text-sm">
          <Checkbox
            checked={Boolean(field.value)}
            onCheckedChange={(value) => field.onChange(!!value)}
          />
          <span className="grid gap-1">
            <span className="font-medium">{label}</span>
            {description && (
              <span className="text-muted-foreground">{description}</span>
            )}
          </span>
        </label>
      )}
    />
  );
}

// ─── Step 1: Informations et prix ────────────────────────────────────────────

function Step1({ form }: { form: UseFormReturn<EnterpriseFormData> }) {
  const t = useTranslations("productFormEnterprise");
  const validation = useValidationMessage();
  const { control } = form;
  const isService = useWatch({ control, name: "isService" });
  const categoryId = useWatch({ control, name: "categoryId" });
  const subCategoryId = useWatch({ control, name: "subCategoryId" });
  const currency = useWatch({ control, name: "currency" });
  const b2c = useFieldArray({ control, name: "b2cPrices" });
  const b2b = useFieldArray({ control, name: "b2bPrices" });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-bold">{t("step1.productInfo")}</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                control={control}
                name="launchDate"
                label={t("step1.launchDate")}
                type="date"
              />
              <TextField
                control={control}
                name="gs1Reference"
                label={t("step1.gs1Reference")}
                placeholder="xxxxxx"
              />
              <TextField
                control={control}
                name="internalReference"
                label={t("step1.internalReference")}
              />
              <TextField
                control={control}
                name="region"
                label={t("step1.region")}
                placeholder={t("step1.regionPlaceholder")}
              />
              <SelectField
                control={control}
                name="exposure"
                label={t("step1.exposure")}
                options={optionLabels(listingExposureEnum, (value) =>
                  t(`exposure.${value}`),
                )}
              />
              <TextField
                control={control}
                name="brand"
                label={t("step1.brand")}
                placeholder={t("step1.brandPlaceholder")}
              />
            </div>

            <TextField
              control={control}
              name="title"
              label={t("step1.title")}
              placeholder={t("step1.titlePlaceholder")}
            />

            <TextareaField
              control={control}
              name="shortDescription"
              label={t("step1.shortDescription")}
              placeholder={t("step1.shortDescriptionPlaceholder")}
              rows={3}
            />

            <CheckboxField
              control={control}
              name="isService"
              label={t("step1.isService")}
              description={t("step1.isServiceHint")}
            />

            <CategorySelects
              isService={isService}
              categoryId={categoryId}
              subCategoryId={subCategoryId}
              onCategoryChange={(value) => {
                form.setValue("categoryId", value, { shouldValidate: true });
                form.setValue("subCategoryId", "", { shouldValidate: true });
              }}
              onSubCategoryChange={(value) =>
                form.setValue("subCategoryId", value, { shouldValidate: true })
              }
              categoryError={form.formState.errors.categoryId}
              subCategoryError={form.formState.errors.subCategoryId}
            />

            <Field>
              <FieldLabel>{t("step1.currency")}</FieldLabel>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <select
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value)}
                    className="border-input bg-background h-9 w-40 rounded-md border px-3 text-sm"
                  >
                    <option value="XOF">Fcfa (XOF)</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                )}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-bold">{t("step1.b2cTitle")}</CardTitle>
          <p className="text-muted-foreground text-sm">{t("step1.b2cHint")}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {form.formState.errors.b2cPrices?.root?.message && (
            <p className="text-destructive text-sm">
              {validation.text(form.formState.errors.b2cPrices.root.message)}
            </p>
          )}
          {form.formState.errors.b2cPrices?.message && (
            <p className="text-destructive text-sm">
              {validation.text(form.formState.errors.b2cPrices.message)}
            </p>
          )}
          {b2c.fields.map((row, index) => (
            <div key={row.id} className="rounded-md border p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium">
                  {row.countryCode === DEFAULT_MARKET
                    ? t("step1.defaultMarket", { number: index + 1 })
                    : t("step1.market", { number: index + 1 })}
                </p>
                {b2c.fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => b2c.remove(index)}
                  >
                    <X /> {t("step1.remove")}
                  </Button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name={`b2cPrices.${index}.countryCode`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>{t("step1.targetMarket")}</FieldLabel>
                      <CountryCombobox
                        value={field.value}
                        onChange={field.onChange}
                        invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <TextField
                  control={control}
                  name={`b2cPrices.${index}.priceAmountMinor`}
                  label={t("step1.priceWithShipping", { currency })}
                  type="number"
                  placeholder="12 000"
                />
                <TextField
                  control={control}
                  name={`b2cPrices.${index}.vatRatePercent`}
                  label={t("step1.vat")}
                  type="number"
                  placeholder="18"
                />
                <TextField
                  control={control}
                  name={`b2cPrices.${index}.vmpCommissionPercent`}
                  label={t("step1.vmpCommission")}
                  type="number"
                  placeholder={t("step1.vmpCommissionPlaceholder")}
                />
                <TextField
                  control={control}
                  name={`b2cPrices.${index}.ddpPriceAmountMinor`}
                  label={t("step1.ddpPrice", { currency })}
                  type="number"
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => b2c.append(emptyB2cPrice())}
          >
            <PlusIcon /> {t("step1.addB2c")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-bold">{t("step1.b2bTitle")}</CardTitle>
          <p className="text-muted-foreground text-sm">{t("step1.b2bHint")}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {b2b.fields.map((row, index) => (
            <div key={row.id} className="rounded-md border p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium">
                  {t("step1.b2bMarket", { number: index + 1 })}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => b2b.remove(index)}
                >
                  <X /> {t("step1.remove")}
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name={`b2bPrices.${index}.countryCode`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>{t("step1.targetMarket")}</FieldLabel>
                      <CountryCombobox
                        value={field.value}
                        onChange={field.onChange}
                        invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <TextField
                  control={control}
                  name={`b2bPrices.${index}.priceAmountMinor`}
                  label={t("step1.fobPrice", { currency })}
                  type="number"
                />
                <TextField
                  control={control}
                  name={`b2bPrices.${index}.minOrderQuantity`}
                  label={t("step1.moq")}
                  type="number"
                />
                <TextField
                  control={control}
                  name={`b2bPrices.${index}.agentCommissionPercent`}
                  label={t("step1.agentCommission")}
                  type="number"
                  hint={t("step1.agentCommissionHint")}
                />
                <TextField
                  control={control}
                  name={`b2bPrices.${index}.cartonsPerPallet`}
                  label={t("step1.cartonsPerPallet")}
                  type="number"
                  hint={t("step1.cartonsPerPalletHint")}
                />
                <TextField
                  control={control}
                  name={`b2bPrices.${index}.containerType`}
                  label={t("step1.containerType")}
                  placeholder="20', 40', 40' HC…"
                />
                <TextField
                  control={control}
                  name={`b2bPrices.${index}.unitsPerContainer`}
                  label={t("step1.unitsPerContainer")}
                  type="number"
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => b2b.append(emptyB2bPrice())}
          >
            <PlusIcon /> {t("step1.addB2b")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Step 2: Stocks et logistique ────────────────────────────────────────────

function Step2({ form }: { form: UseFormReturn<EnterpriseFormData> }) {
  const t = useTranslations("productFormEnterprise");
  const { control } = form;
  const isService = useWatch({ control, name: "isService" });
  const readyToShip = useWatch({ control, name: "readyToShip" });

  if (isService) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-bold">{t("step2.title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            {t("step2.serviceHint")}
          </p>
          <TextField
            control={control}
            name="leadTime"
            label={t("step2.completionTime")}
            placeholder={t("step2.forSpecificMarket")}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-bold">{t("step2.logistics")}</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                control={control}
                name="hsCode"
                label={t("step2.hsCode")}
              />
              <TextField control={control} name="ean13" label={t("step2.ean13")} />
              <TextField control={control} name="cupCode" label={t("step2.cupCode")} />
              <TextField
                control={control}
                name="packaging"
                label={t("step2.packaging")}
                placeholder={t("step2.packagingPlaceholder")}
              />
              <TextField
                control={control}
                name="unit"
                label={t("step2.unit")}
                placeholder={t("step2.unitPlaceholder")}
              />
              <TextField
                control={control}
                name="baseValueMinor"
                label={t("step2.baseValue")}
                type="number"
              />
              <TextField
                control={control}
                name="grossWeightKg"
                label={t("step2.grossWeight")}
                type="number"
              />
              <TextField
                control={control}
                name="weightVolumeRatio"
                label={t("step2.weightVolumeRatio")}
              />
              <TextField
                control={control}
                name="widthCm"
                label={t("step2.width")}
                type="number"
              />
              <TextField
                control={control}
                name="heightCm"
                label={t("step2.height")}
                type="number"
              />
              <TextField
                control={control}
                name="depthCm"
                label={t("step2.depth")}
                type="number"
              />
              <TextField
                control={control}
                name="packagingType"
                label={t("step2.packagingType")}
                placeholder={t("step2.packagingTypePlaceholder")}
              />
            </div>
            <CheckboxField
              control={control}
              name="isFragile"
              label={t("step2.fragile")}
              description={t("step2.fragileHint")}
            />
            <TextareaField
              control={control}
              name="transporters"
              label={t("step2.transporters")}
              placeholder={t("step2.transportersPlaceholder")}
            />
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-bold">{t("step2.stock")}</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <CheckboxField
              control={control}
              name="readyToShip"
              label={t("step2.readyToShip")}
              description={t("step2.readyToShipHint")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                control={control}
                name="availableOn"
                label={t("step2.availableOn")}
                options={optionLabels(listingAvailabilityChannelEnum, (value) =>
                  t(`availability.${value}`),
                )}
              />
              <TextField
                control={control}
                name="storageLocation"
                label={t("step2.storageLocation")}
                placeholder={t("step2.storageLocationPlaceholder")}
              />
              <TextField
                control={control}
                name="stock"
                label={t("step2.quantity")}
                type="number"
              />
              <TextField
                control={control}
                name="lowStockThreshold"
                label={t("step2.lowStock")}
                placeholder={t("step2.lowStockPlaceholder")}
                type="number"
              />
              <TextField
                control={control}
                name="leadTime"
                label={
                  readyToShip
                    ? t("step2.leadTime")
                    : t("step2.leadTimeWithManufacturing")
                }
                placeholder={t("step2.forSpecificMarket")}
              />
              <SelectField
                control={control}
                name="outOfStockPolicy"
                label={t("step2.outOfStock")}
                options={optionLabels(listingStockPolicyEnum, (value) =>
                  t(`stockPolicy.${value}`),
                )}
                placeholder={t("step2.outOfStockPlaceholder")}
              />
              <TextField
                control={control}
                name="specialDeliveryTime"
                label={t("step2.specialDeliveryTime")}
                placeholder={t("step2.specialDeliveryTimePlaceholder")}
              />
            </div>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Step 3: Description et certifications ───────────────────────────────────

function BrandsCard({
  brands,
  onChange,
}: {
  brands: ManagedBrand[];
  onChange: (brands: ManagedBrand[]) => void;
}) {
  const t = useTranslations("productFormEnterprise.step3");
  const update = (key: string, patch: Partial<ManagedBrand>) =>
    onChange(brands.map((b) => (b.key === key ? { ...b, ...patch } : b)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-bold">{t("brandsTitle")}</CardTitle>
        <p className="text-muted-foreground text-sm">
          {t("brandsHint", { max: MAX_BRANDS })}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {brands.map((brand, index) => (
          <div
            key={brand.key}
            className="grid items-center gap-2 rounded-md border px-3 py-2 sm:grid-cols-[1fr_auto_auto]"
          >
            <Input
              value={brand.name}
              onChange={(event) => update(brand.key, { name: event.target.value })}
              placeholder={t("brandPlaceholder", { number: index + 1 })}
              className="h-8"
            />
            <label className="text-primary cursor-pointer text-xs whitespace-nowrap underline">
              {brand.logoFile
                ? brand.logoFile.name
                : brand.logoUrl
                  ? t("changeLogo")
                  : t("brandLogo")}
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) update(brand.key, { logoFile: file, logoUrl: undefined });
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => onChange(brands.filter((b) => b.key !== brand.key))}
              aria-label={t("removeBrand")}
            >
              <X className="text-muted-foreground size-4" />
            </button>
          </div>
        ))}
        {brands.length < MAX_BRANDS && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() =>
              onChange([...brands, { key: `brand-new-${Date.now()}`, name: "" }])
            }
          >
            {t("addBrand")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function Step3({
  form,
  brands,
  onChangeBrands,
  certificates,
  onAddCertificates,
  onRenameCertificate,
  onRemoveCertificate,
}: {
  form: UseFormReturn<EnterpriseFormData>;
  brands: ManagedBrand[];
  onChangeBrands: (brands: ManagedBrand[]) => void;
  certificates: ManagedCertificate[];
  onAddCertificates: (files: File[]) => void;
  onRenameCertificate: (key: string, name: string) => void;
  onRemoveCertificate: (key: string) => void;
}) {
  const t = useTranslations("productFormEnterprise.step3");
  const { control } = form;
  const dropzone = useDropzone({
    onDrop: onAddCertificates,
    accept: CERTIFICATE_ACCEPT,
    multiple: true,
  });

  return (
    <div className="flex flex-col gap-4">
      <BrandsCard brands={brands} onChange={onChangeBrands} />

      <Card>
        <CardHeader>
          <CardTitle className="font-bold">{t("certificatesTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div
            {...dropzone.getRootProps()}
            className={`flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 transition-colors ${
              dropzone.isDragActive
                ? "border-primary bg-primary/10"
                : "border-muted-foreground/25 bg-muted/30 hover:border-primary/40"
            }`}
          >
            <input {...dropzone.getInputProps()} />
            <UploadIcon className="text-muted-foreground/50 size-8" />
            <span className="text-muted-foreground text-sm">
              {t("certificatesDrop")}
            </span>
          </div>
          {certificates.map((certificate) => (
            <div
              key={certificate.key}
              className="flex items-center gap-2 rounded-md border px-3 py-2"
            >
              <FileTextIcon className="text-muted-foreground size-4 shrink-0" />
              <Input
                value={certificate.name}
                onChange={(event) =>
                  onRenameCertificate(certificate.key, event.target.value)
                }
                placeholder={t("certificateName")}
                className="h-8"
              />
              {certificate.url && (
                <a
                  href={certificate.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary text-xs whitespace-nowrap underline"
                >
                  {t("view")}
                </a>
              )}
              <button
                type="button"
                onClick={() => onRemoveCertificate(certificate.key)}
                aria-label={t("removeCertificate")}
              >
                <X className="text-muted-foreground size-4" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-bold">{t("profileTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>{t("description")}</FieldLabel>
                  <p className="text-muted-foreground text-xs">
                    {t("descriptionHint")}
                  </p>
                  <Tiptap
                    description={field.value ?? ""}
                    onChange={field.onChange}
                    showToolbar={false}
                  />
                </Field>
              )}
            />
            <TextareaField
              control={control}
              name="history"
              label={t("history")}
              placeholder={t("historyPlaceholder")}
            />
            <TextareaField
              control={control}
              name="composition"
              label={t("composition")}
              placeholder={t("compositionPlaceholder")}
            />
            <TextareaField
              control={control}
              name="nutrition"
              label={t("nutrition")}
              placeholder={t("nutritionPlaceholder")}
            />
            <TextareaField
              control={control}
              name="benefits"
              label={t("benefits")}
              placeholder={t("benefitsPlaceholder")}
            />
            <TextareaField
              control={control}
              name="storage"
              label={t("storage")}
              placeholder={t("storagePlaceholder")}
            />
            <TextareaField
              control={control}
              name="maintenance"
              label={t("maintenance")}
              placeholder={t("maintenancePlaceholder")}
            />
            <TextareaField
              control={control}
              name="manufacturing"
              label={t("manufacturing")}
              placeholder={t("manufacturingPlaceholder")}
            />
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Step 4: Caractéristiques et références ──────────────────────────────────

function Step4({ form }: { form: UseFormReturn<EnterpriseFormData> }) {
  const t = useTranslations("productFormEnterprise.step4");
  const { control } = form;
  const variants = useFieldArray({ control, name: "variants" });
  const seoTitle = useWatch({ control, name: "seoTitle" });
  const seoMetaDescription = useWatch({ control, name: "seoMetaDescription" });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-bold">{t("featuresTitle")}</CardTitle>
          <p className="text-muted-foreground text-sm">{t("featuresHint")}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {variants.fields.map((row, index) => (
            <div
              key={row.id}
              className="grid gap-2 sm:grid-cols-[1fr_2fr_auto] sm:items-end"
            >
              <TextField
                control={control}
                name={`variants.${index}.name`}
                label={t("feature", { number: index + 1 })}
                placeholder={t("featurePlaceholder")}
              />
              <TextField
                control={control}
                name={`variants.${index}.values`}
                label={t("values")}
                placeholder={t("valuesPlaceholder")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mb-0.5"
                onClick={() => variants.remove(index)}
                aria-label={t("removeFeature")}
              >
                <X />
              </Button>
            </div>
          ))}
          {variants.fields.length < MAX_VARIANTS && (
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              onClick={() => variants.append({ name: "", values: "" })}
            >
              <PlusIcon /> {t("addFeature")}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-bold">{t("seoTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <TextField
              control={control}
              name="seoTitle"
              label={t("titleTag", { length: seoTitle.length })}
            />
            <TextField
              control={control}
              name="seoExternalUrl"
              label={t("externalUrl")}
              type="url"
              placeholder="https://…"
              hint={t("externalUrlHint")}
            />
            <TextareaField
              control={control}
              name="seoMetaDescription"
              label={t("metaDescription", {
                length: seoMetaDescription.length,
              })}
              placeholder={t("metaDescriptionPlaceholder")}
              rows={3}
            />
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Form ────────────────────────────────────────────────────────────────────

/**
 * Five-step product sheet for SMEs and large enterprises. `listing` is set
 * when editing; mount the component only once it has loaded.
 */
export default function EnterpriseProductForm({
  listing,
}: {
  listing?: Listing;
}) {
  const t = useTranslations("productFormEnterprise");
  const tShared = useTranslations("productForm.shared");
  const isEdit = !!listing;
  const [step, setStep] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [brands, setBrands] = useState<ManagedBrand[]>(() =>
    (listing?.brands ?? []).map((brand, index) => ({
      key: `brand-${index}`,
      name: brand.name,
      logoUrl: brand.logoUrl,
    })),
  );
  const [certificates, setCertificates] = useState<ManagedCertificate[]>(
    () =>
      listing?.certificates.map((certificate) => ({
        key: `existing-${certificate.url}`,
        name: certificate.name,
        url: certificate.url,
      })) ?? [],
  );

  const form = useForm<EnterpriseFormData>({
    resolver: zodResolver(enterpriseFormSchema),
    defaultValues: listing ? toFormValues(listing) : emptyValues,
  });

  const media = useListingMedia(
    listing ? { images: listing.images, video: listing.video } : undefined,
  );

  const createUploadMutation = trpc.media.createUpload.useMutation();
  const createUpload: CreateR2Upload = (input) =>
    createUploadMutation.mutateAsync(input);

  const {
    createListing,
    updateListing,
    deleteListing,
    submissionErrors,
    setSubmissionErrors,
    deleteDialogOpen,
    setDeleteDialogOpen,
  } = useListingMutations();

  const isMutating =
    createListing.isPending || updateListing.isPending || isUploading;
  const isLastStep = step === STEPS.length - 1;

  const addCertificates = (files: File[]) =>
    setCertificates((prev) => [
      ...prev,
      ...files.map((file, index) => ({
        key: `new-${Date.now()}-${index}-${file.name}`,
        name: file.name.replace(/\.[^.]+$/, ""),
        file,
      })),
    ]);

  const goNext = async () => {
    setSubmissionErrors([]);
    const valid = await form.trigger(STEP_FIELDS[step]);
    if (!valid) return;
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const onSubmit = async (data: EnterpriseFormData) => {
    if (isMutating) return;

    setSubmissionErrors([]);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploaded = await media.uploadMedia(createUpload, (progress) =>
        setUploadProgress(Math.round(progress * 0.8)),
      );

      const pendingCertificates = certificates.filter((c) => c.file);
      const certificateUrls = pendingCertificates.length
        ? await uploadFilesToR2FromBrowser(
            pendingCertificates.map((c) => c.file as File),
            "docs",
            createUpload,
            (progress) => setUploadProgress(80 + Math.round(progress * 0.2)),
          )
        : [];
      const urlByKey = new Map(
        pendingCertificates.map((c, index) => [c.key, certificateUrls[index]]),
      );

      const pendingLogos = brands.filter((b) => b.logoFile);
      const logoUrls = pendingLogos.length
        ? await uploadFilesToR2FromBrowser(
            pendingLogos.map((b) => b.logoFile as File),
            "images",
            createUpload,
            () => undefined,
          )
        : [];
      const logoByKey = new Map(
        pendingLogos.map((b, index) => [b.key, logoUrls[index]]),
      );
      const brandsPayload = brands
        .filter((brand) => brand.name.trim())
        .map((brand) => {
          const logoUrl = brand.logoUrl ?? logoByKey.get(brand.key);
          return {
            name: brand.name.trim(),
            ...(logoUrl ? { logoUrl } : {}),
          } satisfies ListingBrand;
        });
      const certificatePayload = certificates
        .map((certificate) => {
          const url = certificate.url ?? urlByKey.get(certificate.key);
          if (!url) return null;
          return {
            name: certificate.name.trim() || t("step3.defaultCertificateName"),
            url,
          } satisfies ListingCertificate;
        })
        .filter((c): c is ListingCertificate => c !== null);

      setIsUploading(false);
      setUploadProgress(100);

      const marketPrices: MarketPriceInput[] = [
        ...data.b2cPrices.map((price) => ({
          countryCode: price.countryCode,
          priceType: "B2C" as const,
          currency: data.currency,
          priceAmountMinor: parseInt(price.priceAmountMinor, 10),
          vatRatePercent: optionalNumber(price.vatRatePercent) ?? null,
          vmpCommissionPercent:
            optionalNumber(price.vmpCommissionPercent) ?? null,
          ddpPriceAmountMinor: optionalInt(price.ddpPriceAmountMinor),
        })),
        ...data.b2bPrices.map((price) => ({
          countryCode: price.countryCode,
          priceType: "B2B" as const,
          currency: data.currency,
          priceAmountMinor: parseInt(price.priceAmountMinor, 10),
          agentCommissionPercent:
            optionalNumber(price.agentCommissionPercent) ?? null,
          minOrderQuantity: optionalInt(price.minOrderQuantity),
          cartonsPerPallet: optionalInt(price.cartonsPerPallet),
          containerType: optionalText(price.containerType),
          unitsPerContainer: optionalInt(price.unitsPerContainer),
        })),
      ];

      // The default (Senegal) B2C price doubles as the listing's base price.
      const defaultPrice =
        data.b2cPrices.find((price) => price.countryCode === DEFAULT_MARKET) ??
        data.b2cPrices[0];

      const specificsSections: ListingSpecificsSection[] = data.variants
        .filter((variant) => variant.name.trim() && variant.values.trim())
        .map((variant) => ({
          title: variant.name.trim(),
          items: variant.values
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
            .map((value) => ({ label: value, value })),
        }));

      const firstB2b = data.b2bPrices[0];

      const payload = {
        title: data.title.trim(),
        description: richTextOrNull(data.description),
        shortDescription: optionalText(data.shortDescription),
        categoryId: data.categoryId,
        subCategoryId: data.subCategoryId,
        isService: data.isService,
        condition: "NEW" as const,
        priceAmountMinor: parseInt(defaultPrice.priceAmountMinor, 10),
        currency: data.currency,
        quantityAvailable:
          !data.isService && data.stock.trim()
            ? parseInt(data.stock, 10)
            : undefined,
        lowStockThreshold:
          !data.isService && data.lowStockThreshold.trim()
            ? parseInt(data.lowStockThreshold, 10)
            : null,
        images: uploaded.images.length > 0 ? uploaded.images : undefined,
        video: uploaded.video,
        specificsSections,
        isFragile: data.isService ? null : data.isFragile,
        brand: optionalText(data.brand),
        launchDate: optionalText(data.launchDate),
        gs1Reference: optionalText(data.gs1Reference),
        internalReference: optionalText(data.internalReference),
        region: optionalText(data.region),
        exposure: data.exposure || null,
        hsCode: optionalText(data.hsCode),
        ean13: optionalText(data.ean13),
        cupCode: optionalText(data.cupCode),
        readyToShip: data.isService ? null : data.readyToShip,
        availableOn: data.availableOn || null,
        storageLocation: optionalText(data.storageLocation),
        leadTime: optionalText(data.leadTime),
        outOfStockPolicy: data.outOfStockPolicy || null,
        specialDeliveryTime: optionalText(data.specialDeliveryTime),
        transporters: optionalText(data.transporters),
        // Mirror the first B2B MOQ so the shared field stays meaningful.
        minOrderQuantity: firstB2b
          ? optionalInt(firstB2b.minOrderQuantity)
          : null,
        logistics: data.isService
          ? null
          : cleanObject({
              packaging: optionalText(data.packaging) ?? undefined,
              unit: optionalText(data.unit) ?? undefined,
              baseValueMinor: optionalInt(data.baseValueMinor) ?? undefined,
              grossWeightKg: optionalNumber(data.grossWeightKg),
              widthCm: optionalNumber(data.widthCm),
              heightCm: optionalNumber(data.heightCm),
              depthCm: optionalNumber(data.depthCm),
              weightVolumeRatio:
                optionalText(data.weightVolumeRatio) ?? undefined,
              packagingType: optionalText(data.packagingType) ?? undefined,
            }),
        editorial: cleanObject({
          history: optionalText(data.history) ?? undefined,
          composition: optionalText(data.composition) ?? undefined,
          nutrition: optionalText(data.nutrition) ?? undefined,
          benefits: optionalText(data.benefits) ?? undefined,
          storage: optionalText(data.storage) ?? undefined,
          maintenance: optionalText(data.maintenance) ?? undefined,
          manufacturing: optionalText(data.manufacturing) ?? undefined,
        }),
        seo: cleanObject({
          title: optionalText(data.seoTitle) ?? undefined,
          externalUrl: optionalText(data.seoExternalUrl) ?? undefined,
          metaDescription: optionalText(data.seoMetaDescription) ?? undefined,
        }),
        certificates: certificatePayload,
        brands: brandsPayload,
        marketPrices,
      };

      if (isEdit) {
        updateListing.mutate({ id: listing.id, ...payload });
      } else {
        createListing.mutate(payload);
      }
    } catch (error) {
      setIsUploading(false);
      setSubmissionErrors([
        getMutationErrorMessage(error, t("uploadError")),
      ]);
    }
  };

  const onInvalid = () => {
    // Send the user back to the first step holding an error.
    const errorKeys = Object.keys(form.formState.errors);
    const firstStep = STEP_FIELDS.findIndex((fields) =>
      fields.some((field) => errorKeys.includes(field)),
    );
    if (firstStep >= 0) setStep(firstStep);
    setSubmissionErrors([t("invalidFields")]);
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">
            {isEdit ? t("editTitle") : t("newTitle")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("stepSubtitle", {
              step: step + 1,
              total: STEPS.length,
              title: t(`steps.${STEPS[step]}`),
            })}
          </p>
        </div>

        {isEdit && (
          <Button
            type="button"
            variant="destructive"
            disabled={isMutating || deleteListing.isPending}
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2Icon className="size-4" />
            {t("delete")}
          </Button>
        )}
      </div>

      {/* Step tabs */}
      <div className="flex flex-wrap gap-2">
        {STEPS.map((item, index) => (
          <button
            key={item}
            type="button"
            onClick={() => setStep(index)}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
              index === step
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input hover:bg-muted"
            }`}
          >
            {t("stepTab", { number: index + 1, title: t(`steps.${item}`) })}
          </button>
        ))}
      </div>

      <SubmissionErrors errors={submissionErrors} />

      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className="flex flex-col gap-6"
      >
        {step === 0 && <Step1 form={form} />}
        {step === 1 && <Step2 form={form} />}
        {step === 2 && (
          <Step3
            form={form}
            brands={brands}
            onChangeBrands={setBrands}
            certificates={certificates}
            onAddCertificates={addCertificates}
            onRenameCertificate={(key, name) =>
              setCertificates((prev) =>
                prev.map((c) => (c.key === key ? { ...c, name } : c)),
              )
            }
            onRemoveCertificate={(key) =>
              setCertificates((prev) => prev.filter((c) => c.key !== key))
            }
          />
        )}
        {step === 3 && <Step4 form={form} />}
        {step === 4 && (
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="font-bold">{t("photosTitle")}</CardTitle>
              <p className="text-muted-foreground text-sm">
                {t("photosHint")}
              </p>
            </CardHeader>
            <CardContent>
              <ListingMediaFields media={media} withLabels />
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={step === 0 || isMutating}
            onClick={() => setStep((current) => Math.max(current - 1, 0))}
          >
            {t("previous")}
          </Button>
          {isLastStep ? (
            <Button
              type="submit"
              disabled={isMutating || deleteListing.isPending}
            >
              {isUploading
                ? t("uploading", { progress: uploadProgress })
                : createListing.isPending
                  ? tShared("creating")
                  : updateListing.isPending
                    ? tShared("updating")
                    : isEdit
                      ? tShared("saveChanges")
                      : t("submit")}
            </Button>
          ) : (
            <Button type="button" onClick={() => void goNext()}>
              {t("next")}
            </Button>
          )}
        </div>
      </form>

      <ListingCropDialog media={media} />

      <ListingDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        isPending={deleteListing.isPending}
        onConfirm={() => listing && deleteListing.mutate({ id: listing.id })}
      />

    </div>
  );
}
