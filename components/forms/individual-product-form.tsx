"use client";

import Tiptap from "@/components/editor/tiptap";
import {
  CategorySelects,
  CONDITION_LABELS,
  COUNTRY_CODES,
  COUNTRY_NAME_BY_CODE,
  CountryCombobox,
  ListingDeleteDialog,
  optionalInt,
  optionalText,
  richTextOrNull,
  SubmissionErrors,
  useListingMutations,
} from "@/components/forms/listing-form-shared";
import {
  ListingCropDialog,
  ListingMediaCard,
  useListingMedia,
} from "@/components/forms/listing-media";
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
  ComboboxItem,
  ComboboxList,
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
import { Label } from "@/components/ui/label";
import { RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import countries from "@/lib/countries.json";
import { getMutationErrorMessage } from "@/lib/mutation-error";
import type { CreateR2Upload } from "@/lib/upload-to-r2";
import {
  listingConditionEnum,
  type Listing,
  type ListingSpecificsSection,
} from "@/lib/validators/listings-services";
import { trpc } from "@/server/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

const SIZES = ["S", "XS", "M", "L", "XL", "XXL", "XXXL"] as const;

const PRESET_COLORS = [
  { name: "Noir", value: "#000000" },
  { name: "Blanc", value: "#FFFFFF" },
  { name: "Rouge", value: "#EF4444" },
  { name: "Jaune", value: "#EAB308" },
  { name: "Vert", value: "#22C55E" },
  { name: "Bleu", value: "#3B82F6" },
  { name: "Violet", value: "#A855F7" },
] as const;

const normalizeHexColor = (color: string) => color.trim().toUpperCase();

const productFormSchema = z
  .object({
    title: z.string().trim().min(1, "Le nom du produit est requis."),
    description: z.string().optional(),
    categoryId: z.string().min(1, "La catégorie est requise."),
    subCategoryId: z.string().min(1, "La sous-catégorie est requise."),
    price: z.string(),
    currency: z.string().min(1),
    condition: z.enum(listingConditionEnum),
    selectedSizes: z.array(z.string()),
    selectedColors: z.array(z.string()),
    stock: z.string(),
    isService: z.boolean(),
    isPriceOnQuote: z.boolean(),
    isFragile: z.boolean(),
    validityPeriod: z.string(),
    origin: z.string(),
    destination: z.array(z.string()),
    // Commercial offer (client's "Fiche Produit et Service" for individuals)
    model: z.string(),
    brand: z.string(),
    supplierRole: z.string(),
    productionCapacity: z.string(),
    leadTime: z.string(),
    minOrderQuantity: z.string(),
    certification: z.string(),
    incoterm: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!data.isPriceOnQuote && data.price.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["price"],
        message: "Le prix est requis.",
      });
    }

    const validityPeriod = data.validityPeriod.trim();
    if (!data.isService && validityPeriod && !/^\d+$/.test(validityPeriod)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["validityPeriod"],
        message: "La période de validité doit être un nombre entier positif.",
      });
    }

    const minOrderQuantity = data.minOrderQuantity.trim();
    if (minOrderQuantity && !/^\d+$/.test(minOrderQuantity)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["minOrderQuantity"],
        message: "La commande minimum doit être un nombre entier positif.",
      });
    }
  });

type ProductFormData = z.infer<typeof productFormSchema>;

const emptyValues: ProductFormData = {
  title: "",
  description: "",
  categoryId: "",
  subCategoryId: "",
  price: "",
  currency: "XOF",
  condition: "NEW",
  selectedSizes: [],
  selectedColors: [],
  stock: "",
  isService: false,
  isPriceOnQuote: false,
  isFragile: false,
  validityPeriod: "",
  origin: "",
  destination: [],
  model: "",
  brand: "",
  supplierRole: "",
  productionCapacity: "",
  leadTime: "",
  minOrderQuantity: "",
  certification: "",
  incoterm: "",
};

