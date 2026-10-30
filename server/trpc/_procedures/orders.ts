import type { BusinessOrder, OrderStatus } from "@/lib/seller-dashboard-types";
import {
  idInputSchema,
  paginationInputSchema,
  uuidSchema,
} from "@/lib/validators/backend-resources";
import { callBackend } from "@/server/backend-utils";
import z from "zod";
import { createTRPCRouter, privateProcedure } from "../init";

const orderStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] satisfies [OrderStatus, ...OrderStatus[]]);

const businessOrdersInputSchema = paginationInputSchema.extend({
  businessId: uuidSchema,
  orderBy: z.enum(["totalAmountMinor", "createdAt", "updatedAt"]).optional(),
  status: orderStatusSchema.optional(),
});

export const ordersRouter = createTRPCRouter({
  listBusiness: privateProcedure
    .input(businessOrdersInputSchema)
    .query(({ ctx, input }) => {
      const { businessId, ...query } = input;

      return callBackend<BusinessOrder, "paginated">(
        ctx.api.get(`/businesses/${businessId}/orders`, { params: query }),
        { mode: "paginated" },
      );
    }),
  detail: privateProcedure
    .input(idInputSchema)
    .query(({ ctx, input }) =>
      callBackend<BusinessOrder>(ctx.api.get(`/orders/${input.id}`)),
    ),
  /** Seller (or operator / admin) moves the order to its next status. */
  updateStatus: privateProcedure
    .input(
      z.object({
        id: uuidSchema,
        status: orderStatusSchema,
        note: z.string().trim().max(1000).nullable().optional(),
        trackingNumber: z.string().trim().max(100).nullable().optional(),
        carrier: z.string().trim().max(100).nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { id, ...payload } = input;
      return callBackend<BusinessOrder>(
        ctx.api.patch(`/orders/${id}/status`, payload),
      );
    }),
});
