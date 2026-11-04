"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TrainingEditor } from "@/components/training/training-editor";
import { useUser } from "@/contexts/user-context";
import { useTranslations } from "next-intl";

export default function AdminTrainingPage() {
  const { user } = useUser();
  const t = useTranslations("adminSystem");
  if (user && user.role !== "ADMIN") {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-destructive text-sm">{t("adminOnly")}</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title={t("pages.training.title")}
        description={t("pages.training.description")}
      />
      {user && <TrainingEditor />}
    </div>
  );
}
