import z from "zod";

const authDeviceSchema = z.enum(["WEB", "MOBILE"]).default("WEB");
const userRoleSchema = z
  .enum(["CLIENT", "SELLER", "MODERATOR", "ADMIN", "OPERATOR"])
  .default("CLIENT");
const otpPurposeSchema = z.enum([
  "LOGIN",
  "REGISTER",
  "PASSWORD_RESET",
  "VERIFY_EMAIL",
  "VERIFY_PHONE",
]);

/** Client rule: at least 6 characters, one uppercase letter and one digit. */
export const passwordSchema = z
  .string()
  .min(6, "Le mot de passe doit contenir au moins 6 caractères.")
  .regex(/\p{Lu}/u, "Le mot de passe doit contenir une majuscule.")
  .regex(/\d/, "Le mot de passe doit contenir un chiffre.");

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "Veuillez saisir votre prénom."),
    lastName: z.string().trim().min(1, "Veuillez saisir votre nom."),
    phoneNumber: z
      .string()
      .trim()
      .min(6, "Numéro de téléphone invalide.")
      .max(20, "Numéro de téléphone invalide.")
      .optional(),
    // Optional on the form: an empty input must not fail the email check.
  email: z
    .union([z.literal(""), z.string().trim().email("Adresse email invalide.")])
    .optional()
    .transform((value) => value || undefined),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirmez votre mot de passe."),
    role: userRoleSchema,
    device: authDeviceSchema,
    captchaToken: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.email && !value.phoneNumber) {
      ctx.addIssue({
        code: "custom",
        message: "Veuillez saisir un numéro de téléphone ou une adresse email.",
        path: ["phoneNumber"],
      });
    }

    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Les mots de passe ne correspondent pas.",
        path: ["confirmPassword"],
      });
    }
  });

export const registerFormSchema = registerSchema.safeExtend({
  acceptTerms: z.boolean().refine((accepted) => accepted, {
    message: "Vous devez accepter les CGU pour vous inscrire.",
  }),
});

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Renseignez votre email ou votre numéro de téléphone.")
    .refine(
      (identifier) =>
        z.email().safeParse(identifier).success ||
        /^\+[1-9]\d{5,19}$/.test(identifier),
      "Entrez une adresse email ou un numéro de téléphone valide.",
    ),
  password: z.string().min(1, "Renseignez votre mot de passe."),
  device: authDeviceSchema,
});

export const resendOtpSchema = z.object({
  identifier: z.string().trim().min(1),
  purpose: otpPurposeSchema,
  device: authDeviceSchema,
});

export const forgotPasswordSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Veuillez saisir votre email ou votre numéro de téléphone."),
  device: authDeviceSchema,
});

export const validateOtpSchema = z
  .object({
    identifier: z.string().trim().min(1),
    purpose: otpPurposeSchema,
    code: z.string().trim().length(4, "Le code doit contenir 4 chiffres."),
    device: authDeviceSchema,
    newPassword: passwordSchema.optional(),
    confirmPassword: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.purpose !== "PASSWORD_RESET") {
      return;
    }

    if (!value.newPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Veuillez saisir un nouveau mot de passe.",
        path: ["newPassword"],
      });
    }

    if (!value.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Veuillez confirmer le mot de passe.",
        path: ["confirmPassword"],
      });
    }

    if (
      value.newPassword &&
      value.confirmPassword &&
      value.newPassword !== value.confirmPassword
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Les mots de passe ne correspondent pas.",
        path: ["confirmPassword"],
      });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterFormInput = z.infer<typeof registerFormSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ValidateOtpInput = z.infer<typeof validateOtpSchema>;
