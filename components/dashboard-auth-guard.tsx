"use client";

import IsLoadingScreen from "@/components/is-loading-screen";
import { useBusiness } from "@/contexts/business-context";
import { useUser } from "@/contexts/user-context";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useEffect } from "react";

export function DashboardAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading: isUserLoading } = useUser();
  const { business, isLoading: isBusinessLoading } = useBusiness();

  const isAdmin = user?.role === "ADMIN";
  const isAdminRoute = pathname.startsWith("/dashboard/admin");
  const isSellerTransactionRoute = pathname.startsWith(
    "/dashboard/transactions",
  );
  const isLoading = isUserLoading || (!isAdmin && isBusinessLoading);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/");
      return;
    }

    if (isAdmin) {
      if (!isAdminRoute) {
        router.replace("/dashboard/admin");
      }
      return;
    }

    if (isAdminRoute) {
      router.replace(business ? "/dashboard" : "/create-business");
      return;
    }

    if (isSellerTransactionRoute) {
      router.replace("/dashboard");
      return;
    }

    if (!business) {
      router.replace("/create-business");
    }
  }, [
    isAuthenticated,
    business,
    isAdmin,
    isAdminRoute,
    isSellerTransactionRoute,
    isLoading,
    router,
  ]);

  const canRender = isAdmin
    ? isAdminRoute
    : Boolean(business) && !isAdminRoute && !isSellerTransactionRoute;

  if (isLoading || !isAuthenticated || !canRender) {
    return <IsLoadingScreen text="Chargement..." />;
  }

  return <>{children}</>;
}
