import { adminRouter } from "./_procedures/admin";
import { authRouter } from "./_procedures/auth";
import { businessesRouter } from "./_procedures/businesses";
import { catalogRouter } from "./_procedures/catalog";
import { contentRouter } from "./_procedures/content";
import { geographyRouter } from "./_procedures/geography";
import { listingsRouter } from "./_procedures/listings";
import { mediaRouter } from "./_procedures/media";
import { notificationsRouter } from "./_procedures/notifications";
import { operatorsRouter } from "./_procedures/operators";
import { messagingRouter } from "./_procedures/messaging";
import { ordersRouter } from "./_procedures/orders";
import { sellerDashboardRouter } from "./_procedures/seller-dashboard";
import { tendersRouter } from "./_procedures/tenders";
import { createTRPCRouter } from "./init";

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  auth: authRouter,
  businesses: businessesRouter,
  catalog: catalogRouter,
  content: contentRouter,
  geography: geographyRouter,
  listings: listingsRouter,
  media: mediaRouter,
  messaging: messagingRouter,
  notifications: notificationsRouter,
  operators: operatorsRouter,
  orders: ordersRouter,
  sellerDashboard: sellerDashboardRouter,
  tenders: tendersRouter,
});

export type AppRouter = typeof appRouter;
