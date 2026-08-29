export type MessageAttachment = {
  url: string;
  name?: string;
  mimeType?: string;
  size?: number;
};

export type MessageSender = {
  id: string;
  firstName: string;
  lastName: string;
  profileImage: string | null;
};

export type DirectMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  type: "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
  content: string;
  attachments: MessageAttachment[];
  createdAt: string;
  updatedAt: string;
  sender: MessageSender;
};

export type DirectConversation = {
  id: string;
  customerId: string;
  businessId: string;
  type: "DIRECT";
  createdAt: string;
  updatedAt: string;
  customer: MessageSender;
  business: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
  };
  latestMessage: DirectMessage | null;
  unreadCount: number;
};

export type ConversationReadReceipt = {
  conversationId: string;
  userId: string;
  lastReadAt: string;
};

export type SocketTicket = {
  token: string;
  expiresIn: number;
  url: string;
};

export type SocketAcknowledgement<T> = {
  data: T | null;
  error: string | null;
};