const findSection = (listing: Listing, keyword: string) =>
  listing.specificsSections.find((section) =>
    section.title.toLowerCase().includes(keyword),
  );

const toFormValues = (listing: Listing): ProductFormData => ({
  title: listing.title,
  description: listing.description ?? "",
  categoryId: listing.categoryId,
  subCategoryId: listing.subCategoryId,
  price: listing.priceAmountMinor < 0 ? "" : String(listing.priceAmountMinor),
  currency: listing.currency || "XOF",
  condition: listing.condition,
  selectedSizes:
    findSection(listing, "taille")?.items.map((item) =>
      String(item.value ?? item.label),
    ) ?? [],
  selectedColors:
    findSection(listing, "couleur")?.items.map((item) =>
      String(item.value ?? item.label),
    ) ?? [],
  stock: listing.quantityAvailable ? String(listing.quantityAvailable) : "",
  isService: listing.isService,
  isPriceOnQuote: listing.priceAmountMinor < 0,
  isFragile: listing.isFragile ?? false,
  validityPeriod:
    listing.validityPeriod != null ? String(listing.validityPeriod) : "",
  origin: listing.origin ?? "",
  destination: listing.destination ?? [],
  model: listing.model ?? "",
  brand: listing.brand ?? "",
  supplierRole: listing.supplierRole ?? "",
  productionCapacity: listing.productionCapacity ?? "",
  leadTime: listing.leadTime ?? "",
  minOrderQuantity:
    listing.minOrderQuantity != null ? String(listing.minOrderQuantity) : "",
  certification: listing.certification ?? "",
  incoterm: listing.incoterm ?? "",
});

const buildSpecificsSections = (
  sizes: string[],
  colors: string[],
): ListingSpecificsSection[] => {
  const sections: ListingSpecificsSection[] = [];

  if (sizes.length > 0) {
    sections.push({
      title: "Taille",
      items: sizes.map((s) => ({ label: s, value: s })),
    });
  }

  if (colors.length > 0) {
    sections.push({
      title: "Couleur",
      items: colors.map((c) => {
        const hexColor = normalizeHexColor(c);
        return { label: hexColor, value: hexColor };
      }),
    });
  }

  return sections;
};

