"use client";

import Tiptap from "@/components/editor/tiptap";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useRouter } from "@/i18n/navigation";
import { getBackendErrorMessages } from "@/lib/backend-utils";
import { getCroppedImgSquare, type CroppedArea } from "@/lib/crop-image";
import { getMutationErrorMessage } from "@/lib/mutation-error";
import {
  uploadFilesToR2FromBrowser,
  type CreateR2Upload,
} from "@/lib/upload-to-r2";
import {
  listingConditionEnum,
  type ListingSpecificsSection,
} from "@/lib/validators/listings-services";
import { trpc } from "@/server/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ImageIcon, PlusIcon, Trash2Icon, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import Cropper from "react-easy-crop";
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

const CONDITION_LABELS: Record<string, string> = {
  NEW: "Neuf",
  LIKE_NEW: "Comme neuf",
  USED: "Occasion",
  REFURBISHED: "Reconditionné",
};

const normalizeHexColor = (color: string) => color.trim().toUpperCase();

type ImageItem = {
  file: File;
  preview: string;
  cropped: boolean;
};

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
  })
  .superRefine((data, ctx) => {
    if (!data.isPriceOnQuote && data.price.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["price"],
        message: "Le prix est requis.",
      });
    }
  });

type ProductFormData = z.infer<typeof productFormSchema>;

const defaultValues: ProductFormData = {
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
};

type ExistingImage = {
  url: string;
  order: number;
};

const parseExistingImages = (images: unknown): ExistingImage[] => {
  if (!Array.isArray(images)) return [];

  return images
    .filter(
      (image): image is { order?: number; url: string } =>
        typeof image === "object" &&
        image !== null &&
        "url" in image &&
        typeof image.url === "string",
    )
    .map((image, index) => ({ url: image.url, order: image.order ?? index }))
    .sort((a, b) => a.order - b.order);
};

