import z from "zod";

export const legalBusinessTypeSchema = z.enum([
  "PRODUCER",
  "EXPORTER",
  "IMPORTER",
  "IMPORTER_EXPORTER",
  "OTHER",
]);

export const legalBusinessInformationSchema = z.object({
  acronym: z.string().trim().min(1).optional(),
  creationYear: z.number().int().min(1000).max(9999),
  legalStatus: z.string().trim().min(1, "Le statut juridique est requis."),
  commercialRegisterNumber: z
    .string()
    .trim()
    .min(1, "Le numéro du registre de commerce est requis."),
  permanentStaffCount: z.number().int().nonnegative().optional(),
  addresses: z.array(z.string().trim().min(1)).optional(),
  postalAddress: z.string().trim().min(1).optional(),
  headquartersGeolocation: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
  website: z.url("Le site web est invalide.").optional(),
  productCategories: z.array(z.string().trim().min(1)).optional(),
  serviceCategories: z.array(z.string().trim().min(1)).optional(),
  businessTypes: z.array(legalBusinessTypeSchema).optional(),
  otherBusinessType: z.string().trim().min(1).optional(),
  legalRepresentative: z.object({
    name: z.string().trim().min(1, "Le nom du représentant légal est requis."),
    role: z.string().trim().min(1).optional(),
    email: z.email("L'email du représentant est invalide.").optional(),
    mobilePhone: z
      .string()
      .trim()
      .min(1, "Le téléphone du représentant légal est requis."),
  }),
  productionResources: z
    .object({
      description: z.string().trim().min(1).optional(),
      workshopAreaM2: z.number().nonnegative().optional(),
      storeAreaM2: z.number().nonnegative().optional(),
      outdoorAreaM2: z.number().nonnegative().optional(),
    })
    .optional(),
  importExportIssues: z.string().trim().min(1).optional(),
  plannedActions: z.string().trim().min(1).optional(),
});

export const legalBusinessQuestionSchema = z.object({
  questionTitle: z.string().trim().min(1),
  answer: z.string(),
});

const businessBaseSchema = z.object({
  name: z.string().trim().min(1, "Le nom du business est requis."),
  image: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  whatsappPhone: z.string().trim().optional(),
  contactEmail: z
    .string()
    .trim()
    .email("L'email professionnel est invalide.")
    .optional(),
  facebookLink: z
    .string()
    .trim()
    .url("Le lien Facebook est invalide.")
    .optional(),
  instagramLink: z
    .string()
    .trim()
    .url("Le lien Instagram est invalide.")
    .optional(),
  orangeMoneyNumber: z.string().trim().optional(),
  waveNumber: z.string().trim().optional(),
  countryCode: z.string().trim().min(2, "Le pays est requis."),
  citySlug: z.string().trim().min(1, "La ville est requise."),
  address: z.string().trim().optional(),
  deliveryZones: z.array(z.string().trim().min(1)).optional(),
  legalBusiness: z.boolean().optional(),
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
    if (input.legalBusiness && !input.legalDocuments?.length) {
      ctx.addIssue({
        code: "custom",
        path: ["legalDocuments"],
        message:
          "Les documents légaux sont requis pour un business régularisé.",
      });
    }

    if (input.legalBusiness && !input.legalBusinessInformation) {
      ctx.addIssue({
        code: "custom",
        path: ["legalBusinessInformation"],
        message:
          "Les informations légales sont requises pour un business régularisé.",
      });
    }

    if (input.legalBusiness && !input.legalBusinessQuestions?.length) {
      ctx.addIssue({
        code: "custom",
        path: ["legalBusinessQuestions"],
        message:
          "Sélectionnez au moins une question applicable à votre business.",
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
