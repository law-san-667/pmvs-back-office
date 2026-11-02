"use client";

import InitBusinessForm from "@/components/forms/init-business-form";
import IsLoadingScreen from "@/components/is-loading-screen";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/user-context";
import { useRouter } from "@/i18n/navigation";
import { LogOutIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React from "react";

export default function CreateBusinessPage() {
  const t = useTranslations("onboarding.page");
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useUser();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Local credentials are cleared even if the remote session is already invalid.
    } finally {
      router.replace("/");
      router.refresh();
    }
  };

  React.useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/");
      } else if (user?.role === "ADMIN") {
        router.replace("/dashboard/admin");
      }
    }
  }, [isAuthenticated, isLoading, router, user?.role]);

  if (isLoading || user?.role === "ADMIN") {
    return <IsLoadingScreen text={t("loading")} />;
  }

  return (
    <section className="relative flex min-h-screen items-center justify-center pt-20 pb-8 sm:pt-24">
      <Button
        type="button"
        variant="outline"
        className="absolute top-4 end-4 sm:top-8 sm:end-8"
        onClick={() => void handleLogout()}
      >
        <LogOutIcon />
        {t("logout")}
      </Button>
      <div className="container mx-auto">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="mx-auto w-full max-w-md px-4">
            <InitBusinessForm />
          </div>
          <div className="hidden w-full lg:block">
            <Image
              src="/auth/auth-image.png"
              alt={t("imageAlt")}
              width={904}
              height={982}
              className="h-auto w-full"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
