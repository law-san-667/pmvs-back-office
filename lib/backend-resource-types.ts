import type { LegalBusinessInformation } from "@/lib/validators/business";

export type Country = {
  code: string;
  name: string;
  currencyCode: string;
  phonePrefix: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type City = {
  countryCode: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  isService: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SubCategory = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  isService: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BusinessStatus =
  | "PENDING_VERIFICATION"
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "DELETED";

export type Business = {
  id: string;
  name: string;
  slug: string | null;
  image: string | null;
  description: string | null;
  countryCode: string;
  citySlug: string;
  address?: string | null;
  whatsappPhone?: string | null;
  contactEmail?: string | null;
  facebookLink?: string | null;
  instagramLink?: string | null;
  orangeMoneyNumber?: string | null;
  waveNumber?: string | null;
  deliveryZones: string[];
  legalBusiness: boolean;
  legalDocuments: string[];
  legalBusinessInformation: LegalBusinessInformation | null;
  legalBusinessQuestions: Array<{
    questionTitle: string;
    answer: string;
  }> | null;
  status: BusinessStatus;
  createdAt: string;
  updatedAt: string;
};

export type ListingCondition = "NEW" | "LIKE_NEW" | "USED" | "REFURBISHED";
export type ListingStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "PAUSED"
  | "SOLD"
  | "ARCHIVED";

export type ListingSpecificsSection = {
  title: string;
  items: Array<{
    label: string;
    value: string | number | boolean | null;
  }>;
};

export type ExtendedCategoryAndSubCategory = {
  category: { name: string };
  subCategory: { name: string };
};

export type Listing = {
  id: string;
  businessId: string;
  createdByUserId: string | null;
  title: string;
  description: string | null;
  images: unknown;
  specificsSections: ListingSpecificsSection[];
  condition: ListingCondition;
  status: ListingStatus;
  priceAmountMinor: number;
  isService: boolean;
  currency: string;
  quantityAvailable: number;
  cities: string[];
  countryCode: string;
  createdAt: string;
  updatedAt: string;
};

export type TenderType =
  | "SUPPLY"
  | "SERVICE"
  | "WORKS"
  | "INTELLECTUAL_SERVICE";

export type TenderStatus =
  | "DRAFT"
  | "OPEN"
  | "EVALUATION"
  | "AWARDED"
  | "CLOSED"
  | "CANCELLED";

export type Tender = {
  id: string;
  publisherUserId: string;
  publisherBusinessId: string | null;
  categoryId: string;
  subCategoryId: string;
  title: string;
  description: string | null;
  type: TenderType;
  status: TenderStatus;
  budgetMinMinor: number | null;
  budgetMaxMinor: number | null;
  currency: string;
  requirements: unknown;
  documents: unknown;
  location: string | null;
  countryCode: string;
  submissionDeadline: string;
  evaluationDeadline: string | null;
  awardedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
