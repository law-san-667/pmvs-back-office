import { authRouter } from "./_procedures/auth";
import { businessesRouter } from "./_procedures/businesses";
import { catalogRouter } from "./_procedures/catalog";
import { geographyRouter } from "./_procedures/geography";
import { listingsRouter } from "./_procedures/listings";
import { mediaRouter } from "./_procedures/media";
import { createTRPCRouter } from "./init";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  businesses: businessesRouter,
  catalog: catalogRouter,
  geography: geographyRouter,
  listings: listingsRouter,
  media: mediaRouter,
});

export type AppRouter = typeof appRouter;
