"use client";

import IsLoadingScreen from "@/components/is-loading-screen";
import { ShopVendability } from "@/components/vendability/shop-vendability";
import { useBusiness } from "@/contexts/business-context";
import { useTranslations } from "next-intl";

export default function VendabilityPage() {
  const t = useTranslations("vendability");
  const { businessId } = useBusiness();
  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("page.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("page.subtitle")}</p>
      </div>
      {businessId ? (
        <ShopVendability businessId={businessId} />
      ) : (
        <IsLoadingScreen text={t("page.loadingShop")} />
      )}
    </div>
  );
}
