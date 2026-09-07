import z from "zod";
import { paginationInputSchema, uuidSchema } from "./backend-resources";

export interface ListingSpecificsSection {
  title: string;
  items: {
    label: string;
    value: string | number | boolean | null;
  }[];
}

export const listingImageKindEnum = ["MAIN", "BACK", "SIDE", "OTHER"] as const;
export type ListingImageKind = (typeof listingImageKindEnum)[number];

export interface ListingImages {
  order: number;
  url: string;
  label?: string;
  kind?: ListingImageKind;
}

export const listingExposureEnum = ["NATIONAL", "INTERNATIONAL", "BOTH"] as const;
export const listingAvailabilityChannelEnum = [
  "WEBSITE",
  "MARKETPLACE",
  "OFFLINE",
  "ALL",
] as const;
export const listingStockPolicyEnum = ["ACCEPT_ORDERS", "REFUSE_ORDERS"] as const;
export const marketPriceTypeEnum = ["B2C", "B2B"] as const;

export type ListingExposure = (typeof listingExposureEnum)[number];
export type ListingAvailabilityChannel =
  (typeof listingAvailabilityChannelEnum)[number];
export type ListingStockPolicy = (typeof listingStockPolicyEnum)[number];
export type MarketPriceType = (typeof marketPriceTypeEnum)[number];

export interface ListingLogistics {
  packaging?: string;
  unit?: string;
  baseValueMinor?: number;
  grossWeightKg?: number;
  widthCm?: number;
  heightCm?: number;
  depthCm?: number;
  weightVolumeRatio?: string;
  packagingType?: string;
}

export interface ListingEditorial {
  history?: string;
  composition?: string;
  nutrition?: string;
  benefits?: string;
  storage?: string;
  maintenance?: string;
  manufacturing?: string;
}

export interface ListingSeo {
  title?: string;
  externalUrl?: string;
  metaDescription?: string;
}

export interface ListingCertificate {
  name: string;
  url: string;
}

export type ListingMarketPrice = {
  id: string;
  listingId: string;
  countryCode: string;
  priceType: MarketPriceType;
  currency: string;
  priceAmountMinor: number;
  vatRatePercent: string | null;
  vmpCommissionPercent: string | null;
  ddpPriceAmountMinor: number | null;
  agentCommissionPercent: string | null;
  minOrderQuantity: number | null;
  cartonsPerPallet: number | null;
  containerType: string | null;
  unitsPerContainer: number | null;
  createdAt: string;
  updatedAt: string;
};

export const listingConditionEnum = [
  "NEW",
  "LIKE_NEW",
  "USED",
  "REFURBISHED",
] as const;

export const listingStatusEnum = [
  "DRAFT",
  "PUBLISHED",
  "PAUSED",
  "SOLD",
  "ARCHIVED",
] as const;

const listingConditionSchema = z.enum(listingConditionEnum);
const listingStatusSchema = z.enum(listingStatusEnum);
const listingExposureSchema = z.enum(listingExposureEnum);
const listingAvailabilityChannelSchema = z.enum(listingAvailabilityChannelEnum);
const listingStockPolicySchema = z.enum(listingStockPolicyEnum);

const percentSchema = z.number().min(0).max(100);
const optionalText = z.string().trim().nullable().optional();
const optionalNonNegativeInt = z.number().int().nonnegative().nullable().optional();

export const listingImageSchema: z.ZodType<ListingImages> = z.object({
  order: z.number(),
  url: z.string(),
  label: z.string().trim().optional(),
  kind: z.enum(listingImageKindEnum).optional(),
});

const listingLogisticsSchema: z.ZodType<ListingLogistics> = z.object({
  packaging: z.string().trim().optional(),
  unit: z.string().trim().optional(),
  baseValueMinor: z.number().int().nonnegative().optional(),
  grossWeightKg: z.number().nonnegative().optional(),
  widthCm: z.number().nonnegative().optional(),
  heightCm: z.number().nonnegative().optional(),
  depthCm: z.number().nonnegative().optional(),
  weightVolumeRatio: z.string().trim().optional(),
  packagingType: z.string().trim().optional(),
});

const listingEditorialSchema: z.ZodType<ListingEditorial> = z.object({
  history: z.string().trim().optional(),
  composition: z.string().trim().optional(),
  nutrition: z.string().trim().optional(),
  benefits: z.string().trim().optional(),
  storage: z.string().trim().optional(),
  maintenance: z.string().trim().optional(),
  manufacturing: z.string().trim().optional(),
});

const listingSeoSchema: z.ZodType<ListingSeo> = z.object({
  title: z.string().trim().max(70).optional(),
  externalUrl: z.url().optional(),
  metaDescription: z.string().trim().max(160).optional(),
});

const listingCertificateSchema: z.ZodType<ListingCertificate> = z.object({
  name: z.string().trim().min(1),
  url: z.url(),
});

export const marketPriceInputSchema = z.object({
  countryCode: z.string().trim().min(2),
  priceType: z.enum(marketPriceTypeEnum),
  currency: z.string().trim().min(1).default("XOF"),
  priceAmountMinor: z.number().int().nonnegative(),
  vatRatePercent: percentSchema.nullable().optional(),
  vmpCommissionPercent: percentSchema.nullable().optional(),
  ddpPriceAmountMinor: optionalNonNegativeInt,
  agentCommissionPercent: percentSchema.nullable().optional(),
  minOrderQuantity: optionalNonNegativeInt,
  cartonsPerPallet: optionalNonNegativeInt,
  containerType: optionalText,
  unitsPerContainer: optionalNonNegativeInt,
});

