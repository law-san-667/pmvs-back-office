export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentMethod = "CASH" | "WAVE" | "ORANGE_MONEY";

export type ShippingAddress = {
  recipientName: string;
  phoneNumber: string;
  street?: string | null;
  city: string;
  state?: string | null;
  countryCode: string;
  postalCode?: string | null;
  latitude?: string | null;
  longitude?: string | null;
};

export type OrderListing = {
  id: string;
  businessId: string;
  title: string;
  images: unknown;
  priceAmountMinor: number;
  currency: string;
};

export type OrderItem = {
  id: string;
  orderId: string;
  listingId: string;
  quantity: number;
  unitPriceMinor: number;
  totalPriceMinor: number;
  createdAt: string;
  listing: OrderListing;
};

export type OrderStatusHistory = {
  id: string;
  orderId: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedByUserId: string | null;
  note: string | null;
  createdAt: string;
};

export type BusinessOrder = {
  id: string;
  buyerId: string;
  businessId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  totalAmountMinor: number;
  currency: string;
  shippingAddress: ShippingAddress | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  business: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
  };
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
  buyer?: SellerCustomerSummary;
};

export type SellerCustomerSummary = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string | null;
  profileImage: string | null;
};

export type RecentSellerOrder = BusinessOrder & {
  buyer: SellerCustomerSummary;
};

export type MonetaryTotal = {
  currency: string;
  totalAmountMinor: number;
};

export type SellerCustomer = SellerCustomerSummary & {
  totalOrders: number;
  totals: MonetaryTotal[];
  lastOrderAt: string;
};

export type BestSellingProduct = {
  product: OrderListing & {
    status: string;
    quantityAvailable: number;
  };
  totalSold: number;
  totalRevenueMinor: number;
  totalOrders: number;
};

export type SellerStats = {
  totalSold: number;
  totalCustomers: number;
  totalProducts: number;
  totalOrders: number;
  revenueGraph: {
    year: number;
    series: Array<{
      currency: string;
      months: Array<{
        month: number;
        totalAmountMinor: number;
      }>;
    }>;
  };
};
