import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/seller-dashboard-types";
import { ORDER_STATUS_LABELS } from "@/lib/seller-dashboard-utils";

const STATUS_CLASSES: Record<OrderStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  CONFIRMED: "border-blue-200 bg-blue-50 text-blue-700",
  PROCESSING: "border-violet-200 bg-violet-50 text-violet-700",
  SHIPPED: "border-cyan-200 bg-cyan-50 text-cyan-700",
  DELIVERED: "border-green-200 bg-green-50 text-green-700",
  CANCELLED: "border-red-200 bg-red-50 text-red-700",
  REFUNDED: "border-slate-200 bg-slate-50 text-slate-700",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={STATUS_CLASSES[status]}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}
