"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDate,
  formatMoney,
  getInitials,
  getVisiblePages,
} from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import { SearchIcon, UsersRoundIcon } from "lucide-react";
import { useDeferredValue, useState } from "react";

const PAGE_SIZE = 10;

type CustomerOrderBy = "lastOrderAt" | "totalOrders" | "name";

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [orderBy, setOrderBy] = useState<CustomerOrderBy>("lastOrderAt");
  const deferredSearch = useDeferredValue(search.trim());

  const customers = trpc.sellerDashboard.customers.useQuery({
    page: currentPage,
    limit: PAGE_SIZE,
    orderBy,
    order: orderBy === "name" ? "asc" : "desc",
    search: deferredSearch || undefined,
  });
  const topCustomers = trpc.sellerDashboard.customers.useQuery({
    page: 1,
    limit: 5,
    orderBy: "totalOrders",
    order: "desc",
  });

  const items = customers.data?.items ?? [];
  const totalCustomers = customers.data?.total ?? 0;
  const totalPages = Math.max(customers.data?.totalPages ?? 1, 1);
  const visiblePages = getVisiblePages(currentPage, totalPages);
  const hasTrailingPages =
    visiblePages.length > 0 &&
    visiblePages[visiblePages.length - 1] < totalPages;

  const updateSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const updateOrderBy = (value: CustomerOrderBy) => {
    setOrderBy(value);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">Clients</h1>
        <p className="text-muted-foreground text-sm">
          Les clients ayant commandé auprès de votre entreprise
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="h-fit min-w-0">
          <CardHeader>
            <CardTitle>Liste des clients ({totalCustomers})</CardTitle>
            <CardAction>
              <div className="flex items-center gap-2">
                <select
                  value={orderBy}
                  onChange={(event) =>
                    updateOrderBy(event.target.value as CustomerOrderBy)
                  }
                  className="border-input bg-background h-8 rounded-md border px-2 text-sm"
                  aria-label="Trier les clients"
                >
                  <option value="lastOrderAt">Plus récents</option>
                  <option value="totalOrders">Plus de commandes</option>
                  <option value="name">Nom</option>
                </select>
                <div className="relative">
                  <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                  <Input
                    placeholder="Nom, email, téléphone..."
                    value={search}
                    onChange={(event) => updateSearch(event.target.value)}
                    className="h-8 w-56 pl-8"
                  />
                </div>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Client</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Commandes</TableHead>
                  <TableHead>Total dépensé</TableHead>
                  <TableHead>Dernière commande</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                        <Spinner /> Chargement des clients...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : customers.isError ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 text-sm">
                        <UsersRoundIcon className="text-muted-foreground size-9" />
                        <p className="font-medium">
                          Impossible de charger les clients.
                        </p>
                        <p className="text-muted-foreground">
                          {customers.error.message}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 text-sm">
                        <UsersRoundIcon className="text-muted-foreground size-9" />
                        <p className="font-medium">Aucun client trouvé.</p>
                        <p className="text-muted-foreground">
                          {deferredSearch
                            ? "Essayez avec une autre recherche."
                            : "Les acheteurs apparaîtront ici après leur première commande."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((customer) => {
                    const name =
                      `${customer.firstName} ${customer.lastName}`.trim();

                    return (
                      <TableRow
                        key={customer.id}
                        className="hover:bg-transparent"
                      >
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage
                                src={customer.profileImage ?? undefined}
                                alt={name}
                              />
                              <AvatarFallback>
                                {getInitials(name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-bold">{name}</p>
                              {/* <p className="text-muted-foreground truncate text-sm">
                                {customer.email ?? "Aucun email"}
                              </p> */}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {customer.phoneNumber ?? "—"}
                        </TableCell>
                        <TableCell>{customer.totalOrders}</TableCell>
                        <TableCell>
                          <div className="flex flex-col font-bold whitespace-nowrap">
                            {customer.totals.map((total) => (
                              <span key={total.currency}>
                                {formatMoney(
                                  total.totalAmountMinor,
                                  total.currency,
                                )}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {formatDate(customer.lastOrderAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    text=""
                    href="#"
                    aria-disabled={currentPage <= 1}
                    onClick={(event) => {
                      event.preventDefault();
                      setCurrentPage((page) => Math.max(page - 1, 1));
                    }}
                  />
                </PaginationItem>
                {visiblePages.map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={page === currentPage}
                      onClick={(event) => {
                        event.preventDefault();
                        setCurrentPage(page);
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                {hasTrailingPages && (
                  <>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === totalPages}
                        onClick={(event) => {
                          event.preventDefault();
                          setCurrentPage(totalPages);
                        }}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
                <PaginationItem>
                  <PaginationNext
                    text=""
                    href="#"
                    aria-disabled={currentPage >= totalPages}
                    onClick={(event) => {
                      event.preventDefault();
                      setCurrentPage((page) => Math.min(page + 1, totalPages));
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Meilleurs clients</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {topCustomers.isLoading ? (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Spinner /> Chargement...
              </div>
            ) : topCustomers.isError ? (
              <p className="text-destructive text-sm">
                Impossible de charger le classement.
              </p>
            ) : !topCustomers.data?.items.length ? (
              <p className="text-muted-foreground text-sm">
                Aucun client pour le moment.
              </p>
            ) : (
              topCustomers.data.items.map((customer, index) => {
                const name =
                  `${customer.firstName} ${customer.lastName}`.trim();

                return (
                  <div key={customer.id} className="flex items-center gap-3">
                    <span className="text-muted-foreground w-4 text-sm font-medium">
                      {index + 1}
                    </span>
                    <Avatar>
                      <AvatarImage
                        src={customer.profileImage ?? undefined}
                        alt={name}
                      />
                      <AvatarFallback>{getInitials(name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{name}</p>
                      <p className="text-muted-foreground text-xs">
                        {customer.totalOrders} commande
                        {customer.totalOrders > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right text-xs font-bold whitespace-nowrap">
                      {customer.totals.map((total) => (
                        <p key={total.currency}>
                          {formatMoney(total.totalAmountMinor, total.currency)}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
