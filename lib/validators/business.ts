import z from "zod";

export const createBusinessInputSchema = z
  .object({
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
  })
  .superRefine((input, ctx) => {
    if (input.legalBusiness && !input.legalDocuments?.length) {
      ctx.addIssue({
        code: "custom",
        path: ["legalDocuments"],
        message:
          "Les documents légaux sont requis pour un business régularisé.",
      });
    }
  });

export type CreateBusinessInput = z.infer<typeof createBusinessInputSchema>;
