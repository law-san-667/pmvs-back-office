import z from "zod";
import { msg } from "./messages";

// Messages are keys of the "auth" messages, translated where the form shows
// them (FieldError, useValidationMessage).

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
  .min(6, msg("auth.errors.passwordMin"))
  .regex(/\p{Lu}/u, msg("auth.errors.passwordUppercase"))
  .regex(/\d/, msg("auth.errors.passwordDigit"));

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, msg("auth.errors.firstNameRequired")),
    lastName: z.string().trim().min(1, msg("auth.errors.lastNameRequired")),
    phoneNumber: z
      .string()
      .trim()
      .min(6, msg("auth.errors.phoneInvalid"))
      .max(20, msg("auth.errors.phoneInvalid"))
      .optional(),
    // Optional on the form: an empty input must not fail the email check.
  email: z
    .union([z.literal(""), z.string().trim().email(msg("auth.errors.emailInvalid"))])
    .optional()
    .transform((value) => value || undefined),
    password: passwordSchema,
    confirmPassword: z.string().min(1, msg("auth.errors.confirmPasswordRequired")),
    role: userRoleSchema,
    device: authDeviceSchema,
    captchaToken: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.email && !value.phoneNumber) {
      ctx.addIssue({
        code: "custom",
        message: msg("auth.errors.phoneOrEmailRequired"),
        path: ["phoneNumber"],
      });
    }

    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: msg("auth.errors.passwordsMismatch"),
        path: ["confirmPassword"],
      });
    }
  });

export const registerFormSchema = registerSchema.safeExtend({
  acceptTerms: z.boolean().refine((accepted) => accepted, {
    message: msg("auth.errors.acceptTermsRequired"),
  }),
});

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, msg("auth.errors.identifierRequired"))
    .refine(
      (identifier) =>
        z.email().safeParse(identifier).success ||
        /^\+[1-9]\d{5,19}$/.test(identifier),
      msg("auth.errors.identifierInvalid"),
    ),
  password: z.string().min(1, msg("auth.errors.passwordRequired")),
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
    .min(1, msg("auth.errors.recoveryIdentifierRequired")),
  device: authDeviceSchema,
});

export const validateOtpSchema = z
  .object({
    identifier: z.string().trim().min(1),
    purpose: otpPurposeSchema,
    code: z.string().trim().length(4, msg("auth.errors.codeLength")),
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
        message: msg("auth.errors.newPasswordRequired"),
        path: ["newPassword"],
      });
    }

    if (!value.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: msg("auth.errors.newPasswordConfirmRequired"),
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
        message: msg("auth.errors.passwordsMismatch"),
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
