"use client";

import { useBusiness } from "@/contexts/business-context";
import { useUser } from "@/contexts/user-context";
import { trpc } from "@/server/trpc/client";
import { StoreIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Operators act for the shops an admin assigned to them: this picks the shop
 * every seller page then works on (sent to the API with each request).
 */
export function OperatorBusinessSwitcher() {
  const t = useTranslations("nav.operator");
  const { user } = useUser();
  const { business, setBusiness } = useBusiness();
  const utils = trpc.useUtils();
  const [isSwitching, setIsSwitching] = useState(false);
  const isOperator = user?.role === "OPERATOR";
  const shops = trpc.operators.myBusinesses.useQuery(undefined, {
    enabled: isOperator,
  });

  if (!isOperator) return null;

  if (!shops.data?.length) {
    return shops.isLoading ? null : (
      <span className="text-muted-foreground text-xs">
        {t("noShop")}
      </span>
    );
  }

  const switchTo = async (id: string) => {
    if (id === business?.id) return;
    setIsSwitching(true);
    try {
      const next = await utils.operators.business.fetch({ id });
      setBusiness(next);
      // Every cached page belonged to the previous shop.
      await utils.invalidate();
    } catch {
      toast.error(t("openError"));
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <label className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900">
      <StoreIcon className="size-4 shrink-0" />
      <span className="hidden sm:inline">{t("actingFor")}</span>
      <select
        aria-label={t("managedShop")}
        value={business?.id ?? ""}
        disabled={isSwitching}
        onChange={(event) => void switchTo(event.target.value)}
        className="max-w-48 bg-transparent font-semibold outline-none"
      >
        {!business && <option value="">{t("chooseShop")}</option>}
        {shops.data.map((shop) => (
          <option key={shop.id} value={shop.id}>
            {shop.name}
          </option>
        ))}
      </select>
    </label>
  );
}
