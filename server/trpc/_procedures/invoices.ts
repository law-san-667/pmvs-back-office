import { idInputSchema } from "@/lib/validators/backend-resources";
import { getBackendBaseUrl } from "@/server/api";
import { callBackend } from "@/server/backend-utils";
import z from "zod";
import { createTRPCRouter, privateProcedure } from "../init";

export type InvoiceSummary = {
  id: string;
  orderId: string;
  type: "INVOICE" | "CREDIT_NOTE";
  number: string;
  issuedAt: string;
  currency: string;
  totalAmountMinor: number;
};

export const invoicesRouter = createTRPCRouter({
  /** Invoice and credit note of an order (issued once it is confirmed). */
  forOrder: privateProcedure
    .input(idInputSchema)
    .query(({ ctx, input }) =>
      callBackend<InvoiceSummary[]>(
        ctx.api.get(`/orders/${input.id}/invoices`),
      ),
    ),
  /** Absolute link to the PDF, valid 10 minutes. */
  link: privateProcedure
    .input(idInputSchema)
    .mutation(async ({ ctx, input }) => {
      const link = await callBackend<{ path: string; expiresAt: string }>(
        ctx.api.get(`/invoices/${input.id}/download-link`),
      );
      return { url: new URL(link.path, getBackendBaseUrl()).toString() };
    }),
  business: privateProcedure
    .input(
      z.object({
        businessId: z.uuid(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
      }),
    )
    .query(({ ctx, input }) => {
      const { businessId, ...params } = input;
      return callBackend<InvoiceSummary, "paginated">(
        ctx.api.get(`/businesses/${businessId}/invoices`, { params }),
        { mode: "paginated" },
      );
    }),
});
