export type AppNotification = {
  id: string;
  type: string;
  event: string | null;
  title: string;
  body: string | null;
  /** API path of the related screen: /orders/<id>, /products/<id>… */
  link: string | null;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

/** Back-office page for a notification link; null when there is none. */
export const notificationHref = (link: string | null) => {
  if (!link) return null;
  const [, section, id] = link.split("/");
  if (section === "orders" && id) return `/dashboard/orders/${id}`;
  if (section === "products" && id) return `/dashboard/products/${id}`;
  if (section === "tenders") return "/dashboard/tenders";
  if (section === "support" && id) return `/dashboard/support/${id}`;
  if (section === "questionnaire") return "/dashboard/vendability?tab=questionnaire";
  if (section === "reports") return "/dashboard/reports?tab=automatic";
  if (section === "admin-reports") return "/dashboard/admin/reports?tab=automatic";
  if (section === "compliance") return "/dashboard/documents";
  if (section === "compliance-review") return "/dashboard/admin/compliance";
  if (section === "monitoring") return "/dashboard/admin/monitoring";
  return null;
};

export type NotificationPreferenceData = {
  contacts: { email: string | null; phone: string | null };
  categories: {
    key: string;
    label: string;
    description: string;
    EMAIL: { offered: boolean; enabled: boolean };
    PHONE: { offered: boolean; enabled: boolean };
  }[];
};
