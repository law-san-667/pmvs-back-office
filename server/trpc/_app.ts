import { adminRouter } from "./_procedures/admin";
import { authRouter } from "./_procedures/auth";
import { businessesRouter } from "./_procedures/businesses";
import { catalogRouter } from "./_procedures/catalog";
import { geographyRouter } from "./_procedures/geography";
import { listingsRouter } from "./_procedures/listings";
import { mediaRouter } from "./_procedures/media";
import { ordersRouter } from "./_procedures/orders";
import { sellerDashboardRouter } from "./_procedures/seller-dashboard";
import { tendersRouter } from "./_procedures/tenders";
import { createTRPCRouter } from "./init";

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  auth: authRouter,
  businesses: businessesRouter,
  catalog: catalogRouter,
  geography: geographyRouter,
  listings: listingsRouter,
  media: mediaRouter,
  orders: ordersRouter,
  sellerDashboard: sellerDashboardRouter,
  tenders: tendersRouter,
});

export type AppRouter = typeof appRouter;
