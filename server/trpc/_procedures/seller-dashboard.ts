import type {
  BestSellingProduct,
  RecentSellerOrder,
  SellerCustomer,
  SellerStats,
  SellerTransaction,
  SellerTransactionsSummary,
} from "@/lib/seller-dashboard-types";
import { paginationInputSchema } from "@/lib/validators/backend-resources";
import { callBackend } from "@/server/backend-utils";
import z from "zod";
import { createTRPCRouter, privateProcedure } from "../init";

const customersInputSchema = paginationInputSchema.extend({
  orderBy: z.enum(["name", "totalOrders", "lastOrderAt"]).optional(),
  search: z.string().trim().min(1).optional(),
});

const transactionsInputSchema = paginationInputSchema.extend({
  orderBy: z.enum(["amountMinor", "createdAt"]).optional(),
  status: z
    .enum([
      "PENDING",
      "SUCCEEDED",
      "CANCELLED",
      "ERRORED",
      "REFUND_PENDING",
      "REFUNDED",
    ])
    .optional(),
  payoutStatus: z
    .enum(["NOT_APPLICABLE", "PENDING", "PROCESSING", "SUCCEEDED", "FAILED"])
    .optional(),
  search: z.string().trim().min(1).optional(),
});

export const sellerDashboardRouter = createTRPCRouter({
  transactions: privateProcedure
    .input(transactionsInputSchema)
    .query(({ ctx, input }) =>
      callBackend<SellerTransaction, "paginated">(
        ctx.api.get("/seller/dashboard/transactions", { params: input }),
        { mode: "paginated" },
      ),
    ),
  transactionsSummary: privateProcedure.query(({ ctx }) =>
    callBackend<SellerTransactionsSummary[]>(
      ctx.api.get("/seller/dashboard/transactions/summary"),
    ),
  ),
  stats: privateProcedure
    .input(z.object({ year: z.number().int().min(2000).max(2100) }))
    .query(({ ctx, input }) =>
      callBackend<SellerStats>(
        ctx.api.get("/seller/dashboard/stats", { params: input }),
      ),
    ),
  recentOrders: privateProcedure.query(({ ctx }) =>
    callBackend<RecentSellerOrder[]>(
      ctx.api.get("/seller/dashboard/orders/recent"),
    ),
  ),
  customers: privateProcedure
    .input(customersInputSchema)
    .query(({ ctx, input }) =>
      callBackend<SellerCustomer, "paginated">(
        ctx.api.get("/seller/dashboard/customers", { params: input }),
        { mode: "paginated" },
      ),
    ),
  bestSellingProducts: privateProcedure
    .input(z.object({ limit: z.number().int().positive().max(20) }))
    .query(({ ctx, input }) =>
      callBackend<BestSellingProduct[]>(
        ctx.api.get("/seller/dashboard/products/best-selling", {
          params: input,
        }),
      ),
    ),
});
