"use client";

import { CaseCard } from "@/components/orders/after-sales-card";
import { useBusiness } from "@/contexts/business-context";
import { Link } from "@/i18n/navigation";
import { getOrderReference } from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import { useTranslations } from "next-intl";

/** The shop's returns and disputes, newest first. */
export default function ShopAfterSalesPage() {
  const t = useTranslations("afterSales.page");
  const { businessId } = useBusiness();
  const cases = trpc.afterSales.shop.useQuery(
    { businessId: businessId ?? "" },
    { enabled: Boolean(businessId) },
  );

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>
      {!cases.data?.items.length && (
        <p className="text-muted-foreground text-sm">
          {cases.isLoading ? t("loading") : t("empty")}
        </p>
      )}
      {cases.data?.items.map((item) => (
        <div key={item.id} className="flex flex-col gap-1">
          <Link
            href={`/dashboard/orders/${item.orderId}`}
            className="text-primary text-sm hover:underline"
          >
            {t("order", { reference: getOrderReference(item.orderId) })}
          </Link>
          <CaseCard key={item.id + item.status} item={item} />
        </div>
      ))}
    </div>
  );
}
