import { useTranslations } from "next-intl";

export function AdminPageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const t = useTranslations("adminCommerce");
  return (
    <div>
      <p className="text-primary mb-1 text-sm font-medium">{t("administration")}</p>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
