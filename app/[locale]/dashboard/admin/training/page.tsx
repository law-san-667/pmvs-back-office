"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TrainingEditor } from "@/components/training/training-editor";
import { useUser } from "@/contexts/user-context";

export default function AdminTrainingPage() {
  const { user } = useUser();
  if (user && user.role !== "ADMIN") {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-destructive text-sm">Réservé aux administrateurs.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title="Formation"
        description="Les cours proposés aux vendeurs : vidéos, PDF et textes, par niveau."
      />
      {user && <TrainingEditor />}
    </div>
  );
}
