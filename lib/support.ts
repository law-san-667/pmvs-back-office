export type TicketStatus = "OPEN" | "PENDING_CUSTOMER" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type TicketCategory =
  | "ORDER"
  | "PAYMENT"
  | "ACCOUNT"
  | "PRODUCT"
  | "TECHNICAL"
  | "OTHER";

export type TicketMessage = {
  id: string;
  authorUserId: string | null;
  isStaff: boolean;
  body: string;
  createdAt: string;
};

export type SupportTicket = {
  id: string;
  requesterUserId: string;
  businessId: string | null;
  orderId: string | null;
  category: TicketCategory;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedToUserId: string | null;
  firstResponseDueAt: string;
  firstRespondedAt: string | null;
  resolvedAt: string | null;
  lastMessageAt: string;
  createdAt: string;
  messages?: TicketMessage[];
  requester?: {
    firstName: string;
    lastName: string;
    email: string | null;
    phoneNumber: string | null;
  };
  business?: { name: string } | null;
};

/** French labels; screens show the texts of their message files and use these for the codes. */
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Ouverte",
  PENDING_CUSTOMER: "En attente de réponse",
  RESOLVED: "Résolue",
  CLOSED: "Close",
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: "Basse",
  NORMAL: "Normale",
  HIGH: "Haute",
  URGENT: "Urgente",
};

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  ORDER: "Commande",
  PAYMENT: "Paiement",
  ACCOUNT: "Compte",
  PRODUCT: "Produit",
  TECHNICAL: "Technique",
  OTHER: "Autre",
};

export const ticketReference = (id: string) => id.slice(0, 8).toUpperCase();
