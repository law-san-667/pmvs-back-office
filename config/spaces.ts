import { env } from "@/config/env/client";

/**
 * The marketplace has two front ends: this one is the supplier and admin
 * space, buyers shop on the storefront. The sign-in pages link to each other
 * so nobody creates an account in the wrong place.
 */
export const BUYER_APP_URL =
  env.NEXT_PUBLIC_BUYER_APP_URL ??
  (env.NEXT_PUBLIC_ENV === "production"
    ? "https://pmvs-web.vercel.app"
    : "http://localhost:3000");
