"use client";

import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/user-avatar";
import { useBusiness } from "@/contexts/business-context";
import { useMessaging } from "@/contexts/messaging-context";
import { useUser } from "@/contexts/user-context";
import type { DirectConversation } from "@/lib/messaging";
import { cn } from "@/lib/utils";
import { trpc } from "@/server/trpc/client";
import { ArrowLeft, LoaderCircle, MessageSquareText, Send } from "lucide-react";
import React from "react";

const shortTime = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
});

const listDate = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
});

export function BusinessInbox() {
  const { user } = useUser();
  const { businessId, isLoading: isBusinessLoading } = useBusiness();
  const [activeConversationId, setActiveConversationId] =
    React.useState<string>();
  const [mobileThreadOpen, setMobileThreadOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [sendError, setSendError] = React.useState<string>();
  const [isSending, setIsSending] = React.useState(false);
  const messageListRef = React.useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const conversationsQuery = trpc.messaging.conversations.useQuery(
    { page: 1, limit: 100, businessId: businessId ?? undefined },
    { enabled: Boolean(businessId) },
  );
  const conversations = conversationsQuery.data?.items ?? [];
  const selectedConversation =
    conversations.find((item) => item.id === activeConversationId) ??
    conversations[0];
  const selectedConversationId = selectedConversation?.id;

  const messagesQuery = trpc.messaging.messages.useQuery(
    { id: selectedConversationId ?? "", page: 1, limit: 100 },
    { enabled: Boolean(selectedConversationId) },
  );
  const messages = [...(messagesQuery.data?.items ?? [])].reverse();
  const { isConnected, joinConversation, sendMessage } = useMessaging();

  React.useEffect(() => {
    if (selectedConversationId) joinConversation(selectedConversationId);
  }, [joinConversation, messages.length, selectedConversationId]);

  React.useEffect(() => {
    const list = messageListRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length, selectedConversationId]);

  const selectConversation = (conversation: DirectConversation) => {
    setActiveConversationId(conversation.id);
    setMobileThreadOpen(true);
    setSendError(undefined);
  };

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !selectedConversationId) return;

    setIsSending(true);
    setSendError(undefined);
    try {
      await sendMessage(selectedConversationId, content);
      setDraft("");
      await Promise.all([
        utils.messaging.messages.invalidate({ id: selectedConversationId }),
        utils.messaging.conversations.invalidate(),
      ]);
    } catch (error) {
      setSendError(
        error instanceof Error ? error.message : "Envoi du message impossible.",
      );
    } finally {
      setIsSending(false);
    }
  };

  if (isBusinessLoading) {
    return <Status label="Chargement de l’entreprise…" loading />;
  }

  if (!businessId) {
    return (
      <Status label="Créez ou sélectionnez une entreprise pour accéder à la messagerie." />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Messagerie</h1>
          <p className="text-muted-foreground text-sm">
            Échangez en direct avec vos clients
          </p>
        </div>
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <span
            className={cn(
              "size-2 rounded-full",
              isConnected ? "bg-emerald-500" : "bg-amber-400",
            )}
          />
          {isConnected ? "Temps réel actif" : "Connexion…"}
        </div>
      </div>

      <div className="grid min-h-[36rem] flex-1 overflow-hidden rounded-xl border bg-white md:grid-cols-[19rem_minmax(0,1fr)]">
        <aside
          className={cn(
            "min-h-0 border-r",
            mobileThreadOpen && "hidden md:block",
          )}
        >
          <div className="border-b px-4 py-3">
            <p className="font-semibold">Conversations</p>
            <p className="text-muted-foreground text-xs">
              {conversations.length} conversation
              {conversations.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="h-[calc(100%-4rem)] overflow-y-auto">
            {conversationsQuery.isLoading ? (
              <Status label="Chargement…" loading />
            ) : conversationsQuery.isError ? (
              <Status label="Impossible de charger les conversations." />
            ) : conversations.length === 0 ? (
              <Status label="Aucun client ne vous a encore écrit." />
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => selectConversation(conversation)}
                  className={cn(
                    "flex w-full gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-zinc-50",
                    conversation.id === selectedConversationId &&
                      "bg-primary/5",
                  )}
                >
                  <UserAvatar
                    name={`${conversation.customer.firstName} ${conversation.customer.lastName}`}
                    src={conversation.customer.profileImage}
                    className="size-10"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">
                        {conversation.customer.firstName}{" "}
                        {conversation.customer.lastName}
                      </span>
                      {conversation.latestMessage && (
                        <span className="text-muted-foreground shrink-0 text-[10px]">
                          {listDate.format(
                            new Date(conversation.latestMessage.createdAt),
                          )}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
                        {conversation.latestMessage?.content ??
                          "Nouvelle conversation"}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                          {Math.min(conversation.unreadCount, 9)}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        <section
          className={cn(
            "min-h-0 min-w-0 flex-col",
            mobileThreadOpen ? "flex" : "hidden md:flex",
          )}
        >
          {!selectedConversation || !user ? (
            <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <MessageSquareText className="size-10" />
              <p className="text-sm">Sélectionnez une conversation.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="md:hidden"
                  onClick={() => setMobileThreadOpen(false)}
                  aria-label="Retour aux conversations"
                >
                  <ArrowLeft />
                </Button>
                <UserAvatar
                  name={`${selectedConversation.customer.firstName} ${selectedConversation.customer.lastName}`}
                  src={selectedConversation.customer.profileImage}
                  className="size-10"
                />
                <div>
                  <p className="text-sm font-semibold">
                    {selectedConversation.customer.firstName}{" "}
                    {selectedConversation.customer.lastName}
                  </p>
                  <p className="text-muted-foreground text-xs">Client</p>
                </div>
              </div>

              <div
                ref={messageListRef}
                className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-zinc-50 p-4"
              >
                {messagesQuery.isLoading ? (
                  <Status label="Chargement des messages…" loading />
                ) : messages.length === 0 ? (
                  <Status label="Aucun message dans cette conversation." />
                ) : (
                  messages.map((message) => {
                    const mine = message.senderId === user.id;
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                          mine
                            ? "bg-primary text-primary-foreground ml-auto rounded-br-sm"
                            : "mr-auto rounded-bl-sm bg-white",
                        )}
                      >
                        <p className="break-words whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <p
                          className={cn(
                            "mt-1 text-[10px]",
                            mine
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground",
                          )}
                        >
                          {shortTime.format(new Date(message.createdAt))}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSend} className="border-t p-4">
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    rows={1}
                    placeholder="Répondre au client…"
                    className="border-input focus:ring-primary/30 max-h-28 min-h-10 flex-1 resize-none rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2"
                  />
                  <Button
                    type="submit"
                    size="icon-lg"
                    disabled={!draft.trim() || isSending}
                    aria-label="Envoyer"
                  >
                    {isSending ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <Send />
                    )}
                  </Button>
                </div>
                {sendError && (
                  <p className="text-destructive mt-2 text-xs">{sendError}</p>
                )}
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Status({ label, loading }: { label: string; loading?: boolean }) {
  return (
    <div className="text-muted-foreground flex h-full min-h-32 items-center justify-center gap-2 p-6 text-center text-sm">
      {loading && <LoaderCircle className="size-4 animate-spin" />}
      {label}
    </div>
  );
}
