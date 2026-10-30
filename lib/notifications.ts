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
  return null;
};
