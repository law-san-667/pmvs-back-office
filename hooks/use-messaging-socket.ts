"use client";

import type { DirectMessage, SocketAcknowledgement } from "@/lib/messaging";
import { trpc } from "@/server/trpc/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

const ACK_TIMEOUT_MS = 10_000;

type ChatSocket = Socket<
  {
    "message:new": (message: DirectMessage) => void;
    "conversation:created": () => void;
    "conversation:read": () => void;
  },
  {
    "conversation:join": (
      payload: { conversationId: string },
      acknowledge?: (response: SocketAcknowledgement<unknown>) => void,
    ) => void;
    "conversation:read": (
      payload: { conversationId: string },
      acknowledge?: (response: SocketAcknowledgement<unknown>) => void,
    ) => void;
    "message:send": (
      payload: { conversationId: string; content: string },
      acknowledge?: (response: SocketAcknowledgement<DirectMessage>) => void,
    ) => void;
  }
>;

export function useMessagingSocket(
  enabled: boolean,
  { onMessage }: { onMessage?: (message: DirectMessage) => void } = {},
) {
  const utils = trpc.useUtils();
  const { mutateAsync: getSocketTicket } =
    trpc.messaging.socketTicket.useMutation();
  const { mutateAsync: sendHttp } = trpc.messaging.sendMessage.useMutation();
  const { mutate: markReadHttp } = trpc.messaging.markRead.useMutation({
    onSuccess: () => void utils.messaging.conversations.invalidate(),
  });
  const socketRef = useRef<ChatSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    const scheduleTicketRefresh = (expiresIn: number) => {
      refreshTimer = setTimeout(
        () => void refreshTicket(),
        Math.max((expiresIn - 30) * 1000, 30_000),
      );
    };

    const refreshTicket = async () => {
      try {
        const ticket = await getSocketTicket();
        if (!active) return;

        if (socketRef.current) {
          socketRef.current.auth = { token: ticket.token };
        }
        scheduleTicketRefresh(ticket.expiresIn);
      } catch {
        if (active)
          refreshTimer = setTimeout(() => void refreshTicket(), 30_000);
      }
    };

    const connect = async () => {
      try {
        const ticket = await getSocketTicket();
        if (!active) return;

        const socket: ChatSocket = io(ticket.url, {
          auth: { token: ticket.token },
          transports: ["websocket", "polling"],
        });

        socketRef.current = socket;
        socket.on("connect", () => setIsConnected(true));
        socket.on("disconnect", () => setIsConnected(false));
        socket.on("message:new", (message) => {
          void utils.messaging.messages.invalidate({
            id: message.conversationId,
          });
          void utils.messaging.conversations.invalidate();
          onMessageRef.current?.(message);
        });
        socket.on("conversation:created", () => {
          void utils.messaging.conversations.invalidate();
        });
        socket.on("conversation:read", () => {
          void utils.messaging.conversations.invalidate();
        });

        scheduleTicketRefresh(ticket.expiresIn);
      } catch {
        if (active) refreshTimer = setTimeout(() => void connect(), 30_000);
      }
    };

    void connect();

    return () => {
      active = false;
      if (refreshTimer) clearTimeout(refreshTimer);
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [enabled, getSocketTicket, utils]);

  const joinConversation = useCallback(
    (conversationId: string) => {
      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit("conversation:join", { conversationId });
        socket.emit("conversation:read", { conversationId });
      } else {
        markReadHttp({ conversationId });
      }
    },
    [markReadHttp],
  );

  const sendMessage = useCallback(
    async (conversationId: string, content: string) => {
      const socket = socketRef.current;
      if (!socket?.connected) {
        return sendHttp({ conversationId, content });
      }

      return new Promise<DirectMessage>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("L’envoi du message a expiré.")),
          ACK_TIMEOUT_MS,
        );

        socket.emit("message:send", { conversationId, content }, (response) => {
          clearTimeout(timeout);
          if (response.data) resolve(response.data);
          else reject(new Error(response.error ?? "Envoi impossible."));
        });
      });
    },
    [sendHttp],
  );

  return { isConnected, joinConversation, sendMessage };
}
