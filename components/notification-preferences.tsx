"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/server/trpc/client";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

type Channel = "EMAIL" | "PHONE";

/** Which alerts also go by e-mail or phone; they always stay in the app. */
export function NotificationPreferences({ className }: { className?: string }) {
  const t = useTranslations("notifications.preferences");
  const utils = trpc.useUtils();
  const preferences = trpc.notifications.preferences.useQuery();
  const update = trpc.notifications.updatePreference.useMutation({
    onSuccess: (saved) => utils.notifications.preferences.setData(undefined, saved),
    onError: (error) => toast.error(error.message),
  });

  const data = preferences.data;
  const toggle = (
    category: NonNullable<typeof data>["categories"][number],
    channel: Channel,
    label: string,
    available: boolean,
  ) =>
    category[channel].offered ? (
      <Checkbox
        aria-label={t("toggleLabel", { category: category.label, channel: label })}
        checked={available && category[channel].enabled}
        disabled={!available || update.isPending}
        onCheckedChange={(checked) =>
          update.mutate({ category: category.key, channel, enabled: Boolean(checked) })
        }
      />
    ) : (
      <span className="text-muted-foreground text-xs">{t("notOffered")}</span>
    );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {preferences.error && <p className="text-destructive text-sm">{preferences.error.message}</p>}
        {data && (
          <div className="flex flex-col divide-y">
            <div className="text-muted-foreground grid grid-cols-[1fr_4.5rem_6rem] gap-2 pb-2 text-xs font-medium">
              <span>{t("category")}</span>
              <span className="text-center">{t("email")}</span>
              <span className="text-center">{t("phone")}</span>
            </div>
            {data.categories.map((category) => (
              <div key={category.key} className="grid grid-cols-[1fr_4.5rem_6rem] items-center gap-2 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{category.label}</p>
                  <p className="text-muted-foreground text-xs">{category.description}</p>
                </div>
                <div className="flex justify-center">
                  {toggle(category, "EMAIL", t("emailLower"), Boolean(data.contacts.email))}
                </div>
                <div className="flex justify-center text-center">
                  {toggle(category, "PHONE", t("phone"), Boolean(data.contacts.phone))}
                </div>
              </div>
            ))}
            {(!data.contacts.email || !data.contacts.phone) && (
              <p className="text-muted-foreground pt-3 text-xs">
                {!data.contacts.email ? t("noEmail") : t("noPhone")}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
