"use client";

import { AdminTableState } from "@/components/admin/admin-table-state";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Advertisement } from "@/lib/advertising";
import { formatNumber } from "@/lib/utils";
import { MoreHorizontalIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  clickRate,
  formatPeriod,
  STATE_CLASSES,
} from "./ad-utils";

export type AdAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** Shown as a button next to the menu (e.g. "Valider"). */
  primary?: boolean;
  destructive?: boolean;
};

/** Ads with their state and results; actions come from the page. */
export function AdsTable({
  ads,
  isLoading,
  error,
  showOwner = false,
  actions,
}: {
  ads: Advertisement[] | undefined;
  isLoading: boolean;
  error?: string;
  showOwner?: boolean;
  actions: (ad: Advertisement) => (AdAction | false | null | undefined)[];
}) {
  const t = useTranslations("ads");
  const locale = useLocale();
  const colSpan = 6;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("table.ad")}</TableHead>
          <TableHead>{t("table.placement")}</TableHead>
          <TableHead>{t("table.period")}</TableHead>
          <TableHead>{t("table.state")}</TableHead>
          <TableHead className="text-end">{t("table.results")}</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        <AdminTableState
          colSpan={colSpan}
          isLoading={isLoading}
          error={error}
          isEmpty={!ads?.length}
          loadingLabel={t("table.loading")}
          emptyLabel={t("table.empty")}
        />
        {ads?.map((ad) => (
          <TableRow key={ad.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ad.imageUrl}
                  alt=""
                  className="h-10 w-20 shrink-0 rounded border object-cover"
                />
                <div className="max-w-56 min-w-0">
                  <p className="truncate font-medium" title={ad.title}>
                    {ad.title}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {[
                      showOwner ? (ad.business?.name ?? "Diarama") : null,
                      ad.countryCodes?.length
                        ? ad.countryCodes.join(", ")
                        : t("table.allCountries"),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell>{t(`placement.${ad.placement}`)}</TableCell>
            <TableCell className="text-sm whitespace-nowrap">
              {formatPeriod(ad.startsAt, ad.endsAt, t, locale)}
            </TableCell>
            <TableCell>
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${STATE_CLASSES[ad.state]}`}
                title={ad.reviewReason ?? undefined}
              >
                {t(`state.${ad.state}`)}
              </span>
              {ad.state === "REJECTED" && ad.reviewReason && (
                <p className="text-muted-foreground mt-1 max-w-48 text-xs whitespace-normal">
                  {ad.reviewReason}
                </p>
              )}
            </TableCell>
            <TableCell className="text-end text-sm whitespace-nowrap">
              {formatNumber(ad.impressions, locale)} /{" "}
              {formatNumber(ad.clicks, locale)}
              <span className="text-muted-foreground block text-xs">
                {clickRate(ad.impressions, ad.clicks, locale)}
              </span>
            </TableCell>
            <TableCell>
              <RowActions ad={ad} actions={actions(ad)} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function RowActions({
  ad,
  actions,
}: {
  ad: Advertisement;
  actions: (AdAction | false | null | undefined)[];
}) {
  const t = useTranslations("ads");
  const list = actions.filter((action): action is AdAction => Boolean(action));
  const primary = list.filter((action) => action.primary);
  const others = list.filter((action) => !action.primary);
  return (
    <div className="flex items-center justify-end gap-1">
      {primary.map((action) => (
        <Button
          key={action.label}
          size="sm"
          variant="outline"
          disabled={action.disabled}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ))}
      {others.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("actions.menu", { title: ad.title })}
              />
            }
          >
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {others.map((action) => (
              <DropdownMenuItem
                key={action.label}
                disabled={action.disabled}
                variant={action.destructive ? "destructive" : undefined}
                onClick={action.onClick}
              >
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
