import { idInputSchema } from "@/lib/validators/backend-resources";
import {
  createListingSchema,
  Listing,
  listingsQuerySchema,
  updateListingSchema,
} from "@/lib/validators/listings-services";
import { callBackend } from "@/server/backend-utils";
import { createTRPCRouter, privateProcedure } from "../init";

export const listingsRouter = createTRPCRouter({
  list: privateProcedure
    .input(listingsQuerySchema)
    .query(({ ctx, input }) =>
      callBackend<Listing, "paginated">(
        ctx.api.get("/listings/business", { params: input }),
        { mode: "paginated" },
      ),
    ),
  detail: privateProcedure
    .input(idInputSchema)
    .query(({ ctx, input }) =>
      callBackend<Listing>(ctx.api.get(`/listings/${input.id}`)),
    ),
  create: privateProcedure
    .input(createListingSchema)
    .mutation(({ ctx, input }) =>
      callBackend<Listing>(ctx.api.post("/listings", input)),
    ),
  update: privateProcedure
    .input(updateListingSchema)
    .mutation(({ ctx, input }) =>
      callBackend<Listing>(ctx.api.patch(`/listings/${input.id}`, input)),
    ),
  delete: privateProcedure
    .input(idInputSchema)
    .mutation(({ ctx, input }) =>
      callBackend<Listing>(ctx.api.delete(`/listings/${input.id}`)),
    ),
});
