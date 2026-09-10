import type {
  AdminAccount,
  AdminBusiness,
  AdminBusinessMember,
  AdminDashboardStats,
  AdminListing,
  AdminPayment,
  AdminTender,
  BusinessMemberRole,
  BusinessMemberStatus,
  LedgerEntry,
  LedgerSummary,
  PaymentRecord,
  PaymentStatus,
  PayoutAccount,
  PayoutStatus,
} from "@/lib/admin-types";
import type { BusinessStatus } from "@/lib/backend-resource-types";
import type {
  Category,
  City,
  Country,
  SubCategory,
} from "@/lib/backend-resource-types";
import {
  paginationInputSchema,
  uuidSchema,
} from "@/lib/validators/backend-resources";
import {
  adminsInputSchema,
  createAdminInputSchema,
} from "@/lib/validators/admins";
import { updateBusinessInputSchema } from "@/lib/validators/business";
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
  "REFUND_PENDING",
  "REFUNDED",
] satisfies [PaymentStatus, ...PaymentStatus[]]);

const payoutStatusSchema = z.enum([
  "NOT_APPLICABLE",
  "PENDING",
  "PROCESSING",
  "SUCCEEDED",
  "FAILED",
] satisfies [PayoutStatus, ...PayoutStatus[]]);

const paymentMethodSchema = z.enum([
  "CASH",
  "WAVE",
  "ORANGE_MONEY",
  "FREE_MONEY",
  "EXPRESSO",
  "CARD",
  "ONLINE",
]);

const ledgerAccountSchema = z.enum([
  "SALES",
  "PROVIDER_FEES",
  "PLATFORM_REVENUE",
  "SUPPLIER_PAYABLE",
  "SUPPLIER_PAID",
  "SUPPLIER_RECEIVABLE",
  "REFUNDS",
]);

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

const updateBusinessPayloadSchema = z.object({
  ...updateBusinessInputSchema.shape,
  status: businessStatusSchema.optional(),
  commissionRatePercent: z.number().min(0).max(100).nullable().optional(),
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
  businessId: uuidSchema.optional(),
  method: paymentMethodSchema.optional(),
  status: paymentStatusSchema.optional(),
  provider: z.enum(["CASH", "LAWPAY"]).optional(),
  payoutStatus: payoutStatusSchema.optional(),
  transactionReference: z.string().trim().optional(),
});

const ledgerEntriesInputSchema = paginationInputSchema.extend({
  orderBy: z.enum(["createdAt", "amountMinor"]).optional(),
  businessId: uuidSchema.optional(),
  paymentId: uuidSchema.optional(),
  account: ledgerAccountSchema.optional(),
});

