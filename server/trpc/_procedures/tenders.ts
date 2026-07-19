import type {
  ExtendedCategoryAndSubCategory,
  Tender,
} from "@/lib/backend-resource-types";
import { idInputSchema, tendersInputSchema } from "@/lib/validators/backend-resources";
import { createTenderSchema, updateTenderSchema } from "@/lib/validators/tenders";
import { callBackend } from "@/server/backend-utils";
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
});
