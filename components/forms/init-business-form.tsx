"use client";

import {
    HeadquartersGeolocationField,
    type GeolocationSource,
} from "@/components/forms/headquarters-geolocation-field";
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
import type { BusinessCategory } from "@/lib/backend-resource-types";
import frOnboarding from "@/i18n/messages/fr/onboarding.json";
import { getBackendErrorMessages } from "@/lib/backend-utils";
import {
    BUSINESS_CATEGORY_OPTIONS,
    isLegalBusinessCategory,
} from "@/lib/business-categories";
import { getCroppedImg, type CroppedArea } from "@/lib/crop-image";
import { getMutationErrorMessage } from "@/lib/mutation-error";
import {
    uploadFileToR2FromBrowser,
    uploadFilesToR2FromBrowser,
    type CreateR2Upload,
} from "@/lib/upload-to-r2";
import {
    createBusinessInputSchema,
    legalBusinessInformationSchema,
    legalBusinessTypeSchema,
    getBusinessSizeClass,
    type CreateBusinessInput,
    type LegalBusinessInformation,
    type LegalBusinessType,
    type PersonTitle,
} from "@/lib/validators/business";
import { useValidationMessage } from "@/lib/validators/messages";
import { trpc } from "@/server/trpc/client";
import { AlertCircle, Camera, Pencil, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Cropper from "react-easy-crop";
import { Controller, useForm, useWatch, type Control } from "react-hook-form";
import { PhoneInput } from "../phone-input";

const BASE_TOTAL_STEPS = 5;
const LEGAL_TOTAL_STEPS = 10;

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

const LEGAL_BUSINESS_TYPES: LegalBusinessType[] = legalBusinessTypeSchema.options;

/**
 * The questions shown in the page's language; the API keeps the French title
 * (questionTitle), which the Diarama team reads.
 */
type LegalQuestionKey = keyof typeof frOnboarding.questions.items;
const LEGAL_QUESTION_KEYS = Object.keys(
  frOnboarding.questions.items,
) as LegalQuestionKey[];
const OTHER_QUESTION = frOnboarding.questions.items.other;

const PERSON_TITLES: PersonTitle[] = ["M.", "Mme", "Mlle"];
/** Message keys of the titles (the values sent to the API stay French). */
const PERSON_TITLE_KEYS = {
  "M.": "mr",
  Mme: "mrs",
  Mlle: "miss",
} as const satisfies Record<PersonTitle, string>;

const emptyKeyPerson = (): KeyPersonForm => ({
  title: "M.",
  firstName: "",
  lastName: "",
  idNumber: "",
  position: "",
  mobilePhone: "",
  email: "",
});

const emptyContact = (): ContactForm => ({
  title: "M.",
  fullName: "",
  email: "",
  landlinePhone: "",
  mobilePhone: "",
});

type KeyPersonForm = {
  title: PersonTitle;
  firstName: string;
  lastName: string;
  idNumber: string;
  position: string;
  mobilePhone: string;
  email: string;
};

type ContactForm = {
  title: PersonTitle;
  fullName: string;
  email: string;
  landlinePhone: string;
  mobilePhone: string;
};

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
  businessCategory: BusinessCategory | null;
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
  headquartersAccuracyMeters: string;
  headquartersSource: GeolocationSource | "";
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
  otherQuestionsAnswer: string;
  // Client specification additions
  taxIdentificationNumber: string;
  postalCode: string;
  bankName: string;
  bankAddress: string;
  paymentAccount: string;
  keyPersons: KeyPersonForm[];
  contacts: ContactForm[];
  incorporationDeed: File | null;
  passportScan: File | null;
  businessPhotos: File[];
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
  businessCategory: null,
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
  headquartersAccuracyMeters: "",
  headquartersSource: "",
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
  otherQuestionsAnswer: "",
  taxIdentificationNumber: "",
  postalCode: "",
  bankName: "",
  bankAddress: "",
  paymentAccount: "",
  keyPersons: [emptyKeyPerson(), emptyKeyPerson()],
  contacts: [emptyContact(), emptyContact()],
  incorporationDeed: null,
  passportScan: null,
  businessPhotos: [],
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

/** Drops empty keys; returns undefined when nothing is left. */
const cleanObject = <T extends Record<string, unknown>>(value: T) => {
  const entries = Object.entries(value).filter(
    ([, item]) => item !== undefined && item !== "",
  );
  return entries.length ? (Object.fromEntries(entries) as T) : undefined;
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
    taxIdentificationNumber: optional(formData.taxIdentificationNumber),
    postalCode: optional(formData.postalCode),
    bankDetails: cleanObject({
      bankName: optional(formData.bankName),
      bankAddress: optional(formData.bankAddress),
      paymentAccount: optional(formData.paymentAccount),
    }),
    keyPersons: formData.keyPersons
      .filter((person) => person.firstName.trim() || person.lastName.trim())
      .map((person) => ({
        title: person.title,
        firstName: person.firstName.trim(),
        lastName: person.lastName.trim(),
        idNumber: optional(person.idNumber),
        position: optional(person.position),
        mobilePhone: optional(person.mobilePhone),
        email: optional(person.email),
      })),
    contacts: formData.contacts
      .filter((contact) => contact.fullName.trim())
      .map((contact) => ({
        title: contact.title,
        fullName: contact.fullName.trim(),
        email: optional(contact.email),
        landlinePhone: optional(contact.landlinePhone),
        mobilePhone: optional(contact.mobilePhone),
      })),
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
    const accuracyMeters = optionalNumber(formData.headquartersAccuracyMeters);
    information.headquartersGeolocation = {
      latitude,
      longitude,
      ...(accuracyMeters !== undefined ? { accuracyMeters } : {}),
      ...(formData.headquartersSource
        ? { source: formData.headquartersSource }
        : {}),
    };
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

type UploadedFiles = {
  imageUrl?: string;
  legalDocumentUrls: string[];
  incorporationDeedUrl?: string;
  passportScanUrl?: string;
  businessPhotoUrls: string[];
};

const buildCreateBusinessPayload = (
  formData: FormData,
  uploadedFiles: UploadedFiles,
): CreateBusinessInput => {
  const payload: CreateBusinessInput = {
    name: formData.businessName,
    countryCode: formData.countryCode,
    citySlug: formData.citySlug,
    businessCategory: formData.businessCategory ?? "PHYSICAL_PERSON",
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

  if (isLegalBusinessCategory(formData.businessCategory)) {
    const information = buildLegalBusinessInformation(formData);
    const complianceDocuments = cleanObject({
      incorporationDeedUrl: uploadedFiles.incorporationDeedUrl,
      passportScanUrl: uploadedFiles.passportScanUrl,
      photoUrls: uploadedFiles.businessPhotoUrls.length
        ? uploadedFiles.businessPhotoUrls
        : undefined,
    });
    if (complianceDocuments) information.complianceDocuments = complianceDocuments;
    payload.legalBusinessInformation = information;
    payload.legalBusinessQuestions = formData.legalQuestionTitles.map(
      (questionTitle) => ({
        questionTitle,
        // Only "Autres questions" carries free text; the rest are ticks.
        answer:
          questionTitle === OTHER_QUESTION
            ? formData.otherQuestionsAnswer.trim()
            : "",
      }),
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
  const t = useTranslations("onboarding");
  const validation = useValidationMessage();
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
        getBackendErrorMessages(error, t("errors.createFailed")),
      );
    },
  });

  const form = useForm<FormData>({
    defaultValues: initialFormData,
  });
  const formData = useWatch({ control: form.control }) as FormData;
  const isLegalCategory = isLegalBusinessCategory(formData.businessCategory);
  const totalSteps = isLegalCategory ? LEGAL_TOTAL_STEPS : BASE_TOTAL_STEPS;

  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<CroppedArea | null>(null);

  // Supplier sign-up opens country by country (the client's rollout phases).
  const countries = trpc.geography.countries.useQuery({
    limit: 100,
    order: "asc",
    orderBy: "name",
    supplierRegistrationOpen: "true",
  });
  const cities = trpc.geography.countryCities.useQuery(
    {
      code: formData.countryCode,
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
    disabled: !isLegalBusinessCategory(formData.businessCategory),
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

    if (step === BASE_TOTAL_STEPS && formData.businessCategory === null) {
      setSubmissionErrors([t("errors.categoryRequiredToContinue")]);
      return;
    }

    if (
      step === BASE_TOTAL_STEPS &&
      isLegalCategory &&
      formData.legalDocuments.length === 0
    ) {
      setSubmissionErrors([t("errors.legalDocumentRequired")]);
      return;
    }

    if (step === 6) {
      const hasLatitude = formData.headquartersLatitude.trim().length > 0;
      const hasLongitude = formData.headquartersLongitude.trim().length > 0;

      if (hasLatitude !== hasLongitude) {
        setSubmissionErrors([t("errors.coordinatesTogether")]);
        return;
      }

      const result = legalBusinessIdentitySchema.safeParse(
        buildLegalBusinessInformation(formData),
      );

      if (!result.success) {
        setSubmissionErrors(
          result.error.issues.map((issue) => validation.text(issue.message)),
        );
        return;
      }
    }

    if (
      step === 7 &&
      formData.businessTypes.includes("OTHER") &&
      formData.otherBusinessType.trim().length === 0
    ) {
      setSubmissionErrors([t("errors.otherBusinessTypeRequired")]);
      return;
    }

    if (step === 8) {
      const result = legalBusinessInformationSchema.safeParse(
        buildLegalBusinessInformation(formData),
      );

      if (!result.success) {
        setSubmissionErrors(
          result.error.issues.map((issue) => validation.text(issue.message)),
        );
        return;
      }
    }

    if (
      step === 9 &&
      formData.legalQuestionTitles.includes(OTHER_QUESTION) &&
      formData.otherQuestionsAnswer.trim().length === 0
    ) {
      setSubmissionErrors([t("errors.otherQuestionsRequired")]);
      return;
    }

    if (step < totalSteps) setStep((currentStep) => currentStep + 1);
  };

  /** Client specification: at least two contacts and three business photos. */
  const validateComplianceStep = () => {
    const errors: string[] = [];
    const namedContacts = formData.contacts.filter((contact) =>
      contact.fullName.trim(),
    );
    if (namedContacts.length < 2) {
      errors.push(t("errors.twoContactsRequired"));
    }
    const namedPersons = formData.keyPersons.filter(
      (person) => person.firstName.trim() || person.lastName.trim(),
    );
    if (
      namedPersons.some(
        (person) => !person.firstName.trim() || !person.lastName.trim(),
      )
    ) {
      errors.push(t("errors.keyPersonNameRequired"));
    }
    if (formData.businessPhotos.length < 3) {
      errors.push(t("errors.threePhotosRequired"));
    }
    return errors;
  };

  const isMutating = createBusiness.isPending || isUploading;

  const handleSubmit = async () => {
    if (isMutating) return;

    setSubmissionErrors([]);

    if (formData.businessCategory === null) {
      setSubmissionErrors([t("errors.categoryRequiredBeforeContinue")]);
      return;
    }

    if (isLegalCategory && formData.legalQuestionTitles.length === 0) {
      setSubmissionErrors([t("errors.questionRequired")]);
      return;
    }

    if (isLegalCategory) {
      const complianceErrors = validateComplianceStep();
      if (complianceErrors.length) {
        setSubmissionErrors(complianceErrors);
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const logoFile = formData.logo ?? undefined;
      const legalFiles = isLegalCategory ? formData.legalDocuments : [];

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

      // Typed compliance files (client specification). Progress already
      // reached 100 for the parts above; these are uploaded after.
      const [incorporationDeedUrl, passportScanUrl] = isLegalCategory
        ? await Promise.all([
            uploadFileToR2FromBrowser(
              formData.incorporationDeed ?? undefined,
              "docs",
              createUpload,
              () => undefined,
            ),
            uploadFileToR2FromBrowser(
              formData.passportScan ?? undefined,
              "docs",
              createUpload,
              () => undefined,
            ),
          ])
        : [undefined, undefined];
      const businessPhotoUrls = isLegalCategory
        ? (
            await uploadFilesToR2FromBrowser(
              formData.businessPhotos,
              "images",
              createUpload,
              () => undefined,
            )
          ).filter((url): url is string => url !== undefined)
        : [];

      setIsUploading(false);
      setUploadProgress(100);

      const availableCities = cities.data?.items ?? [];
      const citySlug = formData.citySlug || availableCities[0]?.slug || "dakar";

      const payload = buildCreateBusinessPayload(formData, {
        incorporationDeedUrl,
        passportScanUrl,
        businessPhotoUrls,
        imageUrl,
        legalDocumentUrls,
      });

      const result = createBusinessInputSchema.safeParse({
        ...payload,
        citySlug,
      });

      if (!result.success) {
        setSubmissionErrors(
          result.error.issues.map((issue) => validation.text(issue.message)),
        );
        return;
      }

      createBusiness.mutate({ ...result.data, citySlug });
    } catch (error) {
      setIsUploading(false);
      setSubmissionErrors([
        getMutationErrorMessage(error, t("errors.uploadFailed")),
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
              className="max-w-full text-start whitespace-normal"
            >
              <AlertCircle className="size-3" />
              {error}
            </Badge>
          ))}
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold">{t("form.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("form.intro")}</p>
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
      {step === 10 && <Step10 control={form.control} formData={formData} />}

      <div className="flex flex-col gap-3">
        {step > 1 && (
          <Button
            size="lg"
            variant="outline"
            className="h-12! w-full rounded-sm"
            onClick={() => setStep(step - 1)}
          >
            {t("form.back")}
          </Button>
        )}
        <Button
          size="lg"
          className="h-12! w-full rounded-sm"
          onClick={step === totalSteps ? handleSubmit : next}
          disabled={isMutating}
        >
          {isUploading
            ? t("form.uploading", { progress: uploadProgress })
            : createBusiness.isPending
              ? t("form.creating")
              : t("form.continue")}
        </Button>
      </div>

      {/* Crop dialog */}
      <Dialog
        open={!!cropImage}
        onOpenChange={(open) => !open && setCropImage(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("form.cropTitle")}</DialogTitle>
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
              {t("form.cancel")}
            </Button>
            <Button onClick={handleCropSave}>{t("form.save")}</Button>
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
  const t = useTranslations("onboarding.profile");

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>{t("logo")}</FieldLabel>
        <div
          {...logoDropzone.getRootProps()}
          className="border-primary/30 bg-primary/5 relative flex size-24! cursor-pointer items-center justify-center rounded-full border-2 border-dashed"
        >
          <input {...logoDropzone.getInputProps()} />
          {formData.logoPreview ? (
            <img
              src={formData.logoPreview}
              alt={t("logoAlt")}
              className="size-full rounded-full object-cover"
            />
          ) : (
            <Camera className="text-primary/50 size-8" />
          )}
          <span className="bg-primary/10 text-primary absolute -end-1 -bottom-1 flex size-6 items-center justify-center rounded-full border-2 border-white">
            <Pencil className="size-3" />
          </span>
        </div>
      </Field>

      <Controller
        name="businessName"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>{t("businessName")}</FieldLabel>
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
            <FieldLabel>{t("description")}</FieldLabel>
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
  const t = useTranslations("onboarding.location");
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
            <FieldLabel>{t("country")}</FieldLabel>
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
                  placeholder={isLoadingCountries ? t("loading") : t("country")}
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
            <FieldLabel>{t("city")}</FieldLabel>
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
                  placeholder={isLoadingCities ? t("loading") : t("city")}
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
            <FieldLabel>{t("address")}</FieldLabel>
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
            <FieldLabel>{t("deliveryZones")}</FieldLabel>
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
                  placeholder={
                    isLoadingCities ? t("loading") : t("citiesPlaceholder")
                  }
                  disabled={isLoadingCities || cities.length === 0}
                />
              </ComboboxChips>
              <ComboboxContent anchor={deliveryZoneAnchorRef}>
                <ComboboxEmpty>{t("noCity")}</ComboboxEmpty>
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
  const t = useTranslations("onboarding.contact");

  return (
    <FieldGroup>
      <Controller
        name="whatsapp"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>{t("whatsapp")}</FieldLabel>
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
            <FieldLabel>{t("professionalEmail")}</FieldLabel>
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
            <FieldLabel>{t("facebook")}</FieldLabel>
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
            <FieldLabel>{t("instagram")}</FieldLabel>
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
  const t = useTranslations("onboarding.payment");

  return (
    <FieldGroup>
      <Controller
        name="orangeMoneyNumber"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>{t("orangeMoney")}</FieldLabel>
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
            <FieldLabel>{t("wave")}</FieldLabel>
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
  const t = useTranslations("onboarding.category");
  const documentsDisabled = !isLegalBusinessCategory(formData.businessCategory);
  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    documentDropzone;

  return (
    <FieldGroup>
      <Controller
        name="businessCategory"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>{t("label")}</FieldLabel>
            <div className="flex flex-col gap-2">
              {BUSINESS_CATEGORY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition-colors ${
                    field.value === option.value
                      ? "border-primary bg-primary/5"
                      : "border-input hover:border-primary/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="businessCategory"
                    className="mt-1"
                    checked={field.value === option.value}
                    onChange={() => field.onChange(option.value)}
                  />
                  <span>
                    <span className="block font-medium">
                      {t(`options.${option.value}.label`)}
                    </span>
                    <span className="text-muted-foreground block text-xs">
                      {t(`options.${option.value}.description`)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {documentsDisabled && (
        <p className="text-muted-foreground text-sm">
          {t("physicalPersonNote")}
        </p>
      )}

      <Field data-disabled={documentsDisabled} hidden={documentsDisabled}>
        <FieldLabel>{t("legalDocuments")}</FieldLabel>
        <p className="text-muted-foreground text-xs">
          {t("formatsNote")}
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
            {isDragActive ? t("dropHere") : t("dropOrClick")}
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
  | "plannedActions"
  | "otherQuestionsAnswer"
  | "taxIdentificationNumber"
  | "postalCode"
  | "bankName"
  | "bankAddress"
  | "paymentAccount";

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
  const t = useTranslations("onboarding.legal");

  return (
    <div className="max-h-[65vh] overflow-y-auto pe-3">
      <FieldGroup>
        <div>
          <h2 className="font-semibold">{t("title")}</h2>
          <p className="text-muted-foreground text-sm">
            {t("intro")}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <LegalInput
            control={control}
            name="legalAcronym"
            label={t("acronym")}
          />
          <LegalInput
            control={control}
            name="legalCreationYear"
            label={t("creationYear")}
            type="number"
            placeholder="2024"
          />
        </div>
        <LegalInput
          control={control}
          name="legalStatus"
          label={t("legalStatus")}
          placeholder={t("legalStatusPlaceholder")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <LegalInput
            control={control}
            name="commercialRegisterNumber"
            label={t("commercialRegister")}
          />
          <LegalInput
            control={control}
            name="taxIdentificationNumber"
            label={t("taxId")}
          />
        </div>
        <LegalInput
          control={control}
          name="permanentStaffCount"
          label={t("staffCount")}
          type="number"
        />
        <BusinessSizeHint control={control} />
        <LegalTextarea
          control={control}
          name="legalAddresses"
          label={t("addresses")}
          placeholder={t("addressesPlaceholder")}
        />
        <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
          <LegalInput
            control={control}
            name="postalAddress"
            label={t("postalAddress")}
          />
          <LegalInput control={control} name="postalCode" label={t("postalCode")} />
        </div>
        <Controller
          name="headquartersLatitude"
          control={control}
          render={({ field: latitudeField }) => (
            <Controller
              name="headquartersLongitude"
              control={control}
              render={({ field: longitudeField }) => (
                <Controller
                  name="headquartersAccuracyMeters"
                  control={control}
                  render={({ field: accuracyField }) => (
                    <Controller
                      name="headquartersSource"
                      control={control}
                      render={({ field: sourceField }) => (
                        <HeadquartersGeolocationField
                          value={{
                            latitude: latitudeField.value,
                            longitude: longitudeField.value,
                            accuracyMeters: accuracyField.value,
                            source: sourceField.value,
                          }}
                          onChange={(next) => {
                            latitudeField.onChange(next.latitude);
                            longitudeField.onChange(next.longitude);
                            accuracyField.onChange(next.accuracyMeters);
                            sourceField.onChange(next.source);
                          }}
                        />
                      )}
                    />
                  )}
                />
              )}
            />
          )}
        />
        <LegalInput
          control={control}
          name="legalWebsite"
          label={t("website")}
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
  const t = useTranslations("onboarding.activities");

  return (
    <FieldGroup>
      <div>
        <h2 className="font-semibold">{t("title")}</h2>
        <p className="text-muted-foreground text-sm">{t("intro")}</p>
      </div>
      <LegalTextarea
        control={control}
        name="productCategories"
        label={t("productCategories")}
        placeholder={t("categoriesPlaceholder")}
      />
      <LegalTextarea
        control={control}
        name="serviceCategories"
        label={t("serviceCategories")}
        placeholder={t("categoriesPlaceholder")}
      />
      <Controller
        name="businessTypes"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>{t("businessTypes")}</FieldLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {LEGAL_BUSINESS_TYPES.map((businessType) => (
                <label
                  key={businessType}
                  className="flex items-center gap-2 rounded-md border p-3 text-sm"
                >
                  <Checkbox
                    checked={field.value.includes(businessType)}
                    onCheckedChange={(checked) => {
                      field.onChange(
                        checked
                          ? [...field.value, businessType]
                          : field.value.filter(
                              (value) => value !== businessType,
                            ),
                      );
                    }}
                  />
                  {t(`types.${businessType}`)}
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
          label={t("otherBusinessType")}
        />
      )}
      <LegalTextarea
        control={control}
        name="importExportIssues"
        label={t("importExportIssues")}
      />
      <LegalTextarea
        control={control}
        name="plannedActions"
        label={t("plannedActions")}
      />
    </FieldGroup>
  );
}

// ─── Step 8: Legal representative and production resources ──────────

function Step8({ control }: { control: Control<FormData> }) {
  const t = useTranslations("onboarding.representative");

  return (
    <FieldGroup>
      <div>
        <h2 className="font-semibold">{t("title")}</h2>
        <p className="text-muted-foreground text-sm">{t("intro")}</p>
      </div>
      <LegalInput
        control={control}
        name="representativeName"
        label={t("name")}
      />
      <LegalInput
        control={control}
        name="representativeRole"
        label={t("role")}
      />
      <LegalInput
        control={control}
        name="representativeEmail"
        label={t("email")}
        type="email"
      />
      <LegalInput
        control={control}
        name="representativeMobilePhone"
        label={t("mobilePhone")}
      />
      <div className="border-t pt-2">
        <h3 className="font-medium">{t("productionTitle")}</h3>
      </div>
      <LegalTextarea
        control={control}
        name="productionDescription"
        label={t("productionDescription")}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <LegalInput
          control={control}
          name="workshopAreaM2"
          label={t("workshop")}
          type="number"
        />
        <LegalInput
          control={control}
          name="storeAreaM2"
          label={t("store")}
          type="number"
        />
        <LegalInput
          control={control}
          name="outdoorAreaM2"
          label={t("outdoor")}
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
  const t = useTranslations("onboarding.questions");

  return (
    <FieldGroup>
      <div>
        <h2 className="font-semibold">{t("title")}</h2>
        <p className="text-muted-foreground text-sm">{t("intro")}</p>
      </div>
      <p className="text-muted-foreground text-sm">
        {t("selectedCount", { count: formData.legalQuestionTitles.length })}
      </p>
      <Controller
        name="legalQuestionTitles"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <div className="max-h-[55vh] space-y-2 overflow-y-auto pe-3">
              {LEGAL_QUESTION_KEYS.map((key) => {
                const question = frOnboarding.questions.items[key];
                return (
                  <label
                    key={key}
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
                    <span>{t(`items.${key}`)}</span>
                  </label>
                );
              })}
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      {formData.legalQuestionTitles.includes(OTHER_QUESTION) && (
        <LegalTextarea
          control={control}
          name="otherQuestionsAnswer"
          label={t("items.other")}
          placeholder={t("otherPlaceholder")}
        />
      )}
    </FieldGroup>
  );
}

/** Live MPME size class from the headcount, as defined by the client. */
function BusinessSizeHint({ control }: { control: Control<FormData> }) {
  const t = useTranslations("onboarding.legal");
  const staffCount = useWatch({ control, name: "permanentStaffCount" });
  const sizeClass = getBusinessSizeClass(
    staffCount.trim() ? Number(staffCount) : null,
  );

  if (!sizeClass) return null;

  return (
    <p className="text-muted-foreground -mt-2 text-xs">
      {t.rich("sizeHint", {
        size: t(`sizeClasses.${sizeClass}`),
        b: (chunks) => <strong>{chunks}</strong>,
      })}
    </p>
  );
}

// ─── Step 10: Bank, key persons, contacts, compliance documents ──────

const PHOTO_ACCEPT = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
};

function SingleFileField({
  label,
  hint,
  file,
  onChange,
  accept,
}: {
  label: string;
  hint?: string;
  file: File | null;
  onChange: (file: File | null) => void;
  accept: Record<string, string[]>;
}) {
  const t = useTranslations("onboarding.compliance");
  const dropzone = useDropzone({
    onDrop: (files) => files[0] && onChange(files[0]),
    accept,
    multiple: false,
  });

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      {file ? (
        <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
          <span className="truncate">{file.name}</span>
          <button type="button" onClick={() => onChange(null)} aria-label={t("remove")}>
            <X className="text-muted-foreground size-4" />
          </button>
        </div>
      ) : (
        <div
          {...dropzone.getRootProps()}
          className="border-muted-foreground/25 bg-muted/30 hover:border-primary/40 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed p-3 text-sm"
        >
          <input {...dropzone.getInputProps()} />
          <Upload className="text-muted-foreground/50 size-4" />
          <span className="text-muted-foreground">{t("uploadFile")}</span>
        </div>
      )}
    </Field>
  );
}

function PersonTitleSelect({
  value,
  onChange,
}: {
  value: PersonTitle;
  onChange: (value: PersonTitle) => void;
}) {
  const t = useTranslations("onboarding.compliance");

  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as PersonTitle)}
      className="border-input bg-background h-9 rounded-md border px-2 text-sm"
      aria-label={t("personTitle")}
    >
      {PERSON_TITLES.map((title) => (
        <option key={title} value={title}>
          {t(`personTitles.${PERSON_TITLE_KEYS[title]}`)}
        </option>
      ))}
    </select>
  );
}

function Step10({
  control,
  formData,
}: {
  control: Control<FormData>;
  formData: FormData;
}) {
  const t = useTranslations("onboarding.compliance");
  const photosDropzone = useDropzone({
    accept: PHOTO_ACCEPT,
    multiple: true,
    onDrop: () => undefined,
  });

  return (
    <div className="max-h-[65vh] overflow-y-auto pe-3">
      <FieldGroup>
        <div>
          <h2 className="font-semibold">{t("title")}</h2>
          <p className="text-muted-foreground text-sm">{t("intro")}</p>
        </div>

        <div className="border-t pt-2">
          <h3 className="font-medium">{t("bankTitle")}</h3>
        </div>
        <LegalInput control={control} name="bankName" label={t("bankName")} />
        <LegalInput
          control={control}
          name="bankAddress"
          label={t("bankAddress")}
        />
        <LegalInput
          control={control}
          name="paymentAccount"
          label={t("paymentAccount")}
          placeholder={t("paymentAccountPlaceholder")}
        />

        <div className="border-t pt-2">
          <h3 className="font-medium">{t("keyPersonsTitle")}</h3>
          <p className="text-muted-foreground text-xs">
            {t("keyPersonsHint")}
          </p>
        </div>
        <Controller
          name="keyPersons"
          control={control}
          render={({ field }) => (
            <div className="grid gap-4 md:grid-cols-2">
              {field.value.map((person, index) => {
                const update = (patch: Partial<KeyPersonForm>) =>
                  field.onChange(
                    field.value.map((item, i) =>
                      i === index ? { ...item, ...patch } : item,
                    ),
                  );
                return (
                  <div key={index} className="flex flex-col gap-2 rounded-md border p-3">
                    <p className="text-sm font-medium">
                      {t("keyPerson", { number: index + 1 })}
                    </p>
                    <PersonTitleSelect
                      value={person.title}
                      onChange={(title) => update({ title })}
                    />
                    <Input
                      placeholder={t("firstName")}
                      value={person.firstName}
                      onChange={(e) => update({ firstName: e.target.value })}
                    />
                    <Input
                      placeholder={t("lastName")}
                      value={person.lastName}
                      onChange={(e) => update({ lastName: e.target.value })}
                    />
                    <Input
                      placeholder={t("idNumber")}
                      value={person.idNumber}
                      onChange={(e) => update({ idNumber: e.target.value })}
                    />
                    <Input
                      placeholder={t("position")}
                      value={person.position}
                      onChange={(e) => update({ position: e.target.value })}
                    />
                    <Input
                      placeholder={t("mobile")}
                      type="tel"
                      value={person.mobilePhone}
                      onChange={(e) => update({ mobilePhone: e.target.value })}
                    />
                    <Input
                      placeholder={t("personEmail")}
                      type="email"
                      value={person.email}
                      onChange={(e) => update({ email: e.target.value })}
                    />
                  </div>
                );
              })}
            </div>
          )}
        />

        <div className="border-t pt-2">
          <h3 className="font-medium">{t("contactsTitle")}</h3>
          <p className="text-muted-foreground text-xs">{t("contactsHint")}</p>
        </div>
        <Controller
          name="contacts"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-3">
              {field.value.map((contact, index) => {
                const update = (patch: Partial<ContactForm>) =>
                  field.onChange(
                    field.value.map((item, i) =>
                      i === index ? { ...item, ...patch } : item,
                    ),
                  );
                return (
                  <div
                    key={index}
                    className="grid items-center gap-2 rounded-md border p-3 sm:grid-cols-[5rem_1fr_1fr]"
                  >
                    <PersonTitleSelect
                      value={contact.title}
                      onChange={(title) => update({ title })}
                    />
                    <Input
                      placeholder={t("fullName")}
                      value={contact.fullName}
                      onChange={(e) => update({ fullName: e.target.value })}
                    />
                    <Input
                      placeholder={t("contactEmail")}
                      type="email"
                      value={contact.email}
                      onChange={(e) => update({ email: e.target.value })}
                    />
                    <span className="hidden sm:block" />
                    <Input
                      placeholder={t("landline")}
                      type="tel"
                      value={contact.landlinePhone}
                      onChange={(e) => update({ landlinePhone: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder={t("mobilePhone")}
                        type="tel"
                        value={contact.mobilePhone}
                        onChange={(e) => update({ mobilePhone: e.target.value })}
                      />
                      {field.value.length > 2 && (
                        <button
                          type="button"
                          onClick={() =>
                            field.onChange(field.value.filter((_, i) => i !== index))
                          }
                          aria-label={t("removeContact")}
                        >
                          <X className="text-muted-foreground size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {field.value.length < 4 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => field.onChange([...field.value, emptyContact()])}
                >
                  {t("addContact")}
                </Button>
              )}
            </div>
          )}
        />

        <div className="border-t pt-2">
          <h3 className="font-medium">{t("documentsTitle")}</h3>
          <p className="text-muted-foreground text-xs">
            {t("documentsHint")}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="incorporationDeed"
            control={control}
            render={({ field }) => (
              <SingleFileField
                label={t("incorporationDeed")}
                file={field.value}
                onChange={field.onChange}
                accept={LEGAL_DOCUMENT_ACCEPT}
              />
            )}
          />
          <Controller
            name="passportScan"
            control={control}
            render={({ field }) => (
              <SingleFileField
                label={t("passportScan")}
                hint={t("passportHint")}
                file={field.value}
                onChange={field.onChange}
                accept={LEGAL_DOCUMENT_ACCEPT}
              />
            )}
          />
        </div>
        <Controller
          name="businessPhotos"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel>{t("photos")}</FieldLabel>
              <p className="text-muted-foreground text-xs">
                {t("photosHint")}
                {formData.businessPhotos.length > 0 &&
                  ` ${t("photosAdded", { count: formData.businessPhotos.length })}`}
              </p>
              <div
                {...photosDropzone.getRootProps({
                  onDrop: undefined,
                })}
                onClick={photosDropzone.getRootProps().onClick}
                className="border-muted-foreground/25 bg-muted/30 hover:border-primary/40 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed p-3 text-sm"
              >
                <input
                  {...photosDropzone.getInputProps({
                    onChange: (event) => {
                      const files = Array.from(event.target.files ?? []);
                      if (files.length) field.onChange([...field.value, ...files]);
                    },
                  })}
                />
                <Camera className="text-muted-foreground/50 size-4" />
                <span className="text-muted-foreground">{t("addPhotos")}</span>
              </div>
              {field.value.length > 0 && (
                <div className="flex flex-col gap-1 pt-1">
                  {field.value.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm"
                    >
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          field.onChange(field.value.filter((_, i) => i !== index))
                        }
                        aria-label={t("removePhoto")}
                      >
                        <X className="text-muted-foreground size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Field>
          )}
        />
      </FieldGroup>
    </div>
  );
}
