import type { PaymentRecord } from "@/lib/admin-types";
import { callBackend } from "@/server/backend-utils";
import z from "zod";
import { createTRPCRouter, privateProcedure } from "../init";

/** Payment with its order, shop (and payout account) and buyer. */
export type OperationPayment = PaymentRecord & {
  order: {
    id: string;
    status: string;
    businessId: string;
    totalAmountMinor: number;
    currency: string;
    createdAt: string;
    business: {
      id: string;
      name: string;
      slug: string;
      payoutAccount: {
        service: string;
        destinationNumber: string;
        status: string;
      } | null;
    };
    buyer: {
      firstName: string;
      lastName: string;
      email: string | null;
      phoneNumber: string | null;
    };
  };
};

export const paymentOperationsRouter = createTRPCRouter({
  pendingOffline: privateProcedure.query(({ ctx }) =>
    callBackend<OperationPayment, "paginated">(
      ctx.api.get("/admin/payments/offline", { params: { limit: 100 } }),
      { mode: "paginated" },
    ),
  ),
  confirmOffline: privateProcedure
    .input(z.object({ id: z.uuid(), reference: z.string().trim() }))
    .mutation(({ ctx, input }) =>
      callBackend<PaymentRecord>(
        ctx.api.post(`/admin/payments/${input.id}/confirm-offline`, {
          reference: input.reference,
        }),
      ),
    ),
  rejectOffline: privateProcedure
    .input(z.object({ id: z.uuid(), reason: z.string().trim() }))
    .mutation(({ ctx, input }) =>
      callBackend<PaymentRecord>(
        ctx.api.post(`/admin/payments/${input.id}/reject-offline`, {
          reason: input.reason,
        }),
      ),
    ),
  heldPayouts: privateProcedure
    .input(z.object({ releasable: z.boolean() }))
    .query(({ ctx, input }) =>
      callBackend<OperationPayment, "paginated">(
        ctx.api.get("/admin/payouts", {
          params: {
            limit: 100,
            releasable: input.releasable ? "true" : undefined,
          },
        }),
        { mode: "paginated" },
      ),
    ),
  release: privateProcedure
    .input(
      z.object({
        paymentIds: z.array(z.uuid()).min(1),
        /** MANUAL: already transferred (reference given); PAYDUNYA: paid now from the PayDunya balance. */
        method: z.enum(["MANUAL", "PAYDUNYA"]).default("MANUAL"),
        reference: z.string().trim().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      callBackend<{
        released: string[];
        processing?: string[];
        skipped: { paymentId: string; reason: string }[];
      }>(ctx.api.post("/admin/payouts/release", input)),
    ),
});