const ledgerSummaryInputSchema = z.object({
  businessId: uuidSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

const membersInputSchema = paginationInputSchema.extend({
  orderBy: z.enum(["role", "status", "createdAt", "updatedAt"]).optional(),
  businessId: uuidSchema.optional(),
  userId: uuidSchema.optional(),
  role: memberRoleSchema.optional(),
  status: memberStatusSchema.optional(),
});

const categoryPayloadSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  description: z.string().trim().nullable().optional(),
  icon: z.string().trim().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isService: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const subCategoryPayloadSchema = categoryPayloadSchema.extend({
  categoryId: uuidSchema,
});

const countryPayloadSchema = z.object({
  code: z.string().trim().min(2),
  name: z.string().trim().min(1),
  currencyCode: z.string().trim().min(3),
  phonePrefix: z.string().trim().min(1),
  isActive: z.boolean().optional(),
});

const cityPayloadSchema = z.object({
  countryCode: z.string().trim().min(2),
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  isActive: z.boolean().optional(),
});

export const adminRouter = createTRPCRouter({
  /** Back-office accounts: list and create. Admin-only on the API too. */
  admins: privateProcedure
    .input(adminsInputSchema.optional())
    .query(({ ctx, input }) =>
      callBackend<AdminAccount, "paginated">(
        ctx.api.get("/admins", { params: input }),
        { mode: "paginated" },
      ),
    ),
  createAdmin: privateProcedure
    .input(createAdminInputSchema)
    .mutation(({ ctx, input }) =>
      callBackend<AdminAccount>(ctx.api.post("/admins", input)),
    ),
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
  business: privateProcedure
    .input(z.object({ idOrSlug: z.string().trim().min(1) }))
    .query(({ ctx, input }) =>
      callBackend<AdminBusiness>(ctx.api.get(`/businesses/${input.idOrSlug}`)),
    ),
  updateBusiness: privateProcedure
    .input(updateBusinessPayloadSchema)
    .mutation(({ ctx, input }) => {
      const { id, ...payload } = input;

      return callBackend<AdminBusiness>(
        ctx.api.patch(
          `/businesses/${id}`,
          Object.fromEntries(
            Object.entries(payload).filter(([, value]) => value !== undefined),
          ),
        ),
      );
    }),
  deleteBusiness: privateProcedure
    .input(z.object({ id: uuidSchema }))
    .mutation(({ ctx, input }) =>
      callBackend<AdminBusiness>(ctx.api.delete(`/businesses/${input.id}`)),
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
  ledgerSummary: privateProcedure
    .input(ledgerSummaryInputSchema)
    .query(({ ctx, input }) =>
      callBackend<LedgerSummary>(
        ctx.api.get("/payments/ledger/summary", { params: input }),
      ),
    ),
  ledgerEntries: privateProcedure
    .input(ledgerEntriesInputSchema)
    .query(({ ctx, input }) =>
      callBackend<LedgerEntry, "paginated">(
        ctx.api.get("/payments/ledger/entries", { params: input }),
        { mode: "paginated" },
      ),
    ),
  syncPayment: privateProcedure
    .input(z.object({ id: uuidSchema }))
    .mutation(({ ctx, input }) =>
      callBackend<PaymentRecord>(ctx.api.post(`/payments/${input.id}/sync`)),
    ),
  businessPayoutAccount: privateProcedure
    .input(z.object({ businessId: uuidSchema }))
    .query(({ ctx, input }) =>
      callBackend<PayoutAccount>(
        ctx.api.get(`/businesses/${input.businessId}/payout-account`),
      ),
    ),
  updateBusinessPayoutAccountStatus: privateProcedure
    .input(
      z.object({
        businessId: uuidSchema,
        status: z.enum(["ACTIVE", "SUSPENDED"]),
      }),
    )
    .mutation(({ ctx, input }) =>
      callBackend<PayoutAccount>(
        ctx.api.patch(`/businesses/${input.businessId}/payout-account/status`, {
          status: input.status,
        }),
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
  createCategory: privateProcedure
    .input(categoryPayloadSchema)
    .mutation(({ ctx, input }) =>
      callBackend<Category>(ctx.api.post("/categories", input)),
    ),
  updateCategory: privateProcedure
    .input(categoryPayloadSchema.partial().extend({ id: uuidSchema }))
    .mutation(({ ctx, input }) => {
      const { id, ...payload } = input;
      return callBackend<Category>(ctx.api.patch(`/categories/${id}`, payload));
    }),
  deleteCategory: privateProcedure
    .input(z.object({ id: uuidSchema }))
    .mutation(({ ctx, input }) =>
      callBackend<Category>(ctx.api.delete(`/categories/${input.id}`)),
    ),
  createSubCategory: privateProcedure
    .input(subCategoryPayloadSchema)
    .mutation(({ ctx, input }) =>
      callBackend<SubCategory>(ctx.api.post("/sub-categories", input)),
    ),
  updateSubCategory: privateProcedure
    .input(subCategoryPayloadSchema.partial().extend({ id: uuidSchema }))
    .mutation(({ ctx, input }) => {
      const { id, ...payload } = input;
      return callBackend<SubCategory>(
        ctx.api.patch(`/sub-categories/${id}`, payload),
      );
    }),
  deleteSubCategory: privateProcedure
    .input(z.object({ id: uuidSchema }))
    .mutation(({ ctx, input }) =>
      callBackend<SubCategory>(ctx.api.delete(`/sub-categories/${input.id}`)),
    ),
  createCountry: privateProcedure
    .input(countryPayloadSchema)
    .mutation(({ ctx, input }) =>
      callBackend<Country>(ctx.api.post("/countries", input)),
    ),
  updateCountry: privateProcedure
    .input(countryPayloadSchema.partial().extend({ code: z.string().min(2) }))
    .mutation(({ ctx, input }) => {
      const { code, ...payload } = input;
      return callBackend<Country>(ctx.api.patch(`/countries/${code}`, payload));
    }),
  deleteCountry: privateProcedure
    .input(z.object({ code: z.string().trim().min(2) }))
    .mutation(({ ctx, input }) =>
      callBackend<Country>(ctx.api.delete(`/countries/${input.code}`)),
    ),
  createCity: privateProcedure
    .input(cityPayloadSchema)
    .mutation(({ ctx, input }) =>
      callBackend<City>(ctx.api.post("/cities", input)),
    ),
  updateCity: privateProcedure
    .input(
      cityPayloadSchema.partial().extend({ currentSlug: z.string().min(1) }),
    )
    .mutation(({ ctx, input }) => {
      const { currentSlug, ...payload } = input;
      return callBackend<City>(
        ctx.api.patch(`/cities/${currentSlug}`, payload),
      );
    }),
  deleteCity: privateProcedure
    .input(z.object({ slug: z.string().trim().min(1) }))
    .mutation(({ ctx, input }) =>
      callBackend<City>(ctx.api.delete(`/cities/${input.slug}`)),
    ),
});
