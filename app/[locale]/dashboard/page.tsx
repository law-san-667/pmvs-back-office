"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpRightIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import Image from "next/image";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartData = [
  { month: "Jan", sales: 120000 },
  { month: "Fev", sales: 90000 },
  { month: "Mar", sales: 110000 },
  { month: "Avr", sales: 95000 },
  { month: "Mai", sales: 180000 },
  { month: "Jui", sales: 250000 },
  { month: "Jul", sales: 350000 },
  { month: "Aou", sales: 280000 },
  { month: "Sept", sales: 320000 },
  { month: "Oct", sales: 400000 },
  { month: "Nov", sales: 450000 },
  { month: "Dec", sales: 420000 },
];

const chartConfig = {
  sales: {
    label: "Ventes",
    color: "var(--color-primary)",
  },
};

const recentOrders = [
  {
    image: "/placeholder.svg",
    product: "1 article",
    id: "ID 10-3290-08",
    clientName: "Rodney",
    clientEmail: "rodney.cannon@gmail.com",
    delivery: "Ouakam, cité Avion",
    deliveryDetail: "193 Cole Plains Suite 649, 89126",
    price: "15 000 Fcfa",
    status: "Shipped" as const,
  },
  {
    image: "/placeholder.svg",
    product: "1 article",
    id: "ID 10-3456-18",
    clientName: "Mike Franklin",
    clientEmail: "mike.franklin@gmail.com",
    delivery: "Rufisque, Rue 09",
    deliveryDetail: "619 Jeffrey Freeway Apt. 23",
    price: "15 000 Fcfa",
    status: "En cours" as const,
  },
  {
    image: "/placeholder.svg",
    product: "3 articles",
    id: "ID 10-3786-22",
    clientName: "Louis Franklin",
    clientEmail: "louis.franklin@gmail.com",
    delivery: "Keur massar, Rue 12",
    deliveryDetail: "200 Davis Estates Suite 6",
    price: "15 000 Fcfa",
    status: "En cours" as const,
  },
];

const popularProducts = [
  {
    image: "/placeholder.svg",
    sku: "021231",
    name: "Kanky Kitadakate (Green)",
    price: "10 000Fcfa",
    sales: 3000,
    status: "Success" as const,
  },
  {
    image: "/placeholder.svg",
    sku: "021231",
    name: "Kanky Kitadakate (Green)",
    price: "10 000Fcfa",
    sales: 2311,
    status: "Success" as const,
  },
  {
    image: "/placeholder.svg",
    sku: "021231",
    name: "Kanky Kitadakate (Green)",
    price: "10 000Fcfa",
    sales: 2111,
    status: "Success" as const,
  },
];

const clients = [
  "Natali Craig",
  "Drew Cano",
  "Andi Lane",
  "Koray Okumus",
  "Kate Morrison",
  "Melody Macy",
  "Melody Macy",
  "Melody Macy",
  "Melody Macy",
  "Melody Macy",
  "Melody Macy",
  "Melody Macy",
];

function StatusBadge({ status }: { status: string }) {
  if (status === "Shipped") {
    return (
      <span className="text-xs font-medium text-blue-500">{status}</span>
    );
  }
  if (status === "En cours") {
    return (
      <span className="text-xs font-medium text-orange-500">{status}</span>
    );
  }
  if (status === "Success") {
    return (
      <Badge
        variant="outline"
        className="border-green-200 bg-green-50 text-green-600"
      >
        {status}
      </Badge>
    );
  }
  return <span className="text-xs">{status}</span>;
}

