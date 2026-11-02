import type { Locale } from "./config";
import type { Messages } from "./messages";

// Keys of t() are checked against the French messages.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
