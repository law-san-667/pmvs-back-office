import type {
  Category,
  ExtendedCategoryAndSubCategory,
  Listing,
  SubCategory,
  Tender,
} from "@/lib/backend-resource-types";
import {
  categoriesInputSchema,
  idInputSchema,
  listingsInputSchema,
  subCategoriesInputSchema,
  tendersInputSchema,
} from "@/lib/validators/backend-resources";
import { callBackend } from "@/server/backend-utils";
import { createTRPCRouter, publicProcedure } from "../init";

export const catalogRouter = createTRPCRouter({
  categories: publicProcedure
    .input(categoriesInputSchema.optional())
    .query(({ ctx, input }) =>
      callBackend<Category[]>(ctx.api.get("/categories", { params: input })),
    ),
  categoryDetail: publicProcedure
    .input(idInputSchema)
    .query(({ ctx, input }) =>
      callBackend<Category>(ctx.api.get(`/categories/${input.id}`)),
    ),
  subCategories: publicProcedure
    .input(subCategoriesInputSchema.optional())
    .query(({ ctx, input }) =>
      callBackend<SubCategory[]>(
        ctx.api.get("/sub-categories", { params: input }),
      ),
    ),
  subCategoryDetail: publicProcedure
    .input(idInputSchema)
    .query(({ ctx, input }) =>
      callBackend<SubCategory>(ctx.api.get(`/sub-categories/${input.id}`)),
    ),
  listings: publicProcedure
    .input(listingsInputSchema)
    .query(({ ctx, input }) => {
      const { cities, ...rest } = input;
      const params = cities?.length
        ? { ...rest, cities: cities.join(",") }
        : rest;
      return callBackend<Listing, "paginated">(
        ctx.api.get("/listings", { params }),
        { mode: "paginated" },
      );
    }),
  listingDetail: publicProcedure
    .input(idInputSchema)
    .query(({ ctx, input }) =>
      callBackend<Listing & ExtendedCategoryAndSubCategory>(
        ctx.api.get(`/listings/${input.id}`),
      ),
    ),
  tenders: publicProcedure
    .input(tendersInputSchema)
    .query(({ ctx, input }) =>
      callBackend<Tender, "paginated">(
        ctx.api.get("/tenders", { params: input }),
        { mode: "paginated" },
      ),
    ),
  tenderDetail: publicProcedure
    .input(idInputSchema)
    .query(({ ctx, input }) =>
      callBackend<Tender & ExtendedCategoryAndSubCategory>(
        ctx.api.get(`/tenders/${input.id}`),
      ),
    ),
});
