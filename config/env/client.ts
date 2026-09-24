import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const env = createEnv({
  client: {
    NEXT_PUBLIC_APP_URL: z.string().min(1),
    NEXT_PUBLIC_ENV: z.enum(["development", "production"]),
    /** Cloudflare Turnstile. Unset hides the sign-up captcha entirely. */
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
    /** Storefront (buyer space), for the "Je suis un acheteur" button. */
    NEXT_PUBLIC_BUYER_APP_URL: z.string().min(1).optional(),
  },
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_BUYER_APP_URL: process.env.NEXT_PUBLIC_BUYER_APP_URL,
  },
});
