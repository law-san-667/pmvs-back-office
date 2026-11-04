"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { trpc } from "@/server/trpc/client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { PageEditor } from "./page-editor";
import { SiteSettingsForm } from "./site-settings-form";

/**
 * Information pages (help, FAQ, terms of use…) and the footer, edited here
 * and shown by the site and the app without a new release.
 */
export default function AdminContentPage() {
  const t = useTranslations("adminSettings.content");
  const tc = useTranslations("adminSettings.common");
  const utils = trpc.useUtils();
  const pages = trpc.content.pages.useQuery();
  const site = trpc.content.site.useQuery();
  const createPage = trpc.content.createPage.useMutation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const selected =
    pages.data?.find((page) => page.id === selectedId) ?? pages.data?.[0];
  const title = (page: NonNullable<typeof selected>) =>
    page.translations.find((tr) => tr.locale === "fr")?.title ?? page.slug;

  const create = async () => {
    try {
      const page = await createPage.mutateAsync({
        slug: newSlug.trim(),
        title: newTitle.trim(),
      });
      setNewSlug("");
      setNewTitle("");
      await utils.content.pages.invalidate();
      setSelectedId(page.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("createFailed"),
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
      />

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{t("pages")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {pages.isLoading && (
              <p className="text-muted-foreground text-sm">
                {tc("loadingEllipsis")}
              </p>
            )}
            {pages.data?.map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => setSelectedId(page.id)}
                className={cn(
                  "hover:bg-muted flex items-center justify-between gap-2 rounded-md px-3 py-2 text-start text-sm",
                  selected?.id === page.id && "bg-muted font-medium",
                )}
              >
                <span className="truncate">{title(page)}</span>
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    page.isPublished ? "bg-green-500" : "bg-slate-300",
                  )}
                  aria-label={page.isPublished ? t("published") : t("draft")}
                />
              </button>
            ))}
            <div className="mt-4 flex flex-col gap-2 border-t pt-4">
              <p className="text-sm font-medium">{t("newPage")}</p>
              <Input
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder={t("newTitlePlaceholder")}
              />
              <Input
                value={newSlug}
                onChange={(event) =>
                  setNewSlug(event.target.value.toLowerCase())
                }
                placeholder={t("newSlugPlaceholder")}
              />
              <Button
                variant="outline"
                disabled={
                  !newSlug.trim() || !newTitle.trim() || createPage.isPending
                }
                onClick={() => void create()}
              >
                {t("create")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>{selected ? title(selected) : t("page")}</CardTitle>
          </CardHeader>
          <CardContent>
            {selected ? (
              <PageEditor
                key={selected.id + selected.updatedAt}
                page={selected}
              />
            ) : (
              <p className="text-muted-foreground text-sm">{t("noPage")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("footerTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {site.data ? (
            <SiteSettingsForm site={site.data} />
          ) : (
            <p className="text-muted-foreground text-sm">
              {site.isLoading ? tc("loadingEllipsis") : t("siteUnavailable")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
