"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/contexts/user-context";
import { BellIcon, MailIcon, SearchIcon } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  SELLER: "Vendeur",
  CLIENT: "Client",
  MODERATOR: "Modérateur",
  OPERATOR: "Opérateur",
};

export function SiteHeader() {
  const { user } = useUser();

  const displayName = user
    ? `${user.firstName} ${user.lastName}`
    : "";
  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "";
  const roleLabel = user ? (ROLE_LABELS[user.role] ?? user.role) : "";

  return (
    <header className="sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center border-b bg-background transition-[width,height] ease-linear">
      <div className="flex w-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              type="search"
              placeholder="Rechercher..."
              className="h-9 w-64 pl-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="secondary" size="icon-sm" className="bg-zinc-100">
            <MailIcon className="size-4" />
          </Button>
          <Button variant="secondary" size="icon-sm" className="bg-zinc-100">
            <BellIcon className="size-4" />
          </Button>
          <Separator
            orientation="vertical"
            className="mx-2 h-6 data-vertical:self-auto"
          />
          {user && (
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarImage src="" alt={displayName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden flex-col text-left text-sm leading-tight md:flex">
                <span className="truncate text-sm font-medium">
                  {displayName}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {roleLabel}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
