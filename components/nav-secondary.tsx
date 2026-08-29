"use client";

import * as React from "react";
import { Link, usePathname } from "@/i18n/navigation";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavSecondary({
  items,
  label,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: React.ReactNode;
    badge?: number;
  }[];
  label?: string;
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname();

  return (
    <SidebarGroup {...props}>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                isActive={
                  pathname === item.url ||
                  (!["/dashboard", "/dashboard/admin"].includes(item.url) &&
                    pathname.startsWith(`${item.url}/`))
                }
                render={<Link href={item.url} />}
              >
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
              {Boolean(item.badge) && (
                <SidebarMenuBadge className="bg-primary text-primary-foreground">
                  {(item.badge ?? 0) > 99 ? "99+" : item.badge}
                </SidebarMenuBadge>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
