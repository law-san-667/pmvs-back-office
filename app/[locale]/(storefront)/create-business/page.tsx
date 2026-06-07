"use client";

import InitBusinessForm from "@/components/forms/init-business-form";
import IsLoadingScreen from "@/components/is-loading-screen";
import { useUser } from "@/contexts/user-context";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import React from "react";

export default function CreateBusinessPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useUser();

  React.useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/");
      }
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <IsLoadingScreen text="Chargement de votre compte..." />;
  }

  return (
    <section className="flex min-h-screen items-center justify-center py-8">
      <div className="container mx-auto">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="mx-auto w-full max-w-md px-4">
            <InitBusinessForm />
          </div>
          <div className="hidden w-full lg:block">
            <Image
              src="/auth/auth-image.png"
              alt="Illustration promotionnelle"
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
