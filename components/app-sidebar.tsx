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
  CircleHelpIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  PackageIcon,
  Settings,
  Users2Icon,
} from "lucide-react";
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
    title: "Transactions",
    url: "/dashboard/transactions",
    icon: <FileTextIcon />,
  },
  {
    title: "Clients",
    url: "/dashboard/clients",
    icon: <Users2Icon />,
  },
];

const toolsItems = [
  {
    title: "Paramètres",
    url: "/dashboard/settings",
    icon: <Settings />,
  },
  {
    title: "Aide",
    url: "/dashboard/help",
    icon: <CircleHelpIcon />,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavSecondary label="Général" items={generalItems} />
        <NavSecondary label="Outils" items={toolsItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
