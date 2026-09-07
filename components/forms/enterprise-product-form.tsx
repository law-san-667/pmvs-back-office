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
  type ListingAvailabilityChannel,
  type ListingCertificate,
  type ListingExposure,
  type ListingSpecificsSection,
  type ListingStockPolicy,
  type MarketPriceInput,
} from "@/lib/validators/listings-services";
import { trpc } from "@/server/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileTextIcon, PlusIcon, Trash2Icon, UploadIcon, X } from "lucide-react";
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

const EXPOSURE_LABELS: Record<ListingExposure, string> = {
  NATIONAL: "National",
  INTERNATIONAL: "International",
  BOTH: "Les deux",
};

const AVAILABILITY_LABELS: Record<ListingAvailabilityChannel, string> = {
  WEBSITE: "Site web",
  MARKETPLACE: "Place de marché (VMP)",
  OFFLINE: "Hors ligne",
  ALL: "Tous",
};

const STOCK_POLICY_LABELS: Record<ListingStockPolicy, string> = {
  ACCEPT_ORDERS: "Accepter les commandes",
  REFUSE_ORDERS: "Refuser les commandes",
};

const STEPS = [
  { title: "Informations et prix" },
  { title: "Stocks et logistique" },
  { title: "Description et certifications" },
  { title: "Caractéristiques et références" },
  { title: "Photos" },
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
const percentString = decimalString("Pourcentage invalide.").refine(
  (value) => !value.trim() || Number(value) <= 100,
  { message: "Le pourcentage ne peut pas dépasser 100." },
);

const b2cPriceSchema = z.object({
  countryCode: z.string().min(2, "Le marché cible est requis."),
  priceAmountMinor: integerString("Prix invalide.").refine(
    (value) => value.trim().length > 0,
    { message: "Le prix est requis." },
  ),
  vatRatePercent: percentString,
  vmpCommissionPercent: percentString,
  ddpPriceAmountMinor: integerString("Prix DDP invalide."),
});

const b2bPriceSchema = z.object({
  countryCode: z.string().min(2, "Le marché cible est requis."),
  priceAmountMinor: integerString("Prix invalide.").refine(
    (value) => value.trim().length > 0,
    { message: "Le prix FOB est requis." },
  ),
  minOrderQuantity: integerString("Quantité invalide."),
  agentCommissionPercent: percentString,
  cartonsPerPallet: integerString("Nombre invalide."),
  containerType: z.string(),
  unitsPerContainer: integerString("Nombre invalide."),
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
  title: z.string().trim().min(1, "Le nom du produit est requis."),
  shortDescription: z.string(),
  isService: z.boolean(),
  categoryId: z.string().min(1, "La catégorie est requise."),
  subCategoryId: z.string().min(1, "La sous-catégorie est requise."),
  currency: z.string().min(1),
  b2cPrices: z
    .array(b2cPriceSchema)
    .min(1, "Renseignez au moins un prix B2C (marché par défaut : Sénégal)."),
  b2bPrices: z.array(b2bPriceSchema),
  // Step 2
  hsCode: z.string(),
  ean13: z.string(),
  cupCode: z.string(),
  isFragile: z.boolean(),
  packaging: z.string(),
  unit: z.string(),
  baseValueMinor: integerString("Valeur invalide."),
  grossWeightKg: decimalString("Poids invalide."),
  widthCm: decimalString("Largeur invalide."),
  heightCm: decimalString("Hauteur invalide."),
  depthCm: decimalString("Profondeur invalide."),
  weightVolumeRatio: z.string(),
  packagingType: z.string(),
  transporters: z.string(),
  readyToShip: z.boolean(),
  availableOn: z.enum(["", ...listingAvailabilityChannelEnum]),
  storageLocation: z.string(),
  stock: integerString("Quantité invalide."),
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
  seoTitle: z.string().max(70, "70 caractères maximum."),
  seoExternalUrl: z
    .string()
    .refine((value) => !value.trim() || z.url().safeParse(value).success, {
      message: "URL invalide.",
    }),
  seoMetaDescription: z.string().max(160, "160 caractères maximum."),
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
  placeholder = "Sélectionner",
}: {
  control: FormControl;
  name: FieldPath<EnterpriseFormData>;
  label: string;
  options: Record<T, string>;
  placeholder?: string;
}) {
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
            <option value="">{placeholder}</option>
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
          <CardTitle className="font-bold">Informations sur le produit</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                control={control}
                name="launchDate"
                label="Date de lancement"
                type="date"
              />
              <TextField
                control={control}
                name="gs1Reference"
                label="N° de référence / code GS1"
                placeholder="xxxxxx"
              />
              <TextField
                control={control}
                name="internalReference"
                label="Référence interne"
              />
              <TextField
                control={control}
                name="region"
                label="Région"
                placeholder="Région + ville"
              />
              <SelectField
                control={control}
                name="exposure"
                label="Exposition actuelle"
                options={EXPOSURE_LABELS}
              />
              <TextField
                control={control}
                name="brand"
                label="Marque"
                placeholder="Nom de la marque"
              />
            </div>

            <TextField
              control={control}
              name="title"
              label="Nom du produit"
              placeholder="Nom commercial du produit ou service"
            />

            <TextareaField
              control={control}
              name="shortDescription"
              label="Brève description"
              placeholder="Au moins 50 mots"
              rows={3}
            />

            <CheckboxField
              control={control}
              name="isService"
              label="Ceci est un service"
              description="Les données logistiques et de stock seront ignorées."
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
              <FieldLabel>Devise des prix</FieldLabel>
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
          <CardTitle className="font-bold">
            Prix B2C par marché cible
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Le prix du Sénégal est celui affiché par défaut ; chaque
            marketplace pays affiche le prix de son pays.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {form.formState.errors.b2cPrices?.root?.message && (
            <p className="text-destructive text-sm">
              {form.formState.errors.b2cPrices.root.message}
            </p>
          )}
          {form.formState.errors.b2cPrices?.message && (
            <p className="text-destructive text-sm">
              {form.formState.errors.b2cPrices.message}
            </p>
          )}
          {b2c.fields.map((row, index) => (
            <div key={row.id} className="rounded-md border p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium">
                  Marché {index + 1}
                  {row.countryCode === DEFAULT_MARKET && " (défaut)"}
                </p>
                {b2c.fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => b2c.remove(index)}
                  >
                    <X /> Retirer
                  </Button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name={`b2cPrices.${index}.countryCode`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Marché cible</FieldLabel>
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
                  label={`Prix incluant l'expédition (${currency})`}
                  type="number"
                  placeholder="12 000"
                />
                <TextField
                  control={control}
                  name={`b2cPrices.${index}.vatRatePercent`}
                  label="TVA à destination (%)"
                  type="number"
                  placeholder="18"
                />
                <TextField
                  control={control}
                  name={`b2cPrices.${index}.vmpCommissionPercent`}
                  label="Commission VMP (%)"
                  type="number"
                  placeholder="6 à 20 selon le VMP"
                />
                <TextField
                  control={control}
                  name={`b2cPrices.${index}.ddpPriceAmountMinor`}
                  label={`Prix en DDP (${currency})`}
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
            <PlusIcon /> Ajouter un marché B2C
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-bold">
            Prix B2B par marché cible
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Reproduisez cette section pour chaque pays / marché cible.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {b2b.fields.map((row, index) => (
            <div key={row.id} className="rounded-md border p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium">Marché B2B {index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => b2b.remove(index)}
                >
                  <X /> Retirer
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name={`b2bPrices.${index}.countryCode`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Marché cible</FieldLabel>
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
                  label={`Prix par unité FOB (${currency})`}
                  type="number"
                />
                <TextField
                  control={control}
                  name={`b2bPrices.${index}.minOrderQuantity`}
                  label="Quantité minimale de commande (MOQ)"
                  type="number"
                />
                <TextField
                  control={control}
                  name={`b2bPrices.${index}.agentCommissionPercent`}
                  label="Commission d'agent (%)"
                  type="number"
                  hint="Si un intermédiaire est impliqué."
                />
                <TextField
                  control={control}
                  name={`b2bPrices.${index}.cartonsPerPallet`}
                  label="Nombre de cartons par palette"
                  type="number"
                  hint="Palette standard UE 80 × 120 cm."
                />
                <TextField
                  control={control}
                  name={`b2bPrices.${index}.containerType`}
                  label="Type de conteneur"
                  placeholder="20', 40', 40' HC…"
                />
                <TextField
                  control={control}
                  name={`b2bPrices.${index}.unitsPerContainer`}
                  label="Nombre d'unités par conteneur"
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
            <PlusIcon /> Ajouter un marché B2B
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Step 2: Stocks et logistique ────────────────────────────────────────────

function Step2({ form }: { form: UseFormReturn<EnterpriseFormData> }) {
  const { control } = form;
  const isService = useWatch({ control, name: "isService" });
  const readyToShip = useWatch({ control, name: "readyToShip" });

  if (isService) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-bold">Stocks et logistique</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            Cette annonce est un service : les données d&apos;emballage et de
            stock ne s&apos;appliquent pas. Précisez uniquement vos délais.
          </p>
          <TextField
            control={control}
            name="leadTime"
            label="Délai de réalisation"
            placeholder="Pour un marché spécifique"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-bold">Logistique</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                control={control}
                name="hsCode"
                label="Code HS / personnalisé"
              />
              <TextField control={control} name="ean13" label="Code EAN13" />
              <TextField control={control} name="cupCode" label="Code CUP" />
              <TextField
                control={control}
                name="packaging"
                label="Emballage"
                placeholder="Bouteille, carton…"
              />
              <TextField
                control={control}
                name="unit"
                label="Unité"
                placeholder="g / kg / L…"
              />
              <TextField
                control={control}
                name="baseValueMinor"
                label="Valeur de base (valeur taxable)"
                type="number"
              />
              <TextField
                control={control}
                name="grossWeightKg"
                label="Poids brut (kg)"
                type="number"
              />
              <TextField
                control={control}
                name="weightVolumeRatio"
                label="Rapport pesée / volume"
              />
              <TextField
                control={control}
                name="widthCm"
                label="Largeur (cm)"
                type="number"
              />
              <TextField
                control={control}
                name="heightCm"
                label="Hauteur (cm)"
                type="number"
              />
              <TextField
                control={control}
                name="depthCm"
                label="Profondeur ou diamètre (cm)"
                type="number"
              />
              <TextField
                control={control}
                name="packagingType"
                label="Type d'emballage"
                placeholder="Carton / plastique / bois"
              />
            </div>
            <CheckboxField
              control={control}
              name="isFragile"
              label="Produit fragile"
              description="À manipuler avec précaution lors de la livraison."
            />
            <TextareaField
              control={control}
              name="transporters"
              label="Transporteurs"
              placeholder="Liste des transporteurs et de leurs offres pour l'expédition de chaque unité de vente (unité, carton, palette) par marché cible."
            />
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-bold">Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <CheckboxField
              control={control}
              name="readyToShip"
              label="Prêt à livrer"
              description="Décochez si le produit nécessite un temps de fabrication."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                control={control}
                name="availableOn"
                label="Disponible sur"
                options={AVAILABILITY_LABELS}
              />
              <TextField
                control={control}
                name="storageLocation"
                label="Lieu de stockage"
                placeholder="Ville et code postal"
              />
              <TextField
                control={control}
                name="stock"
                label="Quantité disponible"
                type="number"
              />
              <TextField
                control={control}
                name="leadTime"
                label={
                  readyToShip
                    ? "Délai de livraison"
                    : "Délai de livraison (dont fabrication)"
                }
                placeholder="Pour un marché spécifique"
              />
              <SelectField
                control={control}
                name="outOfStockPolicy"
                label="Dans aucun stock"
                options={STOCK_POLICY_LABELS}
                placeholder="Accepter ou refuser les commandes ?"
              />
              <TextField
                control={control}
                name="specialDeliveryTime"
                label="Heure de livraison spéciale"
                placeholder="S'il n'y a plus de stock"
              />
            </div>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Step 3: Description et certifications ───────────────────────────────────

function Step3({
  form,
  certificates,
  onAddCertificates,
  onRenameCertificate,
  onRemoveCertificate,
}: {
  form: UseFormReturn<EnterpriseFormData>;
  certificates: ManagedCertificate[];
  onAddCertificates: (files: File[]) => void;
  onRenameCertificate: (key: string, name: string) => void;
  onRemoveCertificate: (key: string) => void;
}) {
  const { control } = form;
  const dropzone = useDropzone({
    onDrop: onAddCertificates,
    accept: CERTIFICATE_ACCEPT,
    multiple: true,
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-bold">
            Certificats (si disponibles)
          </CardTitle>
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
              Glissez-déposez vos certificats (PDF, JPG, PNG) ou cliquez pour
              ajouter
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
                placeholder="Nom du certificat"
                className="h-8"
              />
              {certificate.url && (
                <a
                  href={certificate.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary text-xs whitespace-nowrap underline"
                >
                  Voir
                </a>
              )}
              <button
                type="button"
                onClick={() => onRemoveCertificate(certificate.key)}
                aria-label="Retirer le certificat"
              >
                <X className="text-muted-foreground size-4" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-bold">Profil du produit</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Description détaillée</FieldLabel>
                  <p className="text-muted-foreground text-xs">
                    300 mots minimum recommandés.
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
              label="Histoire du produit / service"
              placeholder="Environ 100 mots"
            />
            <TextareaField
              control={control}
              name="composition"
              label="Composition"
              placeholder="Matériaux, propriétés, fonctions"
            />
            <TextareaField
              control={control}
              name="nutrition"
              label="Valeur nutritionnelle"
              placeholder="Pour les produits alimentaires uniquement"
            />
            <TextareaField
              control={control}
              name="benefits"
              label="Bénéfices / fonctions"
              placeholder="Ce que l'utilisateur gagne en termes d'avantages, de fonctions ou de pouvoirs en ayant ce produit."
            />
            <TextareaField
              control={control}
              name="storage"
              label="Conservation"
              placeholder="Comment conserver le produit ou maintenir le service / logiciel (mises à jour) ?"
            />
            <TextareaField
              control={control}
              name="maintenance"
              label="Maintenance"
              placeholder="Comment garder le produit actif / brillant, etc."
            />
            <TextareaField
              control={control}
              name="manufacturing"
              label="Processus de fabrication"
              placeholder="Comment sont construits les produits / services"
            />
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Step 4: Caractéristiques et références ──────────────────────────────────

function Step4({ form }: { form: UseFormReturn<EnterpriseFormData> }) {
  const { control } = form;
  const variants = useFieldArray({ control, name: "variants" });
  const seoTitle = useWatch({ control, name: "seoTitle" });
  const seoMetaDescription = useWatch({ control, name: "seoMetaDescription" });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-bold">Caractéristiques</CardTitle>
          <p className="text-muted-foreground text-sm">
            Si le produit est disponible en différentes tailles, variantes,
            couleurs, etc. Séparez les valeurs possibles par des virgules.
          </p>
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
                label={`Fonctionnalité ${index + 1}`}
                placeholder="Ex : Taille (femmes)"
              />
              <TextField
                control={control}
                name={`variants.${index}.values`}
                label="Valeurs possibles"
                placeholder="Ex : 36, 38, 40, 42"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mb-0.5"
                onClick={() => variants.remove(index)}
                aria-label="Retirer la fonctionnalité"
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
              <PlusIcon /> Ajouter une fonctionnalité
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-bold">
            Optimisation des moteurs de recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <TextField
              control={control}
              name="seoTitle"
              label={`Balise titre (${seoTitle.length}/70)`}
            />
            <TextField
              control={control}
              name="seoExternalUrl"
              label="URL pour plus d'informations"
              type="url"
              placeholder="https://…"
              hint="Si la PME dispose d'un site web ou si le produit / service est répertorié ailleurs."
            />
            <TextareaField
              control={control}
              name="seoMetaDescription"
              label={`Méta-description (${seoMetaDescription.length}/160)`}
              placeholder="Le groupe de mots-clés qu'un utilisateur peut taper sur Google pour rechercher ce type de produit / service."
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
  const isEdit = !!listing;
  const [step, setStep] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
      const certificatePayload = certificates
        .map((certificate) => {
          const url = certificate.url ?? urlByKey.get(certificate.key);
          if (!url) return null;
          return {
            name: certificate.name.trim() || "Certificat",
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
        getMutationErrorMessage(error, "Erreur lors de l'envoi des fichiers."),
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
    setSubmissionErrors([
      "Certains champs sont invalides. Vérifiez les étapes signalées.",
    ]);
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">
            {isEdit ? "Modifier la fiche produit" : "Nouvelle fiche produit"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Fiche Produit et Service détaillée — étape {step + 1}/
            {STEPS.length} : {STEPS[step].title}
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
            Supprimer
          </Button>
        )}
      </div>

      {/* Step tabs */}
      <div className="flex flex-wrap gap-2">
        {STEPS.map((item, index) => (
          <button
            key={item.title}
            type="button"
            onClick={() => setStep(index)}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
              index === step
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input hover:bg-muted"
            }`}
          >
            {index + 1}. {item.title}
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
              <CardTitle className="font-bold">Photos du produit</CardTitle>
              <p className="text-muted-foreground text-sm">
                Au moins 3 photos par produit (de préférence 5), hauteur ou
                largeur d&apos;au moins 1 000 px, dont une sur fond blanc.
                Indiquez pour chaque image son type et un nom contenant des
                mots-clés.
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
            Précédent
          </Button>
          {isLastStep ? (
            <Button
              type="submit"
              disabled={isMutating || deleteListing.isPending}
            >
              {isUploading
                ? `Envoi des fichiers… ${uploadProgress}%`
                : createListing.isPending
                  ? "Création en cours..."
                  : updateListing.isPending
                    ? "Mise à jour en cours..."
                    : isEdit
                      ? "Enregistrer les modifications"
                      : "Soumettre la fiche"}
            </Button>
          ) : (
            <Button type="button" onClick={() => void goNext()}>
              Suivant
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
