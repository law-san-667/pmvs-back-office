import type { BusinessStatus } from "@/lib/backend-resource-types";

export const BUSINESS_STATUS_LABELS: Record<BusinessStatus, string> = {
  PENDING_VERIFICATION: "À vérifier",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspendue",
  DELETED: "Supprimée",
};

export const BUSINESS_STATUS_BADGE_CLASSES: Record<BusinessStatus, string> = {
  PENDING_VERIFICATION: "border-amber-200 bg-amber-50 text-amber-700",
  ACTIVE: "border-green-200 bg-green-50 text-green-700",
  INACTIVE: "border-slate-200 bg-slate-50 text-slate-600",
  SUSPENDED: "border-red-200 bg-red-50 text-red-700",
  DELETED: "border-slate-200 bg-slate-50 text-slate-500",
};

export const BUSINESS_MEMBER_ROLE_LABELS = {
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
  MEMBER: "Membre",
} as const;

export const BUSINESS_MEMBER_STATUS_LABELS = {
  INVITED: "Invité",
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  REMOVED: "Retiré",
} as const;
