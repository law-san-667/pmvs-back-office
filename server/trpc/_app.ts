import { authRouter } from "./_procedures/auth";
import { businessesRouter } from "./_procedures/businesses";
import { catalogRouter } from "./_procedures/catalog";
import { geographyRouter } from "./_procedures/geography";
import { createTRPCRouter } from "./init";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  businesses: businessesRouter,
  catalog: catalogRouter,
  geography: geographyRouter,
});

export type AppRouter = typeof appRouter;
