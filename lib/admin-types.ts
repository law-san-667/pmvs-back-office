import type { Business, Listing, Tender } from "@/lib/backend-resource-types";
import type {
  BusinessOrder,
  PaymentMethod,
} from "@/lib/seller-dashboard-types";

export type AdminDashboardStats = {
  totalBusinesses: number;
  totalListings: number;
  totalTenders: number;
  totalOrders: number;
  totalTransactions: number;
  totalTeamMembers: number;
};

export type PaymentStatus = "PENDING" | "SUCCEEDED" | "CANCELLED" | "ERRORED";

export type AdminPayment = {
  id: string;
  orderId: string;
  payerUserId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amountMinor: number;
  currency: string;
  transactionReference: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  order: Omit<BusinessOrder, "business" | "items" | "statusHistory">;
  payer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phoneNumber: string | null;
  };
};

export type BusinessMemberRole = "OWNER" | "ADMIN" | "MEMBER";
export type BusinessMemberStatus =
  | "INVITED"
  | "ACTIVE"
  | "SUSPENDED"
  | "REMOVED";

export type UserStatus =
  | "PENDING_VERIFICATION"
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "DELETED";

export type AdminBusinessMemberUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string | null;
  profileImage: string | null;
  countryCode: string | null;
  role: string;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
};

export type AdminBusinessMember = {
  id: string;
  businessId: string;
  userId: string;
  role: BusinessMemberRole;
  status: BusinessMemberStatus;
  createdAt: string;
  updatedAt: string;
  user: AdminBusinessMemberUser | null;
};

export type {
  Business as AdminBusiness,
  Listing as AdminListing,
  Tender as AdminTender,
};
