"use client";

import { useBusiness } from "@/contexts/business-context";
import { useUser } from "@/contexts/user-context";
import { useMessagingSocket } from "@/hooks/use-messaging-socket";
import {
  playMessageNotificationSound,
  prepareMessageNotificationSound,
} from "@/lib/message-notification-sound";
import type { DirectMessage } from "@/lib/messaging";
import { useRouter } from "@/i18n/navigation";
import { trpc } from "@/server/trpc/client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { toast } from "sonner";

type MessagingContextValue = {
  isConnected: boolean;
  unreadCount: number;
  joinConversation: (conversationId: string) => void;
  sendMessage: (
    conversationId: string,
    content: string,
  ) => Promise<DirectMessage>;
};

const MessagingContext = createContext<MessagingContextValue | null>(null);

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useUser();
  const { businessId } = useBusiness();

  const conversations = trpc.messaging.conversations.useQuery(
    { page: 1, limit: 100, businessId: businessId ?? undefined },
    { enabled: Boolean(user && businessId) },
  );

  useEffect(() => {
    const prepareSound = () => prepareMessageNotificationSound();

    window.addEventListener("pointerdown", prepareSound, { once: true });
    window.addEventListener("keydown", prepareSound, { once: true });

    return () => {
      window.removeEventListener("pointerdown", prepareSound);
      window.removeEventListener("keydown", prepareSound);
    };
  }, []);

  const handleMessage = useCallback(
    (message: DirectMessage) => {
      if (message.senderId === user?.id) return;

      void playMessageNotificationSound();

      const senderName =
        `${message.sender.firstName} ${message.sender.lastName}`.trim() ||
        "Un client";
      const preview =
        message.content.length > 120
          ? `${message.content.slice(0, 117)}…`
          : message.content;

      toast(`Nouveau message de ${senderName}`, {
        id: message.id,
        description: preview,
        action: {
          label: "Voir",
          onClick: () => router.push("/dashboard/messages"),
        },
      });
    },
    [router, user?.id],
  );

  const { isConnected, joinConversation, sendMessage } = useMessagingSocket(
    Boolean(user && businessId),
    {
      onMessage: handleMessage,
    },
  );
  const unreadCount =
    conversations.data?.items.reduce(
      (total, conversation) => total + conversation.unreadCount,
      0,
    ) ?? 0;

  const value = useMemo(
    () => ({ isConnected, unreadCount, joinConversation, sendMessage }),
    [isConnected, joinConversation, sendMessage, unreadCount],
  );

  return <MessagingContext value={value}>{children}</MessagingContext>;
}

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error("useMessaging must be used within a MessagingProvider");
  }
  return context;
}
