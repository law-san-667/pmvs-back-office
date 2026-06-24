import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const env = createEnv({
  server: {
    LOG_VERBOSE: z.coerce.boolean().optional(),
    CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
    CLOUDFLARE_R2_API_URL: z.string().min(1),
    CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().min(1),
    CLOUDFLARE_R2_SECRET_KEY: z.string().min(1),
    CLOUDFLARE_R2_BUCKET: z.string().min(1),
    CLOUDFLARE_R2_PUBLIC_URL: z.url(),
  },
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: process.env,
});
