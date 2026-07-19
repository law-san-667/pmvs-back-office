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
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
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
import countries from "@/lib/countries.json";
import {
  tenderStatusEnum,
  tenderTypeEnum,
} from "@/lib/validators/tenders";
import { trpc } from "@/server/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

const COUNTRY_NAME_BY_CODE = Object.fromEntries(
  countries.map((country) => [country.code, country.name]),
);
const COUNTRY_CODES = countries.map((country) => country.code);

const TYPE_LABELS: Record<(typeof tenderTypeEnum)[number], string> = {
  SUPPLY: "Fourniture",
  SERVICE: "Service",
  WORKS: "Travaux",
  INTELLECTUAL_SERVICE: "Prestation intellectuelle",
};

const TYPE_ITEMS = Object.fromEntries(
  tenderTypeEnum.map((type) => [type, TYPE_LABELS[type]]),
);

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
    title: z.string().trim().min(1, "Le titre est requis."),
    description: z.string(),
    categoryId: z.string().min(1, "La catégorie est requise."),
    subCategoryId: z.string().min(1, "La sous-catégorie est requise."),
    type: z.enum(tenderTypeEnum),
    status: z.enum(tenderStatusEnum),
    budgetMin: z.string(),
    budgetMax: z.string(),
    currency: z.string().min(1),
    location: z.string(),
    countryCode: z.string().min(2, "Le pays est requis."),
    submissionDeadline: z
      .string()
      .min(1, "La date limite de soumission est requise."),
    evaluationDeadline: z.string(),
    requirements: z.string(),
  })
  .superRefine((data, ctx) => {
    const min = data.budgetMin.trim();
    const max = data.budgetMax.trim();

    if (min && !/^\d+$/.test(min)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budgetMin"],
        message: "Le budget doit être un nombre entier positif.",
      });
    }
    if (max && !/^\d+$/.test(max)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budgetMax"],
        message: "Le budget doit être un nombre entier positif.",
      });
    }
    if (min && max && /^\d+$/.test(min) && /^\d+$/.test(max)) {
      if (Number(max) < Number(min)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["budgetMax"],
          message: "Le budget maximum doit être supérieur au minimum.",
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
  submissionDeadline: "",
  evaluationDeadline: "",
  requirements: "",
};

export default function TenderForm({ tenderId }: { tenderId?: string }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const isEdit = !!tenderId;

  const { business } = useBusiness();
  const currentUser = trpc.auth.me.useQuery();

  const [submissionErrors, setSubmissionErrors] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const form = useForm<TenderFormData>({
    resolver: zodResolver(tenderFormSchema),
    defaultValues,
  });

  const watchedValues = useWatch({ control: form.control }) as TenderFormData;
  const categoryId = watchedValues.categoryId;

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
      submissionDeadline: toDatetimeLocal(tender.submissionDeadline),
      evaluationDeadline: toDatetimeLocal(tender.evaluationDeadline),
      requirements,
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
        getBackendErrorMessages(
          error,
          "Erreur lors de la création de l'appel d'offres.",
        ),
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
        getBackendErrorMessages(
          error,
          "Erreur lors de la mise à jour de l'appel d'offres.",
        ),
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
        getBackendErrorMessages(
          error,
          "Erreur lors de la suppression de l'appel d'offres.",
        ),
      );
    },
  });

  const isMutating = createTender.isPending || updateTender.isPending;

  const onSubmit = (data: TenderFormData) => {
    if (isMutating) return;

    const publisherUserId = currentUser.data?.id;
    if (!publisherUserId) {
      setSubmissionErrors([
        "Impossible d'identifier l'utilisateur. Veuillez vous reconnecter.",
      ]);
      return;
    }

    setSubmissionErrors([]);

    const submissionDeadline = fromDatetimeLocal(data.submissionDeadline);
    if (!submissionDeadline) {
      setSubmissionErrors(["La date limite de soumission est invalide."]);
      return;
    }

    const payload = {
      publisherUserId,
      publisherBusinessId: business?.id ?? null,
      categoryId: data.categoryId,
      subCategoryId: data.subCategoryId,
      title: data.title.trim(),
      description: data.description.trim() ? data.description.trim() : null,
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
            {isEdit
              ? "Modifier un appel d'offres"
              : "Créer un appel d'offres"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isEdit
              ? "Mettez à jour les informations de cet appel d'offres."
              : "Publiez un nouvel appel d'offres pour recevoir des soumissions."}
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
            <Card>
              <CardHeader>
                <CardTitle className="font-bold">
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Controller
                    name="title"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Titre de l&apos;appel d&apos;offres</FieldLabel>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          placeholder="Ex: Fourniture de matériel informatique"
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
                        <FieldLabel>Description</FieldLabel>
                        <Textarea
                          {...field}
                          rows={5}
                          placeholder="Décrivez l'objet de l'appel d'offres..."
                        />
                      </Field>
                    )}
                  />

                  <Controller
                    name="type"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Type d&apos;appel d&apos;offres</FieldLabel>
                        <Select
                          items={TYPE_ITEMS}
                          value={field.value}
                          onValueChange={(val) => val && field.onChange(val)}
                        >
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue placeholder="Sélectionner un type" />
                          </SelectTrigger>
                          <SelectContent>
                            {tenderTypeEnum.map((type) => (
                              <SelectItem key={type} value={type}>
                                {TYPE_LABELS[type]}
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
                <CardTitle className="font-bold">Catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="categoryId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Catégorie</FieldLabel>
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
                        <FieldLabel>Sous catégorie</FieldLabel>
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

            <Card>
              <CardHeader>
                <CardTitle className="font-bold">Exigences</CardTitle>
              </CardHeader>
              <CardContent>
                <Controller
                  name="requirements"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Exigences (optionnel)</FieldLabel>
                      <Textarea
                        {...field}
                        rows={4}
                        placeholder="Précisez les exigences, critères et conditions..."
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
                <CardTitle className="font-bold">Budget</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Controller
                  name="currency"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Devise</FieldLabel>
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
                        <FieldLabel>Budget minimum</FieldLabel>
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
                        <FieldLabel>Budget maximum</FieldLabel>
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
                <CardTitle className="font-bold">Localisation</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Controller
                    name="countryCode"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Pays</FieldLabel>
                        <Combobox
                          items={COUNTRY_CODES}
                          itemToStringLabel={(code) =>
                            COUNTRY_NAME_BY_CODE[code] ?? code
                          }
                          value={field.value || null}
                          onValueChange={(value) => field.onChange(value ?? "")}
                        >
                          <ComboboxInput
                            placeholder="Sélectionner un pays"
                            showClear
                            className="w-full"
                            aria-invalid={fieldState.invalid}
                          />
                          <ComboboxContent>
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

                  <Controller
                    name="location"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Lieu (optionnel)</FieldLabel>
                        <Input
                          {...field}
                          placeholder="Ex: Dakar, Plateau"
                        />
                      </Field>
                    )}
                  />
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-bold">Échéances</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Controller
                    name="submissionDeadline"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Date limite de soumission</FieldLabel>
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
                        <FieldLabel>
                          Date limite d&apos;évaluation (optionnel)
                        </FieldLabel>
                        <Input {...field} type="datetime-local" />
                      </Field>
                    )}
                  />
                </FieldGroup>
              </CardContent>
            </Card>
          </div>
        </div>

        <Button
          type="submit"
          className="mt-6 h-14 w-full text-base"
          disabled={isMutating || deleteTender.isPending}
        >
          {createTender.isPending
            ? "Création en cours..."
            : updateTender.isPending
              ? "Mise à jour en cours..."
              : isEdit
                ? "Enregistrer les modifications"
                : "Publier l'appel d'offres"}
        </Button>
      </form>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer cet appel d&apos;offres ? Cette
              action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTender.isPending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteTender.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (tenderId) deleteTender.mutate({ id: tenderId });
              }}
            >
              {deleteTender.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
