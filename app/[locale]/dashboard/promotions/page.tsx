"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminTableState } from "@/components/admin/admin-table-state";
import { useBusiness } from "@/contexts/business-context";
import { formatDate, formatNumber } from "@/lib/utils";
import { trpc } from "@/server/trpc/client";
import type { Promotion, PromotionState } from "@/server/trpc/_procedures/promotions";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

const STATE_VARIANTS: Record<PromotionState, "default" | "secondary" | "outline"> = {
  RUNNING: "default",
  SCHEDULED: "secondary",
  ENDED: "outline",
  PAUSED: "outline",
};
const SCOPES = ["ALL", "CATEGORY", "LISTING"] as const;
const selectClass = "border-input bg-background h-9 w-full rounded-md border px-3 text-sm";

/** `datetime-local` value of a date, in local time. */
const toLocalInput = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};
const formatDateTime = (value: string, locale: string) =>
  formatDate(value, locale, { dateStyle: "short", timeStyle: "short" });

type Form = {
  id: string | null;
  name: string;
  type: "PERCENT" | "FIXED";
  value: string;
  scope: "LISTING" | "CATEGORY" | "ALL";
  categoryId: string;
  listingIds: string[];
  startsAt: string;
  endsAt: string;
};

const emptyForm = (): Form => {
  const now = new Date();
  return {
    id: null,
    name: "",
    type: "PERCENT",
    value: "",
    scope: "ALL",
    categoryId: "",
    listingIds: [],
    startsAt: toLocalInput(now),
    endsAt: toLocalInput(new Date(now.getTime() + 7 * 86_400_000)),
  };
};

/**
 * The shop's discounts. The best running promotion applies to each product;
 * promotions never add up. Order lines keep the discount granted.
 */
