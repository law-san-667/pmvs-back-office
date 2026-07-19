import type { Business } from "@/lib/backend-resource-types";
import {
  createBusinessInputSchema,
  updateBusinessInputSchema,
} from "@/lib/validators/business";
import { callBackend } from "@/server/backend-utils";
import { createTRPCRouter, privateProcedure } from "../init";

const omitUndefined = <T extends Record<string, unknown>>(input: T) =>
  Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>;

export const businessesRouter = createTRPCRouter({
  myBusiness: privateProcedure.query(({ ctx }) =>
    callBackend<Business>(ctx.api.get("/businesses/me")),
  ),
  create: privateProcedure
    .input(createBusinessInputSchema)
    .mutation(({ ctx, input }) => {
      return callBackend<Business>(
        ctx.api.post("/businesses", omitUndefined(input)),
      );
    }),
  update: privateProcedure
    .input(updateBusinessInputSchema)
    .mutation(({ ctx, input }) => {
      const { id, ...rest } = input;

      return callBackend<Business>(
        ctx.api.patch(`/businesses/${id}`, omitUndefined(rest)),
      );
    }),
});
