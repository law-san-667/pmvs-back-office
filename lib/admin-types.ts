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

export type PaymentStatus =
  | "PENDING"
  | "SUCCEEDED"
  | "CANCELLED"
  | "ERRORED"
  | "REFUND_PENDING"
  | "REFUNDED";

export type PaymentProvider = "CASH" | "LAWPAY";

export type PayoutStatus =
  | "NOT_APPLICABLE"
  | "PENDING"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED";

export type PaymentRecord = {
  id: string;
  orderId: string;
  payerUserId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amountMinor: number;
  currency: string;
  transactionReference: string | null;
  failureReason: string | null;
  provider: PaymentProvider;
  providerTransactionId: string | null;
  providerStatus: string | null;
  providerPaymentMethod: string | null;
  paymentUrl: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  recipientId: string | null;
  applicationFeeMinor: number;
  platformFeeMinor: number;
  payoutAmountMinor: number | null;
  payoutStatus: PayoutStatus;
  payoutReference: string | null;
  payoutError: string | null;
  payoutAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LedgerAccount =
  | "SALES"
  | "PROVIDER_FEES"
  | "PLATFORM_REVENUE"
  | "SUPPLIER_PAYABLE"
  | "SUPPLIER_PAID"
  | "SUPPLIER_RECEIVABLE"
  | "REFUNDS";

export type LedgerEntryType =
  | "SALE"
  | "PROVIDER_FEE"
  | "COMMISSION"
  | "SUPPLIER_PAYABLE"
  | "SUPPLIER_PAYOUT"
  | "REFUND"
  | "REFUND_COMMISSION_REVERSAL"
  | "REFUND_SUPPLIER_RECEIVABLE";

export type LedgerEntry = {
  id: string;
  paymentId: string;
  orderId: string | null;
  businessId: string | null;
  account: LedgerAccount;
  entryType: LedgerEntryType;
  amountMinor: number;
  currency: string;
  reference: string | null;
  description: string | null;
  createdAt: string;
};

export type LedgerSummary = {
  balances: Array<{
    account: LedgerAccount;
    currency: string;
    balanceMinor: number;
    entryCount: number;
  }>;
  payments: {
    total: number;
    succeeded: number;
    pending: number;
    failed: number;
    refunded: number;
    payoutsPending: number;
    payoutsFailed: number;
  };
};

export type PayoutAccountStatus = "ACTIVE" | "SUSPENDED";

export type PayoutAccount = {
  id: string;
  businessId: string;
  provider: PaymentProvider;
  recipientId: string;
  externalId: string;
  service: string;
  /** Masked by the API: only the last 4 digits. */
  destinationNumber: string;
  status: PayoutAccountStatus;
  lastProviderEventAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminPayment = PaymentRecord & {
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

/** A back-office account: platform staff, never a client or a seller. */
export type StaffRole = "ADMIN" | "MODERATOR" | "OPERATOR";

export type AdminAccount = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string | null;
  profileImage: string | null;
  role: StaffRole;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

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