export type MarketPriceInput = z.infer<typeof marketPriceInputSchema>;
const listingSpecificsSectionsSchema: z.ZodType<ListingSpecificsSection[]> =
  z.array(
    z.object({
      title: z.string(),
      items: z.array(
        z.object({
          label: z.string(),
          value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
        }),
      ),
    }),
  );

export const listingsQuerySchema = paginationInputSchema.extend({
  orderBy: z
    .enum(["title", "priceAmountMinor", "createdAt", "updatedAt"])
    .default("createdAt"),
  businessSlug: z.string().trim().optional(),
  createdByUserId: uuidSchema.optional(),
  categoryId: uuidSchema.optional(),
  subCategoryId: uuidSchema.optional(),
  title: z.string().trim().optional(),
  condition: listingConditionSchema.optional(),
  status: listingStatusSchema.optional(),
  isService: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  currency: z.string().trim().optional(),
  countryCode: z.string().trim().optional(),
  cities: z
    .string()
    .transform((s) =>
      s
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
    )
    .optional(),
  minPriceAmountMinor: z.coerce.number().int().nonnegative().optional(),
  maxPriceAmountMinor: z.coerce.number().int().nonnegative().optional(),
});

export const createListingSchema = z.object({
  categoryId: uuidSchema,
  subCategoryId: uuidSchema,
  title: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  images: z.array(listingImageSchema).optional(),
  video: z.url().nullable().optional(),
  specificsSections: listingSpecificsSectionsSchema.optional(),
  condition: listingConditionSchema.optional(),
  status: listingStatusSchema.optional(),
  isService: z.boolean().optional(),
  isFragile: z.boolean().nullable().optional(),
  validityPeriod: z.number().int().nonnegative().nullable().optional(),
  origin: z.string().trim().min(1).nullable().optional(),
  destination: z.array(z.string().trim().min(1)).nullable().optional(),
  // -1 indicates a "sur devis" (price on quote) listing.
  priceAmountMinor: z.number().int().min(-1),
  currency: z.string().trim().min(1).optional(),
  quantityAvailable: z.number().int().positive().optional(),
  // Commercial offer (both categories)
  brand: optionalText,
  model: optionalText,
  supplierRole: optionalText,
  productionCapacity: optionalText,
  leadTime: optionalText,
  minOrderQuantity: optionalNonNegativeInt,
  certification: optionalText,
  incoterm: optionalText,
  // Enterprise product sheet
  launchDate: z.string().nullable().optional(),
  gs1Reference: optionalText,
  internalReference: optionalText,
  region: optionalText,
  exposure: listingExposureSchema.nullable().optional(),
  shortDescription: optionalText,
  hsCode: optionalText,
  ean13: optionalText,
  cupCode: optionalText,
  readyToShip: z.boolean().nullable().optional(),
  availableOn: listingAvailabilityChannelSchema.nullable().optional(),
  storageLocation: optionalText,
  outOfStockPolicy: listingStockPolicySchema.nullable().optional(),
  specialDeliveryTime: optionalText,
  transporters: optionalText,
  logistics: listingLogisticsSchema.nullable().optional(),
  editorial: listingEditorialSchema.nullable().optional(),
  seo: listingSeoSchema.nullable().optional(),
  certificates: z.array(listingCertificateSchema).optional(),
  marketPrices: z.array(marketPriceInputSchema).optional(),
});

export const updateListingSchema = createListingSchema.partial().extend({
  id: uuidSchema,
});

export type Listing = {
  id: string;
  businessId: string;
  createdByUserId: string | null;
  categoryId: string;
  subCategoryId: string;
  title: string;
  description: string | null;
  images: unknown;
  video: string | null;
  specificsSections: ListingSpecificsSection[];
  condition: "NEW" | "LIKE_NEW" | "USED" | "REFURBISHED";
  status: "DRAFT" | "PUBLISHED" | "PAUSED" | "SOLD" | "ARCHIVED";
  isService: boolean;
  isFragile: boolean | null;
  validityPeriod: number | null;
  origin: string | null;
  destination: string[] | null;
  priceAmountMinor: number;
  currency: string;
  quantityAvailable: number;
  cities: string[];
  countryCode: string;
  brand: string | null;
  model: string | null;
  supplierRole: string | null;
  productionCapacity: string | null;
  leadTime: string | null;
  minOrderQuantity: number | null;
  certification: string | null;
  incoterm: string | null;
  launchDate: string | null;
  gs1Reference: string | null;
  internalReference: string | null;
  region: string | null;
  exposure: ListingExposure | null;
  shortDescription: string | null;
  hsCode: string | null;
  ean13: string | null;
  cupCode: string | null;
  readyToShip: boolean | null;
  availableOn: ListingAvailabilityChannel | null;
  storageLocation: string | null;
  outOfStockPolicy: ListingStockPolicy | null;
  specialDeliveryTime: string | null;
  transporters: string | null;
  logistics: ListingLogistics | null;
  editorial: ListingEditorial | null;
  seo: ListingSeo | null;
  certificates: ListingCertificate[];
  marketPrices: ListingMarketPrice[];
  marketPrice: ListingMarketPrice | null;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    slug: string;
    name: string;
  };
  subCategory: {
    id: string;
    slug: string;
    name: string;
  };
};
