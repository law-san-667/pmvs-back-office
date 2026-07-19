"use client";

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
  ArrowDownToLineIcon,
  BanknoteIcon,
  ClockIcon,
  EyeIcon,
  ReceiptTextIcon,
  SearchIcon,
  TrendingUpIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

type TransactionStatus = "PAID" | "PENDING" | "REFUNDED" | "FAILED";

type Transaction = {
  id: string;
  reference: string;
  client: string;
  item: string;
  method: "Wave" | "Orange Money" | "Carte bancaire" | "Espèces";
  date: string;
  amountMinor: number;
  currency: string;
  status: TransactionStatus;
};

const STATUS_LABELS: Record<TransactionStatus, string> = {
  PAID: "Payée",
  PENDING: "En attente",
  REFUNDED: "Remboursée",
  FAILED: "Échouée",
};

const STATUS_CLASSES: Record<TransactionStatus, string> = {
  PAID: "bg-green-500/15 text-green-600",
  PENDING: "bg-amber-500/15 text-amber-600",
  REFUNDED: "bg-blue-500/15 text-blue-600",
  FAILED: "bg-destructive/10 text-destructive",
};

type FilterTab = "all" | TransactionStatus;

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "PAID", label: "Payées" },
  { value: "PENDING", label: "En attente" },
  { value: "REFUNDED", label: "Remboursées" },
];

// Données de démonstration en attendant l'API transactions
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    reference: "TX-2025-0148",
    client: "Awa Ndiaye",
    item: "Boubou brodé homme",
    method: "Wave",
    date: "2025-07-18",
    amountMinor: 45000,
    currency: "XOF",
    status: "PAID",
  },
  {
    id: "2",
    reference: "TX-2025-0147",
    client: "Moussa Diop",
    item: "Sandales en cuir",
    method: "Orange Money",
    date: "2025-07-17",
    amountMinor: 18500,
    currency: "XOF",
    status: "PAID",
  },
  {
    id: "3",
    reference: "TX-2025-0146",
    client: "Fatou Sall",
    item: "Robe wax sur mesure",
    method: "Carte bancaire",
    date: "2025-07-16",
    amountMinor: 62000,
    currency: "XOF",
    status: "PENDING",
  },
  {
    id: "4",
    reference: "TX-2025-0145",
    client: "Ibrahima Fall",
    item: "Sac à main tissé",
    method: "Wave",
    date: "2025-07-15",
    amountMinor: 27000,
    currency: "XOF",
    status: "REFUNDED",
  },
  {
    id: "5",
    reference: "TX-2025-0144",
    client: "Aminata Ba",
    item: "Service de couture — retouches",
    method: "Espèces",
    date: "2025-07-14",
    amountMinor: 8000,
    currency: "XOF",
    status: "PAID",
  },
  {
    id: "6",
    reference: "TX-2025-0143",
    client: "Cheikh Gueye",
    item: "Chemise en lin",
    method: "Orange Money",
    date: "2025-07-12",
    amountMinor: 22000,
    currency: "XOF",
    status: "FAILED",
  },
  {
    id: "7",
    reference: "TX-2025-0142",
    client: "Mariama Sy",
    item: "Ensemble pagne tissé",
    method: "Wave",
    date: "2025-07-10",
    amountMinor: 54000,
    currency: "XOF",
    status: "PAID",
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

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return MOCK_TRANSACTIONS.filter((transaction) => {
      if (activeTab !== "all" && transaction.status !== activeTab) {
        return false;
      }
      if (!query) return true;

      return [transaction.reference, transaction.client, transaction.item]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [activeTab, search]);

  const totalPaidMinor = MOCK_TRANSACTIONS.filter(
    (transaction) => transaction.status === "PAID",
  ).reduce((sum, transaction) => sum + transaction.amountMinor, 0);

  const pendingCount = MOCK_TRANSACTIONS.filter(
    (transaction) => transaction.status === "PENDING",
  ).length;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-normal">
              Revenus encaissés
            </CardTitle>
            <CardAction>
              <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-lg">
                <BanknoteIcon className="size-5" />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatPrice(totalPaidMinor, "XOF")}
            </p>
            <p className="text-muted-foreground flex items-center gap-1 text-sm">
              <TrendingUpIcon className="size-4 text-green-500" />
              +12% ce mois-ci
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-normal">
              Transactions
            </CardTitle>
            <CardAction>
              <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-lg">
                <ReceiptTextIcon className="size-5" />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{MOCK_TRANSACTIONS.length}</p>
            <p className="text-muted-foreground text-sm">
              Sur les 30 derniers jours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-normal">
              En attente
            </CardTitle>
            <CardAction>
              <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-lg">
                <ClockIcon className="size-5" />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingCount}</p>
            <p className="text-muted-foreground text-sm">
              Paiements à confirmer
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Historique des transactions ({filteredTransactions.length})
          </CardTitle>
          <CardAction>
            <div className="flex items-center gap-2">
              <div className="relative">
                <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <Input
                  placeholder="Recherche..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-8 w-48 pl-8"
                />
              </div>
              <Button size="sm" variant="outline">
                <ArrowDownToLineIcon className="size-4" />
                Exporter
              </Button>
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
                  Référence
                </TableHead>
                <TableHead className="text-muted-foreground font-normal">
                  Client
                </TableHead>
                <TableHead className="text-muted-foreground font-normal">
                  Produit / Service
                </TableHead>
                <TableHead className="text-muted-foreground font-normal">
                  Moyen de paiement
                </TableHead>
                <TableHead className="text-muted-foreground font-normal">
                  Date
                </TableHead>
                <TableHead className="text-muted-foreground font-normal">
                  Montant
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
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-2 text-sm">
                      <ReceiptTextIcon className="text-muted-foreground size-9" />
                      <p className="font-medium">Aucune transaction trouvée.</p>
                      <p className="text-muted-foreground">
                        Ajustez votre recherche ou vos filtres.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    className="hover:bg-transparent"
                  >
                    <TableCell className="font-medium">
                      {transaction.reference}
                    </TableCell>
                    <TableCell>{transaction.client}</TableCell>
                    <TableCell className="text-muted-foreground max-w-56 truncate">
                      {transaction.item}
                    </TableCell>
                    <TableCell>{transaction.method}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell className="font-bold">
                      {formatPrice(transaction.amountMinor, transaction.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_CLASSES[transaction.status]}>
                        {STATUS_LABELS[transaction.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
                          <span className="sr-only">Voir le détail</span>
                        </TooltipTrigger>
                        <TooltipContent>Voir le détail</TooltipContent>
                      </Tooltip>
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
    </div>
  );
}
