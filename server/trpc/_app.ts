import { adminRouter } from "./_procedures/admin";
import { authRouter } from "./_procedures/auth";
import { businessesRouter } from "./_procedures/businesses";
import { catalogRouter } from "./_procedures/catalog";
import { classifiedsRouter } from "./_procedures/classifieds";
import { complianceRouter } from "./_procedures/compliance";
import { contentRouter } from "./_procedures/content";
import { geographyRouter } from "./_procedures/geography";
import { listingsRouter } from "./_procedures/listings";
import { invoicesRouter } from "./_procedures/invoices";
import { mediaRouter } from "./_procedures/media";
import { moderationRouter } from "./_procedures/moderation";
import { monitoringRouter } from "./_procedures/monitoring";
import { notificationsRouter } from "./_procedures/notifications";
import { operatorsRouter } from "./_procedures/operators";
import { messagingRouter } from "./_procedures/messaging";
import { ordersRouter } from "./_procedures/orders";
import { paymentOperationsRouter } from "./_procedures/payment-operations";
import { promotionsRouter } from "./_procedures/promotions";
import { sellerDashboardRouter } from "./_procedures/seller-dashboard";
import { supportRouter } from "./_procedures/support";
import { tendersRouter } from "./_procedures/tenders";
import { reportsRouter } from "./_procedures/reports";
import { trafficRouter } from "./_procedures/traffic";
import { trainingRouter } from "./_procedures/training";
import { marketingRouter } from "./_procedures/marketing";
import { vendabilityRouter } from "./_procedures/vendability";
import { afterSalesRouter } from "./_procedures/after-sales";
import { advertisingRouter } from "./_procedures/advertising";
import { createTRPCRouter } from "./init";

export const appRouter = createTRPCRouter({
  afterSales: afterSalesRouter,
  advertising: advertisingRouter,
  admin: adminRouter,
  auth: authRouter,
  businesses: businessesRouter,
  catalog: catalogRouter,
  classifieds: classifiedsRouter,
  compliance: complianceRouter,
  content: contentRouter,
  geography: geographyRouter,
  listings: listingsRouter,
  invoices: invoicesRouter,
  media: mediaRouter,
  messaging: messagingRouter,
  moderation: moderationRouter,
  monitoring: monitoringRouter,
  notifications: notificationsRouter,
  operators: operatorsRouter,
  orders: ordersRouter,
  paymentOperations: paymentOperationsRouter,
  promotions: promotionsRouter,
  sellerDashboard: sellerDashboardRouter,
  support: supportRouter,
  tenders: tendersRouter,
  reports: reportsRouter,
  traffic: trafficRouter,
  training: trainingRouter,
  marketing: marketingRouter,
  vendability: vendabilityRouter,
});

export type AppRouter = typeof appRouter;
