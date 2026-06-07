"use client";

import IsLoadingScreen from "@/components/is-loading-screen";
import { useBusiness } from "@/contexts/business-context";
import { useUser } from "@/contexts/user-context";
import { useRouter } from "@/i18n/navigation";
import { useEffect } from "react";

export function DashboardAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading: isUserLoading } = useUser();
  const { business, isLoading: isBusinessLoading } = useBusiness();

  const isLoading = isUserLoading || isBusinessLoading;

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/");
      return;
    }

    if (!business) {
      router.replace("/create-business");
    }
  }, [isAuthenticated, business, isLoading, router]);

  if (isLoading || !isAuthenticated || !business) {
    return <IsLoadingScreen text="Chargement..." />;
  }

  return <>{children}</>;
}
