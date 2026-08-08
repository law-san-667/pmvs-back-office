import { OrderDetails } from "@/app/[locale]/dashboard/orders/[id]/order-details";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <OrderDetails id={id} admin />;
}