export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Dashboard</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
        {/* Chart + Revenue card row */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_minmax(200px,280px)_minmax(200px,280px)]">
          {/* Sales Chart - spans 2 rows on xl */}
          <Card className="xl:row-span-2">
            <CardHeader>
              <CardTitle>Ventes dans l&apos;année</CardTitle>
              <CardAction>
                <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  Voir tout
                  <ArrowUpRightIcon className="size-4" />
                </button>
              </CardAction>
            </CardHeader>
            <CardContent className="pb-0">
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-primary)"
                        stopOpacity={0.15}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-primary)"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-xs"
                  />
                  <YAxis hide />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) =>
                          `${Number(value).toLocaleString("fr-FR")}Fcfa`
                        }
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fill="url(#fillSales)"
                    strokeDasharray="6 3"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Revenue Total */}
          <Card className="bg-[#3B9AE1] text-white">
            <CardHeader>
              <CardTitle className="text-white/90">Revenu Total</CardTitle>
              <CardAction>
                <ArrowUpRightIcon className="size-4 text-white/70" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">34 000Fcfa</p>
              <div className="mt-2 flex items-center gap-1 text-sm text-white/80">
                <TrendingUpIcon className="size-4" />
                <span className="font-medium text-green-200">10.2%</span>
                <span>Sur la dernière semaine</span>
              </div>
            </CardContent>
          </Card>

          {/* Client Total */}
          <Card>
            <CardHeader>
              <CardTitle>Client Total</CardTitle>
              <CardAction>
                <ArrowUpRightIcon className="size-4 text-muted-foreground" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-[#3B9AE1]">240</p>
                <div className="flex flex-col items-end text-xs">
                  <span className="flex items-center gap-0.5 font-medium text-green-500">
                    <TrendingUpIcon className="size-3" /> 1.5%
                  </span>
                  <span className="text-muted-foreground">
                    Sur la dernière semaine
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Total */}
          <Card className="xl:col-start-2">
            <CardHeader>
              <CardTitle>Transaction Total</CardTitle>
              <CardAction>
                <ArrowUpRightIcon className="size-4 text-muted-foreground" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-[#3B9AE1]">453</p>
                <div className="flex flex-col items-end text-xs">
                  <span className="flex items-center gap-0.5 font-medium text-green-500">
                    <TrendingUpIcon className="size-3" /> 3.6%
                  </span>
                  <span className="text-muted-foreground">
                    Sur la dernière semaine
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Produit */}
          <Card className="xl:col-start-3">
            <CardHeader>
              <CardTitle>Total Produit</CardTitle>
              <CardAction>
                <ArrowUpRightIcon className="size-4 text-muted-foreground" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-[#3B9AE1]">149</p>
                <div className="flex flex-col items-end text-xs">
                  <span className="flex items-center gap-0.5 font-medium text-red-500">
                    <TrendingDownIcon className="size-3" /> 1.5%
                  </span>
                  <span className="text-muted-foreground">
                    Sur la dernière semaine
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Orders + Clients Row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        {/* Left column: Orders + Popular Products */}
        <div className="flex flex-col gap-4">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Dernières commandes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-muted-foreground font-normal">
                      Produit
                    </TableHead>
                    <TableHead className="text-muted-foreground font-normal">
                      Client
                    </TableHead>
                    <TableHead className="text-muted-foreground font-normal">
                      Livraison
                    </TableHead>
                    <TableHead className="text-muted-foreground font-normal">
                      Prix
                    </TableHead>
                    <TableHead className="text-muted-foreground font-normal">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Image
                            src={order.image}
                            alt={order.product}
                            width={48}
                            height={48}
                            className="rounded-lg bg-muted object-cover"
                          />
                          <div>
                            <p className="font-medium">{order.product}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.clientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.clientEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{order.delivery}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.deliveryDetail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {order.price}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Popular Products */}
          <Card>
            <CardHeader>
              <CardTitle>Product Popular</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-muted-foreground font-normal">
                      Produit
                    </TableHead>
                    <TableHead className="text-muted-foreground font-normal">
                      Prix
                    </TableHead>
                    <TableHead className="text-muted-foreground font-normal">
                      Vente
                    </TableHead>
                    <TableHead className="text-muted-foreground font-normal">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {popularProducts.map((product, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="rounded-lg bg-muted object-cover"
                          />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {product.sku}
                            </p>
                            <p className="font-medium">{product.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.price}
                      </TableCell>
                      <TableCell>{product.sales.toLocaleString()}</TableCell>
                      <TableCell>
                        <StatusBadge status={product.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Clients sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="font-bold">Clients</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-lg">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                <UsersIcon className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Nombre de client enregistré
                </p>
                <p className="text-xs text-muted-foreground">320 clients</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {clients.map((name, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Avatar size="sm">
                    <AvatarImage src="/placeholder.svg" alt={name} />
                    <AvatarFallback>
                      {name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
