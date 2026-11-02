"use client";

import { TicketThread } from "@/components/support/ticket-thread";
import { use } from "react";

export default function SupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <TicketThread id={id} />;
}
