import {
  type AuthOtpActionData,
  type PublicUser,
  type SignUpData,
  type ValidateOtpData,
  isAuthSuccessData,
} from "@/lib/backend-utils";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendOtpSchema,
  validateOtpSchema,
} from "@/lib/validators/auth";
import { callBackend } from "@/server/backend-utils";
import { createTRPCRouter, publicProcedure } from "../init";

const cookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: "Lax",
  secure: process.env.NODE_ENV === "production",
} as const;

const serializeCookie = (
  name: string,
  value: string,
  maxAge: number,
  options = cookieOptions,
) => {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Max-Age=${maxAge}`,
    `Path=${options.path}`,
    `SameSite=${options.sameSite}`,
    "HttpOnly",
  ];

  if (options.secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
};

export const authRouter = createTRPCRouter({
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.isAuthenticated) {
      return null;
    }
    return callBackend<PublicUser>(ctx.api.get("/me"));
  }),
  register: publicProcedure
    .input(registerSchema)
    .mutation(({ ctx, input }) =>
      callBackend<SignUpData>(ctx.api.post("/signup", input)),
    ),
  login: publicProcedure.input(loginSchema).mutation(({ ctx, input }) =>
    callBackend<AuthOtpActionData>(ctx.api.post("/login", input)),
  ),
  resendOtp: publicProcedure
    .input(resendOtpSchema)
    .mutation(({ ctx, input }) =>
      callBackend<AuthOtpActionData>(ctx.api.post("/resend-otp", input)),
    ),
  forgotPassword: publicProcedure
    .input(forgotPasswordSchema)
    .mutation(({ ctx, input }) =>
      callBackend<AuthOtpActionData>(
        ctx.api.post("/forgot-password", input),
      ),
    ),
  validateOtp: publicProcedure
    .input(validateOtpSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await callBackend<ValidateOtpData>(
        ctx.api.post("/validate-otp", input),
      );

      if (isAuthSuccessData(result)) {
        ctx.resHeaders.append(
          "set-cookie",
          serializeCookie("access_token", result.accessToken, result.expiresIn),
        );
        ctx.resHeaders.append(
          "set-cookie",
          serializeCookie(
            "refresh_token",
            result.refreshToken,
            result.refreshExpiresIn,
          ),
        );
      }

      return result;
    }),
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.resHeaders.append(
      "set-cookie",
      serializeCookie("access_token", "", 0),
    );
    ctx.resHeaders.append(
      "set-cookie",
      serializeCookie("refresh_token", "", 0),
    );
    return { success: true };
  }),
});
