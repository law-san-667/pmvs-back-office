import { Button } from "@/components/ui/button";
import { BUYER_APP_URL } from "@/config/spaces";
import { ShoppingBag, Store } from "lucide-react";

/**
 * Says which of the two spaces the visitor is in, and sends them to the other
 * one. Signing up in the wrong space is the mistake this prevents: a buyer
 * account lives on the storefront, not here.
 */
export default function SpaceBanner({ mode }: { mode: "login" | "register" }) {
  return (
    <div className="border-primary/20 bg-primary/5 mb-6 w-full rounded-2xl border p-4">
      <div className="flex items-start gap-3">
        <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
          <Store className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-primary text-sm font-semibold">
            Espace fournisseur
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {mode === "register"
              ? "Créez un compte fournisseur pour publier vos produits et services, répondre aux appels d'offres et gérer vos ventes. Cet espace s'adresse aux producteurs, prestataires, exportateurs, commerçants et adjudicateurs."
              : "Connectez-vous à votre compte fournisseur pour gérer vos produits, vos commandes et vos reversements. Les administrateurs de la plateforme se connectent également ici."}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dashed pt-3">
        <p className="text-muted-foreground text-sm">
          Vous souhaitez acheter sur la plateforme ?
        </p>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          render={
            // Keep the visitor on the same step in the other space.
            <a
              href={`${BUYER_APP_URL}/fr/auth${mode === "register" ? "?mode=register" : ""}`}
              rel="noreferrer"
            />
          }
        >
          <ShoppingBag /> Je suis un acheteur
        </Button>
      </div>
    </div>
  );
}
