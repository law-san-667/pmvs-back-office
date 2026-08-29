"use client";

import Image from "next/image";
import * as React from "react";

import { NavSecondary } from "@/components/nav-secondary";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Building2Icon,
  CircleHelpIcon,
  CreditCardIcon,
  GavelIcon,
  LayoutDashboardIcon,
  MapPinnedIcon,
  MessageSquareIcon,
  PackageIcon,
  SettingsIcon,
  ShoppingCartIcon,
  UserCogIcon,
  Users2Icon,
} from "lucide-react";
import { useUser } from "@/contexts/user-context";
import { useMessaging } from "@/contexts/messaging-context";
import { NavUser } from "./nav-user";

const generalItems = [
  {
    title: "Tableau de bord",
    url: "/dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Produits",
    url: "/dashboard/products",
    icon: <PackageIcon />,
  },
  {
    title: "Appels d'offres",
    url: "/dashboard/tenders",
    icon: <GavelIcon />,
  },
  {
    title: "Commandes",
    url: "/dashboard/orders",
    icon: <ShoppingCartIcon />,
  },
  {
    title: "Clients",
    url: "/dashboard/clients",
    icon: <Users2Icon />,
  },
  {
    title: "Messagerie",
    url: "/dashboard/messages",
    icon: <MessageSquareIcon />,
  },
];

const toolsItems = [
  {
    title: "Paramètres",
    url: "/dashboard/settings",
    icon: <SettingsIcon />,
  },
  {
    title: "Aide",
    url: "/dashboard/help",
    icon: <CircleHelpIcon />,
  },
];

const adminItems = [
  {
    title: "Tableau de bord",
    url: "/dashboard/admin",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Configuration",
    url: "/dashboard/admin/configuration",
    icon: <MapPinnedIcon />,
  },
  {
    title: "Entreprises",
    url: "/dashboard/admin/businesses",
    icon: <Building2Icon />,
  },
  {
    title: "Produits & services",
    url: "/dashboard/admin/listings",
    icon: <PackageIcon />,
  },
  {
    title: "Appels d'offres",
    url: "/dashboard/admin/tenders",
    icon: <GavelIcon />,
  },
  {
    title: "Commandes",
    url: "/dashboard/admin/orders",
    icon: <ShoppingCartIcon />,
  },
  {
    title: "Transactions",
    url: "/dashboard/admin/transactions",
    icon: <CreditCardIcon />,
  },
  {
    title: "Membres d'équipe",
    url: "/dashboard/admin/team-members",
    icon: <UserCogIcon />,
  },
  {
    title: "Clients",
    url: "/dashboard/admin/customers",
    icon: <Users2Icon />,
  },
  {
    title: "Paramètres",
    url: "/dashboard/admin/settings",
    icon: <SettingsIcon />,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const { unreadCount } = useMessaging();
  const isAdmin = user?.role === "ADMIN";
  const navigationItems = generalItems.map((item) =>
    item.url === "/dashboard/messages" ? { ...item, badge: unreadCount } : item,
  );

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Image
              src="/logo.png"
              alt="Diarama"
              width={150}
              height={40}
              className="p-2"
              priority
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavSecondary
          label={isAdmin ? "Administration" : "Général"}
          items={isAdmin ? adminItems : navigationItems}
        />
        {!isAdmin && <NavSecondary label="Outils" items={toolsItems} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
