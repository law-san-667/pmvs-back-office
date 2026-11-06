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
import { useMessaging } from "@/contexts/messaging-context";
import { useUser } from "@/contexts/user-context";
import {
    ActivityIcon,
  HeartPulseIcon,
  ClipboardCheckIcon,
  FileChartColumnIcon,
  GraduationCapIcon,
  MailIcon,
  TrophyIcon,
  FileCheckIcon,
  ChartNoAxesColumnIcon,
    AwardIcon,
    BanknoteIcon,
    Building2Icon,
    CircleHelpIcon,
    CreditCardIcon,
    FileTextIcon,
    FlagIcon,
    GavelIcon,
    HandshakeIcon,
    LayoutDashboardIcon,
    LifeBuoyIcon,
    MapPinnedIcon,
    MegaphoneIcon,
    MessageSquareIcon,
    NewspaperIcon,
    PackageIcon,
    PercentIcon,
    SendIcon,
    SettingsIcon,
    ShieldCheckIcon,
    ShoppingCartIcon,
    StoreIcon,
    UndoIcon,
    UserCogIcon,
    Users2Icon,
} from "lucide-react";
import type { Messages } from "@/i18n/messages";
import { type MessageKeys, type NestedKeyOf, useTranslations } from "next-intl";
import { NavUser } from "./nav-user";

type ItemsMessages = Messages["nav"]["items"];
type NavKey = MessageKeys<ItemsMessages, NestedKeyOf<ItemsMessages>>;
type NavItem = { key: NavKey; url: string; icon: React.ReactNode };

const generalItems: NavItem[] = [
  {
    key: "dashboard",
    url: "/dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    key: "products",
    url: "/dashboard/products",
    icon: <PackageIcon />,
  },
  {
    key: "tenders",
    url: "/dashboard/tenders",
    icon: <GavelIcon />,
  },
  {
    key: "tenderOpportunities",
    url: "/dashboard/tenders/opportunities",
    icon: <SendIcon />,
  },
  {
    key: "orders",
    url: "/dashboard/orders",
    icon: <ShoppingCartIcon />,
  },
  {
    key: "invoices",
    url: "/dashboard/invoices",
    icon: <FileTextIcon />,
  },
  {
    key: "promotions",
    url: "/dashboard/promotions",
    icon: <PercentIcon />,
  },
  {
    key: "documents",
    url: "/dashboard/documents",
    icon: <FileCheckIcon />,
  },
  {
    key: "traffic",
    url: "/dashboard/traffic",
    icon: <ChartNoAxesColumnIcon />,
  },
  {
    key: "reports",
    url: "/dashboard/reports",
    icon: <FileChartColumnIcon />,
  },
  {
    key: "vendability",
    url: "/dashboard/vendability",
    icon: <TrophyIcon />,
  },
  {
    key: "advertising",
    url: "/dashboard/advertising",
    icon: <MegaphoneIcon />,
  },
  {
    key: "afterSales",
    url: "/dashboard/after-sales",
    icon: <UndoIcon />,
  },
  {
    key: "clients",
    url: "/dashboard/clients",
    icon: <Users2Icon />,
  },
  {
    key: "messages",
    url: "/dashboard/messages",
    icon: <MessageSquareIcon />,
  },
];

const toolsItems: NavItem[] = [
  {
    key: "support",
    url: "/dashboard/support",
    icon: <LifeBuoyIcon />,
  },
  {
    key: "settings",
    url: "/dashboard/settings",
    icon: <SettingsIcon />,
  },
  {
    key: "training",
    url: "/dashboard/training",
    icon: <GraduationCapIcon />,
  },
  {
    key: "help",
    url: "/dashboard/help",
    icon: <CircleHelpIcon />,
  },
];

