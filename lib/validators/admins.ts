import { passwordSchema } from "@/lib/validators/auth";
import { paginationInputSchema, uuidSchema } from "@/lib/validators/backend-resources";
import z from "zod";
import { msg } from "./messages";

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
    firstName: z.string().trim().min(1, msg("adminAccounts.createAdmin.errors.firstNameRequired")),
    lastName: z.string().trim().min(1, msg("adminAccounts.createAdmin.errors.lastNameRequired")),
    // Optional on the form: an empty input must not fail the email check.
    email: z
      .union([z.literal(""), z.string().trim().email(msg("adminAccounts.createAdmin.errors.emailInvalid"))])
      .optional()
      .transform((value) => value || undefined),
    phoneNumber: z
      .union([z.literal(""), z.string().trim().min(6).max(20)])
      .optional()
      .transform((value) => value || undefined),
    password: passwordSchema,
    confirmPassword: z.string().min(1, msg("adminAccounts.createAdmin.errors.confirmPasswordRequired")),
    role: staffRoleSchema,
  })
  .superRefine((value, ctx) => {
    if (!value.email && !value.phoneNumber) {
      ctx.addIssue({
        code: "custom",
        message: msg("adminAccounts.createAdmin.errors.contactRequired"),
        path: ["email"],
      });
    }
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: msg("adminAccounts.createAdmin.errors.passwordMismatch"),
        path: ["confirmPassword"],
      });
    }
  });

/** Frontend-only: the CGU tick is checked in the dialog, never sent. */
export const createAdminFormSchema = createAdminInputSchema.safeExtend({
  acceptTerms: z.boolean().refine((accepted) => accepted, {
    message: msg("adminAccounts.createAdmin.errors.acceptTerms"),
  }),
});

export const verifyAdminInputSchema = z.object({
  id: uuidSchema,
  code: z.string().trim().length(4, msg("adminAccounts.createAdmin.errors.codeLength")),
});

export type StaffRole = z.infer<typeof staffRoleSchema>;
export type AdminsInput = z.infer<typeof adminsInputSchema>;
export type CreateAdminInput = z.infer<typeof createAdminInputSchema>;
export type CreateAdminFormInput = z.infer<typeof createAdminFormSchema>;
