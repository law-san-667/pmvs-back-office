"use client";

import IsLoadingScreen from "@/components/is-loading-screen";
import { useUser } from "@/contexts/user-context";
import { useRouter } from "@/i18n/navigation";
import { trpc } from "@/server/trpc/client";
import React from "react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useUser();
  const [hasCheckedBusiness, setHasCheckedBusiness] = React.useState(false);

  const { refetch: fetchBusiness } = trpc.businesses.myBusiness.useQuery(
    undefined,
    { enabled: false, retry: false },
  );

  React.useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/");
      return;
    }

    if (user?.role === "ADMIN") {
      router.replace("/dashboard/admin");
      return;
    }

    void fetchBusiness().then(({ data }) => {
      if (data) {
        router.replace("/dashboard");
      } else {
        router.replace("/create-business");
      }
      setHasCheckedBusiness(true);
    });
  }, [isAuthenticated, isLoading, router, fetchBusiness, user?.role]);

  if (isLoading || !hasCheckedBusiness) {
    return <IsLoadingScreen text="Authentification en cours..." />;
  }

  return null;
}