export default function ProductForm({ listingId }: { listingId?: string }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const isEdit = !!listingId;

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  const watchedValues = useWatch({ control: form.control }) as ProductFormData;
  const categoryId = watchedValues.categoryId;
  const isService = watchedValues.isService ?? false;
  const isPriceOnQuote = watchedValues.isPriceOnQuote ?? false;
  const selectedSizes = watchedValues.selectedSizes ?? [];
  const selectedColors = watchedValues.selectedColors ?? [];

  const [customColor, setCustomColor] = useState("#000000");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [removedImageUrls, setRemovedImageUrls] = useState<Set<string>>(
    new Set(),
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [submissionErrors, setSubmissionErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Crop state
  const [cropImageIndex, setCropImageIndex] = useState<number | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<CroppedArea | null>(null);

  // Backend queries
  const categories = trpc.catalog.categories.useQuery(undefined);
  const selectedCategory = categories.data?.find((c) => c.id === categoryId);
  const subCategories = trpc.catalog.subCategories.useQuery(
    { categorySlug: selectedCategory?.slug },
    { enabled: !!selectedCategory?.slug },
  );

  // Maps used by the selects to display the name (not the id) of the
  // currently selected value.
  const categoryItems = Object.fromEntries(
    (categories.data ?? []).map((cat) => [cat.id, cat.name]),
  );
  const subCategoryItems = Object.fromEntries(
    (subCategories.data ?? []).map((sub) => [sub.id, sub.name]),
  );

  const createUploadMutation = trpc.media.createUpload.useMutation();
  const createUpload: CreateR2Upload = (input) =>
    createUploadMutation.mutateAsync(input);

  const listingDetail = trpc.listings.detail.useQuery(
    { id: listingId ?? "" },
    { enabled: isEdit },
  );

  // Prefill the form when editing an existing listing.
  useEffect(() => {
    const listing = listingDetail.data;
    if (!listing) return;

    const sizesSection = listing.specificsSections.find((section) =>
      section.title.toLowerCase().includes("taille"),
    );
    const colorsSection = listing.specificsSections.find((section) =>
      section.title.toLowerCase().includes("couleur"),
    );

    form.reset({
      title: listing.title,
      description: listing.description ?? "",
      categoryId: listing.categoryId,
      subCategoryId: listing.subCategoryId,
      price:
        listing.priceAmountMinor < 0
          ? ""
          : String(listing.priceAmountMinor / 100),
      currency: listing.currency || "XOF",
      condition: listing.condition,
      selectedSizes:
        sizesSection?.items.map((item) => String(item.value ?? item.label)) ??
        [],
      selectedColors:
        colorsSection?.items.map((item) => String(item.value ?? item.label)) ??
        [],
      stock: listing.quantityAvailable ? String(listing.quantityAvailable) : "",
      isService: listing.isService,
      isPriceOnQuote: listing.priceAmountMinor < 0,
    });
  }, [listingDetail.data, form]);

  // Images already attached to the listing, minus the ones removed in the UI.
  const existingImages = parseExistingImages(listingDetail.data?.images).filter(
    (img) => !removedImageUrls.has(img.url),
  );

  const createListing = trpc.listings.create.useMutation({
    onSuccess: () => {
      setSubmissionErrors([]);
      router.replace("/dashboard/products");
      router.refresh();
    },
    onError: (error) => {
      setSubmissionErrors(
        getBackendErrorMessages(
          error,
          "Erreur lors de la création du produit.",
        ),
      );
    },
  });

  const updateListing = trpc.listings.update.useMutation({
    onSuccess: () => {
      setSubmissionErrors([]);
      router.replace("/dashboard/products");
      router.refresh();
    },
    onError: (error) => {
      setSubmissionErrors(
        getBackendErrorMessages(
          error,
          "Erreur lors de la mise à jour du produit.",
        ),
      );
    },
  });

  const deleteListing = trpc.listings.delete.useMutation({
    onSuccess: async () => {
      setDeleteDialogOpen(false);
      await utils.listings.list.invalidate();
      router.replace("/dashboard/products");
      router.refresh();
    },
    onError: (error) => {
      setDeleteDialogOpen(false);
      setSubmissionErrors(
        getBackendErrorMessages(
          error,
          "Erreur lors de la suppression du produit.",
        ),
      );
    },
  });

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

  const onCropComplete = useCallback(
    (_: CroppedArea, croppedPixels: CroppedArea) => {
      setCroppedAreaPixels(croppedPixels);
    },
    [],
  );

  const handleCropSave = async () => {
    if (
      cropImageSrc === null ||
      croppedAreaPixels === null ||
      cropImageIndex === null
    )
      return;

    const blob = await getCroppedImgSquare(cropImageSrc, croppedAreaPixels);
    const file = new File([blob], `product-image-${cropImageIndex}.png`, {
      type: "image/png",
    });
    const preview = URL.createObjectURL(blob);

    setImages((prev) =>
      prev.map((img, i) =>
        i === cropImageIndex ? { file, preview, cropped: true } : img,
      ),
    );

    setCropImageIndex(null);
    setCropImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const onImageDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file, fileIdx) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setImages((prev) => [
          ...prev,
          { file, preview: URL.createObjectURL(file), cropped: false },
        ]);
        if (fileIdx === 0) {
          setImages((prev) => {
            setCropImageIndex(prev.length - 1);
            setCropImageSrc(dataUrl);
            return prev;
          });
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removeImage = (index: number) => {
    setImages((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const openCropForImage = (index: number) => {
    const img = images[index];
    if (!img) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageIndex(index);
      setCropImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(img.file);
  };

  const removeExistingImage = (url: string) => {
    setRemovedImageUrls((prev) => new Set(prev).add(url));
  };

  const imageDropzone = useDropzone({
    onDrop: onImageDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    multiple: true,
  });

  const isMutating =
    createListing.isPending || updateListing.isPending || isUploading;

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

  const onSubmit = async (data: ProductFormData) => {
    if (isMutating) return;

    setSubmissionErrors([]);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const imageFiles = images.map((img) => img.file);
      const uploadedUrls =
        imageFiles.length > 0
          ? (
              await uploadFilesToR2FromBrowser(
                imageFiles,
                "images",
                createUpload,
                setUploadProgress,
              )
            ).filter((url): url is string => url !== undefined)
          : [];

      setIsUploading(false);
      setUploadProgress(100);

      const allImageUrls = [
        ...existingImages.map((img) => img.url),
        ...uploadedUrls,
      ];

      const listingImages = allImageUrls.map((url, i) => ({
        order: i,
        url,
      }));

      const payload = {
        title: data.title.trim(),
        description:
          data.description && data.description !== "<p></p>"
            ? data.description
            : null,
        categoryId: data.categoryId,
        subCategoryId: data.subCategoryId,
        priceAmountMinor: data.isPriceOnQuote
          ? -1
          : Math.round(parseFloat(data.price) * 100),
        currency: data.isPriceOnQuote ? "XOF" : data.currency,
        condition: data.isService ? undefined : data.condition,
        isService: data.isService,
        quantityAvailable:
          !data.isService && data.stock ? parseInt(data.stock, 10) : undefined,
        images: listingImages.length > 0 ? listingImages : undefined,
        specificsSections: data.isService
          ? undefined
          : buildSpecificsSections(data.selectedSizes, data.selectedColors),
      };

      if (isEdit && listingId) {
        updateListing.mutate({ id: listingId, ...payload });
      } else {
        createListing.mutate(payload);
      }
    } catch (error) {
      setIsUploading(false);
      setSubmissionErrors([
        getMutationErrorMessage(error, "Erreur lors de l'envoi des images."),
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

      {submissionErrors.length > 0 && (
        <div className="border-destructive/30 bg-destructive/5 flex flex-wrap gap-2 rounded-md border p-3">
          {submissionErrors.map((error, index) => (
            <Badge
              key={`${error}-${index}`}
              variant="destructive"
              className="max-w-full text-left whitespace-normal"
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
            {/* Name & Description */}
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

            {/* Listing type */}
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
                        onCheckedChange={(value) => field.onChange(!!value)}
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

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="font-bold">Catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="categoryId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Catégorie du produit</FieldLabel>
                        <Select
                          items={categoryItems}
                          value={field.value}
                          onValueChange={(val) => {
                            if (!val) return;
                            field.onChange(val);
                            form.setValue("subCategoryId", "", {
                              shouldValidate: true,
                            });
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
                                  ? "Chargement..."
                                  : "Sélectionner une catégorie"
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
                        <FieldLabel>Sous catégorie du produit</FieldLabel>
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
                                  ? "Sélectionner une catégorie d'abord"
                                  : subCategories.isLoading
                                    ? "Chargement..."
                                    : "Sélectionner une sous-catégorie"
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
                  {/* Sizes */}
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

                  {/* Colors */}
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
                        {/* Custom color picker */}
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

                  {/* Condition */}
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
                </CardContent>
              </Card>
            )}

            {/* Price */}
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

                {/* Discount section - commented out for now */}
                {/*
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="reduction" />
                    <Label>Réduction</Label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["10%", "15%", "20%", "50%", "60%", "70%", "80%", "90%"].map((reduction) => (
                      <button
                        key={reduction}
                        type="button"
                        className="rounded-md border px-3 py-1 text-sm font-medium transition-colors border-input hover:bg-muted"
                      >
                        {reduction}
                      </button>
                    ))}
                  </div>
                </div>
                */}
              </CardContent>
            </Card>

            {/* Images */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="font-bold">
                  Image de {isService ? "service" : "produit"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {/* Upload zone */}
                  <div
                    {...imageDropzone.getRootProps()}
                    className="border-primary/40 hover:border-primary flex size-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors"
                  >
                    <input {...imageDropzone.getInputProps()} />
                    <ImageIcon className="text-primary/60 size-8" />
                    <span className="text-primary text-xs font-medium">
                      Ajouter une image
                    </span>
                  </div>

                  {/* Existing images (edit mode) */}
                  {existingImages.map((img, index) => (
                    <div
                      key={img.url}
                      className="group relative size-32 overflow-hidden rounded-lg"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={`Image existante ${index + 1}`}
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(img.url)}
                        className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}

                  {/* Image previews */}
                  {images.map((img, index) => (
                    <div
                      key={index}
                      className="group relative size-32 overflow-hidden rounded-lg"
                    >
                      <Image
                        src={img.preview}
                        alt={`Product image ${index + 1}`}
                        fill
                        className="cursor-pointer object-cover"
                        onClick={() => openCropForImage(index)}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                      >
                        <X className="size-3" />
                      </button>
                      {!img.cropped && (
                        <div className="bg-destructive/80 absolute right-0 bottom-0 left-0 py-0.5 text-center text-[10px] text-white">
                          Non recadré
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          className="mt-6 h-14 w-full text-base"
          disabled={isMutating || deleteListing.isPending}
        >
          {isUploading
            ? `Envoi des images… ${uploadProgress}%`
            : createListing.isPending
              ? "Création en cours..."
              : updateListing.isPending
                ? "Mise à jour en cours..."
                : isEdit
                  ? "Enregistrer les modifications"
                  : "Enregistrer"}
        </Button>
      </form>

      {/* Crop dialog */}
      <Dialog
        open={cropImageSrc !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCropImageIndex(null);
            setCropImageSrc(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Recadrer l&apos;image (carré)</DialogTitle>
          </DialogHeader>
          <div className="relative h-72 w-full">
            {cropImageSrc && (
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="rect"
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCropImageIndex(null);
                setCropImageSrc(null);
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleCropSave}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer cet article ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteListing.isPending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteListing.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (listingId) deleteListing.mutate({ id: listingId });
              }}
            >
              {deleteListing.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
