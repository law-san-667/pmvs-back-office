"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CaseCard } from "@/components/orders/after-sales-card";
import { Link } from "@/i18n/navigation";
import { type CaseStatus, CASE_STATUS_LABELS } from "@/lib/after-sales";
import { cn } from "@/lib/utils";
import { trpc } from "@/server/trpc/client";
import { useState } from "react";

/** Cases waiting for a decision first: escalated, then accepted. */
export default function AdminAfterSalesPage() {
  const [status, setStatus] = useState<CaseStatus>("ESCALATED");
  const cases = trpc.afterSales.all.useQuery({ status });

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <AdminPageHeader
        title="Retours et litiges"
        description="Tranchez les dossiers refusés par le vendeur ou restés sans réponse, et appliquez ceux qu’il a acceptés."
      />
      <div className="flex flex-wrap gap-2">
        {(Object.keys(CASE_STATUS_LABELS) as CaseStatus[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatus(key)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              status === key && "bg-primary text-primary-foreground",
            )}
          >
            {CASE_STATUS_LABELS[key]}
          </button>
        ))}
      </div>
      {!cases.data?.items.length && (
        <p className="text-muted-foreground text-sm">
          {cases.isLoading ? "Chargement…" : "Aucun dossier."}
        </p>
      )}
      {cases.data?.items.map((item) => (
        <div key={item.id} className="flex flex-col gap-1">
          <Link
            href={`/dashboard/admin/orders/${item.orderId}`}
            className="text-primary text-sm hover:underline"
          >
            Commande #{item.orderId.slice(0, 8).toUpperCase()}
            {item.business ? ` · ${item.business.name}` : ""}
          </Link>
          <CaseCard key={item.id + item.status} item={item} />
        </div>
      ))}
    </div>
  );
}
