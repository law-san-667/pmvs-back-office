import { locales } from "@/i18n/config";
import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales,
  defaultLocale: "fr",
});

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
