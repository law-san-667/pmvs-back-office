import type {
  AdminBusiness,
  AdminBusinessMember,
  AdminDashboardStats,
  AdminListing,
  AdminPayment,
  AdminTender,
  BusinessMemberRole,
  BusinessMemberStatus,
  PaymentStatus,
} from "@/lib/admin-types";
import type { BusinessStatus } from "@/lib/backend-resource-types";
import {
  paginationInputSchema,
  uuidSchema,
} from "@/lib/validators/backend-resources";
import { callBackend } from "@/server/backend-utils";
import z from "zod";
import { createTRPCRouter, privateProcedure } from "../init";

const businessStatusSchema = z.enum([
  "PENDING_VERIFICATION",
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "DELETED",
] satisfies [BusinessStatus, ...BusinessStatus[]]);

const paymentStatusSchema = z.enum([
  "PENDING",
  "SUCCEEDED",
  "CANCELLED",
  "ERRORED",
] satisfies [PaymentStatus, ...PaymentStatus[]]);

const paymentMethodSchema = z.enum(["CASH", "WAVE", "ORANGE_MONEY"]);

const memberRoleSchema = z.enum(["OWNER", "ADMIN", "MEMBER"] satisfies [
  BusinessMemberRole,
  ...BusinessMemberRole[],
]);

const memberStatusSchema = z.enum([
  "INVITED",
  "ACTIVE",
  "SUSPENDED",
  "REMOVED",
] satisfies [BusinessMemberStatus, ...BusinessMemberStatus[]]);

const businessesInputSchema = paginationInputSchema.extend({
  orderBy: z
    .enum([
      "name",
      "status",
      "countryCode",
      "citySlug",
      "createdAt",
      "updatedAt",
    ])
    .optional(),
  name: z.string().trim().optional(),
  countryCode: z.string().trim().optional(),
  citySlug: z.string().trim().optional(),
  status: businessStatusSchema.optional(),
});

const listingsInputSchema = paginationInputSchema.extend({
  orderBy: z
    .enum(["title", "priceAmountMinor", "createdAt", "updatedAt"])
    .optional(),
  title: z.string().trim().optional(),
  businessSlug: z.string().trim().optional(),
  categoryId: uuidSchema.optional(),
  subCategoryId: uuidSchema.optional(),
  isService: z.boolean().optional(),
  status: z
    .enum(["DRAFT", "PUBLISHED", "PAUSED", "SOLD", "ARCHIVED"])
    .optional(),
  countryCode: z.string().trim().optional(),
});

const tendersInputSchema = paginationInputSchema.extend({
  orderBy: z
    .enum(["title", "submissionDeadline", "createdAt", "updatedAt"])
    .optional(),
  title: z.string().trim().optional(),
  publisherBusinessId: uuidSchema.optional(),
  type: z
    .enum(["SUPPLY", "SERVICE", "WORKS", "INTELLECTUAL_SERVICE"])
    .optional(),
  status: z
    .enum(["DRAFT", "OPEN", "EVALUATION", "AWARDED", "CLOSED", "CANCELLED"])
    .optional(),
  countryCode: z.string().trim().optional(),
});

const paymentsInputSchema = paginationInputSchema.extend({
  orderBy: z.enum(["amountMinor", "createdAt", "updatedAt"]).optional(),
  orderId: uuidSchema.optional(),
  payerUserId: uuidSchema.optional(),
  method: paymentMethodSchema.optional(),
  status: paymentStatusSchema.optional(),
  transactionReference: z.string().trim().optional(),
});

const membersInputSchema = paginationInputSchema.extend({
  orderBy: z.enum(["role", "status", "createdAt", "updatedAt"]).optional(),
  businessId: uuidSchema.optional(),
  userId: uuidSchema.optional(),
  role: memberRoleSchema.optional(),
  status: memberStatusSchema.optional(),
});

export const adminRouter = createTRPCRouter({
  stats: privateProcedure.query(async ({ ctx }) => {
    const [businesses, listings, tenders, payments, members] =
      await Promise.all([
        callBackend<AdminBusiness, "paginated">(
          ctx.api.get("/businesses", { params: { page: 1, limit: 1 } }),
          { mode: "paginated" },
        ),
        callBackend<AdminListing, "paginated">(
          ctx.api.get("/listings", { params: { page: 1, limit: 1 } }),
          { mode: "paginated" },
        ),
        callBackend<AdminTender, "paginated">(
          ctx.api.get("/tenders", { params: { page: 1, limit: 1 } }),
          { mode: "paginated" },
        ),
        callBackend<AdminPayment, "paginated">(
          ctx.api.get("/payments", { params: { page: 1, limit: 1 } }),
          { mode: "paginated" },
        ),
        callBackend<AdminBusinessMember, "paginated">(
          ctx.api.get("/business-members", {
            params: { page: 1, limit: 1 },
          }),
          { mode: "paginated" },
        ),
      ]);

    return {
      totalBusinesses: businesses.total,
      totalListings: listings.total,
      totalTenders: tenders.total,
      totalOrders: payments.total,
      totalTransactions: payments.total,
      totalTeamMembers: members.total,
    } satisfies AdminDashboardStats;
  }),
  businesses: privateProcedure
    .input(businessesInputSchema)
    .query(({ ctx, input }) =>
      callBackend<AdminBusiness, "paginated">(
        ctx.api.get("/businesses", { params: input }),
        { mode: "paginated" },
      ),
    ),
  listings: privateProcedure
    .input(listingsInputSchema)
    .query(({ ctx, input }) =>
      callBackend<AdminListing, "paginated">(
        ctx.api.get("/listings", { params: input }),
        { mode: "paginated" },
      ),
    ),
  tenders: privateProcedure
    .input(tendersInputSchema)
    .query(({ ctx, input }) =>
      callBackend<AdminTender, "paginated">(
        ctx.api.get("/tenders", { params: input }),
        { mode: "paginated" },
      ),
    ),
  payments: privateProcedure
    .input(paymentsInputSchema)
    .query(({ ctx, input }) =>
      callBackend<AdminPayment, "paginated">(
        ctx.api.get("/payments", { params: input }),
        { mode: "paginated" },
      ),
    ),
  members: privateProcedure
    .input(membersInputSchema)
    .query(({ ctx, input }) =>
      callBackend<AdminBusinessMember, "paginated">(
        ctx.api.get("/business-members", { params: input }),
        { mode: "paginated" },
      ),
    ),
});