export default function PromotionsPage() {
  const t = useTranslations("promotions");
  const locale = useLocale();
  const { businessId } = useBusiness();
  const utils = trpc.useUtils();
  const promotions = trpc.promotions.list.useQuery(
    { businessId: businessId ?? "" },
    { enabled: Boolean(businessId) },
  );
  const categories = trpc.catalog.categories.useQuery({
    orderBy: "sortOrder",
    order: "asc",
  });
  const listings = trpc.listings.list.useQuery(
    { page: 1, limit: 100, orderBy: "title", order: "asc" },
    { enabled: Boolean(businessId) },
  );
  const create = trpc.promotions.create.useMutation();
  const update = trpc.promotions.update.useMutation();
  const remove = trpc.promotions.delete.useMutation();
  const [form, setForm] = useState<Form | null>(null);
  const saving = create.isPending || update.isPending;

  const categoryName = (id: string | null) =>
    categories.data?.find((category) => category.id === id)?.name ?? "—";
  const target = (promotion: Promotion) =>
    promotion.scope === "ALL"
      ? t("scope.ALL")
      : promotion.scope === "CATEGORY"
        ? categoryName(promotion.categoryId)
        : t("productCount", { count: promotion.listingIds.length });
  const formatValue = (promotion: Pick<Promotion, "type" | "value">) =>
    promotion.type === "PERCENT"
      ? t("percentValue", { value: formatNumber(promotion.value, locale) })
      : t("fixedValue", { value: formatNumber(promotion.value, locale) });

  const value = Number.parseInt(form?.value.replace(/\s/g, "") ?? "", 10);
  const canSave =
    form !== null &&
    form.name.trim().length >= 2 &&
    Number.isFinite(value) &&
    value > 0 &&
    (form.type !== "PERCENT" || value <= 90) &&
    (form.scope !== "CATEGORY" || Boolean(form.categoryId)) &&
    (form.scope !== "LISTING" || form.listingIds.length > 0) &&
    new Date(form.endsAt) > new Date(form.startsAt);

  const refresh = () => utils.promotions.list.invalidate();

  const save = async () => {
    if (!form || !businessId || !canSave) return;
    const body = {
      name: form.name.trim(),
      type: form.type,
      value,
      scope: form.scope,
      categoryId: form.scope === "CATEGORY" ? form.categoryId : null,
      listingIds: form.scope === "LISTING" ? form.listingIds : [],
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
    };
    try {
      if (form.id) await update.mutateAsync({ id: form.id, ...body });
      else await create.mutateAsync({ businessId, ...body });
      toast.success(form.id ? t("updated") : t("created"));
      setForm(null);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("saveFailed"));
    }
  };

  const toggle = async (promotion: Promotion) => {
    try {
      await update.mutateAsync({ id: promotion.id, isActive: !promotion.isActive });
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("actionFailed"));
    }
  };

  const destroy = async (promotion: Promotion) => {
    if (!window.confirm(t("deleteConfirm", { name: promotion.name }))) return;
    try {
      await remove.mutateAsync({ id: promotion.id });
      toast.success(t("deleted"));
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("deleteFailed"));
    }
  };

  const edit = (promotion: Promotion) =>
    setForm({
      id: promotion.id,
      name: promotion.name,
      type: promotion.type,
      value: String(promotion.value),
      scope: promotion.scope,
      categoryId: promotion.categoryId ?? "",
      listingIds: promotion.listingIds,
      startsAt: toLocalInput(new Date(promotion.startsAt)),
      endsAt: toLocalInput(new Date(promotion.endsAt)),
    });

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {t("listTitle", { count: promotions.data?.length ?? 0 })}
          </CardTitle>
          <CardAction>
            <Button size="sm" onClick={() => setForm(emptyForm())}>
              {t("new")}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.name")}</TableHead>
                <TableHead>{t("columns.discount")}</TableHead>
                <TableHead>{t("columns.target")}</TableHead>
                <TableHead>{t("columns.period")}</TableHead>
                <TableHead>{t("columns.state")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={6}
                isLoading={promotions.isLoading}
                error={promotions.error?.message}
                isEmpty={!promotions.data?.length}
                loadingLabel={t("loading")}
                emptyLabel={t("empty")}
              />
              {promotions.data?.map((promotion) => (
                <TableRow key={promotion.id}>
                  <TableCell className="font-medium">{promotion.name}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatValue(promotion)}
                  </TableCell>
                  <TableCell>{target(promotion)}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatDateTime(promotion.startsAt, locale)} →{" "}
                    {formatDateTime(promotion.endsAt, locale)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATE_VARIANTS[promotion.state]}>
                      {t(`state.${promotion.state}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => edit(promotion)}>
                        {t("edit")}
                      </Button>
                      {promotion.state !== "ENDED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={update.isPending}
                          onClick={() => void toggle(promotion)}
                        >
                          {promotion.isActive ? t("pause") : t("resume")}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={remove.isPending}
                        onClick={() => void destroy(promotion)}
                      >
                        {t("delete")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog
        open={form !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen && !saving) setForm(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {form?.id ? t("editTitle") : t("new")}
            </AlertDialogTitle>
          </AlertDialogHeader>
          {form && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="promo-name">{t("name")}</FieldLabel>
                <Input
                  id="promo-name"
                  value={form.name}
                  maxLength={120}
                  placeholder={t("namePlaceholder")}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="promo-type">{t("type")}</FieldLabel>
                <select
                  id="promo-type"
                  className={selectClass}
                  value={form.type}
                  onChange={(event) =>
                    setForm({ ...form, type: event.target.value as Form["type"] })
                  }
                >
                  <option value="PERCENT">{t("typePercent")}</option>
                  <option value="FIXED">{t("typeFixed")}</option>
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="promo-value">
                  {form.type === "PERCENT" ? t("valuePercent") : t("valueFixed")}
                </FieldLabel>
                <Input
                  id="promo-value"
                  inputMode="numeric"
                  value={form.value}
                  onChange={(event) => setForm({ ...form, value: event.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="promo-start">{t("start")}</FieldLabel>
                <Input
                  id="promo-start"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="promo-end">{t("end")}</FieldLabel>
                <Input
                  id="promo-end"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(event) => setForm({ ...form, endsAt: event.target.value })}
                />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="promo-scope">{t("appliesTo")}</FieldLabel>
                <select
                  id="promo-scope"
                  className={selectClass}
                  value={form.scope}
                  onChange={(event) =>
                    setForm({ ...form, scope: event.target.value as Form["scope"] })
                  }
                >
                  {SCOPES.map((scope) => (
                    <option key={scope} value={scope}>
                      {t(`scope.${scope}`)}
                    </option>
                  ))}
                </select>
              </Field>
              {form.scope === "CATEGORY" && (
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="promo-category">{t("category")}</FieldLabel>
                  <select
                    id="promo-category"
                    className={selectClass}
                    value={form.categoryId}
                    onChange={(event) =>
                      setForm({ ...form, categoryId: event.target.value })
                    }
                  >
                    <option value="">{t("choose")}</option>
                    {categories.data?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              {form.scope === "LISTING" && (
                <div className="flex max-h-56 flex-col gap-2 overflow-y-auto rounded-md border p-3 sm:col-span-2">
                  {listings.data?.items.length === 0 && (
                    <p className="text-muted-foreground text-sm">{t("noProduct")}</p>
                  )}
                  {listings.data?.items.map((listing) => (
                    <label key={listing.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.listingIds.includes(listing.id)}
                        onCheckedChange={(checked) =>
                          setForm({
                            ...form,
                            listingIds: checked
                              ? [...form.listingIds, listing.id]
                              : form.listingIds.filter((id) => id !== listing.id),
                          })
                        }
                      />
                      <span className="truncate">{listing.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <AlertDialogCancel disabled={saving}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={!canSave || saving}
              onClick={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              {saving ? t("saving") : t("save")}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