function TextField({
  control,
  name,
  label,
  placeholder,
  type = "text",
}: {
  control: ReturnType<typeof useForm<ProductFormData>>["control"];
  name: keyof ProductFormData;
  label: string;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
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
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

/**
 * Short product sheet for physical persons. `listing` is provided when
 * editing; the component must be mounted only once it has loaded.
 */
export default function IndividualProductForm({
  listing,
}: {
  listing?: Listing;
}) {
  const isEdit = !!listing;

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: listing ? toFormValues(listing) : emptyValues,
  });

  const watchedValues = useWatch({ control: form.control }) as ProductFormData;
  const isService = watchedValues.isService ?? false;
  const isPriceOnQuote = watchedValues.isPriceOnQuote ?? false;
  const selectedSizes = watchedValues.selectedSizes ?? [];
  const selectedColors = watchedValues.selectedColors ?? [];

  const destinationAnchorRef = useComboboxAnchor();
  const [customColor, setCustomColor] = useState("#000000");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const toggleArrayField = (
    fieldName: "selectedSizes" | "selectedColors",
    value: string,
  ) => {
    const current = form.getValues(fieldName);
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    form.setValue(fieldName, next, { shouldDirty: true, shouldValidate: true });
  };

  const addCustomColor = () => {
    const normalizedColor = normalizeHexColor(customColor);

    if (normalizedColor && !selectedColors.includes(normalizedColor)) {
      form.setValue("selectedColors", [...selectedColors, normalizedColor], {
        shouldDirty: true,
      });
    }
  };

  const isMutating =
    createListing.isPending || updateListing.isPending || isUploading;

  const onSubmit = async (data: ProductFormData) => {
    if (isMutating) return;

    setSubmissionErrors([]);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploaded = await media.uploadMedia(createUpload, setUploadProgress);
      setIsUploading(false);

      const payload = {
        title: data.title.trim(),
        description: richTextOrNull(data.description),
        categoryId: data.categoryId,
        subCategoryId: data.subCategoryId,
        priceAmountMinor: data.isPriceOnQuote
          ? -1
          : Math.round(parseFloat(data.price)),
        currency: data.isPriceOnQuote ? "XOF" : data.currency,
        condition: data.isService ? undefined : data.condition,
        isService: data.isService,
        quantityAvailable:
          !data.isService && data.stock ? parseInt(data.stock, 10) : undefined,
        images: uploaded.images.length > 0 ? uploaded.images : undefined,
        video: uploaded.video,
        specificsSections: data.isService
          ? undefined
          : buildSpecificsSections(data.selectedSizes, data.selectedColors),
        isFragile: data.isService ? null : data.isFragile,
        validityPeriod:
          data.isService || !data.validityPeriod.trim()
            ? null
            : parseInt(data.validityPeriod, 10),
        origin: data.isService || !data.origin ? null : data.origin,
        destination:
          data.isService || data.destination.length === 0
            ? null
            : data.destination,
        model: optionalText(data.model),
        brand: optionalText(data.brand),
        supplierRole: optionalText(data.supplierRole),
        productionCapacity: optionalText(data.productionCapacity),
        leadTime: optionalText(data.leadTime),
        minOrderQuantity: optionalInt(data.minOrderQuantity),
        certification: optionalText(data.certification),
        incoterm: optionalText(data.incoterm),
      };

      if (isEdit) {
        updateListing.mutate({ id: listing.id, ...payload });
      } else {
        createListing.mutate(payload);
      }
    } catch (error) {
      setIsUploading(false);
      setSubmissionErrors([
        getMutationErrorMessage(error, "Erreur lors de l'envoi des médias."),
      ]);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">
            {isEdit
              ? "Modifier un produit ou service"
              : "Ajouter un produit ou service"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isEdit
              ? "Mettez à jour les informations de cet article de votre boutique"
              : "Ajouter un nouveau produit ou service à votre boutique"}
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

      <SubmissionErrors errors={submissionErrors} />

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-bold">Nom et Description</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Controller
                    name="title"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>
                          Nom du {isService ? "service" : "produit"}
                        </FieldLabel>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          placeholder={
                            isService
                              ? "Ceci est un nom d'un service"
                              : "Ceci est un nom d'un produit"
                          }
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      control={form.control}
                      name="model"
                      label="Modèle (optionnel)"
                    />
                    <TextField
                      control={form.control}
                      name="brand"
                      label="Marque (optionnel)"
                    />
                  </div>

                  <Controller
                    name="description"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>
                          Description du {isService ? "service" : "produit"}
                        </FieldLabel>
                        <Tiptap
                          description={field.value ?? ""}
                          onChange={field.onChange}
                          showToolbar={false}
                        />
                      </Field>
                    )}
                  />
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-bold">Type d&apos;annonce</CardTitle>
              </CardHeader>
              <CardContent>
                <Controller
                  name="isService"
                  control={form.control}
                  render={({ field }) => (
                    <label className="flex items-start gap-3 text-sm">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(!!value);
                          // The category lists change with the listing type,
                          // so previous selections no longer apply.
                          form.setValue("categoryId", "", {
                            shouldValidate: true,
                          });
                          form.setValue("subCategoryId", "", {
                            shouldValidate: true,
                          });
                        }}
                      />
                      <span className="grid gap-1">
                        <span className="font-medium">Ceci est un service</span>
                        <span className="text-muted-foreground">
                          Les détails de produit comme la taille, la couleur,
                          l&apos;état et le stock seront ignorés.
                        </span>
                      </span>
                    </label>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-bold">Catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <CategorySelects
                  isService={isService}
                  categoryId={watchedValues.categoryId ?? ""}
                  subCategoryId={watchedValues.subCategoryId ?? ""}
                  onCategoryChange={(value) => {
                    form.setValue("categoryId", value, {
                      shouldValidate: true,
                    });
                    form.setValue("subCategoryId", "", {
                      shouldValidate: true,
                    });
                  }}
                  onSubCategoryChange={(value) =>
                    form.setValue("subCategoryId", value, {
                      shouldValidate: true,
                    })
                  }
                  categoryError={form.formState.errors.categoryId}
                  subCategoryError={form.formState.errors.subCategoryId}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-bold">
                  Livraison à l&apos;étranger
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Controller
                    name="origin"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Pays d&apos;origine (optionnel)</FieldLabel>
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

                  <Controller
                    name="destination"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Pays de destination (optionnel)</FieldLabel>
                        <Combobox
                          multiple
                          items={COUNTRY_CODES}
                          itemToStringLabel={(code) =>
                            COUNTRY_NAME_BY_CODE[code] ?? code
                          }
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <ComboboxChips ref={destinationAnchorRef}>
                            {field.value.map((code) => (
                              <ComboboxChip key={code}>
                                {COUNTRY_NAME_BY_CODE[code] ?? code}
                              </ComboboxChip>
                            ))}
                            <ComboboxChipsInput placeholder="Pays" />
                          </ComboboxChips>
                          <ComboboxContent anchor={destinationAnchorRef}>
                            <ComboboxEmpty>Aucun pays trouvé.</ComboboxEmpty>
                            <ComboboxList>
                              {countries.map((country) => (
                                <ComboboxItem
                                  key={country.code}
                                  value={country.code}
                                >
                                  {country.name}
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
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-bold">Offre commerciale</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Informations complémentaires affichées aux acheteurs
                  professionnels.
                </p>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <TextField
                    control={form.control}
                    name="supplierRole"
                    label="Rôle pour ce produit (optionnel)"
                    placeholder="Producteur, revendeur, importateur…"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      control={form.control}
                      name="productionCapacity"
                      label="Capacité de production (optionnel)"
                      placeholder="500 unités / mois"
                    />
                    <TextField
                      control={form.control}
                      name="leadTime"
                      label="Délai de livraison (optionnel)"
                      placeholder="7 jours"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      control={form.control}
                      name="minOrderQuantity"
                      label="Commande minimum (optionnel)"
                      type="number"
                      placeholder="10"
                    />
                    <TextField
                      control={form.control}
                      name="incoterm"
                      label="Incoterms (optionnel)"
                      placeholder="EXW, FOB, CIF…"
                    />
                  </div>
                  <TextField
                    control={form.control}
                    name="certification"
                    label="Certification (optionnel)"
                    placeholder="Bio, ISO 9001…"
                  />
                </FieldGroup>
              </CardContent>
            </Card>

            {!isService && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-bold">Gestion du stock</CardTitle>
                </CardHeader>
                <CardContent>
                  <Controller
                    name="stock"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Stock disponible</FieldLabel>
                        <Input
                          {...field}
                          type="number"
                          placeholder="0"
                          className="w-40"
                        />
                      </Field>
                    )}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            {!isService && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-bold">Détail du produit</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <Controller
                    name="selectedSizes"
                    control={form.control}
                    render={() => (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="size" />
                          <Label>Taille</Label>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {SIZES.map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() =>
                                toggleArrayField("selectedSizes", size)
                              }
                              className={`flex size-10 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
                                selectedSizes.includes(size)
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-input hover:bg-muted"
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  />

                  <Controller
                    name="selectedColors"
                    control={form.control}
                    render={() => (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="color" />
                          <Label>Couleur du produit</Label>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() =>
                                toggleArrayField("selectedColors", color.value)
                              }
                              className={`size-9 rounded-full border-2 transition-all ${
                                selectedColors.includes(color.value)
                                  ? "border-primary ring-primary/30 ring-2"
                                  : "border-transparent"
                              }`}
                              style={{ backgroundColor: color.value }}
                              title={color.name}
                            >
                              {color.value === "#FFFFFF" && (
                                <span className="flex size-full items-center justify-center rounded-full border border-gray-200" />
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            className="border-input size-9 cursor-pointer rounded-md border p-0.5"
                            title="Couleur personnalisée"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addCustomColor}
                          >
                            <PlusIcon className="size-3" />
                            Ajouter couleur
                          </Button>
                          {selectedColors
                            .filter(
                              (c) => !PRESET_COLORS.some((p) => p.value === c),
                            )
                            .map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() =>
                                  toggleArrayField("selectedColors", c)
                                }
                                className="border-primary ring-primary/30 size-9 rounded-full border-2 ring-2"
                                style={{ backgroundColor: c }}
                                title={c}
                              />
                            ))}
                        </div>
                      </div>
                    )}
                  />

                  <Controller
                    name="condition"
                    control={form.control}
                    render={({ field }) => (
                      <div className="flex flex-col gap-2">
                        <Label>État du produit</Label>
                        <div className="flex flex-wrap gap-2">
                          {listingConditionEnum.map((cond) => (
                            <Badge
                              key={cond}
                              variant={
                                field.value === cond ? "default" : "outline"
                              }
                              className="cursor-pointer rounded-sm px-5 py-3 select-none"
                              onClick={() => field.onChange(cond)}
                            >
                              {CONDITION_LABELS[cond] ?? cond}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  />

                  <Controller
                    name="isFragile"
                    control={form.control}
                    render={({ field }) => (
                      <label className="flex items-start gap-3 text-sm">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(value) => field.onChange(!!value)}
                        />
                        <span className="grid gap-1">
                          <span className="font-medium">Produit fragile</span>
                          <span className="text-muted-foreground">
                            À manipuler avec précaution lors de la livraison.
                          </span>
                        </span>
                      </label>
                    )}
                  />

                  <Controller
                    name="validityPeriod"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>
                          Période de validité (jours, optionnel)
                        </FieldLabel>
                        <Input
                          {...field}
                          type="number"
                          min={0}
                          aria-invalid={fieldState.invalid}
                          placeholder="30"
                          className="w-40"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="font-bold">
                  Prix du {isService ? "service" : "produit"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Controller
                  name="isPriceOnQuote"
                  control={form.control}
                  render={({ field }) => (
                    <label className="flex items-center gap-3 text-sm">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(value) => field.onChange(!!value)}
                      />
                      <span className="font-medium">Le prix est sur devis</span>
                    </label>
                  )}
                />

                {!isPriceOnQuote && (
                  <div className="grid grid-cols-2 gap-4">
                    <Controller
                      name="price"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Prix</FieldLabel>
                          <InputGroup className="overflow-hidden">
                            <InputGroupAddon
                              align="inline-start"
                              className="bg-primary/25 overflow-hidden"
                            >
                              <Controller
                                name="currency"
                                control={form.control}
                                render={({ field: currencyField }) => (
                                  <Select
                                    value={currencyField.value}
                                    onValueChange={(val) =>
                                      val && currencyField.onChange(val)
                                    }
                                  >
                                    <SelectTrigger className="h-auto w-auto border-0 bg-transparent p-0 shadow-none">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="XOF">Fcfa</SelectItem>
                                      <SelectItem value="EUR">EUR</SelectItem>
                                      <SelectItem value="USD">USD</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </InputGroupAddon>
                            <InputGroupInput
                              type="number"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              aria-invalid={fieldState.invalid}
                              placeholder="12 000"
                            />
                          </InputGroup>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <ListingMediaCard
              media={media}
              subject={isService ? "service" : "produit"}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="mt-6 h-14 w-full text-base"
          disabled={isMutating || deleteListing.isPending}
        >
          {isUploading
            ? `Envoi des médias… ${uploadProgress}%`
            : createListing.isPending
              ? "Création en cours..."
              : updateListing.isPending
                ? "Mise à jour en cours..."
                : isEdit
                  ? "Enregistrer les modifications"
                  : "Enregistrer"}
        </Button>
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
