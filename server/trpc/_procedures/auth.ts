import { locales } from "@/i18n/config";
import z from "zod";
import {
  type AuthSuccessData,
  type LoginChallenge,
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
import { privateProcedure, createTRPCRouter, publicProcedure } from "../init";

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

const setAuthCookies = (headers: Headers, result: AuthSuccessData) => {
  headers.append(
    "set-cookie",
    serializeCookie("access_token", result.accessToken, result.expiresIn),
  );
  headers.append(
    "set-cookie",
    serializeCookie(
      "refresh_token",
      result.refreshToken,
      result.refreshExpiresIn,
    ),
  );
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
  login: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
    const result = await callBackend<AuthSuccessData | LoginChallenge>(
      ctx.api.post("/login", { ...input, supportsMfa: true }),
    );

    if ("accessToken" in result) setAuthCookies(ctx.resHeaders, result);

    return result;
  }),
  verifyLogin: publicProcedure
    .input(z.object({ challengeId: z.uuid(), code: z.string().min(4).max(8), device: z.enum(["WEB", "MOBILE"]).default("WEB") }))
    .mutation(async ({ ctx, input }) => {
      const result = await callBackend<AuthSuccessData>(ctx.api.post("/login/verify", input));

      setAuthCookies(ctx.resHeaders, result);

      return result;
    }),
  resendLoginCode: publicProcedure
    .input(z.object({ challengeId: z.uuid() }))
    .mutation(({ ctx, input }) =>
      callBackend<LoginChallenge>(ctx.api.post("/login/resend", input)),
    ),
  /** Language of the person's e-mails, messages and notifications. */
  setLanguage: privateProcedure
    .input(z.object({ language: z.enum(locales) }))
    .mutation(({ ctx, input }) => callBackend<PublicUser>(ctx.api.put("/me/language", input))),
  updateMfa: privateProcedure
    .input(z.object({ enabled: z.boolean(), password: z.string().min(1) }))
    .mutation(({ ctx, input }) => callBackend<PublicUser>(ctx.api.put("/me/mfa", input))),
  resendOtp: publicProcedure
    .input(resendOtpSchema)
    .mutation(({ ctx, input }) =>
      callBackend<AuthOtpActionData>(ctx.api.post("/resend-otp", input)),
    ),
  forgotPassword: publicProcedure
    .input(forgotPasswordSchema)
    .mutation(({ ctx, input }) =>
      callBackend<AuthOtpActionData>(ctx.api.post("/forgot-password", input)),
    ),
  validateOtp: publicProcedure
    .input(validateOtpSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await callBackend<ValidateOtpData>(
        ctx.api.post("/validate-otp", input),
      );

      if (isAuthSuccessData(result)) {
        setAuthCookies(ctx.resHeaders, result);
      }

      return result;
    }),
  logout: publicProcedure.mutation(async ({ ctx }) => {
    try {
      if (ctx.auth.isAuthenticated) {
        await callBackend<{ message: string }>(ctx.api.post("/logout"));
      }

      return { success: true };
    } finally {
      ctx.resHeaders.append(
        "set-cookie",
        serializeCookie("access_token", "", 0),
      );
      ctx.resHeaders.append(
        "set-cookie",
        serializeCookie("refresh_token", "", 0),
      );
    }
  }),
});
