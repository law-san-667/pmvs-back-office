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

export const registerSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  phoneNumber: z.string().trim().min(6).max(20).optional(),
  email: z.string().trim().email().optional(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  role: userRoleSchema,
  device: authDeviceSchema,
}).superRefine((value, ctx) => {
  if (!value.email && !value.phoneNumber) {
    ctx.addIssue({
      code: "custom",
      message: "Email or phone number is required.",
      path: ["phoneNumber"],
    });
  }

  if (value.password !== value.confirmPassword) {
    ctx.addIssue({
      code: "custom",
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    });
  }
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
  device: authDeviceSchema,
});

export const resendOtpSchema = z.object({
  identifier: z.string().trim().min(1),
  purpose: otpPurposeSchema,
  device: authDeviceSchema,
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().trim().min(1),
  device: authDeviceSchema,
});

export const validateOtpSchema = z
  .object({
    identifier: z.string().trim().min(1),
    purpose: otpPurposeSchema,
    code: z.string().trim().length(6),
    device: authDeviceSchema,
    newPassword: z.string().min(8).optional(),
    confirmPassword: z.string().min(8).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.purpose !== "PASSWORD_RESET") {
      return;
    }

    if (!value.newPassword) {
      ctx.addIssue({
        code: "custom",
        message: "New password is required for password reset.",
        path: ["newPassword"],
      });
    }

    if (!value.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Confirm password is required for password reset.",
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
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ValidateOtpInput = z.infer<typeof validateOtpSchema>;
