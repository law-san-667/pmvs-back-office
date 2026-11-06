import { isLegalBusinessCategory } from "@/lib/business-categories";
import z from "zod";
import { msg } from "./messages";

/** Supplier types from the client's account-opening specification. */
export const legalBusinessTypeSchema = z.enum([
  "PRODUCER",
  "TRANSFORMER",
  "SERVICE_PROVIDER",
  "EXPORTER",
  "IMPORTER",
  "IMPORTER_EXPORTER",
  "WHOLESALER",
  "SEMI_WHOLESALER",
  "RETAILER",
  "SOLE_PROPRIETOR",
  "CONTRACTING_AUTHORITY",
  "OTHER",
]);

/** French labels, for the admin screens (the supplier wizard uses onboarding.activities.types). */
export const LEGAL_BUSINESS_TYPE_LABELS: Record<
  z.infer<typeof legalBusinessTypeSchema>,
  string
> = {
  PRODUCER: "Producteur",
  TRANSFORMER: "Transformateur",
  SERVICE_PROVIDER: "Prestataire de service",
  EXPORTER: "Exportateur",
  IMPORTER: "Importateur",
  IMPORTER_EXPORTER: "Importateur-exportateur",
  WHOLESALER: "Grossiste",
  SEMI_WHOLESALER: "Demi-grossiste",
  RETAILER: "Détaillant",
  SOLE_PROPRIETOR: "Entreprise individuelle",
  CONTRACTING_AUTHORITY: "Adjudicateur",
  OTHER: "Autre (précisez)",
};

export const personTitleSchema = z.enum(["M.", "Mme", "Mlle"]);
const optionalTrimmed = z.string().trim().min(1).optional();

export const businessKeyPersonSchema = z.object({
  title: personTitleSchema.optional(),
  firstName: z.string().trim().min(1, msg("onboarding.errors.firstNameRequired")),
  lastName: z.string().trim().min(1, msg("onboarding.errors.lastNameRequired")),
  idNumber: optionalTrimmed,
  position: optionalTrimmed,
  mobilePhone: optionalTrimmed,
  email: z.email(msg("onboarding.errors.emailInvalid")).optional(),
});

export const businessContactSchema = z.object({
  title: personTitleSchema.optional(),
  fullName: z.string().trim().min(1, msg("onboarding.errors.fullNameRequired")),
  email: z.email(msg("onboarding.errors.emailInvalid")).optional(),
  landlinePhone: optionalTrimmed,
  mobilePhone: optionalTrimmed,
});

/**
 * MPME size class by permanent headcount (client specification): micro 0-5,
 * small 6-20, medium 21-100, large above 100.
 */
export const getBusinessSizeClass = (permanentStaffCount?: number | null) => {
  if (permanentStaffCount === undefined || permanentStaffCount === null) {
    return null;
  }
  if (permanentStaffCount <= 5) return "MICRO" as const;
  if (permanentStaffCount <= 20) return "SMALL" as const;
  if (permanentStaffCount <= 100) return "MEDIUM" as const;
  return "LARGE" as const;
};

/** French labels, for the admin screens (the supplier wizard uses onboarding.legal.sizeClasses). */
export const BUSINESS_SIZE_LABELS = {
  MICRO: "Micro-entreprise (0 à 5 employés)",
  SMALL: "Petite entreprise (6 à 20 employés)",
  MEDIUM: "Moyenne entreprise (21 à 100 employés)",
  LARGE: "Grande entreprise (plus de 100 employés)",
} as const;

