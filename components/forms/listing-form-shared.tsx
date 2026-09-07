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
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import { getBackendErrorMessages } from "@/lib/backend-utils";
import countries from "@/lib/countries.json";
import { trpc } from "@/server/trpc/client";
import { AlertCircle } from "lucide-react";
import { useState } from "react";

export const CONDITION_LABELS: Record<string, string> = {
  NEW: "Neuf",
  LIKE_NEW: "Comme neuf",
  USED: "Occasion",
  REFURBISHED: "Reconditionné",
};

export const COUNTRY_NAME_BY_CODE: Record<string, string> = Object.fromEntries(
  countries.map((country) => [country.code, country.name]),
);
export const COUNTRY_CODES = countries.map((country) => country.code);

export const optionalText = (value: string | undefined | null) => {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? trimmed : null;
};

export const optionalInt = (value: string | undefined | null) => {
  const trimmed = value?.trim() ?? "";
  if (!trimmed.length) return null;
  const parsed = parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

export const optionalNumber = (value: string | undefined | null) => {
  const trimmed = value?.trim() ?? "";
  if (!trimmed.length) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/** Tiptap leaves an empty paragraph behind; treat it as no description. */
export const richTextOrNull = (value: string | undefined) =>
  value && value !== "<p></p>" ? value : null;

export function SubmissionErrors({ errors }: { errors: string[] }) {
  if (!errors.length) return null;

  return (
    <div className="border-destructive/30 bg-destructive/5 flex flex-wrap gap-2 rounded-md border p-3">
      {errors.map((error, index) => (
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
  );
}

/** Create / update / delete mutations with their error messages collected. */
export function useListingMutations() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [submissionErrors, setSubmissionErrors] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const goToProducts = () => {
    setSubmissionErrors([]);
    router.replace("/dashboard/products");
    router.refresh();
  };

  const createListing = trpc.listings.create.useMutation({
    onSuccess: goToProducts,
    onError: (error) =>
      setSubmissionErrors(
        getBackendErrorMessages(error, "Erreur lors de la création du produit."),
      ),
  });

  const updateListing = trpc.listings.update.useMutation({
    onSuccess: goToProducts,
    onError: (error) =>
      setSubmissionErrors(
        getBackendErrorMessages(
          error,
          "Erreur lors de la mise à jour du produit.",
        ),
      ),
  });

  const deleteListing = trpc.listings.delete.useMutation({
    onSuccess: async () => {
      setDeleteDialogOpen(false);
      await utils.listings.list.invalidate();
      goToProducts();
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

  return {
    createListing,
    updateListing,
    deleteListing,
    submissionErrors,
    setSubmissionErrors,
    deleteDialogOpen,
    setDeleteDialogOpen,
  };
}

export function ListingDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            Voulez-vous vraiment supprimer cet article ? Cette action est
            irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isPending ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function CountryCombobox({
  value,
  onChange,
  placeholder = "Sélectionner un pays",
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <Combobox
      items={COUNTRY_CODES}
      itemToStringLabel={(code) => COUNTRY_NAME_BY_CODE[code] ?? code}
      value={value || null}
      onValueChange={(next) => onChange(next ?? "")}
    >
      <ComboboxInput
        placeholder={placeholder}
        showClear
        className="w-full"
        aria-invalid={invalid}
      />
      <ComboboxContent>
        <ComboboxEmpty>Aucun pays trouvé.</ComboboxEmpty>
        <ComboboxList>
          {countries.map((country) => (
            <ComboboxItem key={country.code} value={country.code}>
              {country.name}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

/**
 * Category / sub-category selects fed by the backend, filtered on the
 * listing type. Kept generic so both product forms can plug it in.
 */
export function CategorySelects({
  isService,
  categoryId,
  subCategoryId,
  onCategoryChange,
  onSubCategoryChange,
  categoryError,
  subCategoryError,
}: {
  isService: boolean;
  categoryId: string;
  subCategoryId: string;
  onCategoryChange: (value: string) => void;
  onSubCategoryChange: (value: string) => void;
  categoryError?: { message?: string };
  subCategoryError?: { message?: string };
}) {
  const categories = trpc.catalog.categories.useQuery({ isService });
  const selectedCategory = categories.data?.find((c) => c.id === categoryId);
  const subCategories = trpc.catalog.subCategories.useQuery(
    { categorySlug: selectedCategory?.slug, isService },
    { enabled: !!selectedCategory?.slug },
  );

  const categoryItems = Object.fromEntries(
    (categories.data ?? []).map((cat) => [cat.id, cat.name]),
  );
  const subCategoryItems = Object.fromEntries(
    (subCategories.data ?? []).map((sub) => [sub.id, sub.name]),
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field data-invalid={Boolean(categoryError)}>
        <FieldLabel>Catégorie</FieldLabel>
        <Select
          items={categoryItems}
          value={categoryId}
          onValueChange={(val) => {
            if (!val) return;
            onCategoryChange(val);
          }}
          disabled={categories.isLoading}
        >
          <SelectTrigger
            aria-invalid={Boolean(categoryError)}
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
        {categoryError && <FieldError errors={[categoryError]} />}
      </Field>

      <Field data-invalid={Boolean(subCategoryError)}>
        <FieldLabel>Sous-catégorie</FieldLabel>
        <Select
          items={subCategoryItems}
          value={subCategoryId}
          onValueChange={(val) => val && onSubCategoryChange(val)}
          disabled={!categoryId || subCategories.isLoading}
        >
          <SelectTrigger
            aria-invalid={Boolean(subCategoryError)}
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
        {subCategoryError && <FieldError errors={[subCategoryError]} />}
      </Field>
    </div>
  );
}
