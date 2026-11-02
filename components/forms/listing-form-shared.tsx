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
import { intlLocale } from "@/i18n/config";
import { useRouter } from "@/i18n/navigation";
import { getBackendErrorMessages } from "@/lib/backend-utils";
import countries from "@/lib/countries.json";
import { trpc } from "@/server/trpc/client";
import { AlertCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

/** English names from countries.json, used when the browser has no regional names. */
export const COUNTRY_NAME_BY_CODE: Record<string, string> = Object.fromEntries(
  countries.map((country) => [country.code, country.name]),
);
export const COUNTRY_CODES = countries.map((country) => country.code);

/** Country names in the page's language (Intl), falling back to the English list. */
export function useCountryName() {
  const locale = useLocale();

  return useMemo(() => {
    let names: Intl.DisplayNames | null = null;
    try {
      names = new Intl.DisplayNames([intlLocale(locale)], { type: "region" });
    } catch {
      names = null;
    }
    return (code: string) => {
      try {
        return names?.of(code) ?? COUNTRY_NAME_BY_CODE[code] ?? code;
      } catch {
        return COUNTRY_NAME_BY_CODE[code] ?? code;
      }
    };
  }, [locale]);
}

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
          className="max-w-full text-start whitespace-normal"
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
  const t = useTranslations("productForm.shared");
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
        getBackendErrorMessages(error, t("createError")),
      ),
  });

  const updateListing = trpc.listings.update.useMutation({
    onSuccess: goToProducts,
    onError: (error) =>
      setSubmissionErrors(
        getBackendErrorMessages(
          error,
          t("updateError"),
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
          t("deleteError"),
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
  const t = useTranslations("productForm.shared");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("deleteDescription")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isPending ? t("deleting") : t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function CountryCombobox({
  value,
  onChange,
  placeholder,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  const t = useTranslations("productForm.shared");
  const countryName = useCountryName();

  return (
    <Combobox
      items={COUNTRY_CODES}
      itemToStringLabel={countryName}
      value={value || null}
      onValueChange={(next) => onChange(next ?? "")}
    >
      <ComboboxInput
        placeholder={placeholder ?? t("selectCountry")}
        showClear
        className="w-full"
        aria-invalid={invalid}
      />
      <ComboboxContent>
        <ComboboxEmpty>{t("noCountry")}</ComboboxEmpty>
        <ComboboxList>
          {countries.map((country) => (
            <ComboboxItem key={country.code} value={country.code}>
              {countryName(country.code)}
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
  const t = useTranslations("productForm.shared");
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
        <FieldLabel>{t("category")}</FieldLabel>
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
                  ? t("loading")
                  : t("selectCategory")
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
        <FieldLabel>{t("subCategory")}</FieldLabel>
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
                  ? t("selectCategoryFirst")
                  : subCategories.isLoading
                    ? t("loading")
                    : t("selectSubCategory")
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
