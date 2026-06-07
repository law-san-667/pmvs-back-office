import type { City, Country } from "@/lib/backend-resource-types";
import {
  citiesInputSchema,
  countriesInputSchema,
  countryCitiesInputSchema,
  countryCodeInputSchema,
  idInputSchema,
} from "@/lib/validators/backend-resources";
import { callBackend } from "@/server/backend-utils";
import { createTRPCRouter, publicProcedure } from "../init";

export const geographyRouter = createTRPCRouter({
  countries: publicProcedure
    .input(countriesInputSchema.optional())
    .query(({ ctx, input }) =>
      callBackend<Country, "paginated">(
        ctx.api.get("/countries", { params: input }),
        { mode: "paginated" },
      ),
    ),
  countryDetail: publicProcedure
    .input(countryCodeInputSchema)
    .query(({ ctx, input }) =>
      callBackend<Country>(ctx.api.get(`/countries/${input.code}`)),
    ),
  cities: publicProcedure
    .input(citiesInputSchema.optional())
    .query(({ ctx, input }) =>
      callBackend<City, "paginated">(
        ctx.api.get("/cities", { params: input }),
        { mode: "paginated" },
      ),
    ),
  countryCities: publicProcedure
    .input(countryCitiesInputSchema)
    .query(({ ctx, input }) => {
      const { code, ...params } = input;

      return callBackend<City, "paginated">(
        ctx.api.get(`/countries/${code}/cities`, { params }),
        { mode: "paginated" },
      );
    }),
  cityDetail: publicProcedure.input(idInputSchema).query(({ ctx, input }) =>
    callBackend<City>(ctx.api.get(`/cities/${input.id}`)),
  ),
});
