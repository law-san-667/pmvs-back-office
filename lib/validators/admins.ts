import { paginationInputSchema } from "@/lib/validators/backend-resources";
import z from "zod";

/** Roles that can sign into the back office. */
export const staffRoleSchema = z.enum(["ADMIN", "MODERATOR", "OPERATOR"]);

const userStatusSchema = z.enum([
  "PENDING_VERIFICATION",
  "ACTIVE",
  "SUSPENDED",
  "DELETED",
]);

export const adminsInputSchema = paginationInputSchema.extend({
  orderBy: z
    .enum(["createdAt", "lastLoginAt", "role", "firstName"])
    .optional(),
  role: staffRoleSchema.optional(),
  status: userStatusSchema.optional(),
  search: z.string().trim().min(1).optional(),
});

export const createAdminInputSchema = z
  .object({
    firstName: z.string().trim().min(1, "Prénom obligatoire."),
    lastName: z.string().trim().min(1, "Nom obligatoire."),
    // Optional on the form: an empty input must not fail the email check.
    email: z
      .union([z.literal(""), z.string().trim().email("Adresse email invalide.")])
      .optional()
      .transform((value) => value || undefined),
    phoneNumber: z
      .union([z.literal(""), z.string().trim().min(6).max(20)])
      .optional()
      .transform((value) => value || undefined),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    role: staffRoleSchema,
  })
  .superRefine((value, ctx) => {
    if (!value.email && !value.phoneNumber) {
      ctx.addIssue({
        code: "custom",
        message: "Renseignez un email ou un numéro de téléphone.",
        path: ["email"],
      });
    }
  });

export type StaffRole = z.infer<typeof staffRoleSchema>;
export type AdminsInput = z.infer<typeof adminsInputSchema>;
export type CreateAdminInput = z.infer<typeof createAdminInputSchema>;
