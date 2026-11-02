import type {
  ExtendedCategoryAndSubCategory,
  Tender,
} from "@/lib/backend-resource-types";
import type { TenderResponse } from "@/lib/tender-responses";
import {
  idInputSchema,
  tendersInputSchema,
} from "@/lib/validators/backend-resources";
import {
  createTenderSchema,
  updateTenderSchema,
} from "@/lib/validators/tenders";
import { callBackend } from "@/server/backend-utils";
import z from "zod";
import { createTRPCRouter, privateProcedure } from "../init";

const omitUndefined = <T extends Record<string, unknown>>(input: T) =>
  Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>;

export const tendersRouter = createTRPCRouter({
  list: privateProcedure
    .input(tendersInputSchema)
    .query(({ ctx, input }) =>
      callBackend<Tender, "paginated">(
        ctx.api.get("/tenders", { params: input }),
        { mode: "paginated" },
      ),
    ),
  detail: privateProcedure
    .input(idInputSchema)
    .query(({ ctx, input }) =>
      callBackend<Tender & ExtendedCategoryAndSubCategory>(
        ctx.api.get(`/tenders/${input.id}`),
      ),
    ),
  create: privateProcedure
    .input(createTenderSchema)
    .mutation(({ ctx, input }) =>
      callBackend<Tender>(ctx.api.post("/tenders", omitUndefined(input))),
    ),
  update: privateProcedure
    .input(updateTenderSchema)
    .mutation(({ ctx, input }) => {
      const { id, ...rest } = input;

      return callBackend<Tender>(
        ctx.api.patch(`/tenders/${id}`, omitUndefined(rest)),
      );
    }),
  delete: privateProcedure
    .input(idInputSchema)
    .mutation(({ ctx, input }) =>
      callBackend<Tender>(ctx.api.delete(`/tenders/${input.id}`)),
    ),
  /** Offers received on one of my tenders (amounts included). */
  responses: privateProcedure
    .input(idInputSchema)
    .query(({ ctx, input }) =>
      callBackend<TenderResponse[]>(
        ctx.api.get(`/tenders/${input.id}/responses`),
      ),
    ),
  reviewResponse: privateProcedure
    .input(
      z.object({
        id: z.uuid(),
        status: z.enum(["UNDER_REVIEW", "SHORTLISTED", "REJECTED"]),
      }),
    )
    .mutation(({ ctx, input }) =>
      callBackend<TenderResponse>(
        ctx.api.patch(`/tender-responses/${input.id}/status`, {
          status: input.status,
        }),
      ),
    ),
  award: privateProcedure
    .input(z.object({ tenderId: z.uuid(), responseId: z.uuid() }))
    .mutation(({ ctx, input }) =>
      callBackend<Tender>(
        ctx.api.post(`/tenders/${input.tenderId}/award`, {
          responseId: input.responseId,
        }),
      ),
    ),
  /** My shop's offer on someone else's tender. */
  submitResponse: privateProcedure
    .input(
      z.object({
        tenderId: z.uuid(),
        proposedAmountMinor: z.number().int().positive(),
        deliveryDelayDays: z.number().int().positive().nullable(),
        validityDays: z.number().int().positive().nullable(),
        technicalOffer: z.string().nullable(),
        coverLetter: z.string().nullable(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { tenderId, ...offer } = input;
      return callBackend<TenderResponse>(
        ctx.api.post(`/tenders/${tenderId}/responses`, offer),
      );
    }),
  withdrawResponse: privateProcedure
    .input(idInputSchema)
    .mutation(({ ctx, input }) =>
      callBackend<TenderResponse>(
        ctx.api.post(`/tender-responses/${input.id}/withdraw`),
      ),
    ),
  myResponses: privateProcedure
    .input(z.object({ page: z.number().int().positive().default(1) }))
    .query(({ ctx, input }) =>
      callBackend<TenderResponse, "paginated">(
        ctx.api.get("/seller/tender-responses", {
          params: { page: input.page, limit: 20 },
        }),
        { mode: "paginated" },
      ),
    ),
});
