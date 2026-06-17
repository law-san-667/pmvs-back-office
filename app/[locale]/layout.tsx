import { TooltipProvider } from "@/components/ui/tooltip";
import { UserPreferencesProvider } from "@/contexts/user-preferences-context";
import { UserProvider } from "@/contexts/user-context";
import { locales } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { TRPCProvider } from "@/server/trpc/client";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Inter, Poppins } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-title",
});

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "DIARAMA BACK OFFICE",
  description: "Espace d'administration de DIARAMA",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const messages = await getMessages();
  const { locale } = await params;

  return (
    <html lang={locale} className="w-full">
      <body
        className={cn(
          "selection:bg-primary selection:text-secondary relative min-h-screen bg-gray-50 antialiased",
          inter.variable,
          poppins.variable,
        )}
      >
        <TRPCProvider>
          <NuqsAdapter>
            <NextIntlClientProvider messages={messages}>
              <TooltipProvider>
                <UserPreferencesProvider>
                  <UserProvider>
                    <div className="relative min-h-screen w-full">
                      {children}
                    </div>
                  </UserProvider>
                </UserPreferencesProvider>
              </TooltipProvider>
            </NextIntlClientProvider>
          </NuqsAdapter>
        </TRPCProvider>
      </body>
    </html>
  );
}
