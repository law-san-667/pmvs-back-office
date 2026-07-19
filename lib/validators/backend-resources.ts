import z from "zod";

export const uuidSchema = z.uuid();
const orderSchema = z.enum(["asc", "desc"]);
const positiveIntSchema = z.number().int().positive();

export const paginationInputSchema = z.object({
  page: positiveIntSchema.optional(),
  limit: positiveIntSchema.max(100).optional(),
  order: orderSchema.optional(),
});

export const idInputSchema = z.object({
  id: uuidSchema,
});

export const countryCodeInputSchema = z.object({
  code: z.string().trim().min(2),
});

export const countriesInputSchema = paginationInputSchema.extend({
  orderBy: z
    .enum(["code", "name", "currencyCode", "createdAt", "updatedAt"])
    .optional(),
  code: z.string().trim().optional(),
  name: z.string().trim().optional(),
  currencyCode: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

export const citiesInputSchema = paginationInputSchema.extend({
  orderBy: z
    .enum(["countryCode", "name", "slug", "createdAt", "updatedAt"])
    .optional(),
  countryCode: z.string().trim().min(2).optional(),
  name: z.string().trim().optional(),
  slug: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

export const countryCitiesInputSchema = citiesInputSchema
  .omit({ countryCode: true })
  .extend({
    code: z.string().trim().min(2),
  });

export const categoriesInputSchema = z.object({
  orderBy: z
    .enum(["name", "slug", "sortOrder", "createdAt", "updatedAt"])
    .optional(),
  order: orderSchema.optional(),
  name: z.string().trim().optional(),
  slug: z.string().trim().optional(),
  isService: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const subCategoriesInputSchema = categoriesInputSchema.extend({
  categorySlug: z.string().trim().optional(),
});

export const businessesInputSchema = paginationInputSchema.extend({
  orderBy: z
    .enum(["name", "status", "countryCode", "createdAt", "updatedAt"])
    .optional(),
  countryCode: z.string().trim().min(2),
  name: z.string().trim().optional(),
  status: z
    .enum([
      "PENDING_VERIFICATION",
      "ACTIVE",
      "INACTIVE",
      "SUSPENDED",
      "DELETED",
    ])
    .optional(),
});

export const listingsInputSchema = paginationInputSchema.extend({
  orderBy: z
    .enum(["title", "priceAmountMinor", "createdAt", "updatedAt"])
    .optional(),
  countryCode: z.string().trim().min(2),
  businessSlug: z.string().trim().optional(),
  createdByUserId: uuidSchema.optional(),
  title: z.string().trim().optional(),
  isService: z.boolean().optional(),
  condition: z.enum(["NEW", "LIKE_NEW", "USED", "REFURBISHED"]).optional(),
  status: z
    .enum(["DRAFT", "PUBLISHED", "PAUSED", "SOLD", "ARCHIVED"])
    .optional(),
  currency: z.string().trim().optional(),
  cities: z.array(z.string()).optional(),
  minPriceAmountMinor: z.number().int().nonnegative().optional(),
  maxPriceAmountMinor: z.number().int().nonnegative().optional(),
});

export type CountriesInput = z.infer<typeof countriesInputSchema>;
export type CitiesInput = z.infer<typeof citiesInputSchema>;
export type CountryCitiesInput = z.infer<typeof countryCitiesInputSchema>;
export type CategoriesInput = z.infer<typeof categoriesInputSchema>;
export type SubCategoriesInput = z.infer<typeof subCategoriesInputSchema>;
export type BusinessesInput = z.infer<typeof businessesInputSchema>;
export type ListingsInput = z.infer<typeof listingsInputSchema>;

export const tendersInputSchema = paginationInputSchema.extend({
  orderBy: z
    .enum(["title", "submissionDeadline", "createdAt", "updatedAt"])
    .optional(),
  publisherUserId: uuidSchema.optional(),
  publisherBusinessId: uuidSchema.optional(),
  categoryId: uuidSchema.optional(),
  subCategoryId: uuidSchema.optional(),
  title: z.string().trim().optional(),
  type: z
    .enum(["SUPPLY", "SERVICE", "WORKS", "INTELLECTUAL_SERVICE"])
    .optional(),
  status: z
    .enum(["DRAFT", "OPEN", "EVALUATION", "AWARDED", "CLOSED", "CANCELLED"])
    .optional(),
  currency: z.string().trim().optional(),
  countryCode: z.string().trim().min(2).optional(),
  minBudgetMinor: z.number().int().nonnegative().optional(),
  maxBudgetMinor: z.number().int().nonnegative().optional(),
});

export type TendersInput = z.infer<typeof tendersInputSchema>;
