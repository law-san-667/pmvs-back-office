"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useUser } from "@/contexts/user-context";
import { type Locale, localeNames, locales } from "@/i18n/config";
import { useRouter } from "@/i18n/navigation";
import { trpc } from "@/server/trpc/client";
import {
  BellIcon,
  CircleUserRoundIcon,
  EllipsisVerticalIcon,
  LanguagesIcon,
  LogOutIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

function getUserInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getUserDisplayName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`;
}

export function NavUser() {
  const t = useTranslations("nav.user");
  const locale = useLocale();
  const { isMobile } = useSidebar();
  const { user, logout, isAuthenticated } = useUser();
  const router = useRouter();
  const saveLanguage = trpc.auth.setLanguage.useMutation();

  if (!user) return null;

  const displayName = getUserDisplayName(user.firstName, user.lastName);
  const initials = getUserInitials(user.firstName, user.lastName);

  // Same as the header's language menu, which phones do not show.
  const changeLanguage = async (next: Locale) => {
    if (next === locale) return;
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    if (isAuthenticated) {
      await saveLanguage.mutateAsync({ language: next }).catch(() => null);
    }
    const { pathname, search, hash } = window.location;
    const path = pathname.replace(/^\/(fr|en|pt|ar)(?=\/|$)/, `/${next}`);
    // A full load: the page direction (Arabic) and server texts change too.
    window.location.assign(`${path}${search}${hash}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Local credentials are cleared even if the remote session is already invalid.
    } finally {
      router.replace("/");
      router.refresh();
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <Avatar className="size-8 rounded-lg">
              <AvatarImage src="" alt={displayName} />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-start text-sm leading-tight">
              <span className="truncate font-medium">{displayName}</span>
              <span className="text-foreground/70 truncate text-xs">
                {user.email ?? user.phoneNumber}
              </span>
            </div>
            <EllipsisVerticalIcon className="ms-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                  <Avatar className="size-8">
                    <AvatarImage src="" alt={displayName} />
                    <AvatarFallback className="rounded-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-start text-sm leading-tight">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {user.email ?? user.phoneNumber}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <CircleUserRoundIcon />
                {t("account")}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon />
                {t("notifications")}
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <LanguagesIcon />
                  {t("language")}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={locale}
                    onValueChange={(value) => void changeLanguage(value as Locale)}
                  >
                    {locales.map((code) => (
                      <DropdownMenuRadioItem key={code} value={code}>
                        <span lang={code} dir={code === "ar" ? "rtl" : "ltr"}>
                          {localeNames[code]}
                        </span>
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void handleLogout()}>
              <LogOutIcon />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