const adminItems: NavItem[] = [
  {
    key: "admin.dashboard",
    url: "/dashboard/admin",
    icon: <LayoutDashboardIcon />,
  },
  {
    key: "admin.content",
    url: "/dashboard/admin/content",
    icon: <FileTextIcon />,
  },
  {
    key: "admin.configuration",
    url: "/dashboard/admin/configuration",
    icon: <MapPinnedIcon />,
  },
  {
    key: "admin.businesses",
    url: "/dashboard/admin/businesses",
    icon: <Building2Icon />,
  },
  {
    key: "admin.listings",
    url: "/dashboard/admin/listings",
    icon: <PackageIcon />,
  },
  {
    key: "admin.classifieds",
    url: "/dashboard/admin/classifieds",
    icon: <NewspaperIcon />,
  },
  {
    key: "admin.classifiedContacts",
    url: "/dashboard/admin/classified-contacts",
    icon: <HandshakeIcon />,
  },
  {
    key: "admin.tenders",
    url: "/dashboard/admin/tenders",
    icon: <GavelIcon />,
  },
  {
    key: "admin.orders",
    url: "/dashboard/admin/orders",
    icon: <ShoppingCartIcon />,
  },
  {
    key: "admin.payouts",
    url: "/dashboard/admin/payouts",
    icon: <BanknoteIcon />,
  },
  {
    key: "admin.transactions",
    url: "/dashboard/admin/transactions",
    icon: <CreditCardIcon />,
  },
  {
    key: "admin.quality",
    url: "/dashboard/admin/quality",
    icon: <AwardIcon />,
  },
  {
    key: "admin.traffic",
    url: "/dashboard/admin/traffic",
    icon: <ChartNoAxesColumnIcon />,
  },
  {
    key: "admin.reports",
    url: "/dashboard/admin/reports",
    icon: <FileChartColumnIcon />,
  },
  {
    key: "admin.vendability",
    url: "/dashboard/admin/vendability",
    icon: <TrophyIcon />,
  },
  {
    key: "admin.training",
    url: "/dashboard/admin/training",
    icon: <GraduationCapIcon />,
  },
  {
    key: "admin.marketing",
    url: "/dashboard/admin/marketing",
    icon: <MailIcon />,
  },
  {
    key: "admin.teamMembers",
    url: "/dashboard/admin/team-members",
    icon: <UserCogIcon />,
  },
  {
    key: "admin.moderation",
    url: "/dashboard/admin/moderation",
    icon: <FlagIcon />,
  },
  {
    key: "admin.advertising",
    url: "/dashboard/admin/advertising",
    icon: <MegaphoneIcon />,
  },
  {
    key: "admin.afterSales",
    url: "/dashboard/admin/after-sales",
    icon: <UndoIcon />,
  },
  {
    key: "admin.support",
    url: "/dashboard/admin/support",
    icon: <LifeBuoyIcon />,
  },
  {
    key: "admin.customers",
    url: "/dashboard/admin/customers",
    icon: <Users2Icon />,
  },
  {
    key: "admin.administrators",
    url: "/dashboard/admin/administrators",
    icon: <ShieldCheckIcon />,
  },
  {
    key: "admin.operators",
    url: "/dashboard/admin/operators",
    icon: <StoreIcon />,
  },
  {
    key: "admin.compliance",
    url: "/dashboard/admin/compliance",
    icon: <ClipboardCheckIcon />,
  },
  {
    key: "admin.monitoring",
    url: "/dashboard/admin/monitoring",
    icon: <HeartPulseIcon />,
  },
  {
    key: "admin.diagnostics",
    url: "/dashboard/admin/diagnostics",
    icon: <ActivityIcon />,
  },
  {
    key: "admin.settings",
    url: "/dashboard/admin/settings",
    icon: <SettingsIcon />,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations("nav");
  const { user } = useUser();
  const { unreadCount } = useMessaging();
  const isAdmin = user?.role === "ADMIN";
  // Operators confirm payments and release payouts of their shops.
  const operatorTools: NavItem[] =
    user?.role === "OPERATOR"
      ? [
          {
            key: "admin.payouts",
            url: "/dashboard/admin/payouts",
            icon: <BanknoteIcon />,
          },
          ...toolsItems,
        ]
      : user?.role === "MODERATOR"
        ? [
            {
              key: "admin.moderation",
              url: "/dashboard/admin/moderation",
              icon: <FlagIcon />,
            },
            {
              key: "admin.compliance",
              url: "/dashboard/admin/compliance",
              icon: <ClipboardCheckIcon />,
            },
            {
              key: "admin.listingsToReview",
              url: "/dashboard/admin/listings",
              icon: <PackageIcon />,
            },
            {
              key: "admin.classifieds",
              url: "/dashboard/admin/classifieds",
              icon: <NewspaperIcon />,
            },
            {
              key: "admin.classifiedContacts",
              url: "/dashboard/admin/classified-contacts",
              icon: <HandshakeIcon />,
            },
            {
              key: "admin.advertising",
              url: "/dashboard/admin/advertising",
              icon: <MegaphoneIcon />,
            },
            ...toolsItems,
          ]
        : toolsItems;
  const label = ({ key, ...item }: NavItem) => ({ ...item, title: t(`items.${key}`) });
  const navigationItems = generalItems.map((item) =>
    item.url === "/dashboard/messages"
      ? { ...label(item), badge: unreadCount }
      : label(item),
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
            <p className="px-2 pb-1 text-xs leading-tight font-semibold text-slate-600 group-data-[collapsible=icon]:hidden">
              {t("brand.tagline")}
            </p>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavSecondary
          label={isAdmin ? t("sidebar.administration") : t("sidebar.general")}
          items={isAdmin ? adminItems.map(label) : navigationItems}
        />
        {!isAdmin && (
          <NavSecondary label={t("sidebar.tools")} items={operatorTools.map(label)} />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
