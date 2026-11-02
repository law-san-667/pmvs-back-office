import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { UserPreferencesProvider } from "@/contexts/user-preferences-context";
import { UserProvider } from "@/contexts/user-context";
import { type Locale, localeDirection, locales } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { TRPCProvider } from "@/server/trpc/client";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { IBM_Plex_Sans_Arabic, Inter, Poppins } from "next/font/google";
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

// Arabic letters come from this font; Latin text keeps the site's fonts.
const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
});

const OG_LOCALES: Record<string, string> = {
  fr: "fr_FR",
  en: "en_GB",
  pt: "pt_PT",
  ar: "ar_AR",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "meta" });

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: "https://pmvs-web.vercel.app",
      siteName: "Diarama",
      images: [
        {
          url: "https://pmvs-web.vercel.app/diarama-square-logo.png",
          width: 1200,
          height: 630,
          alt: "Diarama",
        },
      ],
      locale: OG_LOCALES[locale] ?? "fr_FR",
      type: "website",
    },
  };
}

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
    <html lang={locale} dir={localeDirection(locale)} className="w-full">
      <body
        className={cn(
          "selection:bg-primary selection:text-secondary relative min-h-screen bg-gray-50 antialiased",
          inter.variable,
          poppins.variable,
          arabic.variable,
        )}
      >
        <TRPCProvider>
          <NuqsAdapter>
            <NextIntlClientProvider locale={locale as Locale} messages={messages}>
              <TooltipProvider>
                <UserPreferencesProvider>
                  <UserProvider>
                    <div className="relative min-h-screen w-full">
                      {children}
                    </div>
                    <Toaster position="top-right" closeButton />
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
