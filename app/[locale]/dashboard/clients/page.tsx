"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  EyeIcon,
  MessageCircleIcon,
  SearchIcon,
  UsersRoundIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

type ClientStatus = "ACTIVE" | "INACTIVE";

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  orders: number;
  totalSpentMinor: number;
  currency: string;
  lastOrder: string;
  status: ClientStatus;
};

const STATUS_LABELS: Record<ClientStatus, string> = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
};

const STATUS_CLASSES: Record<ClientStatus, string> = {
  ACTIVE: "bg-green-500/15 text-green-600",
  INACTIVE: "bg-muted text-muted-foreground",
};

type FilterTab = "all" | ClientStatus;

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "ACTIVE", label: "Actifs" },
  { value: "INACTIVE", label: "Inactifs" },
];

// Données de démonstration en attendant l'API clients
const MOCK_CLIENTS: Client[] = [
  {
    id: "1",
    name: "Awa Ndiaye",
    email: "awa.ndiaye@example.com",
    phone: "+221 77 123 45 67",
    city: "Dakar",
    orders: 8,
    totalSpentMinor: 312000,
    currency: "XOF",
    lastOrder: "2025-07-18",
    status: "ACTIVE",
  },
  {
    id: "2",
    name: "Moussa Diop",
    email: "moussa.diop@example.com",
    phone: "+221 78 234 56 78",
    city: "Thiès",
    orders: 5,
    totalSpentMinor: 148500,
    currency: "XOF",
    lastOrder: "2025-07-17",
    status: "ACTIVE",
  },
  {
    id: "3",
    name: "Fatou Sall",
    email: "fatou.sall@example.com",
    phone: "+221 76 345 67 89",
    city: "Saint-Louis",
    orders: 3,
    totalSpentMinor: 96000,
    currency: "XOF",
    lastOrder: "2025-07-16",
    status: "ACTIVE",
  },
  {
    id: "4",
    name: "Ibrahima Fall",
    email: "ibrahima.fall@example.com",
    phone: "+221 70 456 78 90",
    city: "Dakar",
    orders: 2,
    totalSpentMinor: 54000,
    currency: "XOF",
    lastOrder: "2025-06-02",
    status: "INACTIVE",
  },
  {
    id: "5",
    name: "Aminata Ba",
    email: "aminata.ba@example.com",
    phone: "+221 77 567 89 01",
    city: "Kaolack",
    orders: 6,
    totalSpentMinor: 187000,
    currency: "XOF",
    lastOrder: "2025-07-14",
    status: "ACTIVE",
  },
  {
    id: "6",
    name: "Cheikh Gueye",
    email: "cheikh.gueye@example.com",
    phone: "+221 78 678 90 12",
    city: "Ziguinchor",
    orders: 1,
    totalSpentMinor: 22000,
    currency: "XOF",
    lastOrder: "2025-05-20",
    status: "INACTIVE",
  },
  {
    id: "7",
    name: "Mariama Sy",
    email: "mariama.sy@example.com",
    phone: "+221 76 789 01 23",
    city: "Dakar",
    orders: 11,
    totalSpentMinor: 428000,
    currency: "XOF",
    lastOrder: "2025-07-10",
    status: "ACTIVE",
  },
];

const formatPrice = (amountMinor: number, currency: string) => {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amountMinor);
  } catch {
    return `${amountMinor.toLocaleString("fr-FR")} ${currency}`;
  }
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(date),
  );

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function ClientsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return MOCK_CLIENTS.filter((client) => {
      if (activeTab !== "all" && client.status !== activeTab) return false;
      if (!query) return true;

      return [client.name, client.email, client.phone, client.city]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [activeTab, search]);

  const topClients = [...MOCK_CLIENTS]
    .sort((a, b) => b.totalSpentMinor - a.totalSpentMinor)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Liste des clients ({filteredClients.length})</CardTitle>
            <CardAction>
              <div className="relative">
                <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <Input
                  placeholder="Recherche..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-8 w-48 pl-8"
                />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex gap-2">
              {FILTER_TABS.map((tab) => (
                <Button
                  key={tab.value}
                  size="sm"
                  variant={activeTab === tab.value ? "default" : "outline"}
                  onClick={() => setActiveTab(tab.value)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-normal">
                    Client
                  </TableHead>
                  <TableHead className="text-muted-foreground font-normal">
                    Téléphone
                  </TableHead>
                  <TableHead className="text-muted-foreground font-normal">
                    Ville
                  </TableHead>
                  <TableHead className="text-muted-foreground font-normal">
                    Commandes
                  </TableHead>
                  <TableHead className="text-muted-foreground font-normal">
                    Total dépensé
                  </TableHead>
                  <TableHead className="text-muted-foreground font-normal">
                    Dernière commande
                  </TableHead>
                  <TableHead className="text-muted-foreground font-normal">
                    Statut
                  </TableHead>
                  <TableHead className="text-muted-foreground font-normal">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 text-sm">
                        <UsersRoundIcon className="text-muted-foreground size-9" />
                        <p className="font-medium">Aucun client trouvé.</p>
                        <p className="text-muted-foreground">
                          Ajustez votre recherche ou vos filtres.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-transparent">
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {getInitials(client.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-bold">{client.name}</p>
                            <p className="text-muted-foreground truncate text-sm">
                              {client.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {client.phone}
                      </TableCell>
                      <TableCell>{client.city}</TableCell>
                      <TableCell>{client.orders}</TableCell>
                      <TableCell className="font-bold">
                        {formatPrice(client.totalSpentMinor, client.currency)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(client.lastOrder)}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_CLASSES[client.status]}>
                          {STATUS_LABELS[client.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-foreground"
                                />
                              }
                            >
                              <EyeIcon className="size-4" />
                              <span className="sr-only">Voir le profil</span>
                            </TooltipTrigger>
                            <TooltipContent>Voir le profil</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-foreground"
                                />
                              }
                            >
                              <MessageCircleIcon className="size-4" />
                              <span className="sr-only">Contacter</span>
                            </TooltipTrigger>
                            <TooltipContent>Contacter</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious text="" href="#" aria-disabled />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    1
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext text="" href="#" aria-disabled />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="font-bold">Meilleurs clients</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {topClients.map((client, index) => (
              <div key={client.id} className="flex items-center gap-3">
                <span className="text-muted-foreground w-4 text-sm font-medium">
                  {index + 1}
                </span>
                <Avatar>
                  <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{client.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {client.orders} commande{client.orders > 1 ? "s" : ""}
                  </p>
                </div>
                <p className="text-sm font-bold">
                  {formatPrice(client.totalSpentMinor, client.currency)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