export const legalBusinessInformationSchema = z.object({
  acronym: z.string().trim().min(1).optional(),
  creationYear: z
    .number(msg("onboarding.errors.creationYearInvalid"))
    .int(msg("onboarding.errors.creationYearInvalid"))
    .min(1000, msg("onboarding.errors.creationYearInvalid"))
    .max(9999, msg("onboarding.errors.creationYearInvalid")),
  legalStatus: z.string().trim().min(1, msg("onboarding.errors.legalStatusRequired")),
  commercialRegisterNumber: z
    .string()
    .trim()
    .min(1, msg("onboarding.errors.commercialRegisterRequired")),
  taxIdentificationNumber: optionalTrimmed,
  permanentStaffCount: z.number().int().nonnegative().optional(),
  postalCode: optionalTrimmed,
  addresses: z.array(z.string().trim().min(1)).optional(),
  postalAddress: z.string().trim().min(1).optional(),
  headquartersGeolocation: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      accuracyMeters: z.number().nonnegative().optional(),
      source: z.enum(["DEVICE", "MAP", "MANUAL"]).optional(),
    })
    .optional(),
  website: z.url(msg("onboarding.errors.websiteInvalid")).optional(),
  productCategories: z.array(z.string().trim().min(1)).optional(),
  serviceCategories: z.array(z.string().trim().min(1)).optional(),
  businessTypes: z.array(legalBusinessTypeSchema).optional(),
  otherBusinessType: z.string().trim().min(1).optional(),
  bankDetails: z
    .object({
      bankName: optionalTrimmed,
      bankAddress: optionalTrimmed,
      paymentAccount: optionalTrimmed,
    })
    .optional(),
  keyPersons: z.array(businessKeyPersonSchema).max(2).optional(),
  contacts: z.array(businessContactSchema).optional(),
  complianceDocuments: z
    .object({
      incorporationDeedUrl: z.url().optional(),
      passportScanUrl: z.url().optional(),
      photoUrls: z.array(z.url()).optional(),
    })
    .optional(),
  legalRepresentative: z.object({
    name: z.string().trim().min(1, msg("onboarding.errors.representativeNameRequired")),
    role: z.string().trim().min(1).optional(),
    email: z.email(msg("onboarding.errors.representativeEmailInvalid")).optional(),
    mobilePhone: z
      .string()
      .trim()
      .min(1, msg("onboarding.errors.representativePhoneRequired")),
  }),
  productionResources: z
    .object({
      description: z.string().trim().min(1).optional(),
      workshopAreaM2: z.number().nonnegative().optional(),
      storeAreaM2: z.number().nonnegative().optional(),
      outdoorAreaM2: z.number().nonnegative().optional(),
      /** Equipment: number and characteristics of the machines. */
      machineCount: z.number().int().nonnegative().optional(),
      machinesDescription: z.string().trim().min(1).max(2000).optional(),
    })
    .optional(),
  /** Characteristics of the products or services made. */
  producedProducts: z.string().trim().min(1).max(2000).optional(),
  /** Characteristics of the products or services bought or to buy. */
  purchasedProducts: z.string().trim().min(1).max(2000).optional(),
  /** Products sold: commercial and industrial names, tariff position (HS code). */
  tradeProducts: z
    .array(
      z.object({
        commercialName: z
          .string()
          .trim()
          .min(1, msg("onboarding.errors.tradeProductNameRequired"))
          .max(150),
        industrialName: z.string().trim().min(1).max(150).optional(),
        hsCode: z
          .string()
          .trim()
          .regex(/^\d{4,10}$/, msg("onboarding.errors.hsCodeInvalid"))
          .optional(),
      }),
    )
    .max(20)
    .optional(),
  importExportIssues: z.string().trim().min(1).optional(),
  plannedActions: z.string().trim().min(1).optional(),
});

export const businessCategorySchema = z.enum([
  "PHYSICAL_PERSON",
  "SME",
  "LARGE_ENTERPRISE",
]);

export const legalBusinessQuestionSchema = z.object({
  questionTitle: z.string().trim().min(1),
  answer: z.string(),
});

const businessBaseSchema = z.object({
  name: z.string().trim().min(1, msg("onboarding.errors.nameRequired")),
  image: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  whatsappPhone: z.string().trim().optional(),
  contactEmail: z
    .string()
    .trim()
    .email(msg("onboarding.errors.contactEmailInvalid"))
    .optional(),
  facebookLink: z
    .string()
    .trim()
    .url(msg("onboarding.errors.facebookInvalid"))
    .optional(),
  instagramLink: z
    .string()
    .trim()
    .url(msg("onboarding.errors.instagramInvalid"))
    .optional(),
  orangeMoneyNumber: z.string().trim().optional(),
  waveNumber: z.string().trim().optional(),
  countryCode: z.string().trim().min(2, msg("onboarding.errors.countryRequired")),
  citySlug: z.string().trim().min(1, msg("onboarding.errors.cityRequired")),
  address: z.string().trim().optional(),
  deliveryZones: z.array(z.string().trim().min(1)).optional(),
  businessCategory: businessCategorySchema.optional(),
  legalDocuments: z.array(z.url()).optional(),
  legalBusinessInformation: legalBusinessInformationSchema
    .nullable()
    .optional(),
  legalBusinessQuestions: z
    .array(legalBusinessQuestionSchema)
    .nullable()
    .optional(),
});

export const createBusinessInputSchema = businessBaseSchema.superRefine(
  (input, ctx) => {
    const isLegal = isLegalBusinessCategory(input.businessCategory);

    if (isLegal && !input.legalDocuments?.length) {
      ctx.addIssue({
        code: "custom",
        path: ["legalDocuments"],
        message:
          msg("onboarding.errors.legalDocumentsRequired"),
      });
    }

    if (isLegal && !input.legalBusinessInformation) {
      ctx.addIssue({
        code: "custom",
        path: ["legalBusinessInformation"],
        message:
          msg("onboarding.errors.legalInformationRequired"),
      });
    }

    if (isLegal && !input.legalBusinessQuestions?.length) {
      ctx.addIssue({
        code: "custom",
        path: ["legalBusinessQuestions"],
        message:
          msg("onboarding.errors.questionRequired"),
      });
    }
  },
);

export const updateBusinessInputSchema = z.object({
  id: z.string(),
  ...businessBaseSchema.partial().shape,
});

export type CreateBusinessInput = z.infer<typeof createBusinessInputSchema>;
export type UpdateBusinessInput = z.infer<typeof updateBusinessInputSchema>;
export type LegalBusinessInformation = z.infer<
  typeof legalBusinessInformationSchema
>;
export type LegalBusinessType = z.infer<typeof legalBusinessTypeSchema>;
export type BusinessCategoryInput = z.infer<typeof businessCategorySchema>;
export type BusinessKeyPerson = z.infer<typeof businessKeyPersonSchema>;
export type BusinessContact = z.infer<typeof businessContactSchema>;
export type PersonTitle = z.infer<typeof personTitleSchema>;
