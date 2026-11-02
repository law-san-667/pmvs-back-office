import { Button } from "@/components/ui/button";
import { BUYER_APP_URL } from "@/config/spaces";
import { ShoppingBag, Store } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

/**
 * Says which of the two spaces the visitor is in, and sends them to the other
 * one. Signing up in the wrong space is the mistake this prevents: a buyer
 * account lives on the storefront, not here.
 */
export default function SpaceBanner({ mode }: { mode: "login" | "register" }) {
  const t = useTranslations("auth.spaceBanner");
  const locale = useLocale();

  return (
    <div className="border-primary/20 bg-primary/5 mb-6 w-full rounded-2xl border p-4">
      <div className="flex items-start gap-3">
        <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
          <Store className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-primary text-sm font-semibold">{t("title")}</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {mode === "register" ? t("register") : t("login")}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dashed pt-3">
        <p className="text-muted-foreground text-sm">{t("buyQuestion")}</p>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          nativeButton={false}
          render={
            // Keep the visitor on the same step in the other space.
            <a
              href={`${BUYER_APP_URL}/${locale}/auth${mode === "register" ? "?mode=register" : ""}`}
              rel="noreferrer"
            />
          }
        >
          <ShoppingBag /> {t("buyerButton")}
        </Button>
      </div>
    </div>
  );
}
