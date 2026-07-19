"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import { getBackendErrorMessages } from "@/lib/backend-utils";
import { getCroppedImg, type CroppedArea } from "@/lib/crop-image";
import { getMutationErrorMessage } from "@/lib/mutation-error";
import legalBusinessQuestions from "@/lib/questions.json";
import {
  uploadFileToR2FromBrowser,
  uploadFilesToR2FromBrowser,
  type CreateR2Upload,
} from "@/lib/upload-to-r2";
import {
  createBusinessInputSchema,
  legalBusinessInformationSchema,
  type CreateBusinessInput,
  type LegalBusinessInformation,
  type LegalBusinessType,
} from "@/lib/validators/business";
import { trpc } from "@/server/trpc/client";
import { AlertCircle, Camera, Pencil, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Cropper from "react-easy-crop";
import { Controller, useForm, useWatch, type Control } from "react-hook-form";
import { PhoneInput } from "../phone-input";

const BASE_TOTAL_STEPS = 5;
const LEGAL_TOTAL_STEPS = 9;

const legalBusinessIdentitySchema = legalBusinessInformationSchema.omit({
  legalRepresentative: true,
  productionResources: true,
  productCategories: true,
  serviceCategories: true,
  businessTypes: true,
  otherBusinessType: true,
  importExportIssues: true,
  plannedActions: true,
});

const LEGAL_BUSINESS_TYPES: Array<{
  value: LegalBusinessType;
  label: string;
}> = [
  { value: "PRODUCER", label: "Producteur" },
  { value: "EXPORTER", label: "Exportateur" },
  { value: "IMPORTER", label: "Importateur" },
  { value: "IMPORTER_EXPORTER", label: "Importateur / Exportateur" },
  { value: "OTHER", label: "Autre" },
];

const LEGAL_DOCUMENT_ACCEPT = {
  "image/svg+xml": [".svg"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
};

interface FormData {
  logo: File | null;
  logoPreview: string | null;
  businessName: string;
  email: string;
  description: string;
  category: string;
  countryCode: string;
  citySlug: string;
  address: string;
  deliveryZones: string[];
  whatsapp: string;
  professionalEmail: string;
  facebookLink: string;
  instagramLink: string;
  websiteLink: string;
  orangeMoneyNumber: string;
  waveNumber: string;
  isRegularized: boolean | null;
  legalDocuments: File[];
  legalAcronym: string;
  legalCreationYear: string;
  legalStatus: string;
  commercialRegisterNumber: string;
  permanentStaffCount: string;
  legalAddresses: string;
  postalAddress: string;
  headquartersLatitude: string;
  headquartersLongitude: string;
  legalWebsite: string;
  productCategories: string;
  serviceCategories: string;
  businessTypes: LegalBusinessType[];
  otherBusinessType: string;
  representativeName: string;
  representativeRole: string;
  representativeEmail: string;
  representativeMobilePhone: string;
  productionDescription: string;
  workshopAreaM2: string;
  storeAreaM2: string;
  outdoorAreaM2: string;
  importExportIssues: string;
  plannedActions: string;
  legalQuestionTitles: string[];
}

const initialFormData: FormData = {
  logo: null,
  logoPreview: null,
  businessName: "",
  email: "",
  description: "",
  category: "Agriculteur",
  countryCode: "SN",
  citySlug: "dakar",
  address: "",
  deliveryZones: [],
  whatsapp: "",
  professionalEmail: "",
  facebookLink: "",
  instagramLink: "",
  websiteLink: "",
  orangeMoneyNumber: "",
  waveNumber: "",
  isRegularized: null,
  legalDocuments: [],
  legalAcronym: "",
  legalCreationYear: "",
  legalStatus: "",
  commercialRegisterNumber: "",
  permanentStaffCount: "",
  legalAddresses: "",
  postalAddress: "",
  headquartersLatitude: "",
  headquartersLongitude: "",
  legalWebsite: "",
  productCategories: "",
  serviceCategories: "",
  businessTypes: [],
  otherBusinessType: "",
  representativeName: "",
  representativeRole: "",
  representativeEmail: "",
  representativeMobilePhone: "",
  productionDescription: "",
  workshopAreaM2: "",
  storeAreaM2: "",
  outdoorAreaM2: "",
  importExportIssues: "",
  plannedActions: "",
  legalQuestionTitles: [],
};

const optional = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const optionalNumber = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length ? Number(trimmed) : undefined;
};

const stringList = (value: string) => {
  const values = value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return values.length ? values : undefined;
};

const buildLegalBusinessInformation = (
  formData: FormData,
): LegalBusinessInformation => {
  const information: LegalBusinessInformation = {
    creationYear: Number(formData.legalCreationYear),
    legalStatus: formData.legalStatus,
    commercialRegisterNumber: formData.commercialRegisterNumber,
    legalRepresentative: {
      name: formData.representativeName,
      mobilePhone: formData.representativeMobilePhone,
    },
  };

  const optionalFields = {
    acronym: optional(formData.legalAcronym),
    permanentStaffCount: optionalNumber(formData.permanentStaffCount),
    addresses: stringList(formData.legalAddresses),
    postalAddress: optional(formData.postalAddress),
    website: optional(formData.legalWebsite),
    productCategories: stringList(formData.productCategories),
    serviceCategories: stringList(formData.serviceCategories),
    businessTypes: formData.businessTypes.length
      ? formData.businessTypes
      : undefined,
    otherBusinessType: optional(formData.otherBusinessType),
    importExportIssues: optional(formData.importExportIssues),
    plannedActions: optional(formData.plannedActions),
  } satisfies Partial<LegalBusinessInformation>;

  Object.assign(
    information,
    Object.fromEntries(
      Object.entries(optionalFields).filter(([, value]) => value !== undefined),
    ),
  );

  const representativeRole = optional(formData.representativeRole);
  const representativeEmail = optional(formData.representativeEmail);
  if (representativeRole) {
    information.legalRepresentative.role = representativeRole;
  }
  if (representativeEmail) {
    information.legalRepresentative.email = representativeEmail;
  }

  const latitude = optionalNumber(formData.headquartersLatitude);
  const longitude = optionalNumber(formData.headquartersLongitude);
  if (latitude !== undefined && longitude !== undefined) {
    information.headquartersGeolocation = { latitude, longitude };
  }

  const productionResources = {
    description: optional(formData.productionDescription),
    workshopAreaM2: optionalNumber(formData.workshopAreaM2),
    storeAreaM2: optionalNumber(formData.storeAreaM2),
    outdoorAreaM2: optionalNumber(formData.outdoorAreaM2),
  };
  const definedProductionResources = Object.fromEntries(
    Object.entries(productionResources).filter(
      ([, value]) => value !== undefined,
    ),
  );
  if (Object.keys(definedProductionResources).length) {
    information.productionResources = definedProductionResources;
  }

  return information;
};

const buildCreateBusinessPayload = (
  formData: FormData,
  uploadedFiles: { imageUrl?: string; legalDocumentUrls: string[] },
): CreateBusinessInput => {
  const payload: CreateBusinessInput = {
    name: formData.businessName,
    countryCode: formData.countryCode,
    citySlug: formData.citySlug,
    legalBusiness: formData.isRegularized ?? false,
  };

  const optionalFields = {
    description: optional(formData.description),
    whatsappPhone: optional(formData.whatsapp),
    contactEmail: optional(formData.professionalEmail || formData.email),
    facebookLink: optional(formData.facebookLink),
    instagramLink: optional(formData.instagramLink),
    orangeMoneyNumber: optional(formData.orangeMoneyNumber),
    waveNumber: optional(formData.waveNumber),
    address: optional(formData.address),
  } satisfies Partial<CreateBusinessInput>;

  if (uploadedFiles.imageUrl) payload.image = uploadedFiles.imageUrl;
  if (formData.deliveryZones.length)
    payload.deliveryZones = formData.deliveryZones;
  if (uploadedFiles.legalDocumentUrls.length)
    payload.legalDocuments = uploadedFiles.legalDocumentUrls;

  if (formData.isRegularized === true) {
    payload.legalBusinessInformation = buildLegalBusinessInformation(formData);
    payload.legalBusinessQuestions = formData.legalQuestionTitles.map(
      (questionTitle) => ({ questionTitle, answer: "" }),
    );
  }

  for (const [key, value] of Object.entries(optionalFields)) {
    if (value !== undefined) {
      payload[key as keyof typeof optionalFields] = value;
    }
  }

  return payload;
};

export default function InitBusinessForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submissionErrors, setSubmissionErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const createUploadMutation = trpc.media.createUpload.useMutation();
  const createUpload: CreateR2Upload = (input) =>
    createUploadMutation.mutateAsync(input);

  const createBusiness = trpc.businesses.create.useMutation({
    onSuccess: () => {
      setSubmissionErrors([]);
      router.replace("/dashboard");
      router.refresh();
    },
    onError: (error) => {
      setSubmissionErrors(
        getBackendErrorMessages(
          error,
          "Erreur lors de la création du business.",
        ),
      );
    },
  });

  const form = useForm<FormData>({
    defaultValues: initialFormData,
  });
  const formData = useWatch({ control: form.control }) as FormData;
  const totalSteps =
    formData.isRegularized === true ? LEGAL_TOTAL_STEPS : BASE_TOTAL_STEPS;

  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<CroppedArea | null>(null);

  const countries = trpc.geography.countries.useQuery({
    isActive: true,
    limit: 100,
    order: "asc",
    orderBy: "name",
  });
  const cities = trpc.geography.countryCities.useQuery(
    {
      code: formData.countryCode,
      isActive: true,
      limit: 100,
      order: "asc",
      orderBy: "name",
    },
    {
      enabled: Boolean(formData.countryCode),
    },
  );

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    form.setValue(key, value as never, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const onLogoDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setCropImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const logoDropzone = useDropzone({
    onDrop: onLogoDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    multiple: false,
  });

  const onDocumentDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;

      form.setValue(
        "legalDocuments",
        [...(form.getValues("legalDocuments") ?? []), ...acceptedFiles],
        {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        },
      );
    },
    [form],
  );

  const documentDropzone = useDropzone({
    onDrop: onDocumentDrop,
    accept: LEGAL_DOCUMENT_ACCEPT,
    multiple: true,
    disabled: formData.isRegularized !== true,
  });

  const onCropComplete = useCallback(
    (_: CroppedArea, croppedPixels: CroppedArea) => {
      setCroppedAreaPixels(croppedPixels);
    },
    [],
  );

  const handleCropSave = async () => {
    if (!cropImage || !croppedAreaPixels) return;
    const blob = await getCroppedImg(cropImage, croppedAreaPixels);
    const file = new File([blob], "business-logo.png", {
      type: blob.type || "image/png",
    });
    const preview = URL.createObjectURL(blob);
    update("logo", file);
    update("logoPreview", preview);
    setCropImage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const removeDocument = (index: number) => {
    update(
      "legalDocuments",
      formData.legalDocuments.filter((_, i) => i !== index),
    );
  };

  const next = () => {
    setSubmissionErrors([]);

    if (
      step === BASE_TOTAL_STEPS &&
      formData.isRegularized === true &&
      formData.legalDocuments.length === 0
    ) {
      setSubmissionErrors([
        "Ajoutez au moins un document légal avant de continuer.",
      ]);
      return;
    }

    if (step === 6) {
      const hasLatitude = formData.headquartersLatitude.trim().length > 0;
      const hasLongitude = formData.headquartersLongitude.trim().length > 0;

      if (hasLatitude !== hasLongitude) {
        setSubmissionErrors([
          "Renseignez la latitude et la longitude du siège ensemble.",
        ]);
        return;
      }

      const result = legalBusinessIdentitySchema.safeParse(
        buildLegalBusinessInformation(formData),
      );

      if (!result.success) {
        setSubmissionErrors(result.error.issues.map((issue) => issue.message));
        return;
      }
    }

    if (
      step === 7 &&
      formData.businessTypes.includes("OTHER") &&
      formData.otherBusinessType.trim().length === 0
    ) {
      setSubmissionErrors(["Précisez l'autre type d'activité."]);
      return;
    }

    if (step === 8) {
      const result = legalBusinessInformationSchema.safeParse(
        buildLegalBusinessInformation(formData),
      );

      if (!result.success) {
        setSubmissionErrors(result.error.issues.map((issue) => issue.message));
        return;
      }
    }

    if (step < totalSteps) setStep((currentStep) => currentStep + 1);
  };

  const isMutating = createBusiness.isPending || isUploading;

  const handleSubmit = async () => {
    if (isMutating) return;

    setSubmissionErrors([]);

    if (formData.isRegularized === null) {
      setSubmissionErrors([
        "Indiquez si votre business est régularisé avant de continuer.",
      ]);
      return;
    }

    if (
      formData.isRegularized === true &&
      formData.legalQuestionTitles.length === 0
    ) {
      setSubmissionErrors([
        "Sélectionnez au moins une question applicable à votre business.",
      ]);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const logoFile = formData.logo ?? undefined;
      const legalFiles =
        formData.isRegularized === true ? formData.legalDocuments : [];

      const totalParts = (logoFile ? 1 : 0) + (legalFiles.length ? 1 : 0);
      let completedParts = 0;

      const imageUrl = await uploadFileToR2FromBrowser(
        logoFile,
        "images",
        createUpload,
        (p) => {
          if (totalParts <= 1) {
            setUploadProgress(p);
          } else {
            setUploadProgress(Math.round(p / totalParts));
          }
        },
      );
      if (logoFile) completedParts++;

      const legalDocumentUrls = (
        await uploadFilesToR2FromBrowser(
          legalFiles,
          "docs",
          createUpload,
          (p) =>
            setUploadProgress(
              Math.round(((completedParts * 100 + p) / totalParts) * 1),
            ),
        )
      ).filter((url): url is string => url !== undefined);

      setIsUploading(false);
      setUploadProgress(100);

      const availableCities = cities.data?.items ?? [];
      const citySlug = formData.citySlug || availableCities[0]?.slug || "dakar";

      const payload = buildCreateBusinessPayload(formData, {
        imageUrl,
        legalDocumentUrls,
      });

      const result = createBusinessInputSchema.safeParse({
        ...payload,
        citySlug,
      });

      if (!result.success) {
        setSubmissionErrors(result.error.issues.map((issue) => issue.message));
        return;
      }

      createBusiness.mutate({ ...result.data, citySlug });
    } catch (error) {
      setIsUploading(false);
      setSubmissionErrors([
        getMutationErrorMessage(error, "Erreur lors de l'envoi des fichiers."),
      ]);
    }
  };

  const geographyErrors = [
    countries.error?.message,
    cities.error?.message,
  ].filter((error): error is string => Boolean(error));
  const visibleErrors = [...geographyErrors, ...submissionErrors];

  return (
    <div className="flex w-full flex-col gap-6">
      <p className="text-muted-foreground text-sm">
        {step}/{totalSteps}
      </p>
      {visibleErrors.length > 0 && (
        <div className="border-destructive/30 bg-destructive/5 flex flex-wrap gap-2 rounded-md border p-3">
          {visibleErrors.map((error, index) => (
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
      <div>
        <h1 className="text-2xl font-bold">Configurer votre compte</h1>
        <p className="text-muted-foreground text-sm">
          Configurez votre compte en entrant les informations suivantes :
        </p>
      </div>

      {step === 1 && (
        <Step1
          control={form.control}
          formData={formData}
          logoDropzone={logoDropzone}
        />
      )}
      {step === 2 && (
        <Step2
          control={form.control}
          update={update}
          countries={countries.data?.items ?? []}
          cities={cities.data?.items ?? []}
          isLoadingCountries={countries.isLoading}
          isLoadingCities={cities.isLoading}
        />
      )}
      {step === 3 && <Step3 control={form.control} />}
      {step === 4 && <Step4 control={form.control} />}
      {step === 5 && (
        <Step5
          control={form.control}
          formData={formData}
          documentDropzone={documentDropzone}
          removeDocument={removeDocument}
        />
      )}
      {step === 6 && <Step6 control={form.control} />}
      {step === 7 && <Step7 control={form.control} formData={formData} />}
      {step === 8 && <Step8 control={form.control} />}
      {step === 9 && <Step9 control={form.control} formData={formData} />}

      <div className="flex flex-col gap-3">
        {step > 1 && (
          <Button
            size="lg"
            variant="outline"
            className="h-12! w-full rounded-sm"
            onClick={() => setStep(step - 1)}
          >
            Retour
          </Button>
        )}
        <Button
          size="lg"
          className="h-12! w-full rounded-sm"
          onClick={step === totalSteps ? handleSubmit : next}
          disabled={isMutating}
        >
          {isUploading
            ? `Envoi des fichiers… ${uploadProgress}%`
            : createBusiness.isPending
              ? "Création..."
              : "Continuer"}
        </Button>
      </div>

      {/* Crop dialog */}
      <Dialog
        open={!!cropImage}
        onOpenChange={(open) => !open && setCropImage(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Recadrer la photo</DialogTitle>
          </DialogHeader>
          <div className="relative h-72 w-full">
            {cropImage && (
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCropImage(null)}>
              Annuler
            </Button>
            <Button onClick={handleCropSave}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Step 1: Profile ──────────────────────────────────────────────────

function Step1({
  control,
  formData,
  logoDropzone,
}: {
  control: Control<FormData>;
  formData: FormData;
  logoDropzone: ReturnType<typeof useDropzone>;
}) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel>Photo de profile/Logo</FieldLabel>
        <div
          {...logoDropzone.getRootProps()}
          className="border-primary/30 bg-primary/5 relative flex size-24! cursor-pointer items-center justify-center rounded-full border-2 border-dashed"
        >
          <input {...logoDropzone.getInputProps()} />
          {formData.logoPreview ? (
            <img
              src={formData.logoPreview}
              alt="Logo"
              className="size-full rounded-full object-cover"
            />
          ) : (
            <Camera className="text-primary/50 size-8" />
          )}
          <span className="bg-primary/10 text-primary absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full border-2 border-white">
            <Pencil className="size-3" />
          </span>
        </div>
      </Field>

      <Controller
        name="businessName"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Nom du Business</FieldLabel>
            <Input
              {...field}
              aria-invalid={fieldState.invalid}
              className="h-12"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="description"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Description</FieldLabel>
            <Textarea {...field} aria-invalid={fieldState.invalid} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </FieldGroup>
  );
}

// ─── Step 2: Location ─────────────────────────────────────────────────

function Step2({
  control,
  update,
  countries,
  cities,
  isLoadingCountries,
  isLoadingCities,
}: {
  control: Control<FormData>;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  countries: Array<{ code: string; name: string }>;
  cities: Array<{ name: string; slug: string }>;
  isLoadingCountries: boolean;
  isLoadingCities: boolean;
}) {
  const deliveryZoneAnchorRef = useComboboxAnchor();
  const countryNameByCode = Object.fromEntries(
    countries.map((country) => [country.code, country.name]),
  );
  const cityNameBySlug = new Map(cities.map((city) => [city.slug, city.name]));
  const cityNameItems = Object.fromEntries(
    cities.map((city) => [city.slug, city.name]),
  );
  const citySlugs = cities.map((city) => city.slug);

  return (
    <FieldGroup>
      <Controller
        name="countryCode"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Pays</FieldLabel>
            <Select
              items={countryNameByCode}
              value={field.value}
              onValueChange={(val) => {
                if (!val) return;
                field.onChange(val);
                update("citySlug", "");
              }}
              disabled={isLoadingCountries}
            >
              <SelectTrigger
                aria-invalid={fieldState.invalid}
                className="h-12! w-full"
              >
                <SelectValue
                  placeholder={isLoadingCountries ? "Chargement..." : "Pays"}
                />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="citySlug"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Ville</FieldLabel>
            <Select
              items={cityNameItems}
              value={field.value}
              onValueChange={(val) => val && field.onChange(val)}
              disabled={isLoadingCities || cities.length === 0}
            >
              <SelectTrigger
                aria-invalid={fieldState.invalid}
                className="h-12! w-full"
              >
                <SelectValue
                  placeholder={isLoadingCities ? "Chargement..." : "Ville"}
                />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.slug} value={city.slug}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="address"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Adresse</FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                className="h-12 flex-1"
              />
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="deliveryZones"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Zone de livraison</FieldLabel>
            <Combobox
              multiple
              items={citySlugs}
              itemToStringLabel={(slug) => cityNameBySlug.get(slug) ?? slug}
              value={field.value}
              onValueChange={field.onChange}
              disabled={isLoadingCities || cities.length === 0}
            >
              <ComboboxChips ref={deliveryZoneAnchorRef} className="min-h-12">
                {field.value.map((zone) => (
                  <ComboboxChip key={zone}>
                    {cityNameBySlug.get(zone) ?? zone}
                  </ComboboxChip>
                ))}
                <ComboboxChipsInput
                  placeholder={isLoadingCities ? "Chargement..." : "Villes"}
                  disabled={isLoadingCities || cities.length === 0}
                />
              </ComboboxChips>
              <ComboboxContent anchor={deliveryZoneAnchorRef}>
                <ComboboxEmpty>Aucune ville trouvée.</ComboboxEmpty>
                <ComboboxList>
                  {cities.map((city) => (
                    <ComboboxItem key={city.slug} value={city.slug}>
                      {city.name}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </FieldGroup>
  );
}

// ─── Step 3: Contact & Social ─────────────────────────────────────────

function Step3({ control }: { control: Control<FormData> }) {
  return (
    <FieldGroup>
      <Controller
        name="whatsapp"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Numéro Whatsapp (optionnel)</FieldLabel>
            <PhoneInput
              value={field.value}
              onChange={(value) => field.onChange(value || "")}
              defaultCountry="SN"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="professionalEmail"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Email professionel (optionnel)</FieldLabel>
            <Input
              {...field}
              type="email"
              aria-invalid={fieldState.invalid}
              className="h-12"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="facebookLink"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Lien Facebook (optionnel)</FieldLabel>
            <Input
              {...field}
              aria-invalid={fieldState.invalid}
              className="h-12"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="instagramLink"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Lien Instagram (optionnel)</FieldLabel>
            <Input
              {...field}
              aria-invalid={fieldState.invalid}
              className="h-12"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </FieldGroup>
  );
}

// ─── Step 4: Payment Methods ──────────────────────────────────────────

function Step4({ control }: { control: Control<FormData> }) {
  return (
    <FieldGroup>
      <Controller
        name="orangeMoneyNumber"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Numéro Orange Money (optionnel)</FieldLabel>
            <PhoneInput
              value={field.value}
              onChange={(value) => field.onChange(value || "")}
              defaultCountry="SN"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="waveNumber"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Numéro Wave (optionnel)</FieldLabel>
            <PhoneInput
              value={field.value}
              onChange={(value) => field.onChange(value || "")}
              defaultCountry="SN"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </FieldGroup>
  );
}

// ─── Step 5: Legal ────────────────────────────────────────────────────

function Step5({
  control,
  formData,
  documentDropzone,
  removeDocument,
}: {
  control: Control<FormData>;
  formData: FormData;
  documentDropzone: ReturnType<typeof useDropzone>;
  removeDocument: (index: number) => void;
}) {
  const documentsDisabled = formData.isRegularized !== true;
  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    documentDropzone;

  return (
    <FieldGroup>
      <Controller
        name="isRegularized"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Etes-vous un business régularisé ?</FieldLabel>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={field.value === true}
                  onCheckedChange={() => field.onChange(true)}
                />
                Oui
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={field.value === false}
                  onCheckedChange={() => field.onChange(false)}
                />
                Non
              </label>
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Field data-disabled={documentsDisabled}>
        <FieldLabel>Documents légaux</FieldLabel>
        <p className="text-muted-foreground text-xs">
          Note : Format photos SVG, PNG, JPG, pdf, word
        </p>
        <div
          {...getRootProps()}
          className={`flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 transition-colors ${
            documentsDisabled
              ? "border-muted-foreground/15 bg-muted/20 pointer-events-none cursor-not-allowed opacity-50"
              : isDragReject
                ? "border-destructive/50 bg-destructive/5 cursor-pointer"
                : isDragActive
                  ? "border-primary bg-primary/10 cursor-pointer"
                  : "border-muted-foreground/25 bg-muted/30 hover:border-primary/40 cursor-pointer"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="text-muted-foreground/50 size-8" />
          <span className="text-muted-foreground text-sm">
            {isDragActive
              ? "Déposez les documents ici"
              : "Glissez-déposez des documents ou cliquez pour ajouter"}
          </span>
        </div>
        {formData.legalDocuments.length > 0 && (
          <div className="flex flex-col gap-2 pt-2">
            {formData.legalDocuments.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span className="truncate">{file.name}</span>
                <button type="button" onClick={() => removeDocument(i)}>
                  <X className="text-muted-foreground size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Field>
    </FieldGroup>
  );
}

type LegalStringField =
  | "legalAcronym"
  | "legalCreationYear"
  | "legalStatus"
  | "commercialRegisterNumber"
  | "permanentStaffCount"
  | "legalAddresses"
  | "postalAddress"
  | "headquartersLatitude"
  | "headquartersLongitude"
  | "legalWebsite"
  | "productCategories"
  | "serviceCategories"
  | "otherBusinessType"
  | "representativeName"
  | "representativeRole"
  | "representativeEmail"
  | "representativeMobilePhone"
  | "productionDescription"
  | "workshopAreaM2"
  | "storeAreaM2"
  | "outdoorAreaM2"
  | "importExportIssues"
  | "plannedActions";

function LegalInput({
  control,
  name,
  label,
  type = "text",
  placeholder,
}: {
  control: Control<FormData>;
  name: LegalStringField;
  label: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>{label}</FieldLabel>
          <Input
            {...field}
            type={type}
            placeholder={placeholder}
            aria-invalid={fieldState.invalid}
            className="h-12"
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

function LegalTextarea({
  control,
  name,
  label,
  placeholder,
}: {
  control: Control<FormData>;
  name: LegalStringField;
  label: string;
  placeholder?: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>{label}</FieldLabel>
          <Textarea
            {...field}
            placeholder={placeholder}
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

// ─── Step 6: Legal business information ──────────────────────────────

function Step6({ control }: { control: Control<FormData> }) {
  return (
    <div className="max-h-[65vh] overflow-y-auto pr-3">
      <FieldGroup>
        <div>
          <h2 className="font-semibold">Informations juridiques</h2>
          <p className="text-muted-foreground text-sm">
            Renseignez les informations officielles de votre entreprise.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <LegalInput
            control={control}
            name="legalAcronym"
            label="Sigle (optionnel)"
          />
          <LegalInput
            control={control}
            name="legalCreationYear"
            label="Année de création"
            type="number"
            placeholder="2024"
          />
        </div>
        <LegalInput
          control={control}
          name="legalStatus"
          label="Statut juridique"
          placeholder="SARL, SA, GIE…"
        />
        <LegalInput
          control={control}
          name="commercialRegisterNumber"
          label="Numéro du registre de commerce"
        />
        <LegalInput
          control={control}
          name="permanentStaffCount"
          label="Nombre d'employés permanents (optionnel)"
          type="number"
        />
        <LegalTextarea
          control={control}
          name="legalAddresses"
          label="Adresses (optionnel)"
          placeholder="Une adresse par ligne"
        />
        <LegalInput
          control={control}
          name="postalAddress"
          label="Adresse postale (optionnel)"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <LegalInput
            control={control}
            name="headquartersLatitude"
            label="Latitude du siège (optionnel)"
            type="number"
          />
          <LegalInput
            control={control}
            name="headquartersLongitude"
            label="Longitude du siège (optionnel)"
            type="number"
          />
        </div>
        <LegalInput
          control={control}
          name="legalWebsite"
          label="Site web (optionnel)"
          type="url"
          placeholder="https://example.com"
        />
      </FieldGroup>
    </div>
  );
}

// ─── Step 7: Business activities ─────────────────────────────────────

function Step7({
  control,
  formData,
}: {
  control: Control<FormData>;
  formData: FormData;
}) {
  return (
    <FieldGroup>
      <div>
        <h2 className="font-semibold">Activités de l&apos;entreprise</h2>
        <p className="text-muted-foreground text-sm">
          Décrivez les produits, services et activités de votre entreprise.
        </p>
      </div>
      <LegalTextarea
        control={control}
        name="productCategories"
        label="Catégories de produits (optionnel)"
        placeholder="Séparez les catégories par une virgule ou une ligne"
      />
      <LegalTextarea
        control={control}
        name="serviceCategories"
        label="Catégories de services (optionnel)"
        placeholder="Séparez les catégories par une virgule ou une ligne"
      />
      <Controller
        name="businessTypes"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Types d&apos;activité (optionnel)</FieldLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {LEGAL_BUSINESS_TYPES.map((businessType) => (
                <label
                  key={businessType.value}
                  className="flex items-center gap-2 rounded-md border p-3 text-sm"
                >
                  <Checkbox
                    checked={field.value.includes(businessType.value)}
                    onCheckedChange={(checked) => {
                      field.onChange(
                        checked
                          ? [...field.value, businessType.value]
                          : field.value.filter(
                              (value) => value !== businessType.value,
                            ),
                      );
                    }}
                  />
                  {businessType.label}
                </label>
              ))}
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      {formData.businessTypes.includes("OTHER") && (
        <LegalInput
          control={control}
          name="otherBusinessType"
          label="Autre type d'activité"
        />
      )}
      <LegalTextarea
        control={control}
        name="importExportIssues"
        label="Difficultés d'import-export (optionnel)"
      />
      <LegalTextarea
        control={control}
        name="plannedActions"
        label="Actions prévues (optionnel)"
      />
    </FieldGroup>
  );
}

// ─── Step 8: Legal representative and production resources ──────────

function Step8({ control }: { control: Control<FormData> }) {
  return (
    <FieldGroup>
      <div>
        <h2 className="font-semibold">Représentant et moyens de production</h2>
        <p className="text-muted-foreground text-sm">
          Renseignez le représentant légal et les capacités de production.
        </p>
      </div>
      <LegalInput
        control={control}
        name="representativeName"
        label="Nom complet du représentant"
      />
      <LegalInput
        control={control}
        name="representativeRole"
        label="Fonction (optionnel)"
      />
      <LegalInput
        control={control}
        name="representativeEmail"
        label="Email (optionnel)"
        type="email"
      />
      <LegalInput
        control={control}
        name="representativeMobilePhone"
        label="Téléphone mobile"
      />
      <div className="border-t pt-2">
        <h3 className="font-medium">Moyens de production (optionnel)</h3>
      </div>
      <LegalTextarea
        control={control}
        name="productionDescription"
        label="Description des moyens de production"
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <LegalInput
          control={control}
          name="workshopAreaM2"
          label="Atelier (m²)"
          type="number"
        />
        <LegalInput
          control={control}
          name="storeAreaM2"
          label="Magasin (m²)"
          type="number"
        />
        <LegalInput
          control={control}
          name="outdoorAreaM2"
          label="Extérieur (m²)"
          type="number"
        />
      </div>
    </FieldGroup>
  );
}

// ─── Step 9: Applicable legal-business questions ─────────────────────

function Step9({
  control,
  formData,
}: {
  control: Control<FormData>;
  formData: FormData;
}) {
  return (
    <FieldGroup>
      <div>
        <h2 className="font-semibold">Questions applicables</h2>
        <p className="text-muted-foreground text-sm">
          Sélectionnez les questions qui correspondent à votre entreprise. Les
          réponses pourront être complétées ultérieurement.
        </p>
      </div>
      <p className="text-muted-foreground text-sm">
        {formData.legalQuestionTitles.length} question(s) sélectionnée(s)
      </p>
      <Controller
        name="legalQuestionTitles"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-3">
              {legalBusinessQuestions.map((question) => (
                <label
                  key={question}
                  className="hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm"
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={field.value.includes(question)}
                    onCheckedChange={(checked) => {
                      field.onChange(
                        checked
                          ? [...field.value, question]
                          : field.value.filter((value) => value !== question),
                      );
                    }}
                  />
                  <span>{question}</span>
                </label>
              ))}
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </FieldGroup>
  );
}
